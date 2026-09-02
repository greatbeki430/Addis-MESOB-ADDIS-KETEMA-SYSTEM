// frontend/src/pages/Profile.jsx
import { useState, useRef, useMemo, useCallback } from "react";
import { C } from "../styles/theme";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useLanguage } from "../hooks/useLanguage";
import { authAPI, uploadAPI } from "../services/api";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiEdit2,
  FiSave,
  FiX,
  FiLoader,
  FiClock,
  FiCheckCircle,
  FiFileText,
  FiAward,
  FiCalendar,
  FiBriefcase,
  FiMapPin,
  FiGlobe,
  FiLink,
  FiTwitter,
  FiGithub,
  FiLinkedin,
  FiChevronRight,
  FiSettings,
  FiCamera,
  FiTrash2,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiMessageSquare,
  FiZap,
} from "react-icons/fi";
import "./Profile.css";

export default function Profile() {
  const { user, isAdmin, isSuperAdmin, isLeader, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [hoveredStat, setHoveredStat] = useState(null);

  const getInitialFormData = () => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profilePhotoUrl: user?.profilePhotoUrl || "",
    bio: user?.bio || "",
    position: user?.position || "",
    department: user?.department || "",
    location: user?.location || "",
    website: user?.website || "",
    twitter: user?.twitter || "",
    github: user?.github || "",
    linkedin: user?.linkedin || "",
  });

  const [formData, setFormData] = useState(getInitialFormData);
  const [photoPreviewState, setPhotoPreviewState] = useState(
    user?.profilePhotoUrl || null,
  );

  const resetFormData = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      profilePhotoUrl: user?.profilePhotoUrl || "",
      bio: user?.bio || "",
      position: user?.position || "",
      department: user?.department || "",
      location: user?.location || "",
      website: user?.website || "",
      twitter: user?.twitter || "",
      github: user?.github || "",
      linkedin: user?.linkedin || "",
    });
    setPhotoPreviewState(user?.profilePhotoUrl || null);
  };

  const photoPreview = photoPreviewState;

  // Get user's role with translation
  const getUserRole = () => {
    if (isSuperAdmin) return t("profile.roleSuperAdmin") || "Super Admin";
    if (isAdmin) return t("profile.roleAdmin") || "Admin";
    if (isLeader) return t("profile.roleTeamLeader") || "Team Leader";
    return t("profile.roleEmployee") || "Employee";
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
        showToast(t("profile.photoTooLarge"), "error");
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
        bio: formData.bio,
        position: formData.position,
        department: formData.department,
        location: formData.location,
        website: formData.website,
        twitter: formData.twitter,
        github: formData.github,
        linkedin: formData.linkedin,
      };

      await authAPI.updateProfile(updateData);
      showToast(t("profile.updateSuccess"), "success");
      setIsEditing(false);
      setPhotoFile(null);

      await refreshUser();
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile:", error);
      showToast(
        error.response?.data?.message || t("profile.updateError"),
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

  // Format date for member since
  const formatMemberSince = useCallback(() => {
    if (!user?.createdAt) return t("profile.noData");
    try {
      return new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return t("profile.noData");
    }
  }, [user, t]);

  // Stats data
  const stats = useMemo(() => {
    const baseStats = [
      {
        id: "tasks",
        icon: <FiCheckCircle size={18} />,
        value: user?.totalTasks || 0,
        label: t("profile.tasksCompleted") || "Tasks Completed",
        color: "#3b82f6",
        gradient: "linear-gradient(135deg, #eff6ff, #dbeafe)",
        subtitle: "This month",
      },
      {
        id: "earnings",
        icon: <FiAward size={18} />,
        value: `$${user?.totalEarnings || "0.00"}`,
        label: t("profile.totalEarnings") || "Total Earnings",
        color: "#f59e0b",
        gradient: "linear-gradient(135deg, #fffbeb, #fef3c7)",
        subtitle: "Lifetime",
      },
      {
        id: "member",
        icon: <FiClock size={18} />,
        value: formatMemberSince(),
        label: t("profile.memberSince") || "Member Since",
        color: "#10b981",
        gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
        subtitle: "Active member",
      },
      {
        id: "reports",
        icon: <FiTrendingUp size={18} />,
        value: user?.totalReports || 0,
        label: t("profile.reportsSubmitted") || "Reports Submitted",
        color: "#8b5cf6",
        gradient: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        subtitle: "Total reports",
      },
    ];

    // Add role-specific stats
    if (isLeader || isAdmin || isSuperAdmin) {
      baseStats.push({
        id: "team",
        icon: <FiUsers size={18} />,
        value: user?.teamSize || 0,
        label: t("profile.teamSize") || "Team Size",
        color: "#ec4899",
        gradient: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
        subtitle: "Team members",
      });
    }

    return baseStats;
  }, [user, t, isLeader, isAdmin, isSuperAdmin, formatMemberSince]);

  // Social links
  const socialLinks = [
    { key: "website", icon: <FiLink size={16} />, label: "Website" },
    { key: "twitter", icon: <FiTwitter size={16} />, label: "Twitter" },
    { key: "github", icon: <FiGithub size={16} />, label: "GitHub" },
    { key: "linkedin", icon: <FiLinkedin size={16} />, label: "LinkedIn" },
  ];

  const hasSocialLinks = socialLinks.some(
    (link) => formData[link.key] && formData[link.key].trim() !== "",
  );

  return (
    <div className="profile-page">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(26,58,173,0.15); }
          50% { box-shadow: 0 0 40px rgba(26,58,173,0.25); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="profile-container">
        {/* Header with subtle gradient */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div>
              <div className="profile-breadcrumb">
                <span className="profile-breadcrumb-item">Dashboard</span>
                <FiChevronRight size={14} className="profile-breadcrumb-sep" />
                <span className="profile-breadcrumb-item active">Profile</span>
              </div>
              <h1 className="profile-title">
                <FiUser size={24} className="profile-title-icon" />
                {t("profile.title") || "My Profile"}
              </h1>
              <p className="profile-subtitle">
                {t("profile.subtitle") ||
                  "Manage your personal information and preferences"}
              </p>
            </div>
            <div className="profile-header-actions">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="profile-btn profile-btn-primary"
                >
                  <FiEdit2 size={16} />
                  {t("profile.editProfileBtn") || "Edit Profile"}
                </button>
              ) : (
                <div className="profile-header-actions-edit">
                  <span className="profile-unsaved-pill">
                    <FiZap size={12} /> Editing
                  </span>
                  <button
                    onClick={handleCancel}
                    className="profile-btn profile-btn-quiet"
                    disabled={saving}
                  >
                    <FiX size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="profile-btn profile-btn-primary"
                    disabled={saving || uploadingPhoto}
                  >
                    {saving || uploadingPhoto ? (
                      <>
                        <FiLoader size={16} className="profile-spin" />
                        {uploadingPhoto
                          ? t("profile.uploadingPhoto") || "Uploading..."
                          : t("profile.saving") || "Saving..."}
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        {t("profile.saveChanges") || "Save Changes"}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="profile-body">
          <div className="profile-layout">
            {/* Sidebar - Profile Card */}
            <aside className="profile-sidebar">
              <div className="profile-card profile-card-profile">
                {/* Avatar Section */}
                <div className="profile-avatar-section">
                  <div className="profile-avatar-wrapper">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt={t("profile.title") || "Profile"}
                        className="profile-avatar-img"
                      />
                    ) : (
                      <div
                        className="profile-avatar-placeholder"
                        style={{
                          background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                        }}
                      >
                        {getUserInitials()}
                      </div>
                    )}
                    {isEditing && (
                      <>
                        <label className="profile-avatar-upload">
                          <FiCamera size={16} />
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            disabled={uploadingPhoto}
                          />
                        </label>
                        {uploadingPhoto && (
                          <div className="profile-avatar-loading">
                            <FiLoader size={24} className="profile-spin" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {isEditing && photoPreview && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="profile-avatar-remove"
                    >
                      <FiTrash2 size={12} />
                      {t("profile.removePhoto") || "Remove"}
                    </button>
                  )}
                </div>

                {/* User Info */}
                <div className="profile-user-info">
                  <h2 className="profile-user-name">
                    {formData.name || t("profile.noName") || "No Name"}
                  </h2>
                  <p className="profile-user-title">
                    {formData.position || formData.department
                      ? `${formData.position || ""}${formData.position && formData.department ? " · " : ""}${formData.department || ""}`
                      : t("profile.noRole") || "No role specified"}
                  </p>
                  <div className="profile-user-role">
                    <span
                      className="profile-role-badge"
                      style={{ background: getRoleColor() }}
                    >
                      <span className="profile-role-icon">{getRoleIcon()}</span>
                      {getUserRole()}
                    </span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="profile-quick-info">
                  <div className="profile-quick-item">
                    <FiMail size={14} className="profile-quick-icon" />
                    <span>
                      {formData.email || t("profile.noEmail") || "No email"}
                    </span>
                  </div>
                  {formData.phone && (
                    <div className="profile-quick-item">
                      <FiPhone size={14} className="profile-quick-icon" />
                      <span>{formData.phone}</span>
                    </div>
                  )}
                  {formData.location && (
                    <div className="profile-quick-item">
                      <FiMapPin size={14} className="profile-quick-icon" />
                      <span>{formData.location}</span>
                    </div>
                  )}
                  <div className="profile-quick-item">
                    <FiCalendar size={14} className="profile-quick-icon" />
                    <span>
                      {t("profile.joined") || "Joined"}: {formatMemberSince()}
                    </span>
                  </div>
                </div>

                {/* Social Links */}
                {hasSocialLinks && (
                  <div className="profile-social-links">
                    <span className="profile-social-label">
                      {t("profile.connect") || "Connect"}
                    </span>
                    <div className="profile-social-icons">
                      {socialLinks.map(
                        (link) =>
                          formData[link.key] &&
                          formData[link.key].trim() !== "" && (
                            <a
                              key={link.key}
                              href={formData[link.key]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="profile-social-link"
                              title={link.label}
                            >
                              {link.icon}
                            </a>
                          ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <main className="profile-content">
              {/* Navigation Tabs */}
              <div className="profile-tabs">
                {[
                  {
                    id: "overview",
                    label: t("profile.overview") || "Overview",
                    icon: <FiUser size={16} />,
                  },
                  {
                    id: "details",
                    label: t("profile.details") || "Details",
                    icon: <FiSettings size={16} />,
                  },
                  {
                    id: "activity",
                    label: t("profile.activity") || "Activity",
                    icon: <FiTrendingUp size={16} />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`profile-tab ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="profile-tab-content">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <>
                    {/* Stats Grid */}
                    <div className="profile-stats-grid">
                      {stats.map((stat) => (
                        <div
                          key={stat.id}
                          className="profile-stat-card"
                          style={{
                            background: stat.gradient,
                            borderColor:
                              hoveredStat === stat.id
                                ? stat.color
                                : "transparent",
                          }}
                          onMouseEnter={() => setHoveredStat(stat.id)}
                          onMouseLeave={() => setHoveredStat(null)}
                        >
                          <div
                            className="profile-stat-icon"
                            style={{ color: stat.color }}
                          >
                            {stat.icon}
                          </div>
                          <div className="profile-stat-content">
                            <div
                              className="profile-stat-value"
                              style={{ color: stat.color }}
                            >
                              {stat.value}
                            </div>
                            <div className="profile-stat-label">
                              {stat.label}
                            </div>
                            <div className="profile-stat-subtitle">
                              {stat.subtitle}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bio Section */}
                    {formData.bio && (
                      <div className="profile-section">
                        <h3 className="profile-section-title">
                          <FiMessageSquare size={18} />
                          {t("profile.about") || "About Me"}
                        </h3>
                        <p className="profile-section-text">{formData.bio}</p>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="profile-quick-actions">
                      <h3 className="profile-section-title">
                        <FiZap size={18} />
                        {t("profile.quickActions") || "Quick Actions"}
                      </h3>
                      <div className="profile-actions-grid">
                        <button
                          className="profile-action-btn"
                          onClick={() => (window.location.href = "/settings")}
                        >
                          <FiSettings size={18} />
                          <span>
                            {t("profile.goToSettings") || "Go to Settings"}
                          </span>
                          <FiChevronRight
                            size={14}
                            className="profile-action-arrow"
                          />
                        </button>
                        <button
                          className="profile-action-btn"
                          onClick={() =>
                            (window.location.href = "/change-password")
                          }
                        >
                          <FiShield size={18} />
                          <span>
                            {t("profile.changePassword") || "Change Password"}
                          </span>
                          <FiChevronRight
                            size={14}
                            className="profile-action-arrow"
                          />
                        </button>
                        <button
                          className="profile-action-btn"
                          onClick={() => (window.location.href = "/dashboard")}
                        >
                          <FiTrendingUp size={18} />
                          <span>
                            {t("profile.goToDashboard") || "Go to Dashboard"}
                          </span>
                          <FiChevronRight
                            size={14}
                            className="profile-action-arrow"
                          />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Details Tab */}
                {activeTab === "details" && (
                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <FiSettings size={18} />
                      {t("profile.personalDetails") || "Personal Details"}
                    </h3>

                    <div className="profile-details-grid">
                      <div className="profile-detail-item">
                        <label className="profile-detail-label">
                          <FiUser size={14} />
                          {t("profile.fullName") || "Full Name"}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              handleFormChange("name", e.target.value)
                            }
                            className="profile-input"
                            placeholder={
                              t("profile.fullNamePlaceholder") ||
                              "Enter your full name"
                            }
                          />
                        ) : (
                          <span className="profile-detail-value">
                            {formData.name || t("profile.noData") || "No data"}
                          </span>
                        )}
                      </div>

                      <div className="profile-detail-item">
                        <label className="profile-detail-label">
                          <FiMail size={14} />
                          {t("profile.email") || "Email"}
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleFormChange("email", e.target.value)
                            }
                            className="profile-input"
                            placeholder={
                              t("profile.emailPlaceholder") ||
                              "Enter your email"
                            }
                          />
                        ) : (
                          <span className="profile-detail-value">
                            {formData.email || t("profile.noData") || "No data"}
                          </span>
                        )}
                      </div>

                      <div className="profile-detail-item">
                        <label className="profile-detail-label">
                          <FiPhone size={14} />
                          {t("profile.phone") || "Phone"}
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleFormChange("phone", e.target.value)
                            }
                            className="profile-input"
                            placeholder={
                              t("profile.phonePlaceholder") ||
                              "+251 9XX XXX XXX"
                            }
                          />
                        ) : (
                          <span className="profile-detail-value">
                            {formData.phone || t("profile.noData") || "No data"}
                          </span>
                        )}
                      </div>

                      <div className="profile-detail-item">
                        <label className="profile-detail-label">
                          <FiBriefcase size={14} />
                          {t("profile.position") || "Position"}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.position}
                            onChange={(e) =>
                              handleFormChange("position", e.target.value)
                            }
                            className="profile-input"
                            placeholder={
                              t("profile.positionPlaceholder") ||
                              "e.g., Team Leader"
                            }
                          />
                        ) : (
                          <span className="profile-detail-value">
                            {formData.position ||
                              t("profile.noData") ||
                              "No data"}
                          </span>
                        )}
                      </div>

                      <div className="profile-detail-item">
                        <label className="profile-detail-label">
                          <FiBriefcase size={14} />
                          {t("profile.department") || "Department"}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.department}
                            onChange={(e) =>
                              handleFormChange("department", e.target.value)
                            }
                            className="profile-input"
                            placeholder={
                              t("profile.departmentPlaceholder") ||
                              "e.g., IT & Systems"
                            }
                          />
                        ) : (
                          <span className="profile-detail-value">
                            {formData.department ||
                              t("profile.noData") ||
                              "No data"}
                          </span>
                        )}
                      </div>

                      <div className="profile-detail-item">
                        <label className="profile-detail-label">
                          <FiMapPin size={14} />
                          {t("profile.location") || "Location"}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              handleFormChange("location", e.target.value)
                            }
                            className="profile-input"
                            placeholder={
                              t("profile.locationPlaceholder") ||
                              "e.g., Addis Ababa"
                            }
                          />
                        ) : (
                          <span className="profile-detail-value">
                            {formData.location ||
                              t("profile.noData") ||
                              "No data"}
                          </span>
                        )}
                      </div>

                      <div className="profile-detail-item profile-detail-full">
                        <label className="profile-detail-label">
                          <FiMessageSquare size={14} />
                          {t("profile.bio") || "Bio"}
                        </label>
                        {isEditing ? (
                          <textarea
                            value={formData.bio}
                            onChange={(e) =>
                              handleFormChange("bio", e.target.value)
                            }
                            className="profile-textarea"
                            rows={4}
                            placeholder={
                              t("profile.bioPlaceholder") ||
                              "Tell us about yourself..."
                            }
                            maxLength={200}
                          />
                        ) : (
                          <span className="profile-detail-value">
                            {formData.bio || t("profile.noData") || "No data"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="profile-section-sub">
                      <h4 className="profile-section-subtitle">
                        <FiGlobe size={16} />
                        {t("profile.socialLinks") || "Social Links"}
                      </h4>
                      <div className="profile-details-grid profile-social-grid">
                        {socialLinks.map((link) => (
                          <div key={link.key} className="profile-detail-item">
                            <label className="profile-detail-label">
                              {link.icon}
                              {link.label}
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={formData[link.key]}
                                onChange={(e) =>
                                  handleFormChange(link.key, e.target.value)
                                }
                                className="profile-input"
                                placeholder={`https://${link.key}.com/username`}
                              />
                            ) : (
                              <span className="profile-detail-value">
                                {formData[link.key] ? (
                                  <a
                                    href={formData[link.key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="profile-social-link-text"
                                  >
                                    {formData[link.key]}
                                  </a>
                                ) : (
                                  t("profile.noData") || "No data"
                                )}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                  <div className="profile-section">
                    <h3 className="profile-section-title">
                      <FiTrendingUp size={18} />
                      {t("profile.recentActivity") || "Recent Activity"}
                    </h3>
                    <div className="profile-activity-list">
                      <div className="profile-activity-item">
                        <div
                          className="profile-activity-icon"
                          style={{ background: "#eff6ff", color: "#3b82f6" }}
                        >
                          <FiCheckCircle size={16} />
                        </div>
                        <div className="profile-activity-content">
                          <p className="profile-activity-text">
                            {t("profile.activityTaskCompleted") ||
                              "Completed a task"}
                          </p>
                          <span className="profile-activity-time">
                            {t("profile.justNow") || "Just now"}
                          </span>
                        </div>
                      </div>
                      <div className="profile-activity-item">
                        <div
                          className="profile-activity-icon"
                          style={{ background: "#f5f3ff", color: "#8b5cf6" }}
                        >
                          <FiFileText size={16} />
                        </div>
                        <div className="profile-activity-content">
                          <p className="profile-activity-text">
                            {t("profile.activityReportSubmitted") ||
                              "Submitted a daily report"}
                          </p>
                          <span className="profile-activity-time">
                            {t("profile.twoHoursAgo") || "2 hours ago"}
                          </span>
                        </div>
                      </div>
                      <div className="profile-activity-item">
                        <div
                          className="profile-activity-icon"
                          style={{ background: "#f0fdf4", color: "#10b981" }}
                        >
                          <FiUsers size={16} />
                        </div>
                        <div className="profile-activity-content">
                          <p className="profile-activity-text">
                            {t("profile.activityJoinedTeam") ||
                              "Joined a team meeting"}
                          </p>
                          <span className="profile-activity-time">
                            {t("profile.yesterday") || "Yesterday"}
                          </span>
                        </div>
                      </div>
                      <div className="profile-activity-item">
                        <div
                          className="profile-activity-icon"
                          style={{ background: "#fffbeb", color: "#f59e0b" }}
                        >
                          <FiStar size={16} />
                        </div>
                        <div className="profile-activity-content">
                          <p className="profile-activity-text">
                            {t("profile.activityEvaluationReceived") ||
                              "Received evaluation feedback"}
                          </p>
                          <span className="profile-activity-time">
                            {t("profile.threeDaysAgo") || "3 days ago"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
