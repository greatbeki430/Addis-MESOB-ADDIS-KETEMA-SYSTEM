// frontend/src/components/ui/ModalWrapper.jsx
import { useEffect } from "react";
import { C } from "../../styles/theme";

export const ModalWrapper = ({
  isOpen,
  onClose,
  children,
  closeOnBackdrop = true,
  zIndex = 1000,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: zIndex,
        padding: "16px",
        backdropFilter: "blur(4px)",
        margin: 0,
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
        overflow: "auto",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 16,
          padding: "clamp(16px, 3vw, 28px)",
          maxHeight: "90vh",
          overflowY: "auto",
          overflowX: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
          margin: "auto",
          position: "relative",
          animation: "modalSlideUp 0.3s ease",
          display: "flex",
          flexDirection: "column",
          scrollbarWidth: "thin",
          scrollbarColor: `${C.border} transparent`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
