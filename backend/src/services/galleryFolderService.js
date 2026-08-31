// backend/src/services/galleryFolderService.js
// Resolves the (week folder, fileType subfolder) pair a gallery item
// belongs in, creating either as needed.

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

  let folder = await GoldenMondayFolder.findOne({ folderType: "week", weekOf });

  if (!folder) {
    try {
      folder = await GoldenMondayFolder.create({
        folderType: "week",
        weekOf,
        weekOfEthiopianDate: weekOfEthiopianDate || "",
        topics: topic ? [topic.trim()] : [],
        createdBy: userId,
        createdByName: userName,
      });
    } catch (err) {
      if (err.code === 11000) {
        // Someone else created it concurrently — re-fetch.
        folder = await GoldenMondayFolder.findOne({
          folderType: "week",
          weekOf,
        });
      } else {
        throw err;
      }
    }
  }

  // ✅ Defensive retry: covers the rare case where a concurrent insert's
  // duplicate-key conflict resolves before the winning insert is visible
  // to this read (replica lag / read timing), which previously crashed
  // with "Cannot read properties of null (reading 'topics')".
  if (!folder) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    folder = await GoldenMondayFolder.findOne({ folderType: "week", weekOf });
  }

  if (!folder) {
    throw new Error(
      `getOrCreateWeekFolder: folder is still null after create/retry for weekOf=${weekOf.toISOString()}`,
    );
  }

  // Append the topic if it's new (case-insensitive), without duplicating.
  if (topic && topic.trim()) {
    const trimmed = topic.trim();
    const alreadyPresent = folder.topics.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!alreadyPresent) {
      folder.topics.push(trimmed);
      await folder.save();
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
  let folder = await GoldenMondayFolder.findOne({
    folderType: "fileType",
    parentFolder: weekFolder._id,
    fileType,
  });

  if (!folder) {
    try {
      folder = await GoldenMondayFolder.create({
        folderType: "fileType",
        parentFolder: weekFolder._id,
        fileType,
        createdBy: userId,
        createdByName: userName,
      });
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
  }

  // ✅ Same defensive retry as getOrCreateWeekFolder.
  if (!folder) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    folder = await GoldenMondayFolder.findOne({
      folderType: "fileType",
      parentFolder: weekFolder._id,
      fileType,
    });
  }

  if (!folder) {
    throw new Error(
      `getOrCreateTypeFolder: folder is still null after create/retry for parentFolder=${weekFolder._id}, fileType=${fileType}`,
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
