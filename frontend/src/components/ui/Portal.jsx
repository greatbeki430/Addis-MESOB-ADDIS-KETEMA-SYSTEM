// frontend/src/components/ui/Portal.jsx
import { createPortal } from "react-dom";
import { useEffect, useMemo } from "react";

export const Portal = ({ children }) => {
  const element = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.createElement("div");
  }, []);

  useEffect(() => {
    if (!element) return;

    document.body.appendChild(element);

    return () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [element]);

  if (!element) return null;

  return createPortal(children, element);
};
