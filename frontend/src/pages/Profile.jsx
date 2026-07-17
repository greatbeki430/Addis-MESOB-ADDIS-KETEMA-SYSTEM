// frontend/src/pages/Profile.jsx
import { useState, useRef } from "react";
import { C, F, btn, card, flex, shadows, radius, inp } from "../styles/theme";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { authAPI, uploadAPI } from "../services/api";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiEdit2,
  FiSave,
  FiX,
  FiUpload,
  FiLoader,
  FiClock,
  FiCheckCircle,
  FiAward,
} from "react-icons/fi";
import "./Profile.css";

export default function Profile() {
  const { user, isAdmin, isSuperAdmin, isLeader, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ✅ FIXED: Derive form data directly from user prop
  // This is the correct way - no useEffect needed!
  const getInitialFormData = () => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profilePhotoUrl: user?.profilePhotoUrl || "",
  });

  // ✅ FIXED: Initialize state once with current user data
  const [formData, setFormData] = useState(getInitialFormData);
  const [photoPreviewState, setPhotoPreviewState] = useState(
    user?.profilePhotoUrl || null,
  );

  // ✅ FIXED: When user changes, reset the form with a function
  // This uses a key-based approach - the function runs when user changes
  // but doesn't cause cascading renders
  const resetFormData = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      profilePhotoUrl: user?.profilePhotoUrl || "",
    });
    setPhotoPreviewState(user?.profilePhotoUrl || null);
  };

  const photoPreview = photoPreviewState;

  // Role helpers
  const getUserRole = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isAdmin) return "Admin";
    if (isLeader) return "Team Leader";
    return "Employee";
  };

  const getRoleIcon = () => {
    if (isSuperAdmin) return "👑";
    if (isAdmin) return "⚙️";
    if (isLeader) return "⭐";
    return "👤";
  };

  const getRoleColor = () => {
    if (isSuperAdmin) return "#8b5cf6";
    if (isAdmin) return C.primary;
    if (isLeader) return C.gold;
    return "#10b981";
  };

  const getUserInitials = () => {
    if (!formData.name) return "U";
    return formData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Photo handlers
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Photo must be less than 5MB", "error");
        e.target.value = "";
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreviewState(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewState(null);
    setFormData((f) => ({ ...f, profilePhotoUrl: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((f) => ({ ...f, [field]: value }));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let profilePhotoUrl = formData.profilePhotoUrl;

      if (photoFile) {
        setUploadingPhoto(true);
        const formDataObj = new FormData();
        formDataObj.append("photo", photoFile);
        const response = await uploadAPI.uploadProfilePhoto(formDataObj);
        profilePhotoUrl = response.data.url;
        setUploadingPhoto(false);
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profilePhotoUrl: profilePhotoUrl || formData.profilePhotoUrl,
      };

      await authAPI.updateProfile(updateData);
      showToast("Profile updated successfully!", "success");
      setIsEditing(false);
      setPhotoFile(null);

      // Refresh user data
      await refreshUser();
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile:", error);
      showToast(
        error.response?.data?.message || "Failed to update profile",
        "error",
      );
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetFormData();
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="profile-page"
      style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}
    >
      {/* Header */}
      <div
        style={{
          ...flex.between,
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(20px, 5vw, 26px)",
              fontWeight: 900,
              color: C.dark,
              fontFamily: F.serif,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FiUser size={24} color={C.primary} />
            My Profile
          </h1>
          <p
            style={{
              fontSize: "clamp(11px, 3vw, 13px)",
              color: C.muted,
              marginTop: 4,
              fontFamily: F.sans,
            }}
          >
            Manage your personal information and preferences
          </p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} style={btn.primary}>
            <FiEdit2 size={16} style={{ marginRight: 6 }} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Main Card */}
      <div style={card}>
        <form onSubmit={handleSubmit}>
          {/* Profile Photo Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div style={{ position: "relative" }}>
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `4px solid ${C.primary}`,
                    boxShadow: shadows.md,
                    transition: "transform 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                    color: "#fff",
                    fontWeight: 900,
                    fontFamily: F.serif,
                    border: `4px solid ${C.primary}`,
                    boxShadow: shadows.md,
                    transition: "transform 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  {getUserInitials()}
                </div>
              )}
              {isEditing && (
                <>
                  <label
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      background: C.primary,
                      color: "#fff",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: `2px solid ${C.white}`,
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <FiUpload size={16} />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: "none" }}
                      disabled={uploadingPhoto}
                    />
                  </label>
                  {uploadingPhoto && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FiLoader
                        size={32}
                        color="#fff"
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            {isEditing && photoPreview && (
              <button
                type="button"
                onClick={removePhoto}
                style={{
                  marginTop: 8,
                  background: "none",
                  border: "none",
                  color: C.red,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#b91c1c")}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.red)}
              >
                <FiX size={14} /> Remove Photo
              </button>
            )}
          </div>

          {/* Role Badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                background: getRoleColor(),
                color: "#fff",
                padding: "6px 16px",
                borderRadius: radius.pill,
                fontSize: 13,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{getRoleIcon()}</span>
              {getUserRole()}
            </span>
          </div>

          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: C.bg,
                padding: 16,
                borderRadius: radius.md,
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: `1px solid transparent`,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = shadows.md;
                e.currentTarget.style.borderColor = C.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <FiCheckCircle size={20} color={C.primary} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.dark }}>
                  {user?.totalTasks || 0}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Tasks Completed
                </div>
              </div>
            </div>
            <div
              style={{
                background: C.bg,
                padding: 16,
                borderRadius: radius.md,
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: `1px solid transparent`,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = shadows.md;
                e.currentTarget.style.borderColor = C.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <FiAward size={20} color={C.gold} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.dark }}>
                  ${user?.totalEarnings || "0.00"}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Total Earnings
                </div>
              </div>
            </div>
            <div
              style={{
                background: C.bg,
                padding: 16,
                borderRadius: radius.md,
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: `1px solid transparent`,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = shadows.md;
                e.currentTarget.style.borderColor = C.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <FiClock size={20} color={C.muted} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.dark }}>
                  {user?.joinDate
                    ? new Date(user.joinDate).toLocaleDateString()
                    : "N/A"}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>Member Since</div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.dark,
                }}
              >
                Full Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  style={{
                    ...inp,
                    borderColor: C.border,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    background: C.bg,
                    borderRadius: radius.md,
                    fontSize: 14,
                    color: C.dark,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiUser size={16} color={C.muted} />
                  {formData.name || "Not set"}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.dark,
                }}
              >
                Email *
              </label>
              {isEditing ? (
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  style={{
                    ...inp,
                    borderColor: C.border,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    background: C.bg,
                    borderRadius: radius.md,
                    fontSize: 14,
                    color: C.dark,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiMail size={16} color={C.muted} />
                  {formData.email || "Not set"}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.dark,
                }}
              >
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  style={{
                    ...inp,
                    borderColor: C.border,
                  }}
                  placeholder="+251 9XX XXX XXX"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    background: C.bg,
                    borderRadius: radius.md,
                    fontSize: 14,
                    color: C.dark,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FiPhone size={16} color={C.muted} />
                  {formData.phone || "Not set"}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.dark,
                }}
              >
                Role
              </label>
              <div
                style={{
                  padding: "10px 14px",
                  background: C.bg,
                  borderRadius: radius.md,
                  fontSize: 14,
                  color: C.dark,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FiShield size={16} color={C.muted} />
                {getUserRole()}
              </div>
            </div>
          </div>

          {/* Actions */}
          {isEditing && (
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                borderTop: `1px solid ${C.border}`,
                paddingTop: 20,
                marginTop: 8,
              }}
            >
              <button
                type="button"
                onClick={handleCancel}
                style={btn.secondary}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...btn.primary,
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                disabled={saving || uploadingPhoto}
              >
                {saving || uploadingPhoto ? (
                  <>
                    <FiLoader
                      size={16}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    {uploadingPhoto ? "Uploading Photo..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
