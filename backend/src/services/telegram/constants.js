// backend/src/services/telegram/constants.js

// ─── BRANCHES ─────────────────────────────────────────────────────
const BRANCHES = [
  "Addis Ketema",
  "Lideta",
  "Kirkos",
  "Bole",
  "Yeka",
  "Gulele",
  "Nifas Silk",
  "Kolfe Keranio",
  "Arada",
  "Akaki Kality",
  "Lemi Kura",
  "Other",
];

// ─── REGISTRATION STEPS ─────────────────────────────────────────
const STEPS = {
  NAME: "awaiting_name",
  EMAIL: "awaiting_email",
  PHONE: "awaiting_phone",
  BRANCH: "awaiting_branch",
  DEPARTMENT: "awaiting_department",
  POSITION: "awaiting_position",
  SKILLS: "awaiting_skills",
  PHOTO: "awaiting_photo",
  OTP: "awaiting_otp",
};

// ─── NOTIFICATION TYPES ──────────────────────────────────────────
const NOTIFICATION_TYPES = {
  PRESENTER_ASSIGNED: "presenter_assigned",
  SESSION_REMINDER: "session_reminder",
  TITLE_REMINDER: "title_reminder",
  ENDORSEMENT_RECEIVED: "endorsement_received",
  FEEDBACK_REQUESTED: "feedback_requested",
  SESSION_CANCELLED: "session_cancelled",
  RESOURCE_UPLOADED: "resource_uploaded",
  AGENDA_PUBLISHED: "agenda_published",
};

// ─── PRIORITY LEVELS ─────────────────────────────────────────────
const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

module.exports = {
  BRANCHES,
  STEPS,
  NOTIFICATION_TYPES,
  PRIORITY,
};
