// Helper to show toast notifications from non-React files
let toastFn = null;

export const setToastFunction = (fn) => {
  toastFn = fn;
};

export const showToast = (message, type = "success", duration = 3000) => {
  if (toastFn) {
    toastFn(message, type, duration);
  } else {
    console.warn("Toast function not set. Message:", message);
    // Fallback to console.log
    console.log(`${type.toUpperCase()}: ${message}`);
  }
};

export const showErrorToast = (message) => {
  showToast(message, "error", 4000);
};

export const showSuccessToast = (message) => {
  showToast(message, "success", 3000);
};

export const showWarningToast = (message) => {
  showToast(message, "warning", 3500);
};
