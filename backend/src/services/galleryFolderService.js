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

  console.log("🔍 [getOrCreateWeekFolder] weekOf:", weekOf.toISOString());

  let folder;
  try {
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
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(
      "🔍 [getOrCreateWeekFolder] upsert succeeded, folder:",
      folder ? folder._id : "NULL/UNDEFINED",
    );
  } catch (err) {
    // ✅ Log the FULL error, not just err.code, so we can see exactly
    // what MongoDB rejected — which index, which constraint, etc.
    console.error("🔍 [getOrCreateWeekFolder] upsert threw. Full error:", {
      name: err.name,
      code: err.code,
      message: err.message,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue,
    });

    if (err.code === 11000) {
      folder = await GoldenMondayFolder.findOne({ folderType: "week", weekOf });
      console.log(
        "🔍 [getOrCreateWeekFolder] post-E11000 findOne result:",
        folder ? folder._id : "NULL",
      );
    } else {
      throw err;
    }
  }

  if (!folder) {
    throw new Error(
      `getOrCreateWeekFolder: upsert returned no document for weekOf=${weekOf.toISOString()}`,
    );
  }

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
