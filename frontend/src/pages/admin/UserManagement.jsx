/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from "react";
import { C, F, btn } from "../../styles/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import {
  getRoleDisplayName,
  getRoleBadgeColor,
  getRoleIcon,
  ROLES,
} from "../../utils/roles";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useToast";
import {
  FiEdit2,
  FiEye,
  FiTrash2,
  FiRefreshCw,
  FiUserPlus,
  FiSearch,
  FiUsers,
  FiUser,
  FiUserCheck,
  FiShield,
  FiStar,
  FiX,
  FiCheck,
} from "react-icons/fi";

// ✅ Beautiful Stat Card with Gradient
const StatCard = ({ icon: Icon, value, label, color, gradient }) => (
  <div
    style={{
      background: gradient || C.white,
      padding: "16px 20px",
      borderRadius: 12,
      textAlign: "center",
      border: `1px solid ${C.border}33`,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      position: "relative",
      overflow: "hidden",
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: 4,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: color + "15",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={color} />
      </div>
      <div
        style={{
          fontSize: "clamp(24px, 5vw, 32px)",
          fontWeight: 900,
          color: color,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
    <div
      style={{
        fontSize: "clamp(10px, 2.5vw, 12px)",
        color: C.muted,
        fontWeight: 500,
        marginTop: 2,
      }}
    >
      {label}
    </div>
    {/* Decorative gradient line */}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${color}44, ${color})`,
        borderRadius: "0 0 12px 12px",
      }}
    />
  </div>
);

const ActionButton = ({ onClick, Icon, label, color = C.primary, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "6px 10px",
      borderRadius: 8,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      fontSize: 12,
      fontWeight: 600,
      color: color,
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      fontFamily: F.sans,
      position: "relative",
      minWidth: "32px",
      minHeight: "32px",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = color + "12";
      e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
      e.currentTarget.style.boxShadow = `0 4px 12px ${color}22`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.transform = "translateY(0) scale(1)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    {Icon && <Icon size={16} />}
    {label && <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>}
  </button>
);

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

export default function UserManagement({ t }) {
  const safeT = t || {};
  const tu = safeT.userManagement || {};
  const safeCommon = safeT.common || {};

  const getTranslation = (key) => {
    if (tu && tu[key]) {
      return tu[key];
    }
    const fallback = {
      title: "User Management",
      subtitle: "Manage all users in the system",
      totalUsers: "total users",
      addUser: "Add New User",
      searchPlaceholder: "Search users by name or email...",
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
      updateUser: "Update User",
      createUser: "Create User",
      viewDetails: "View user details",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      changeRole: "Change user role",
      you: "You",
      confirmDeleteTitle: "Confirm Delete",
      confirmDeleteMessage: "Are you sure you want to delete",
      deleteWarning: "This action cannot be undone.",
      userDetails: "User Details",
      created: "Created",
      lastUpdated: "Last Updated",
      userId: "User ID",
      actions: "Actions",
      teamLeader: "Team Leader",
      superAdmin: "Super Admin",
      admin: "Admin",
      employee: "Employee",
      total: "Total",
      roleEmployee: "Employee",
      roleTeamLeader: "Team Leader",
      roleAdmin: "Admin",
      roleSuperAdmin: "Super Admin",
    };
    return fallback[key] || key;
  };

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
  const [roleModal, setRoleModal] = useState({
    isOpen: false,
    user: null,
    selectedRole: "employee",
  });

  const { showToast } = useToast();

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
        title: getTranslation("title"),
        message: getTranslation("loadError"),
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
        showToast(getTranslation("updateSuccess"), "success");
      } else {
        await authAPI.register(formData);
        showToast(getTranslation("createSuccess"), "success");
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
        title: getTranslation("title"),
        message: error.response?.data?.message || getTranslation("saveError"),
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await authAPI.deleteUser(confirmModal.userId);
      setConfirmModal({ isOpen: false, userId: null, userName: "" });
      showToast(getTranslation("deleteSuccess"), "success");
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      setConfirmModal({ isOpen: false, userId: null, userName: "" });
      setAlertModal({
        isOpen: true,
        title: getTranslation("title"),
        message: error.response?.data?.message || getTranslation("deleteError"),
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
        { value: ROLES.EMPLOYEE, label: getTranslation("roleEmployee") },
        { value: ROLES.TEAM_LEADER, label: getTranslation("roleTeamLeader") },
        { value: ROLES.ADMIN, label: getTranslation("roleAdmin") },
        { value: ROLES.SUPER_ADMIN, label: getTranslation("roleSuperAdmin") },
      ];
    }
    if (isAdmin) {
      return [
        { value: ROLES.EMPLOYEE, label: getTranslation("roleEmployee") },
        { value: ROLES.TEAM_LEADER, label: getTranslation("roleTeamLeader") },
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

  // Color configurations for stat cards
  const cardColors = {
    total: {
      color: "#1a3aad",
      gradient: "linear-gradient(135deg, #f0f3ff, #e0e7ff)",
    },
    superadmin: {
      color: "#8B1A1A",
      gradient: "linear-gradient(135deg, #fef2f2, #fee2e2)",
    },
    admin: {
      color: "#1A6B4A",
      gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
    },
    leader: {
      color: "#C25A00",
      gradient: "linear-gradient(135deg, #fffbeb, #fef3c7)",
    },
    employee: {
      color: "#1E4D8C",
      gradient: "linear-gradient(135deg, #eff6ff, #dbeafe)",
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
          setConfirmModal({ isOpen: false, userId: null, userName: "" })
        }
        title={getTranslation("confirmDeleteTitle")}
        message={`${getTranslation("confirmDeleteMessage")} "${confirmModal.userName}"? ${getTranslation("deleteWarning")}`}
        type="confirm"
        confirmText={getTranslation("delete")}
        cancelText={getTranslation("cancel")}
        onConfirm={handleDelete}
        onCancel={() =>
          setConfirmModal({ isOpen: false, userId: null, userName: "" })
        }
      />

      <Modal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, user: null })}
        title={`👤 ${getTranslation("userDetails")} - ${viewModal.user?.name || ""}`}
        type="info"
        size="md"
      >
        {viewModal.user && (
          <div style={{ fontFamily: F.sans }}>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                {
                  label: getTranslation("fullName"),
                  value: viewModal.user.name,
                },
                { label: getTranslation("email"), value: viewModal.user.email },
                {
                  label: getTranslation("role"),
                  value: getRoleDisplayName(viewModal.user.role),
                },
                {
                  label: getTranslation("phone"),
                  value: viewModal.user.phone || "N/A",
                },
                {
                  label: getTranslation("userId"),
                  value: viewModal.user._id,
                  small: true,
                },
                {
                  label: getTranslation("created"),
                  value: new Date(viewModal.user.createdAt).toLocaleString(),
                },
                {
                  label: getTranslation("lastUpdated"),
                  value: new Date(viewModal.user.updatedAt).toLocaleString(),
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: idx < 6 ? `1px solid ${C.border}` : "none",
                    paddingBottom: idx < 6 ? 8 : 0,
                  }}
                >
                  <span style={{ color: C.muted, fontSize: 12 }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: C.dark,
                      fontSize: item.small ? 11 : 13,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={roleModal.isOpen}
        onClose={() =>
          setRoleModal({ isOpen: false, user: null, selectedRole: "employee" })
        }
        title={`🔄 ${getTranslation("changeRole")}`}
        type="confirm"
        confirmText={getTranslation("update")}
        cancelText={getTranslation("cancel")}
        onConfirm={() => {
          if (roleModal.user) {
            const newRole = roleModal.selectedRole;
            const updateData = {
              name: roleModal.user.name,
              email: roleModal.user.email,
              role: newRole,
              phone: roleModal.user.phone || "",
            };
            authAPI
              .updateUser(roleModal.user._id, updateData)
              .then(() => {
                showToast(getTranslation("updateSuccess"), "success");
                loadUsers();
                setRoleModal({
                  isOpen: false,
                  user: null,
                  selectedRole: "employee",
                });
              })
              .catch((error) => {
                console.error("Failed to update role:", error);
                setAlertModal({
                  isOpen: true,
                  title: getTranslation("title"),
                  message:
                    error.response?.data?.message ||
                    getTranslation("saveError"),
                  type: "error",
                });
              });
          }
        }}
        onCancel={() =>
          setRoleModal({ isOpen: false, user: null, selectedRole: "employee" })
        }
      >
        <div style={{ padding: "4px 0" }}>
          <p style={{ marginBottom: 16, color: "#555", fontSize: 13 }}>
            {getTranslation("changeRolePrompt")}{" "}
            <strong>{roleModal.user?.name}</strong>
          </p>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {getTranslation("role")}
            </label>
            <select
              value={roleModal.selectedRole}
              onChange={(e) =>
                setRoleModal({ ...roleModal, selectedRole: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1.5px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                background: C.white,
                outline: "none",
              }}
            >
              <option value={ROLES.EMPLOYEE}>
                {getTranslation("roleEmployee")}
              </option>
              <option value={ROLES.TEAM_LEADER}>
                {getTranslation("roleTeamLeader")}
              </option>
              <option value={ROLES.ADMIN}>{getTranslation("roleAdmin")}</option>
            </select>
          </div>
        </div>
      </Modal>

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
            padding: "8px 18px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 8,
          }}
        >
          <FiUserPlus size={16} />
          {getTranslation("addUser")}
        </button>
      </div>

      {/* Statistics Cards - Responsive Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: "clamp(8px, 2vw, 12px)",
          marginBottom: 16,
        }}
      >
        <StatCard
          icon={FiUsers}
          value={roleStats.total}
          label={getTranslation("total")}
          color={cardColors.total.color}
          gradient={cardColors.total.gradient}
        />
        <StatCard
          icon={FiShield}
          value={roleStats.superadmin}
          label={getTranslation("superAdmin")}
          color={cardColors.superadmin.color}
          gradient={cardColors.superadmin.gradient}
        />
        <StatCard
          icon={FiUserCheck}
          value={roleStats.admin}
          label={getTranslation("admin")}
          color={cardColors.admin.color}
          gradient={cardColors.admin.gradient}
        />
        <StatCard
          icon={FiStar}
          value={roleStats.leader}
          label={getTranslation("teamLeader")}
          color={cardColors.leader.color}
          gradient={cardColors.leader.gradient}
        />
        <StatCard
          icon={FiUser}
          value={roleStats.employee}
          label={getTranslation("employee")}
          color={cardColors.employee.color}
          gradient={cardColors.employee.gradient}
        />
      </div>

      {/* Search and Filter */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
          <FiSearch
            size={16}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#999",
            }}
          />
          <input
            type="text"
            placeholder={getTranslation("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
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
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 13,
            background: C.white,
            outline: "none",
            minWidth: 130,
          }}
        >
          <option value="all">{getTranslation("allRoles")}</option>
          <option value={ROLES.EMPLOYEE}>{getTranslation("employee")}</option>
          <option value={ROLES.TEAM_LEADER}>
            {getTranslation("teamLeader")}
          </option>
          <option value={ROLES.ADMIN}>{getTranslation("admin")}</option>
          <option value={ROLES.SUPER_ADMIN}>
            {getTranslation("superAdmin")}
          </option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: C.muted,
            fontFamily: F.sans,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          <p>{safeCommon.loading || "Loading..."}</p>
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
              minWidth: 600,
            }}
          >
            <thead>
              <tr style={{ background: C.dark, color: C.light }}>
                <th
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: 12,
                  }}
                >
                  <FiUser size={12} style={{ marginRight: 4 }} />
                  {getTranslation("fullName")}
                </th>
                <th
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: 12,
                  }}
                >
                  {getTranslation("email")}
                </th>
                <th
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: 12,
                  }}
                >
                  {getTranslation("role")}
                </th>
                <th
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontSize: 12,
                  }}
                >
                  {getTranslation("phone")}
                </th>
                <th
                  style={{
                    padding: "10px 14px",
                    textAlign: "center",
                    fontSize: 12,
                  }}
                >
                  {getTranslation("actions")}
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
                      padding: "8px 14px",
                      fontWeight: 500,
                      color: C.dark,
                      fontSize: 13,
                    }}
                  >
                    <FiUser
                      size={12}
                      style={{ marginRight: 6, color: C.primary, opacity: 0.6 }}
                    />
                    {user.name}
                    {user._id === currentUser._id && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 9,
                          background: C.primary + "15",
                          color: C.primary,
                          padding: "1px 6px",
                          borderRadius: 10,
                          fontWeight: 600,
                        }}
                      >
                        {getTranslation("you")}
                      </span>
                    )}
                  </td>
                  <td
                    style={{ padding: "8px 14px", color: "#555", fontSize: 12 }}
                  >
                    {user.email}
                  </td>
                  <td style={{ padding: "8px 14px" }}>
                    <div>
                      <span
                        style={{
                          background: getRoleBadgeColor(user.role) + "15",
                          color: getRoleBadgeColor(user.role),
                          padding: "3px 10px",
                          borderRadius: 16,
                          fontSize: 11,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span>{getRoleIcon(user.role)}</span>
                        {getRoleDisplayName(user.role)}
                      </span>
                      <RoleDescription role={user.role} />
                    </div>
                  </td>
                  <td
                    style={{ padding: "8px 14px", color: "#777", fontSize: 12 }}
                  >
                    {user.phone || "—"}
                  </td>
                  <td
                    style={{
                      padding: "4px 8px",
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
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
                      Icon={FiEdit2}
                      color="#3b82f6"
                      title={getTranslation("edit")}
                    />
                    <ActionButton
                      onClick={() => openViewModal(user)}
                      Icon={FiEye}
                      color="#8b5cf6"
                      title={getTranslation("viewDetails")}
                    />
                    {isSuperAdmin && user.role !== ROLES.SUPER_ADMIN && (
                      <ActionButton
                        onClick={() => {
                          setRoleModal({
                            isOpen: true,
                            user: user,
                            selectedRole: user.role,
                          });
                        }}
                        Icon={FiRefreshCw}
                        color="#f59e0b"
                        title={getTranslation("changeRole")}
                      />
                    )}
                    {canDeleteUser(user) && (
                      <ActionButton
                        onClick={() => openDeleteConfirm(user._id, user.name)}
                        Icon={FiTrash2}
                        color="#ef4444"
                        title={getTranslation("delete")}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: C.muted,
                fontFamily: F.sans,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <p style={{ fontSize: 15, marginBottom: 4 }}>
                {searchTerm || roleFilter !== "all"
                  ? getTranslation("noUsersMatch")
                  : getTranslation("noUsersFound")}
              </p>
              <p style={{ fontSize: 12, color: "#999" }}>
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
              padding: 24,
              width: "90%",
              maxWidth: 450,
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
                gap: 8,
              }}
            >
              {editingUser ? (
                <>
                  <FiEdit2 size={20} color="#3b82f6" />
                  {getTranslation("editUser")}
                </>
              ) : (
                <>
                  <FiUserPlus size={20} color={C.primary} />
                  {getTranslation("addNewUser")}
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
              {editingUser
                ? `${getTranslation("updateInfo")} ${editingUser.name}`
                : getTranslation("createAccount")}
            </p>

            <form id="user-form" onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 3,
                    fontWeight: 600,
                    fontSize: 12,
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
                    padding: "8px 12px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
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

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 3,
                    fontWeight: 600,
                    fontSize: 12,
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
                    padding: "8px 12px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
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
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 3,
                      fontWeight: 600,
                      fontSize: 12,
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
                      padding: "8px 12px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
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

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 3,
                    fontWeight: 600,
                    fontSize: 12,
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
                    padding: "8px 12px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
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

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 3,
                    fontWeight: 600,
                    fontSize: 12,
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
                    padding: "8px 12px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
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
                  gap: 10,
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
                    padding: "8px 18px",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FiX size={14} />
                  {getTranslation("cancel")}
                </button>
                <button
                  type="submit"
                  style={{
                    ...btn.primary,
                    padding: "8px 18px",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {editingUser ? (
                    <>
                      <FiCheck size={14} />
                      {getTranslation("updateUser")}
                    </>
                  ) : (
                    <>
                      <FiUserPlus size={14} />
                      {getTranslation("createUser")}
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
