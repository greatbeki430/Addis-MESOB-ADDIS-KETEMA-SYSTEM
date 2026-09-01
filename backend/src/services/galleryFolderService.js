// backend/src/services/galleryFolderService.js
// Resolves the (week folder, fileType subfolder) pair a gallery item
// belongs in, creating either as needed.
//
// ✅ REWRITTEN to use atomic findOneAndUpdate(..., { upsert: true })
// instead of the previous find-then-create-then-refetch pattern. That
// older pattern is inherently racy: even with retries, there's no way
// to guarantee "check if it exists" and "create it" happen as one
// indivisible step across two separate database calls. An upsert IS
// that indivisible step — MongoDB itself resolves the "does this exist
// yet" question atomically, so there's no window for a duplicate-key
// conflict to point at a document that a subsequent read can't find.

const GoldenMondayFolder = require("../models/GoldenMondayFolder");

// Monday of the week containing `date`, normalized to local midnight.
const mondayOf = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const FILE_TYPE_LABELS = {
  image: "Images",
  pdf: "PDFs",
  presentation: "Presentations",
  document: "Documents",
  video: "Videos",
  other: "Other Files",
};

const getOrCreateWeekFolder = async ({
  uploadDate,
  topic,
  weekOfEthiopianDate,
  userId,
  userName,
}) => {
  const weekOf = mondayOf(uploadDate);
  const trimmedTopic = topic && topic.trim() ? topic.trim() : null;

  let folder;
  try {
    // ✅ Single atomic operation: if a "week" folder for this weekOf
    // already exists, return it as-is; if not, create it in the same
    // step. $setOnInsert means these fields are only applied when a
    // new document is actually inserted — they're ignored on a match,
    // so this never overwrites an existing folder's data.
    folder = await GoldenMondayFolder.findOneAndUpdate(
      { folderType: "week", weekOf },
      {
        $setOnInsert: {
          folderType: "week",
          weekOf,
          weekOfEthiopianDate: weekOfEthiopianDate || "",
          createdBy: userId,
          createdByName: userName,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  } catch (err) {
    // Two upserts landing in the exact same instant can still rarely
    // throw E11000 depending on MongoDB version/topology. If that
    // happens, the document is now guaranteed to exist — just fetch it.
    if (err.code === 11000) {
      folder = await GoldenMondayFolder.findOne({ folderType: "week", weekOf });
    } else {
      throw err;
    }
  }

  if (!folder) {
    // If we get here, it's not a race condition — something is
    // actually wrong (e.g. a schema validation issue on insert, or an
    // index conflict from an old/stale index definition). Fail with a
    // message specific enough to debug from the server logs.
    throw new Error(
      `getOrCreateWeekFolder: upsert returned no document for weekOf=${weekOf.toISOString()}`,
    );
  }

  // Append the topic if it's new (case-insensitive), without
  // duplicating — done as its own atomic $addToSet rather than
  // mutate-then-save, so this can't race with a concurrent topic
  // append on the same folder either.
  if (trimmedTopic) {
    const alreadyPresent = (folder.topics || []).some(
      (t) => t.toLowerCase() === trimmedTopic.toLowerCase(),
    );
    if (!alreadyPresent) {
      folder = await GoldenMondayFolder.findByIdAndUpdate(
        folder._id,
        { $addToSet: { topics: trimmedTopic } },
        { new: true },
      );
    }
  }

  return folder;
};

const getOrCreateTypeFolder = async ({
  weekFolder,
  fileType,
  userId,
  userName,
}) => {
  let folder;
  try {
    folder = await GoldenMondayFolder.findOneAndUpdate(
      { folderType: "fileType", parentFolder: weekFolder._id, fileType },
      {
        $setOnInsert: {
          folderType: "fileType",
          parentFolder: weekFolder._id,
          fileType,
          createdBy: userId,
          createdByName: userName,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  } catch (err) {
    if (err.code === 11000) {
      folder = await GoldenMondayFolder.findOne({
        folderType: "fileType",
        parentFolder: weekFolder._id,
        fileType,
      });
    } else {
      throw err;
    }
  }

  if (!folder) {
    throw new Error(
      `getOrCreateTypeFolder: upsert returned no document for parentFolder=${weekFolder._id}, fileType=${fileType}`,
    );
  }

  return folder;
};

const updateWeekFolderAggregates = async (weekFolderId) => {
  const children = await GoldenMondayFolder.find({
    parentFolder: weekFolderId,
    folderType: "fileType",
  });

  const totalCount = children.reduce((sum, c) => sum + (c.count || 0), 0);
  const coverPhoto = children.find((c) => c.coverPhoto)?.coverPhoto || "";

  await GoldenMondayFolder.findByIdAndUpdate(weekFolderId, {
    count: totalCount,
    ...(coverPhoto ? { coverPhoto } : {}),
  });
};

const getFileTypeLabel = (fileType) => FILE_TYPE_LABELS[fileType] || fileType;

module.exports = {
  mondayOf,
  getOrCreateWeekFolder,
  getOrCreateTypeFolder,
  updateWeekFolderAggregates,
  getFileTypeLabel,
  FILE_TYPE_LABELS,
};
