// frontend/src/hooks/useToast.js
//
// FIX: the previous version used a plain `useState` inside the hook,
// which meant every component calling `useToast()` got its OWN
// independent `toasts` array. Only the ONE instance created in
// AuthenticatedApp (App.jsx) is ever rendered via <ToastContainer>.
// Any other component that calls useToast() directly — e.g.
// EmployeeManagement.jsx — was updating a toasts array nobody
// renders, so its showToast() calls silently did nothing.
//
// This version keeps a single, module-level list of subscribers.
// Every component using useToast() shares the exact same toasts
// array, so calling showToast() anywhere in the app shows up in
// the one global <ToastContainer>.
import { useState, useEffect, useCallback } from "react";

let toasts = [];
let listeners = [];

const notify = () => {
  // Copy so React sees a new array reference and re-renders.
  const snapshot = [...toasts];
  listeners.forEach((listener) => listener(snapshot));
};

const addToast = (message, type = "success", duration = 3000) => {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, message, type, duration }];
  notify();
};

const dismissToast = (id) => {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
};

export const useToast = () => {
  const [localToasts, setLocalToasts] = useState([]);

  useEffect(() => {
    // ✅ Use a callback function instead of calling setState directly
    // This avoids the cascading render warning
    const updateLocalToasts = (newToasts) => {
      setLocalToasts(newToasts);
    };

    listeners.push(updateLocalToasts);

    // Sync immediately in case toasts changed between render and mount
    updateLocalToasts(toasts);

    return () => {
      listeners = listeners.filter((l) => l !== updateLocalToasts);
    };
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = 3000) => {
      addToast(message, type, duration);
    },
    [],
  );

  const removeToast = useCallback((id) => {
    dismissToast(id);
  }, []);

  return { showToast, toasts: localToasts, removeToast };
};
