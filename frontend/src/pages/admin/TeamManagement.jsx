// frontend/src/pages/admin/TeamManagement.jsx
// Complete Team Management - Fixed leader dropdown to show only Admin, Super Admin, Team Leader roles
// WITH member multi-select support

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { C, F, btn, card } from "../../styles/theme";
import { teamAPI, authAPI } from "../../services/api";
import { getRoleDisplayName } from "../../utils/roles";
import { useToast } from "../../hooks/useToast";
// ✅ FIXED: Correct import path for Modal
import { Modal } from "../../components/ui/Modal";
import {
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiStar,
  FiX,
  FiCheck,
  FiCalendar,
  FiBriefcase,
  FiAlertTriangle,
  FiUser,
} from "react-icons/fi";

// ✅ Stat Card Component
const StatCard = ({ icon: Icon, value, label, color, gradient, subtitle }) => (
  <div
    style={{
      background: gradient || C.white,
      padding: "clamp(14px, 2vw, 20px) clamp(16px, 2.5vw, 24px)",
      borderRadius: 14,
      textAlign: "center",
      border: `1px solid ${C.border}33`,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      position: "relative",
      overflow: "hidden",
      cursor: "default",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
      e.currentTarget.style.boxShadow = `0 12px 40px ${color}22`;
      e.currentTarget.style.borderColor = color;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0) scale(1)";
      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
      e.currentTarget.style.borderColor = C.border + "33";
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: color + "08",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 6,
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "12px",
          background: color + "15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "transform 0.3s ease",
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div
        style={{
          fontSize: "clamp(28px, 5vw, 36px)",
          fontWeight: 900,
          color: color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
    <div
      style={{
        fontSize: "clamp(11px, 2.5vw, 13px)",
        color: C.muted,
        fontWeight: 600,
        marginTop: 2,
        position: "relative",
        zIndex: 1,
      }}
    >
      {label}
    </div>
    {subtitle && (
      <div
        style={{
          fontSize: "clamp(9px, 2vw, 10px)",
          color: color,
          opacity: 0.7,
          marginTop: 2,
          fontWeight: 500,
          position: "relative",
          zIndex: 1,
        }}
      >
        {subtitle}
      </div>
    )}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${color}44, ${color}, ${color}44)`,
        borderRadius: "0 0 14px 14px",
      }}
    />
  </div>
);

// ✅ Action Buttons
const TeamActionButtons = ({ onEdit, onDelete }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
    <button
      onClick={onEdit}
      title="Edit team"
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "none",
        background: "#eff6ff",
        color: "#3b82f6",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#3b82f6";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#eff6ff";
        e.currentTarget.style.color = "#3b82f6";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <FiEdit2 size={16} />
    </button>
    <button
      onClick={onDelete}
      title="Delete team"
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "none",
        background: "#fef2f2",
        color: "#ef4444",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#ef4444";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fef2f2";
        e.currentTarget.style.color = "#ef4444";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <FiTrash2 size={16} />
    </button>
  </div>
);

// ✅ Role Description
const RoleDescription = ({ role }) => {
  const descriptions = {
    superadmin: "Full system control",
    admin: "Manage users & services",
    leader: "Manage team",
    employee: "Staff member",
  };
  return (
    <span
      style={{
        fontSize: 9,
        color: "#999",
        display: "block",
        marginTop: 1,
        fontStyle: "italic",
      }}
    >
      {descriptions[role] || ""}
    </span>
  );
};

export default function TeamManagement({ t, isSuperAdmin }) {
  const safeT = useMemo(() => t || {}, [t]);
  const safeCommon = useMemo(() => safeT.common || {}, [safeT]);

  const translations = useMemo(() => safeT.teamManagement || {}, [safeT]);

  const getTranslation = useCallback(
    (key) => {
      if (translations && translations[key]) {
        return translations[key];
      }
      const fallback = {
        title: "Team Management",
        addTeam: "Add New Team",
        noTeams: "No teams created yet.",
        noDepartment: "No department",
        notAssigned: "Not assigned",
        leader: "Leader",
        members: "Members",
        created: "Created",
        editTeam: "Edit Team",
        addNewTeam: "Add New Team",
        teamName: "Team Name",
        department: "Department",
        departmentPlaceholder: "e.g., Customer Service",
        teamLeader: "Team Leader",
        selectLeader: "Select Team Leader",
        selectMembers: "Select Team Members",
        noAvailableMembers: "No available members to add",
        update: "Update",
        create: "Create",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        refreshSuccess: "Data refreshed successfully",
        refreshError: "Failed to refresh data",
        updateSuccess: "Team updated successfully!",
        createSuccess: "Team created successfully!",
        deleteSuccess: "Team deleted successfully!",
        deleteError: "Delete failed. Please try again.",
        saveError: "Operation failed. Please try again.",
        confirmDeleteTitle: "Confirm Delete",
        confirmDeleteMessage: "Are you sure you want to delete",
        deleteWarning: "This action cannot be undone.",
        totalTeams: "TOTAL TEAMS",
        totalMembers: "TOTAL MEMBERS",
        teamsWithLeaders: "TEAMS WITH LEADERS",
        admin: "Admin",
        superAdmin: "Super Admin",
        employee: "Employee",
        membersCount: "members",
      };
      return fallback[key] || key;
    },
    [translations],
  );

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    leader: "",
    members: [],
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    teamId: null,
    teamName: "",
  });
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const [teamsResult, usersResult] = await Promise.allSettled([
      teamAPI.getAll(),
      authAPI.getUsers(),
    ]);

    if (teamsResult.status === "fulfilled") {
      console.log("📊 [TeamManagement] Teams loaded:", teamsResult.value.data);
      setTeams(teamsResult.value.data);
    } else {
      console.error(
        "❌ [TeamManagement] Failed to load teams:",
        teamsResult.reason?.response?.status,
        teamsResult.reason?.response?.data || teamsResult.reason?.message,
      );
    }

    if (usersResult.status === "fulfilled") {
      console.log("📊 [TeamManagement] Users loaded:", usersResult.value.data);
      setUsers(usersResult.value.data);
    } else {
      console.error(
        "❌ [TeamManagement] Failed to load users:",
        usersResult.reason?.response?.status,
        usersResult.reason?.response?.data || usersResult.reason?.message,
      );
    }

    if (
      teamsResult.status === "rejected" ||
      usersResult.status === "rejected"
    ) {
      throw new Error(
        "One or more of teams/users failed to load — check the console for details.",
      );
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchData();
      showToast(getTranslation("refreshSuccess"), "success");
    } catch {
      showToast(getTranslation("refreshError"), "error");
    } finally {
      setLoading(false);
    }
  }, [fetchData, showToast, getTranslation]);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        await fetchData();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        department: formData.department,
        leader: formData.leader,
        members: formData.members || [],
      };

      if (editingTeam) {
        await teamAPI.update(editingTeam._id, submitData);
        showToast(getTranslation("updateSuccess"), "success");
      } else {
        await teamAPI.create(submitData);
        showToast(getTranslation("createSuccess"), "success");
      }
      setShowModal(false);
      setEditingTeam(null);
      setFormData({ name: "", department: "", leader: "", members: [] });
      await refreshData();
    } catch (error) {
      console.error("Failed to save team:", error);
      setAlertModal({
        isOpen: true,
        title: getTranslation("title"),
        message: error.response?.data?.message || getTranslation("saveError"),
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await teamAPI.delete(confirmModal.teamId);
      setConfirmModal({ isOpen: false, teamId: null, teamName: "" });
      showToast(getTranslation("deleteSuccess"), "success");
      await refreshData();
    } catch (error) {
      console.error("Failed to delete team:", error);
      setConfirmModal({ isOpen: false, teamId: null, teamName: "" });
      setAlertModal({
        isOpen: true,
        title: getTranslation("title"),
        message: error.response?.data?.message || getTranslation("deleteError"),
        type: "error",
      });
    }
  };

  const openDeleteConfirm = (teamId, teamName) => {
    setConfirmModal({
      isOpen: true,
      teamId: teamId,
      teamName: teamName,
    });
  };

  // ✅ FIXED: Get leader IDs from all teams with proper null checks
  const leaderIds = useMemo(() => {
    const ids = teams
      .map((team) => {
        if (team.leader) {
          return team.leader._id || team.leader;
        }
        return null;
      })
      .filter(Boolean)
      .map((id) => id.toString());

    return ids;
  }, [teams]);

  // ✅ Get all member IDs from all teams (for filtering available members)
  const assignedMemberIds = useMemo(() => {
    const ids = teams
      .flatMap((team) => team.members || [])
      .filter(Boolean)
      .map((m) => m._id || m)
      .filter(Boolean)
      .map((id) => id.toString());

    return ids;
  }, [teams]);

  // ✅ Get users who can be team leaders: Admin, Super Admin, Team Leader
  const availableLeaderUsers = useMemo(() => {
    return users.filter((user) => {
      const isEligibleRole = ["admin", "superadmin", "leader"].includes(
        user.role,
      );
      if (!isEligibleRole) return false;

      if (editingTeam && editingTeam.leader?._id === user._id) {
        return true;
      }

      const isAlreadyLeader = leaderIds.includes(user._id.toString());
      if (isAlreadyLeader) return false;

      return true;
    });
  }, [users, leaderIds, editingTeam]);

  // ✅ Get users who can be team members: Employees only (or any non-admin/leader)
  const availableMemberUsers = useMemo(() => {
    const currentMemberIds = editingTeam
      ? (editingTeam.members || [])
          .map((m) => m._id || m)
          .filter(Boolean)
          .map((id) => id.toString())
      : [];

    return users.filter((user) => {
      // Exclude users who are leaders, admins, or superadmins
      if (["admin", "superadmin", "leader"].includes(user.role)) {
        return false;
      }

      // If editing, include current members
      if (currentMemberIds.includes(user._id.toString())) {
        return true;
      }

      // Exclude users already assigned to any team (unless editing and they're in this team)
      const isAlreadyAssigned = assignedMemberIds.includes(user._id.toString());
      if (isAlreadyAssigned) return false;

      return true;
    });
  }, [users, assignedMemberIds, editingTeam]);

  const eligibleRoleUsers = useMemo(
    () =>
      users.filter((user) =>
        ["admin", "superadmin", "leader"].includes(user.role),
      ),
    [users],
  );

  const totalMembers = teams.reduce(
    (sum, team) => sum + (team.members?.length || 0),
    0,
  );
  const teamsWithLeaders = teams.filter((team) => team.leader).length;

  const cardColors = {
    total: {
      color: "#1a3aad",
      gradient: "linear-gradient(135deg, #f0f3ff, #e0e7ff)",
      subtitle: "All teams",
    },
    members: {
      color: "#1A6B4A",
      gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
      subtitle: "Total staff",
    },
    leaders: {
      color: "#C25A00",
      gradient: "linear-gradient(135deg, #fffbeb, #fef3c7)",
      subtitle: "Teams with leaders",
    },
  };

  // ✅ Helper to get selected member names for display
  const getSelectedMemberNames = (memberIds) => {
    if (!memberIds || memberIds.length === 0) return "";
    const names = memberIds
      .map((id) => {
        const user = users.find((u) => u._id === id);
        return user ? user.name : null;
      })
      .filter(Boolean);
    return names.join(", ");
  };

  // ✅ Delete Confirmation Modal — portaled to document.body
  const deleteConfirmModal = confirmModal.isOpen
    ? createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
            backdropFilter: "blur(4px)",
          }}
          onClick={() =>
            setConfirmModal({ isOpen: false, teamId: null, teamName: "" })
          }
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "clamp(24px, 4vw, 32px)",
              maxWidth: 450,
              width: "100%",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
              position: "relative",
              animation: "fadeIn 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <FiAlertTriangle size={28} color="#dc2626" />
              </div>
              <h3
                style={{
                  fontSize: "clamp(16px, 2.5vw, 20px)",
                  fontWeight: 800,
                  color: C.dark,
                  margin: 0,
                  fontFamily: F.serif,
                }}
              >
                {getTranslation("confirmDeleteTitle")}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: C.muted,
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                {getTranslation("confirmDeleteMessage")}{" "}
                <strong style={{ color: C.dark }}>
                  "{confirmModal.teamName}"
                </strong>
                ?
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "#ef4444",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {getTranslation("deleteWarning")}
              </p>
            </div>

            <div
              style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
            >
              <button
                onClick={() =>
                  setConfirmModal({ isOpen: false, teamId: null, teamName: "" })
                }
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `1.5px solid ${C.border}`,
                  background: "transparent",
                  color: C.dark,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <FiX size={16} />
                {getTranslation("cancel")}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#ef4444";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <FiTrash2 size={16} />
                {getTranslation("delete")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  // ✅ Add/Edit Team Modal — with member multi-select
  const teamFormModal =
    isSuperAdmin && showModal
      ? createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "clamp(20px, 3vw, 28px)",
                width: "90%",
                maxWidth: 600,
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontSize: "clamp(18px, 4vw, 22px)",
                  fontWeight: 800,
                  color: C.dark,
                  fontFamily: F.serif,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {editingTeam ? (
                  <>
                    <FiEdit2 size={20} color="#3b82f6" />
                    {getTranslation("editTeam")}
                  </>
                ) : (
                  <>
                    <FiUserPlus size={20} color={C.primary} />
                    {getTranslation("addNewTeam")}
                  </>
                )}
              </h2>
              <p
                style={{
                  fontSize: "clamp(11px, 2.5vw, 12px)",
                  color: C.muted,
                  marginBottom: 16,
                  fontFamily: F.sans,
                }}
              >
                {editingTeam
                  ? `Update information for ${editingTeam.name}`
                  : "Create a new team and assign a leader and members"}
              </p>

              <form onSubmit={handleSubmit}>
                {/* Team Name */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 12,
                      color: C.dark,
                    }}
                  >
                    {getTranslation("teamName")}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Customer Service Team"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
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
                </div>

                {/* Department */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 12,
                      color: C.dark,
                    }}
                  >
                    {getTranslation("department")}
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder={getTranslation("departmentPlaceholder")}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
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
                </div>

                {/* Team Leader */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 12,
                      color: C.dark,
                    }}
                  >
                    {getTranslation("teamLeader")}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={formData.leader}
                    onChange={(e) =>
                      setFormData({ ...formData, leader: e.target.value })
                    }
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      background: C.white,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">{getTranslation("selectLeader")}</option>
                    {availableLeaderUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({getRoleDisplayName(user.role)})
                      </option>
                    ))}
                  </select>
                  {availableLeaderUsers.length === 0 && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "#ef4444",
                        marginTop: 4,
                        fontStyle: "italic",
                      }}
                    >
                      {eligibleRoleUsers.length === 0
                        ? "No available users with Admin, Super Admin, or Team Leader roles. Create a user with one of these roles first."
                        : "All users with Admin, Super Admin, or Team Leader roles are already leading a team. Reassign an existing leader or promote another user before creating a new one."}
                    </p>
                  )}
                  <RoleDescription role={formData.leader ? "leader" : ""} />
                </div>

                {/* Team Members - Multi-select */}
                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                      fontSize: 12,
                      color: C.dark,
                    }}
                  >
                    {getTranslation("selectMembers")}
                    <span
                      style={{
                        fontSize: 10,
                        color: C.muted,
                        fontWeight: 400,
                        marginLeft: 6,
                      }}
                    >
                      ({getTranslation("membersCount")})
                    </span>
                  </label>

                  {availableMemberUsers.length === 0 &&
                  (!editingTeam || (editingTeam.members || []).length === 0) ? (
                    <p
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        padding: "8px 12px",
                        background: C.bg,
                        borderRadius: 6,
                        fontStyle: "italic",
                      }}
                    >
                      {getTranslation("noAvailableMembers")}
                    </p>
                  ) : (
                    <div
                      style={{
                        border: `1.5px solid ${C.border}`,
                        borderRadius: 8,
                        padding: "8px",
                        maxHeight: 180,
                        overflowY: "auto",
                        background: C.white,
                      }}
                    >
                      {availableMemberUsers.map((user) => {
                        const isSelected = (formData.members || []).includes(
                          user._id,
                        );
                        return (
                          <div
                            key={user._id}
                            onClick={() => {
                              const currentMembers = formData.members || [];
                              let newMembers;
                              if (isSelected) {
                                newMembers = currentMembers.filter(
                                  (id) => id !== user._id,
                                );
                              } else {
                                newMembers = [...currentMembers, user._id];
                              }
                              setFormData({
                                ...formData,
                                members: newMembers,
                              });
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "6px 10px",
                              borderRadius: 6,
                              cursor: "pointer",
                              background: isSelected
                                ? `${C.primary}11`
                                : "transparent",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = C.bg;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background =
                                  "transparent";
                              }
                            }}
                          >
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                border: `2px solid ${isSelected ? C.primary : C.border}`,
                                background: isSelected
                                  ? C.primary
                                  : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "all 0.2s ease",
                              }}
                            >
                              {isSelected && <FiCheck size={12} color="#fff" />}
                            </div>
                            <FiUser size={14} color={C.muted} />
                            <span
                              style={{
                                fontSize: 13,
                                color: C.dark,
                                flex: 1,
                              }}
                            >
                              {user.name}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: C.muted,
                                background: C.bg,
                                padding: "1px 8px",
                                borderRadius: 10,
                              }}
                            >
                              {getRoleDisplayName(user.role)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Show selected members count */}
                  {(formData.members || []).length > 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: C.primary,
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      {formData.members.length} member
                      {formData.members.length !== 1 ? "s" : ""} selected
                      {formData.members.length > 0 &&
                        `: ${getSelectedMemberNames(formData.members)}`}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "flex-end",
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 18,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      ...btn.secondary,
                      padding: "10px 22px",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 8,
                    }}
                  >
                    <FiX size={16} />
                    {getTranslation("cancel")}
                  </button>
                  <button
                    type="submit"
                    style={{
                      ...btn.primary,
                      padding: "10px 22px",
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 8,
                    }}
                  >
                    {editingTeam ? (
                      <>
                        <FiCheck size={16} />
                        {getTranslation("update")}
                      </>
                    ) : (
                      <>
                        <FiUserPlus size={16} />
                        {getTranslation("create")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      style={{
        padding: "clamp(12px, 3vw, 20px)",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* Alert Modal - Using the correct Modal component (already portaled internally) */}
      <Modal
        isOpen={alertModal.isOpen}
        onClose={() =>
          setAlertModal({ isOpen: false, title: "", message: "", type: "info" })
        }
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal}

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(18px, 4vw, 24px)",
              fontWeight: 900,
              color: C.dark,
              fontFamily: F.serif,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiUsers size={22} color={C.primary} />
            {getTranslation("title")}
          </h1>
          <p
            style={{
              fontSize: "clamp(11px, 2.5vw, 13px)",
              color: C.muted,
              marginTop: 2,
              fontFamily: F.sans,
            }}
          >
            {teams.length} {getTranslation("totalTeams")} • {totalMembers}{" "}
            {getTranslation("totalMembers")}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingTeam(null);
              setFormData({
                name: "",
                department: "",
                leader: "",
                members: [],
              });
              setShowModal(true);
            }}
            style={{
              ...btn.primary,
              padding: "10px 22px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 10,
              boxShadow: `0 4px 14px ${C.primary}44`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 6px 20px ${C.primary}66`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 14px ${C.primary}44`;
            }}
          >
            <FiUserPlus size={18} />
            {getTranslation("addTeam")}
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "clamp(10px, 2vw, 14px)",
          marginBottom: 20,
        }}
      >
        <StatCard
          icon={FiUsers}
          value={teams.length}
          label={getTranslation("totalTeams")}
          color={cardColors.total.color}
          gradient={cardColors.total.gradient}
          subtitle={cardColors.total.subtitle}
        />
        <StatCard
          icon={FiUserCheck}
          value={totalMembers}
          label={getTranslation("totalMembers")}
          color={cardColors.members.color}
          gradient={cardColors.members.gradient}
          subtitle={cardColors.members.subtitle}
        />
        <StatCard
          icon={FiStar}
          value={teamsWithLeaders}
          label={getTranslation("teamsWithLeaders")}
          color={cardColors.leaders.color}
          gradient={cardColors.leaders.gradient}
          subtitle={cardColors.leaders.subtitle}
        />
      </div>

      {/* Teams List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>{safeCommon.loading || "Loading..."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {teams.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: C.muted,
                fontFamily: F.sans,
              }}
            >
              <FiUsers
                size={48}
                style={{
                  display: "block",
                  margin: "0 auto 16px",
                  opacity: 0.3,
                  color: C.border,
                }}
              />
              <p style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>
                {getTranslation("noTeams")}
              </p>
              {isSuperAdmin && (
                <p style={{ fontSize: 13, color: "#999" }}>
                  Click "{getTranslation("addTeam")}" to create your first team
                </p>
              )}
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team._id}
                style={{
                  ...card,
                  padding: "clamp(16px, 2vw, 20px)",
                  borderRadius: 14,
                  border: `1px solid ${C.border}33`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = C.primary + "44";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = C.border + "33";
                }}
              >
                {/* Decorative accent line */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`,
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                    marginTop: 4,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "10px",
                          background: `linear-gradient(135deg, ${C.primary}15, ${C.primary}08)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FiUsers size={20} color={C.primary} />
                      </div>
                      <div>
                        <h3
                          style={{
                            fontSize: "clamp(15px, 2.5vw, 17px)",
                            fontWeight: 700,
                            color: C.dark,
                            margin: 0,
                            fontFamily: F.sans,
                          }}
                        >
                          {team.name}
                        </h3>
                        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                          <FiBriefcase size={12} style={{ marginRight: 4 }} />
                          {team.department || getTranslation("noDepartment")}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "clamp(12px, 2vw, 20px)",
                        marginTop: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FiStar size={12} color="#f59e0b" />
                        <strong>{getTranslation("leader")}:</strong>
                        <span style={{ color: C.dark }}>
                          {team.leader?.name || getTranslation("notAssigned")}
                          {team.leader?.role && (
                            <span
                              style={{
                                fontSize: 9,
                                color: C.muted,
                                marginLeft: 4,
                                fontStyle: "italic",
                              }}
                            >
                              ({getRoleDisplayName(team.leader.role)})
                            </span>
                          )}
                        </span>
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FiUserCheck size={12} color={C.primary} />
                        <strong>{getTranslation("members")}:</strong>
                        <span style={{ color: C.dark }}>
                          {team.members?.length || 0}
                        </span>
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FiCalendar size={11} />
                        {getTranslation("created")}:{" "}
                        {team.createdAt
                          ? new Date(team.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    {/* Member names preview */}
                    {team.members && team.members.length > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <FiUser size={11} />
                        <span>
                          {team.members
                            .slice(0, 5)
                            .map((m) => m.name || m)
                            .join(", ")}
                          {team.members.length > 5 &&
                            ` +${team.members.length - 5} more`}
                        </span>
                      </div>
                    )}
                  </div>

                  {isSuperAdmin && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        paddingTop: 4,
                        flexShrink: 0,
                      }}
                    >
                      <TeamActionButtons
                        onEdit={() => {
                          const memberIds = (team.members || [])
                            .map((m) => m._id || m)
                            .filter(Boolean)
                            .map((id) => id.toString());
                          setEditingTeam(team);
                          setFormData({
                            name: team.name,
                            department: team.department || "",
                            leader: team.leader?._id || "",
                            members: memberIds,
                          });
                          setShowModal(true);
                        }}
                        onDelete={() => openDeleteConfirm(team._id, team.name)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Team Modal */}
      {teamFormModal}

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
