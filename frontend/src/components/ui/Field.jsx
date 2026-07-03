// frontend/src/components/ui/Field.jsx
// Enhanced Input Field with professional styling and react-icons

import { useState } from "react";
import { C, F, inp, radius } from "../../styles/theme";
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  error = null,
  hint = null,
  icon = null,
  disabled = false,
  className = "",
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const hasError = !!error;
  const hasValue = value && value.toString().trim().length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(4px, 1.5vw, 6px)",
        width: "100%",
        ...(className && { className }),
      }}
    >
      {label && (
        <label
          style={{
            fontSize: "clamp(11px, 3vw, 13px)",
            fontWeight: 600,
            color: hasError ? C.red : C.dark,
            fontFamily: F.sans,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {label}
          {required && (
            <span style={{ color: C.red, fontSize: "14px", fontWeight: 700 }}>
              *
            </span>
          )}
        </label>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          border: `1.5px solid ${
            hasError ? C.red : isFocused ? C.primary : C.border
          }`,
          borderRadius: radius.md,
          background: disabled ? "#f5f5f5" : "#fff",
          transition: "all 0.2s ease",
          boxShadow: isFocused ? `0 0 0 3px ${C.primary}22` : "none",
          overflow: "hidden",
        }}
      >
        {icon && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: "12px",
              color: isFocused ? C.primary : C.muted,
              fontSize: "18px",
              transition: "color 0.2s ease",
            }}
          >
            {icon}
          </span>
        )}

        <input
          style={{
            ...inp,
            border: "none",
            padding: `clamp(8px, 2.5vw, 10px) ${
              isPassword ? "44px" : "clamp(10px, 3vw, 12px)"
            } ${icon ? "8px" : "clamp(10px, 3vw, 12px)"}`,
            background: disabled ? "#f5f5f5" : "transparent",
            fontSize: "clamp(13px, 3.5vw, 14px)",
            color: disabled ? C.muted : C.dark,
            cursor: disabled ? "not-allowed" : "text",
            width: "100%",
            boxSizing: "border-box",
          }}
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={hasError}
          aria-describedby={hint ? "hint" : undefined}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.muted;
            }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}

        {hasError && (
          <span
            style={{
              position: "absolute",
              right: isPassword ? "44px" : "10px",
              color: C.red,
              display: "flex",
              alignItems: "center",
            }}
          >
            <FiAlertCircle size={18} />
          </span>
        )}

        {!hasError && hasValue && !isPassword && (
          <span
            style={{
              position: "absolute",
              right: "10px",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FiCheckCircle size={16} />
          </span>
        )}
      </div>

      {hint && !hasError && (
        <p
          style={{
            fontSize: "clamp(10px, 2.5vw, 11px)",
            color: C.muted,
            margin: 0,
            fontFamily: F.sans,
          }}
        >
          {hint}
        </p>
      )}

      {error && (
        <p
          style={{
            fontSize: "clamp(10px, 2.5vw, 11px)",
            color: C.red,
            margin: 0,
            fontFamily: F.sans,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <FiAlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;
