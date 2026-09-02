// frontend/src/utils/passwordUtils.js

/**
 * Generate a secure temporary password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} - A secure temporary password
 */
export const generateTempPassword = (length = 12) => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "!@#$%^&*";

  // Ensure at least one of each type
  const allChars = uppercase + lowercase + numbers + specials;
  let password = "";

  // Add one of each required type
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += specials.charAt(Math.floor(Math.random() * specials.length));

  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
};

/**
 * Check if password meets requirements
 * @param {string} password - The password to check
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*)",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check password strength
 * @param {string} password - The password to check
 * @returns {object} - { score: number, label: string, color: string }
 */
export const getPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;

  const levels = [
    { score: 0, label: "Very Weak", color: "#ef4444" },
    { score: 1, label: "Weak", color: "#f59e0b" },
    { score: 2, label: "Weak", color: "#f59e0b" },
    { score: 3, label: "Fair", color: "#3b82f6" },
    { score: 4, label: "Good", color: "#10b981" },
    { score: 5, label: "Strong", color: "#10b981" },
    { score: 6, label: "Very Strong", color: "#059669" },
  ];

  const level = levels.find((l) => l.score >= score) || levels[0];
  return { ...level, score };
};
