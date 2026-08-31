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

  // ✅ Include createdBy in the query for proper user isolation
  let folder = await GoldenMondayFolder.findOne({
    folderType: "week",
    weekOf,
    createdBy: userId,
  });

  if (!folder) {
    try {
      folder = await GoldenMondayFolder.create({
        folderType: "week",
        weekOf,
        weekOfEthiopianDate: weekOfEthiopianDate || "",
        topics: topic ? [topic.trim()] : [],
        createdBy: userId,
        createdByName: userName,
        title: `${weekOfEthiopianDate || weekOf.toISOString().split("T")[0]} - ${topic || "Golden Monday"}`,
        count: 0,
        coverPhoto: null,
      });
      console.log(`✅ Created week folder for user ${userId}: ${folder._id}`);
    } catch (err) {
      console.error("❌ Error creating week folder:", err.message);
      if (err.code === 11000) {
        // Duplicate key error - find existing folder for this user
        folder = await GoldenMondayFolder.findOne({
          folderType: "week",
          weekOf,
          createdBy: userId,
        });
        if (folder) {
          console.log(
            `✅ Found existing week folder for user ${userId}: ${folder._id}`,
          );
        }
      } else {
        throw err;
      }
    }
  }

  // ✅ Defensive retry for race conditions
  if (!folder) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    folder = await GoldenMondayFolder.findOne({
      folderType: "week",
      weekOf,
      createdBy: userId,
    });
  }

  if (!folder) {
    throw new Error(
      `getOrCreateWeekFolder: folder is still null after create/retry for weekOf=${weekOf.toISOString()}, userId=${userId}`,
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
      console.log(`✅ Added topic "${trimmed}" to folder ${folder._id}`);
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
  // ✅ Include createdBy in the query for proper user isolation
  let folder = await GoldenMondayFolder.findOne({
    folderType: "fileType",
    parentFolder: weekFolder._id,
    fileType,
    createdBy: userId,
  });

  if (!folder) {
    try {
      folder = await GoldenMondayFolder.create({
        folderType: "fileType",
        parentFolder: weekFolder._id,
        fileType,
        createdBy: userId,
        createdByName: userName,
        title: `${weekFolder.title || "Week"} - ${FILE_TYPE_LABELS[fileType] || fileType}`,
        count: 0,
        coverPhoto: null,
      });
      console.log(`✅ Created type folder for user ${userId}: ${folder._id}`);
    } catch (err) {
      console.error("❌ Error creating type folder:", err.message);
      if (err.code === 11000) {
        folder = await GoldenMondayFolder.findOne({
          folderType: "fileType",
          parentFolder: weekFolder._id,
          fileType,
          createdBy: userId,
        });
        if (folder) {
          console.log(
            `✅ Found existing type folder for user ${userId}: ${folder._id}`,
          );
        }
      } else {
        throw err;
      }
    }
  }

  // ✅ Defensive retry for race conditions
  if (!folder) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    folder = await GoldenMondayFolder.findOne({
      folderType: "fileType",
      parentFolder: weekFolder._id,
      fileType,
      createdBy: userId,
    });
  }

  if (!folder) {
    throw new Error(
      `getOrCreateTypeFolder: folder is still null after create/retry for parentFolder=${weekFolder._id}, fileType=${fileType}, userId=${userId}`,
    );
  }

  return folder;
};

const updateWeekFolderAggregates = async (weekFolderId) => {
  try {
    const children = await GoldenMondayFolder.find({
      parentFolder: weekFolderId,
      folderType: "fileType",
    });

    const totalCount = children.reduce((sum, c) => sum + (c.count || 0), 0);
    const coverPhoto = children.find((c) => c.coverPhoto)?.coverPhoto || null;

    await GoldenMondayFolder.findByIdAndUpdate(weekFolderId, {
      count: totalCount,
      ...(coverPhoto ? { coverPhoto } : {}),
    });

    console.log(`✅ Updated week folder aggregates: ${totalCount} items`);
  } catch (error) {
    console.error("Error updating week folder aggregates:", error);
  }
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
