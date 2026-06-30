// backend/src/services/documentService.js
// Handles Cloudinary uploads for CRRSA document vault and AI OCR extraction

const cloudinary = require("../config/cloudinary");
const { summarizeDocumentContent } = require("./aiService");

const DOCUMENT_FOLDER =
  process.env.CLOUDINARY_DOCUMENT_FOLDER || "crrsa-documents";

// ============================================================
// Upload a file (base64) to Cloudinary under crrsa-documents/
// Supports: PDF, JPG, PNG, TIFF
// Returns: { url, publicId, thumbnailUrl, fileType, fileSize }
// ============================================================
const uploadDocumentToCloud = async (base64File, options = {}) => {
  const { documentType = "other", referenceNumber = "unknown" } = options;

  // Detect file type from base64 prefix
  let resourceType = "raw"; // Cloudinary resource type
  let fileType = "other";

  if (base64File.startsWith("data:application/pdf")) {
    resourceType = "raw";
    fileType = "pdf";
  } else if (
    base64File.startsWith("data:image/jpeg") ||
    base64File.startsWith("data:image/jpg")
  ) {
    resourceType = "image";
    fileType = "jpg";
  } else if (base64File.startsWith("data:image/png")) {
    resourceType = "image";
    fileType = "png";
  } else if (base64File.startsWith("data:image/tiff")) {
    resourceType = "image";
    fileType = "tiff";
  }

  const uploadOptions = {
    folder: `${DOCUMENT_FOLDER}/${documentType}`,
    resource_type: resourceType,
    public_id: `${referenceNumber}_${Date.now()}`,
    overwrite: false,
    // PDF transformation: generate preview image
    ...(fileType === "pdf" && {
      format: "jpg",
      pages: "1", // Generate thumbnail from first page
    }),
  };

  const result = await cloudinary.uploader.upload(base64File, uploadOptions);

  // Generate thumbnail URL for PDFs (first page as image)
  let thumbnailUrl = null;
  if (fileType === "pdf" && result.pages > 0) {
    thumbnailUrl = cloudinary.url(result.public_id, {
      resource_type: "image",
      format: "jpg",
      page: 1,
      width: 200,
      crop: "limit",
    });
  } else if (resourceType === "image") {
    thumbnailUrl = cloudinary.url(result.public_id, {
      width: 200,
      crop: "limit",
      quality: "auto",
    });
  }

  // Get approximate file size from base64 string (base64 is ~4/3 of binary size)
  const base64Data = base64File.split(",")[1] || base64File;
  const fileSizeBytes = Math.round((base64Data.length * 3) / 4);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    thumbnailUrl,
    fileType,
    fileSize: fileSizeBytes,
  };
};

// ============================================================
// Delete a file from Cloudinary (used when correcting an upload)
// Note: We never delete the MongoDB record — only the cloud file
// ============================================================
const deleteDocumentFromCloud = async (publicId, resourceType = "raw") => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};

// ============================================================
// Auto-extract metadata using AI from a text string
// (Called after upload when text content is provided)
// ============================================================
const extractDocumentMetadataWithAI = async (textContent, documentType) => {
  try {
    const extracted = await summarizeDocumentContent(textContent, documentType);
    return {
      ...extracted,
      extractedAt: new Date(),
    };
  } catch (error) {
    console.error("AI OCR extraction error:", error);
    return null;
  }
};

// ============================================================
// Generate a unique reference number
// Format: CRRSA-{TYPE_PREFIX}-{YEAR}-{RANDOM}
// ============================================================
const generateReferenceNumber = (documentType) => {
  const typeMap = {
    birth_certificate: "BC",
    death_certificate: "DC",
    marriage_certificate: "MC",
    divorce_certificate: "DIV",
    residence_id: "RID",
    name_change: "NC",
    registration_book: "RB",
    circular: "CIR",
    directive: "DIR",
    correspondence: "COR",
    application_form: "AF",
    other: "DOC",
  };

  const prefix = typeMap[documentType] || "DOC";
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `CRRSA-${prefix}-${year}-${random}`;
};

module.exports = {
  uploadDocumentToCloud,
  deleteDocumentFromCloud,
  extractDocumentMetadataWithAI,
  generateReferenceNumber,
};
