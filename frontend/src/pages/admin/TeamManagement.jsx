import { useState, useEffect, useCallback } from "react";
import { C, btn, card } from "../../styles/theme";
import { teamAPI, authAPI } from "../../services/api";
import { getRoleDisplayName } from "../../utils/roles";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useToast";

export default function TeamManagement({ t, isSuperAdmin }) {
  // ✅ FIX: Safe access to translations with fallback
  const safeT = t || {};
  const tt = safeT.teamManagement || {};
  const safeCommon = safeT.common || {};

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

  // ✅ Modal states
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
  const { showToast, ToastContainer } = useToast();

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
      showToast(tt.refreshSuccess || "Data refreshed successfully", "success");
    } catch {
      showToast(tt.refreshError || "Failed to refresh data", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchData, showToast, tt]);

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
        showToast(tt.updateSuccess || "Team updated successfully!", "success");
      } else {
        await teamAPI.create(formData);
        showToast(tt.createSuccess || "Team created successfully!", "success");
      }
      setShowModal(false);
      setEditingTeam(null);
      setFormData({ name: "", department: "", leader: "" });
      await refreshData();
    } catch (error) {
      console.error("Failed to save team:", error);
      setAlertModal({
        isOpen: true,
        title: tt.title || "Error",
        message:
          error.response?.data?.message ||
          tt.saveError ||
          "Operation failed. Please try again.",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await teamAPI.delete(confirmModal.teamId);
      setConfirmModal({ isOpen: false, teamId: null, teamName: "" });
      showToast(tt.deleteSuccess || "Team deleted successfully!", "success");
      await refreshData();
    } catch (error) {
      console.error("Failed to delete team:", error);
      setConfirmModal({ isOpen: false, teamId: null, teamName: "" });
      setAlertModal({
        isOpen: true,
        title: tt.title || "Error",
        message:
          error.response?.data?.message ||
          tt.deleteError ||
          "Delete failed. Please try again.",
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
      {/* ✅ Toast Container */}
      <ToastContainer />

      {/* ✅ Alert Modal */}
      <Modal
        isOpen={alertModal.isOpen}
        onClose={() =>
          setAlertModal({ isOpen: false, title: "", message: "", type: "info" })
        }
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      {/* ✅ Confirm Delete Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, teamId: null, teamName: "" })
        }
        title={tt.confirmDeleteTitle || "Confirm Delete"}
        message={`${tt.confirmDeleteMessage || "Are you sure you want to delete"}"${confirmModal.teamName}"? ${tt.deleteWarning || "This action cannot be undone."}`}
        type="confirm"
        confirmText={tt.delete || "Delete"}
        cancelText={tt.cancel || "Cancel"}
        onConfirm={handleDelete}
        onCancel={() =>
          setConfirmModal({ isOpen: false, teamId: null, teamName: "" })
        }
      />

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
          }}
        >
          👥 {tt.title || "Team Management"}
        </h1>
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditingTeam(null);
              setFormData({ name: "", department: "", leader: "" });
              setShowModal(true);
            }}
            style={btn.primary}
          >
            + {tt.addTeam || "Add New Team"}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          {safeCommon.loading || "Loading..."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {teams.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              {tt.noTeams || "No teams created yet."}
            </div>
          ) : (
            teams.map((team) => (
              <div key={team._id} style={{ ...card, padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}
                    >
                      {team.name}
                    </h3>
                    <p style={{ fontSize: 12, color: C.muted }}>
                      {team.department || tt.noDepartment || "No department"}
                    </p>
                    <p style={{ fontSize: 12, marginTop: 8 }}>
                      <strong>{tt.leader || "Leader"}:</strong>{" "}
                      {team.leader?.name || tt.notAssigned || "Not assigned"}
                    </p>
                    <p style={{ fontSize: 12 }}>
                      <strong>{tt.members || "Members"}:</strong>{" "}
                      {team.members?.length || 0}
                    </p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      {tt.created || "Created"}:{" "}
                      {team.createdAt
                        ? new Date(team.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div>
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
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 18,
                          marginRight: 8,
                        }}
                        title={tt.edit || "Edit"}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(team._id, team.name)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 18,
                          color: "#dc2626",
                        }}
                        title={tt.delete || "Delete"}
                      >
                        🗑️
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
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 20 }}>
              {editingTeam
                ? `✏️ ${tt.editTeam || "Edit Team"}`
                : `➕ ${tt.addNewTeam || "Add New Team"}`}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  {tt.teamName || "Team Name"}
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
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  {tt.department || "Department"}
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
                  }}
                  placeholder={
                    tt.departmentPlaceholder || "e.g., Customer Service"
                  }
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  {tt.teamLeader || "Team Leader"}
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
                  }}
                >
                  <option value="">
                    {tt.selectLeader || "Select Team Leader"}
                  </option>
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
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={btn.secondary}
                >
                  {tt.cancel || "Cancel"}
                </button>
                <button type="submit" style={btn.primary}>
                  {editingTeam ? tt.update || "Update" : tt.create || "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
