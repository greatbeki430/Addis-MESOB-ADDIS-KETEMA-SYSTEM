// backend/src/services/galleryFolderService.js
// Resolves the (week folder, fileType subfolder) pair a gallery item
// belongs in, creating either as needed.

const GoldenMondayFolder = require("../models/GoldenMondayFolder");

// Monday of the week containing `date`, normalized to local midnight.
// NOTE: goldenMondayRotationService.js has its own `mondayOf()` used for
// session scheduling — I haven't seen that file, so this is a
// self-contained implementation. Worth checking the two agree if you
// want folder weeks and rotation weeks to always line up; share that
// file if so and I'll reconcile them.
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
        folder = await GoldenMondayFolder.findOne({
          folderType: "week",
          weekOf,
        });
      } else {
        throw err;
      }
    }
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

  return folder;
};

// ✅ ADDED — used by POST /gallery (goldenMondayRoutes.js, step 10) after
// every file finishes uploading, to keep a week folder's denormalized
// count/coverPhoto in sync with the sum of its fileType children.
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

// ✅ ADDED — small display helper, referenced by the routes import but
// previously missing from this module's exports.
const getFileTypeLabel = (fileType) => FILE_TYPE_LABELS[fileType] || fileType;

module.exports = {
  mondayOf,
  getOrCreateWeekFolder,
  getOrCreateTypeFolder,
  updateWeekFolderAggregates,
  getFileTypeLabel,
  FILE_TYPE_LABELS,
};
