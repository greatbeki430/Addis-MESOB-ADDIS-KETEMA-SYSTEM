/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from "react";
import { C, F, btn } from "../../styles/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  getRoleDisplayName,
  getRoleBadgeColor,
  getRoleIcon,
  ROLES,
} from "../../utils/roles";
import { Modal, useToast } from "../../components/ui/Modal";

// ✅ Reusable Action Button Component with improved styling
const ActionButton = ({ onClick, icon, label, color = C.primary, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "6px 10px",
      borderRadius: 6,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 13,
      fontWeight: 500,
      color: color,
      transition: "all 0.2s ease",
      fontFamily: F.sans,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = color + "15";
      e.currentTarget.style.transform = "scale(1.05)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.transform = "scale(1)";
    }}
  >
    <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
    <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
  </button>
);

// ✅ Role Description Component
const RoleDescription = ({ role }) => {
  const descriptions = {
    superadmin: "Full system control • Manage all users & teams",
    admin: "Manage users & services • View all reports",
    leader: "Manage team • Create daily reports",
    employee: "View dashboard • Participate in forums & evaluations",
  };
  return (
    <span
      style={{
        fontSize: 10,
        color: "#999",
        display: "block",
        marginTop: 2,
        fontStyle: "italic",
      }}
    >
      {descriptions[role] || ""}
    </span>
  );
};

