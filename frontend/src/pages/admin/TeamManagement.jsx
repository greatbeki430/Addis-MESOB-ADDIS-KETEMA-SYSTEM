import { useState, useEffect, useCallback } from "react";
import { C, F, btn, card } from "../../styles/theme";
import { teamAPI, authAPI } from "../../services/api";
import { getRoleDisplayName } from "../../utils/roles";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useToast";
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
} from "react-icons/fi";

// ✅ Beautiful Stat Card with Gradient and Icon
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
    {/* Decorative background circle */}
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
    {/* Decorative gradient line */}
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

// ✅ Beautiful Action Button Group for Team Cards
const TeamActionButtons = ({ onEdit, onDelete }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {/* Edit Button */}
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

      {/* Delete Button */}
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
};

export default function TeamManagement({ t, isSuperAdmin }) {
  const safeT = t || {};
  const tt = safeT.teamManagement || {};
  const safeCommon = safeT.common || {};

  const getTranslation = (key) => {
    if (tt && tt[key]) {
      return tt[key];
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
      totalTeams: "total teams",
      totalMembers: "total members",
      teamsWithLeaders: "teams with leaders",
    };
    return fallback[key] || key;
  };

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    leader: "",
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
    try {
      const [teamsRes, usersRes] = await Promise.all([
        teamAPI.getAll(),
        authAPI.getUsers(),
      ]);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
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
  }, [fetchData, showToast]);

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
      if (editingTeam) {
        await teamAPI.update(editingTeam._id, formData);
        showToast(getTranslation("updateSuccess"), "success");
      } else {
        await teamAPI.create(formData);
        showToast(getTranslation("createSuccess"), "success");
      }
      setShowModal(false);
      setEditingTeam(null);
      setFormData({ name: "", department: "", leader: "" });
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

  // Calculate stats
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

  return (
    <div
      style={{
        padding: "clamp(12px, 3vw, 20px)",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* Modals */}
      <Modal
        isOpen={alertModal.isOpen}
        onClose={() =>
          setAlertModal({ isOpen: false, title: "", message: "", type: "info" })
        }
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, teamId: null, teamName: "" })
        }
        title={getTranslation("confirmDeleteTitle")}
        message={`${getTranslation("confirmDeleteMessage")} "${confirmModal.teamName}"? ${getTranslation("deleteWarning")}`}
        type="confirm"
        confirmText={getTranslation("delete")}
        cancelText={getTranslation("cancel")}
        onConfirm={handleDelete}
        onCancel={() =>
          setConfirmModal({ isOpen: false, teamId: null, teamName: "" })
        }
      />

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
              setFormData({ name: "", department: "", leader: "" });
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
                          setEditingTeam(team);
                          setFormData({
                            name: team.name,
                            department: team.department || "",
                            leader: team.leader?._id || "",
                          });
                          setShowModal(true);
                        }}
                        onDelete={() => openDeleteConfirm(team._id, team.name)}
                        isSuperAdmin={isSuperAdmin}
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
      {isSuperAdmin && showModal && (
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
              maxWidth: 500,
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
                : "Create a new team and assign a leader"}
            </p>

            <form onSubmit={handleSubmit}>
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
                  {getTranslation("teamLeader")}
                </label>
                <select
                  value={formData.leader}
                  onChange={(e) =>
                    setFormData({ ...formData, leader: e.target.value })
                  }
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
                  {users
                    .filter(
                      (u) =>
                        u.role === "leader" ||
                        u.role === "admin" ||
                        u.role === "superadmin",
                    )
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({getRoleDisplayName(user.role)})
                      </option>
                    ))}
                </select>
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
        </div>
      )}
    </div>
  );
}
