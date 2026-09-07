// backend/src/services/telegram/utils.js
const crypto = require("crypto");

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function otpExpiry(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function generateTempPassword() {
  return crypto.randomBytes(8).toString("base64url").slice(0, 10);
}

function parseSkills(input) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

module.exports = {
  generateOtp,
  otpExpiry,
  generateTempPassword,
  parseSkills,
  mondayOf,
  formatDate,
};
