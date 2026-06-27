import { useState, useEffect, useCallback } from "react";
import { C, btn, card } from "../../styles/theme";
import { teamAPI, authAPI } from "../../services/api";
import { getRoleDisplayName } from "../../utils/roles";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useToast";
import {
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiUserPlus,
  FiUser,
  FiUserCheck,
  FiStar,
  // eslint-disable-next-line no-unused-vars
  FiAward,
  FiX,
  FiCheck,
  // eslint-disable-next-line no-unused-vars
  FiPlus,
  FiCalendar,
  FiBriefcase,
  // eslint-disable-next-line no-unused-vars
  FiUserMinus,
} from "react-icons/fi";

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

  // Use toast but DON'T render ToastContainer here (it's in App.jsx)
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

  return (
    <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Modals - no ToastContainer here */}

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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(18px, 5vw, 24px)",
            fontWeight: 900,
            color: C.dark,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FiUsers size={24} color={C.primary} />
          {getTranslation("title")}
        </h1>
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingTeam(null);
              setFormData({ name: "", department: "", leader: "" });
              setShowModal(true);
            }}
            style={{
              ...btn.primary,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiUserPlus size={16} />
            {getTranslation("addTeam")}
          </button>
        )}
      </div>

      {/* Teams List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          {safeCommon.loading || "Loading..."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {teams.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              <FiUsers
                size={48}
                style={{
                  display: "block",
                  margin: "0 auto 16px",
                  opacity: 0.3,
                }}
              />
              {getTranslation("noTeams")}
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team._id}
                style={{
                  ...card,
                  padding: 16,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FiUser size={16} color={C.primary} />
                      {team.name}
                    </h3>
                    <p style={{ fontSize: 12, color: C.muted }}>
                      <FiBriefcase size={12} style={{ marginRight: 4 }} />
                      {team.department || getTranslation("noDepartment")}
                    </p>
                    <p style={{ fontSize: 12, marginTop: 8 }}>
                      <strong>
                        <FiStar
                          size={12}
                          style={{ marginRight: 4, color: "#f59e0b" }}
                        />
                        {getTranslation("leader")}:
                      </strong>{" "}
                      {team.leader?.name || getTranslation("notAssigned")}
                    </p>
                    <p style={{ fontSize: 12 }}>
                      <strong>
                        <FiUserCheck
                          size={12}
                          style={{ marginRight: 4, color: C.primary }}
                        />
                        {getTranslation("members")}:
                      </strong>{" "}
                      {team.members?.length || 0}
                    </p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      <FiCalendar size={11} style={{ marginRight: 4 }} />
                      {getTranslation("created")}:{" "}
                      {team.createdAt
                        ? new Date(team.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        justifyContent: "flex-end",
                        minWidth: "80px",
                        paddingTop: "4px",
                      }}
                    >
                      <button
                        onClick={() => {
                          setEditingTeam(team);
                          setFormData({
                            name: team.name,
                            department: team.department || "",
                            leader: team.leader?._id || "",
                          });
                          setShowModal(true);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "8px 12px",
                          borderRadius: 8,
                          color: "#3b82f6",
                          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "36px",
                          minHeight: "36px",
                        }}
                        title={getTranslation("edit")}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#3b82f615";
                          e.currentTarget.style.transform =
                            "translateY(-2px) scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px #3b82f633";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform =
                            "translateY(0) scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(team._id, team.name)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "8px 12px",
                          borderRadius: 8,
                          color: "#ef4444",
                          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "36px",
                          minHeight: "36px",
                        }}
                        title={getTranslation("delete")}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#ef444415";
                          e.currentTarget.style.transform =
                            "translateY(-2px) scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px #ef444433";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform =
                            "translateY(0) scale(1)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <FiTrash2 size={18} />
                      </button>
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
              padding: 24,
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
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "clamp(18px, 4vw, 22px)",
                fontWeight: 800,
                color: C.dark,
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
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 600,
                    fontSize: 13,
                    color: C.dark,
                  }}
                >
                  {getTranslation("teamName")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    border: `1px solid #d0ddd6`,
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d0ddd6";
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 600,
                    fontSize: 13,
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
                  style={{
                    width: "100%",
                    padding: 10,
                    border: `1px solid #d0ddd6`,
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d0ddd6";
                  }}
                  placeholder={getTranslation("departmentPlaceholder")}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontWeight: 600,
                    fontSize: 13,
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
                    padding: 10,
                    border: `1px solid #d0ddd6`,
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    background: C.white,
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
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    ...btn.secondary,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FiX size={16} />
                  {getTranslation("cancel")}
                </button>
                <button
                  type="submit"
                  style={{
                    ...btn.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
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