export default function UserManagement({ t }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    phone: "",
  });
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();

  // ✅ Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    userName: "",
  });
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    user: null,
  });
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const { showToast, ToastContainer } = useToast();

  // ✅ Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to load users. Please refresh the page.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await authAPI.updateUser(editingUser._id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
        });
        showToast("User updated successfully!", "success");
      } else {
        await authAPI.register(formData);
        showToast("User created successfully!", "success");
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        phone: "",
      });
      loadUsers();
    } catch (error) {
      console.error("Failed to save user:", error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message:
          error.response?.data?.message ||
          "Operation failed. Please try again.",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await authAPI.deleteUser(confirmModal.userId);
      setConfirmModal({ isOpen: false, userId: null, userName: "" });
      showToast("User deleted successfully!", "success");
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      setConfirmModal({ isOpen: false, userId: null, userName: "" });
      setAlertModal({
        isOpen: true,
        title: "Error",
        message:
          error.response?.data?.message || "Delete failed. Please try again.",
        type: "error",
      });
    }
  };

  const openDeleteConfirm = (userId, userName) => {
    setConfirmModal({
      isOpen: true,
      userId: userId,
      userName: userName,
    });
  };

  const openViewModal = (user) => {
    setViewModal({
      isOpen: true,
      user: user,
    });
  };

  // ✅ Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getAvailableRoles = () => {
    if (isSuperAdmin) {
      return [
        { value: ROLES.EMPLOYEE, label: "Employee" },
        { value: ROLES.TEAM_LEADER, label: "Team Leader" },
        { value: ROLES.ADMIN, label: "Admin" },
        { value: ROLES.SUPER_ADMIN, label: "Super Admin" },
      ];
    }
    if (isAdmin) {
      return [
        { value: ROLES.EMPLOYEE, label: "Employee" },
        { value: ROLES.TEAM_LEADER, label: "Team Leader" },
      ];
    }
    return [];
  };

  const canDeleteUser = (user) => {
    if (user._id === currentUser._id) return false;
    if (user.role === ROLES.SUPER_ADMIN && !isSuperAdmin) return false;
    return true;
  };

  const getRoleStats = () => {
    const stats = {
      total: users.length,
      superadmin: users.filter((u) => u.role === ROLES.SUPER_ADMIN).length,
      admin: users.filter((u) => u.role === ROLES.ADMIN).length,
      leader: users.filter((u) => u.role === ROLES.TEAM_LEADER).length,
      employee: users.filter((u) => u.role === ROLES.EMPLOYEE).length,
    };
    return stats;
  };

  const roleStats = getRoleStats();

  const getTranslation = (key) => {
    if (t && t.userManagement) {
      return t.userManagement[key] || key;
    }
    const fallback = {
      title: "User Management",
      subtitle: "Manage all users in the system",
      totalUsers: "total users",
      addUser: "Add New User",
      searchPlaceholder: "🔍 Search users by name or email...",
      allRoles: "All Roles",
      noUsersFound: "No users found",
      noUsersMatch: "No users match your search criteria",
      tryAdjusting: "Try adjusting your search or filter",
      createFirstUser: "Click 'Add New User' to create your first user",
      editUser: "Edit User",
      addNewUser: "Add New User",
      updateInfo: "Update information for",
      createAccount: "Create a new user account with specific role permissions",
      fullName: "Full Name",
      email: "Email",
      password: "Password",
      role: "Role",
      phone: "Phone",
      phoneOptional: "Phone (Optional)",
      cancel: "Cancel",
      updateUser: "💾 Update User",
      createUser: "✅ Create User",
      viewDetails: "View user details",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      changeRole: "Change user role",
      you: "You",
    };
    return fallback[key] || key;
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
          setConfirmModal({ isOpen: false, userId: null, userName: "" })
        }
        title="Confirm Delete"
        message={`Are you sure you want to delete "${confirmModal.userName}"? This action cannot be undone.`}
        type="confirm"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() =>
          setConfirmModal({ isOpen: false, userId: null, userName: "" })
        }
      />

      {/* ✅ View User Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, user: null })}
        title={`👤 User Details - ${viewModal.user?.name || ""}`}
        type="info"
        size="md"
      >
        {viewModal.user && (
          <div style={{ fontFamily: F.sans }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: C.muted }}>Name</span>
                <span style={{ fontWeight: 600, color: C.dark }}>
                  {viewModal.user.name}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: C.muted }}>Email</span>
                <span style={{ fontWeight: 600, color: C.dark }}>
                  {viewModal.user.email}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: C.muted }}>Role</span>
                <span style={{ fontWeight: 600, color: C.dark }}>
                  {getRoleIcon(viewModal.user.role)}{" "}
                  {getRoleDisplayName(viewModal.user.role)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: C.muted }}>Phone</span>
                <span style={{ fontWeight: 600, color: C.dark }}>
                  {viewModal.user.phone || "N/A"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: C.muted }}>User ID</span>
                <span style={{ fontWeight: 400, color: "#999", fontSize: 12 }}>
                  {viewModal.user._id}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: `1px solid ${C.border}`,
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: C.muted }}>Created</span>
                <span style={{ fontWeight: 600, color: C.dark }}>
                  {new Date(viewModal.user.createdAt).toLocaleDateString()} at{" "}
                  {new Date(viewModal.user.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.muted }}>Last Updated</span>
                <span style={{ fontWeight: 600, color: C.dark }}>
                  {new Date(viewModal.user.updatedAt).toLocaleDateString()} at{" "}
                  {new Date(viewModal.user.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Header with Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
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
            }}
          >
            👥 {getTranslation("title")}
          </h1>
          <p
            style={{
              fontSize: "clamp(11px, 3vw, 13px)",
              color: C.muted,
              marginTop: 4,
              fontFamily: F.sans,
            }}
          >
            {getTranslation("subtitle")} • {users.length}{" "}
            {getTranslation("totalUsers")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: "",
              email: "",
              password: "",
              role: "employee",
              phone: "",
            });
            setShowModal(true);
          }}
          style={{
            ...btn.primary,
            padding: "10px 24px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>➕</span> {getTranslation("addUser")}
        </button>
      </div>

      {/* Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: C.white,
            padding: "12px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: C.dark }}>
            {roleStats.total}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>Total</div>
        </div>
        <div
          style={{
            background: C.white,
            padding: "12px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#8B1A1A" }}>
            {roleStats.superadmin}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>👑 Super Admin</div>
        </div>
        <div
          style={{
            background: C.white,
            padding: "12px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1A6B4A" }}>
            {roleStats.admin}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>⚙️ Admin</div>
        </div>
        <div
          style={{
            background: C.white,
            padding: "12px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#C25A00" }}>
            {roleStats.leader}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>⭐ Team Leader</div>
        </div>
        <div
          style={{
            background: C.white,
            padding: "12px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1E4D8C" }}>
            {roleStats.employee}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>👤 Employee</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <input
          type="text"
          placeholder={getTranslation("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "10px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.primary;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.border;
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            background: C.white,
            outline: "none",
            minWidth: 150,
          }}
        >
          <option value="all">{getTranslation("allRoles")}</option>
          <option value={ROLES.EMPLOYEE}>Employee</option>
          <option value={ROLES.TEAM_LEADER}>Team Leader</option>
          <option value={ROLES.ADMIN}>Admin</option>
          <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: C.muted,
            fontFamily: F.sans,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: C.white,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <thead>
              <tr style={{ background: C.dark, color: C.light }}>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Phone
                </th>
                <th
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user._id}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: index % 2 === 0 ? C.white : C.cardBg,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8faf8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      index % 2 === 0 ? C.white : C.cardBg;
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 500,
                      color: C.dark,
                    }}
                  >
                    {user.name}
                    {user._id === currentUser._id && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          background: C.primary + "15",
                          color: C.primary,
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        {getTranslation("you")}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#555" }}>
                    {user.email}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div>
                      <span
                        style={{
                          background: getRoleBadgeColor(user.role) + "15",
                          color: getRoleBadgeColor(user.role),
                          padding: "5px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>{getRoleIcon(user.role)}</span>
                        {getRoleDisplayName(user.role)}
                      </span>
                      <RoleDescription role={user.role} />
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#777" }}>
                    {user.phone || "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 16px",
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    {/* ✏️ Edit Button */}
                    <ActionButton
                      onClick={() => {
                        setEditingUser(user);
                        setFormData({
                          name: user.name,
                          email: user.email,
                          password: "",
                          role: user.role,
                          phone: user.phone || "",
                        });
                        setShowModal(true);
                      }}
                      icon="✏️"
                      label={getTranslation("edit")}
                      color="#3b82f6"
                      title={getTranslation("edit")}
                    />

                    {/* 👁️ View Button - Now opens professional modal */}
                    <ActionButton
                      onClick={() => openViewModal(user)}
                      icon="👁️"
                      label={getTranslation("view")}
                      color="#8b5cf6"
                      title={getTranslation("viewDetails")}
                    />

                    {/* 🔄 Role Change Button (Super Admin only) */}
                    {isSuperAdmin && user.role !== ROLES.SUPER_ADMIN && (
                      <ActionButton
                        onClick={() => {
                          const newRole = prompt(
                            `Change role for ${user.name}:\n\n` +
                              "Enter one of: employee, leader, admin",
                            user.role,
                          );
                          if (newRole && newRole !== user.role) {
                            const validRoles = [
                              ROLES.EMPLOYEE,
                              ROLES.TEAM_LEADER,
                              ROLES.ADMIN,
                            ];
                            if (validRoles.includes(newRole)) {
                              setEditingUser(user);
                              setFormData({
                                name: user.name,
                                email: user.email,
                                password: "",
                                role: newRole,
                                phone: user.phone || "",
                              });
                              const submitEvent = new Event("submit", {
                                bubbles: true,
                              });
                              document
                                .querySelector("#user-form")
                                ?.dispatchEvent(submitEvent);
                            } else {
                              setAlertModal({
                                isOpen: true,
                                title: "Invalid Role",
                                message:
                                  "Please use: employee, leader, or admin",
                                type: "warning",
                              });
                            }
                          }
                        }}
                        icon="🔄"
                        label="Role"
                        color="#f59e0b"
                        title={getTranslation("changeRole")}
                      />
                    )}

                    {/* 🗑️ Delete Button */}
                    {canDeleteUser(user) && (
                      <ActionButton
                        onClick={() => openDeleteConfirm(user._id, user.name)}
                        icon="🗑️"
                        label={getTranslation("delete")}
                        color="#ef4444"
                        title={getTranslation("delete")}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: C.muted,
                fontFamily: F.sans,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                {searchTerm || roleFilter !== "all"
                  ? getTranslation("noUsersMatch")
                  : getTranslation("noUsersFound")}
              </p>
              <p style={{ fontSize: 13, color: "#999" }}>
                {searchTerm || roleFilter !== "all"
                  ? getTranslation("tryAdjusting")
                  : getTranslation("createFirstUser")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* User Modal */}
      {showModal && (
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
              background: C.white,
              borderRadius: 16,
              padding: 28,
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
                fontSize: "clamp(20px, 5vw, 24px)",
                fontWeight: 800,
                color: C.dark,
                fontFamily: F.serif,
                marginBottom: 4,
              }}
            >
              {editingUser
                ? "✏️ " + getTranslation("editUser")
                : "➕ " + getTranslation("addNewUser")}
            </h2>
            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                marginBottom: 20,
                fontFamily: F.sans,
              }}
            >
              {editingUser
                ? `${getTranslation("updateInfo")} ${editingUser.name}`
                : getTranslation("createAccount")}
            </p>

            <form id="user-form" onSubmit={handleSubmit}>
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
                  {getTranslation("fullName")}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    transition: "border-color 0.2s",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                  }}
                />
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
                  {getTranslation("email")}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    transition: "border-color 0.2s",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                  }}
                />
              </div>

              {!editingUser && (
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
                    {getTranslation("password")}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      transition: "border-color 0.2s",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                    }}
                  />
                </div>
              )}

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
                  {getTranslation("role")}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    background: C.white,
                    outline: "none",
                  }}
                >
                  {getAvailableRoles().map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <RoleDescription role={formData.role} />
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
                  {getTranslation("phoneOptional")}
                </label>
                <input
                  type="tel"
                  placeholder="+251 9XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    transition: "border-color 0.2s",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    ...btn.secondary,
                    padding: "10px 24px",
                    fontSize: 14,
                  }}
                >
                  {getTranslation("cancel")}
                </button>
                <button
                  type="submit"
                  style={{
                    ...btn.primary,
                    padding: "10px 24px",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {editingUser
                    ? getTranslation("updateUser")
                    : getTranslation("createUser")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
