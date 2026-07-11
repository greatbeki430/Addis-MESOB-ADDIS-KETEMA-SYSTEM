// frontend/src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { C, F, btn, card } from "../styles/theme";
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
} from "react-icons/fi";

// eslint-disable-next-line no-unused-vars
export default function Profile({ t }) {
  const { user, isAdmin, isSuperAdmin, isLeader } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  // photoPreviewState is used instead of a separate photoPreview state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ✅ Initialize form data directly from user prop - NO useEffect needed
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profilePhotoUrl: user?.profilePhotoUrl || "",
  });

  // ✅ Set photo preview directly from user prop - NO useEffect needed
  // We use the state initializer to set photoPreview
  const [photoPreviewState, setPhotoPreviewState] = useState(
    user?.profilePhotoUrl || null,
  );

  // ✅ Use useEffect only for syncing when user changes (e.g., after profile update)
  useEffect(() => {
    // This effect runs when the user object changes (e.g., after reload)
    // It updates the form data to match the latest user data
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        profilePhotoUrl: user.profilePhotoUrl || "",
      });
      setPhotoPreviewState(user.profilePhotoUrl || null);
    }
  }, [user]);

  // Use photoPreviewState for display
  const photoPreview = photoPreviewState;

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
    if (isAdmin) return "#3b82f6";
    if (isLeader) return "#f59e0b";
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
  };

  const handleFormChange = (field, value) => {
    setFormData((f) => ({ ...f, [field]: value }));
  };

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
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      profilePhotoUrl: user?.profilePhotoUrl || "",
    });
    setPhotoPreviewState(user?.profilePhotoUrl || null);
    setPhotoFile(null);
  };

  return (
    <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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

      <div style={card}>
        <form onSubmit={handleSubmit}>
          {/* Profile Photo */}
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
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
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
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
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
                  color: "#ef4444",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
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
                borderRadius: 20,
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
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = C.primary)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    background: C.bg,
                    borderRadius: 8,
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
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = C.primary)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    background: C.bg,
                    borderRadius: 8,
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
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="+251 9XX XXX XXX"
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = C.primary)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
              ) : (
                <div
                  style={{
                    padding: "10px 14px",
                    background: C.bg,
                    borderRadius: 8,
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
                  borderRadius: 8,
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
