// frontend/src/pages/admin/UserManagement.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
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
  generateTempPassword,
  copyToClipboard,
} from "../../utils/passwordUtils";
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
  FiCopy,
  FiEyeOff,
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

// ✅ Action Button Group
const ActionButtons = ({
  user,
  onEdit,
  onView,
  onRoleChange,
  onDelete,
  onToggleGoldenMondayAdmin,
  isSuperAdmin,
  isAdmin,
  currentUser,
}) => {
  const canDelete =
    user._id !== currentUser._id &&
    !(user.role === ROLES.SUPER_ADMIN && !isSuperAdmin);
  const isAdminOrAbove = isSuperAdmin || isAdmin;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => onView(user)}
        title="View user details"
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "none",
          background: "#f0f3ff",
          color: "#8b5cf6",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#8b5cf6";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(139,92,246,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#f0f3ff";
          e.currentTarget.style.color = "#8b5cf6";
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <FiEye size={16} />
      </button>

      <button
        onClick={() => onEdit(user)}
        title="Edit user"
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

      {isSuperAdmin && user.role !== ROLES.SUPER_ADMIN && (
        <button
          onClick={() => onRoleChange(user)}
          title="Change user role"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "none",
            background: "#fffbeb",
            color: "#f59e0b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f59e0b";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(245,158,11,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fffbeb";
            e.currentTarget.style.color = "#f59e0b";
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <FiRefreshCw size={16} />
        </button>
      )}

      {isAdminOrAbove &&
        user.role !== ROLES.ADMIN &&
        user.role !== ROLES.SUPER_ADMIN &&
        onToggleGoldenMondayAdmin && (
          <button
            onClick={() => onToggleGoldenMondayAdmin(user)}
            title={
              user.isGoldenMondayAdmin
                ? "Remove Golden Monday admin access"
                : "Grant Golden Monday admin access"
            }
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "none",
              background: user.isGoldenMondayAdmin ? "#fef3c7" : "#f0f3ff",
              color: user.isGoldenMondayAdmin ? "#b45309" : "#8b5cf6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(139,92,246,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            🌅
          </button>
        )}

      {canDelete && (
        <button
          onClick={() => onDelete(user._id, user.name)}
          title="Delete user"
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
      )}
    </div>
  );
};

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

// ✅ Password Display Component
const PasswordDisplay = ({ password, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(password);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      style={{
        background: "#f0fdf4",
        border: "1px solid #86efac",
        borderRadius: 8,
        padding: "14px 16px",
        marginBottom: 16,
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <p
          style={{ margin: 0, fontSize: 13, color: "#065f46", fontWeight: 600 }}
        >
          ✅ User Created Successfully!
        </p>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#065f46",
            cursor: "pointer",
            fontSize: 16,
            padding: "2px 4px",
          }}
        >
          <FiX size={16} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          borderRadius: 6,
          padding: "6px 12px",
          border: "1px solid #86efac",
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#065f46",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          Temporary Password:
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#065f46",
            fontFamily: "monospace",
            letterSpacing: 0.5,
            flex: 1,
            wordBreak: "break-all",
          }}
        >
          {showPassword ? password : "••••••••••••"}
        </span>
        <button
          onClick={() => setShowPassword(!showPassword)}
          style={{
            background: "none",
            border: "none",
            color: "#065f46",
            cursor: "pointer",
            padding: "4px",
          }}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? "#10b981" : "none",
            color: copied ? "#fff" : "#065f46",
            border: copied ? "none" : "1px solid #86efac",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.2s ease",
          }}
        >
          <FiCopy size={12} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <p
        style={{
          margin: "6px 0 0",
          fontSize: 10,
          color: "#065f46",
          opacity: 0.8,
        }}
      >
        📋 Share this password with the user. They can change it after logging
        in.
      </p>
    </div>
  );
};

export default function UserManagement({ t }) {
  const safeT = useMemo(() => t || {}, [t]);
  const safeCommon = useMemo(() => safeT.common || {}, [safeT]);

  const getTranslation = useCallback(
    (key) => {
      const translations = safeT.userManagement || {};
      if (translations && translations[key]) {
        return translations[key];
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
        createAccount:
          "Create a new user account with specific role permissions",
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
        loadError: "Failed to load users. Please refresh.",
        saveError: "Operation failed. Please try again.",
        updateSuccess: "User updated successfully!",
        createSuccess: "User created successfully!",
        deleteSuccess: "User deleted successfully!",
        deleteError: "Failed to delete user. Please try again.",
        temporaryPassword: "Temporary Password",
        copyPassword: "Copy Password",
        passwordCopied: "Password copied to clipboard!",
      };
      return fallback[key] || key;
    },
    [safeT],
  );

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [showPasswordDisplay, setShowPasswordDisplay] = useState(false);
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

  const loadUsers = useCallback(async () => {
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
  }, [getTranslation]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadUsers]);

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
        setShowModal(false);
        setEditingUser(null);
        resetForm();
        loadUsers();
      } else {
        // ✅ Generate temporary password for new users
        const tempPassword = generateTempPassword(12);
        const userData = {
          name: formData.name,
          email: formData.email,
          password: tempPassword,
          role: formData.role,
          phone: formData.phone || "",
        };

        await authAPI.register(userData);

        // ✅ Store the generated password to display
        setGeneratedPassword(tempPassword);
        setShowPasswordDisplay(true);

        showToast(getTranslation("createSuccess"), "success");

        // Don't close modal yet - show password first
        // Reset form but keep modal open to show password
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "employee",
          phone: "",
        });
        loadUsers();
      }
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

  const handlePasswordDisplayClose = () => {
    setShowPasswordDisplay(false);
    setGeneratedPassword(null);
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      phone: "",
    });
    setGeneratedPassword(null);
    setShowPasswordDisplay(false);
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

  const handleToggleGoldenMondayAdmin = async (targetUser) => {
    try {
      await authAPI.setGoldenMondayAdmin(
        targetUser._id,
        !targetUser.isGoldenMondayAdmin,
      );
      showToast(
        targetUser.isGoldenMondayAdmin
          ? `Removed Golden Monday admin access from ${targetUser.name}`
          : `Granted Golden Monday admin access to ${targetUser.name}`,
        "success",
      );
      loadUsers();
    } catch (error) {
      console.error("Failed to toggle Golden Monday admin:", error);
      showToast(
        error.response?.data?.message || "Failed to update access",
        "error",
      );
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

  const cardColors = {
    total: {
      color: "#1a3aad",
      gradient: "linear-gradient(135deg, #f0f3ff, #e0e7ff)",
      subtitle: "All users",
    },
    superadmin: {
      color: "#8B1A1A",
      gradient: "linear-gradient(135deg, #fef2f2, #fee2e2)",
      subtitle: "Full access",
    },
    admin: {
      color: "#1A6B4A",
      gradient: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
      subtitle: "Management",
    },
    leader: {
      color: "#C25A00",
      gradient: "linear-gradient(135deg, #fffbeb, #fef3c7)",
      subtitle: "Team leads",
    },
    employee: {
      color: "#1E4D8C",
      gradient: "linear-gradient(135deg, #eff6ff, #dbeafe)",
      subtitle: "Staff members",
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
            setGeneratedPassword(null);
            setShowPasswordDisplay(false);
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
          {getTranslation("addUser")}
        </button>
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
          value={roleStats.total}
          label={getTranslation("total")}
          color={cardColors.total.color}
          gradient={cardColors.total.gradient}
          subtitle={cardColors.total.subtitle}
        />
        <StatCard
          icon={FiShield}
          value={roleStats.superadmin}
          label={getTranslation("superAdmin")}
          color={cardColors.superadmin.color}
          gradient={cardColors.superadmin.gradient}
          subtitle={cardColors.superadmin.subtitle}
        />
        <StatCard
          icon={FiUserCheck}
          value={roleStats.admin}
          label={getTranslation("admin")}
          color={cardColors.admin.color}
          gradient={cardColors.admin.gradient}
          subtitle={cardColors.admin.subtitle}
        />
        <StatCard
          icon={FiStar}
          value={roleStats.leader}
          label={getTranslation("teamLeader")}
          color={cardColors.leader.color}
          gradient={cardColors.leader.gradient}
          subtitle={cardColors.leader.subtitle}
        />
        <StatCard
          icon={FiUser}
          value={roleStats.employee}
          label={getTranslation("employee")}
          color={cardColors.employee.color}
          gradient={cardColors.employee.gradient}
          subtitle={cardColors.employee.subtitle}
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
              left: "12px",
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
              padding: "10px 14px 10px 38px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 13,
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              background: C.white,
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
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 13,
            background: C.white,
            outline: "none",
            minWidth: 140,
            cursor: "pointer",
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
            padding: 60,
            color: C.muted,
            fontFamily: F.sans,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>{safeCommon.loading || "Loading..."}</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: C.white,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              minWidth: 650,
            }}
          >
            <thead>
              <tr style={{ background: C.dark, color: C.light }}>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  <FiUser size={12} style={{ marginRight: 6 }} />
                  {getTranslation("fullName")}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  {getTranslation("email")}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  {getTranslation("role")}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  {getTranslation("phone")}
                </th>
                <th
                  style={{
                    padding: "14px 18px",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
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
                    borderBottom: `1px solid ${C.border}44`,
                    background: index % 2 === 0 ? C.white : "#fafbfa",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f0f7f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      index % 2 === 0 ? C.white : "#fafbfa";
                  }}
                >
                  <td
                    style={{
                      padding: "12px 18px",
                      fontWeight: 500,
                      color: C.dark,
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{user.name}</span>
                      {user._id === currentUser._id && (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 9,
                            background: C.primary + "15",
                            color: C.primary,
                            padding: "1px 8px",
                            borderRadius: 12,
                            fontWeight: 600,
                          }}
                        >
                          {getTranslation("you")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      color: "#555",
                      fontSize: 12,
                    }}
                  >
                    {user.email}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <div>
                      <span
                        style={{
                          background: getRoleBadgeColor(user.role) + "15",
                          color: getRoleBadgeColor(user.role),
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span style={{ fontSize: 12 }}>
                          {getRoleIcon(user.role)}
                        </span>
                        {getRoleDisplayName(user.role)}
                      </span>
                      {user.isGoldenMondayAdmin && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 9,
                            background: "#fef3c7",
                            color: "#b45309",
                            padding: "1px 8px",
                            borderRadius: 12,
                            fontWeight: 600,
                            display: "inline-block",
                          }}
                        >
                          🌅 GM Admin
                        </span>
                      )}
                      <RoleDescription role={user.role} />
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 18px",
                      color: "#777",
                      fontSize: 12,
                    }}
                  >
                    {user.phone || "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px",
                      textAlign: "center",
                    }}
                  >
                    <ActionButtons
                      user={user}
                      onEdit={(u) => {
                        setEditingUser(u);
                        setGeneratedPassword(null);
                        setShowPasswordDisplay(false);
                        setFormData({
                          name: u.name,
                          email: u.email,
                          password: "",
                          role: u.role,
                          phone: u.phone || "",
                        });
                        setShowModal(true);
                      }}
                      onView={openViewModal}
                      onRoleChange={(u) => {
                        setRoleModal({
                          isOpen: true,
                          user: u,
                          selectedRole: u.role,
                        });
                      }}
                      onDelete={openDeleteConfirm}
                      onToggleGoldenMondayAdmin={handleToggleGoldenMondayAdmin}
                      isSuperAdmin={isSuperAdmin}
                      isAdmin={isAdmin}
                      currentUser={currentUser}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
              <p style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>
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

      {/* ✅ User Modal with Password Display */}
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
            padding: "12px",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => {
            if (!showPasswordDisplay) {
              setShowModal(false);
              setEditingUser(null);
              resetForm();
            }
          }}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: "clamp(20px, 4vw, 32px)",
              width: "min(92%, 500px)",
              maxWidth: 500,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              margin: "0 auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!editingUser && showPasswordDisplay && generatedPassword ? (
              // ✅ Show Password Display
              <>
                <h2
                  style={{
                    fontSize: "clamp(18px, 4vw, 24px)",
                    fontWeight: 800,
                    color: C.dark,
                    fontFamily: F.serif,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <FiUserPlus size={22} color="#10b981" />
                  {getTranslation("createSuccess")}
                </h2>
                <PasswordDisplay
                  password={generatedPassword}
                  onClose={handlePasswordDisplayClose}
                />
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <button
                    onClick={handlePasswordDisplayClose}
                    style={{
                      ...btn.primary,
                      padding: "10px 24px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: 10,
                    }}
                  >
                    <FiCheck size={18} />
                    Done
                  </button>
                </div>
              </>
            ) : (
              // ✅ User Form
              <>
                <h2
                  style={{
                    fontSize: "clamp(18px, 4vw, 24px)",
                    fontWeight: 800,
                    color: C.dark,
                    fontFamily: F.serif,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {editingUser ? (
                    <>
                      <FiEdit2 size={22} color="#3b82f6" />
                      {getTranslation("editUser")}
                    </>
                  ) : (
                    <>
                      <FiUserPlus size={22} color={C.primary} />
                      {getTranslation("addNewUser")}
                    </>
                  )}
                </h2>
                <p
                  style={{
                    fontSize: "clamp(12px, 2.5vw, 14px)",
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
                        padding: "10px 14px",
                        border: `1.5px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 13,
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        outline: "none",
                        boxSizing: "border-box",
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
                        fontSize: 13,
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        outline: "none",
                        boxSizing: "border-box",
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

                  {!editingUser && (
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
                        {getTranslation("password")}{" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                        <span
                          style={{
                            fontSize: 10,
                            color: C.muted,
                            fontWeight: 400,
                            marginLeft: 6,
                          }}
                        >
                          (Auto-generated if left empty)
                        </span>
                      </label>
                      <input
                        type="password"
                        placeholder="Min 6 characters or leave empty for auto-generate"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: `1.5px solid ${C.border}`,
                          borderRadius: 8,
                          fontSize: 13,
                          transition: "border-color 0.2s, box-shadow 0.2s",
                          outline: "none",
                          boxSizing: "border-box",
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
                  )}

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
                        fontSize: 13,
                        background: C.white,
                        outline: "none",
                        boxSizing: "border-box",
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
                        fontSize: 13,
                        transition: "border-color 0.2s, box-shadow 0.2s",
                        outline: "none",
                        boxSizing: "border-box",
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

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      borderTop: `1px solid ${C.border}`,
                      paddingTop: 20,
                      marginTop: 4,
                    }}
                  >
                    <style>{`
                      @media (min-width: 480px) {
                        .modal-button-row {
                          flex-direction: row !important;
                          justify-content: flex-end !important;
                        }
                        .modal-button-row button {
                          flex: 0 1 auto !important;
                          min-width: 100px !important;
                          width: auto !important;
                        }
                      }
                      @media (max-width: 479px) {
                        .modal-button-row button {
                          width: 100% !important;
                          justify-content: center !important;
                          padding: 14px 20px !important;
                          font-size: 15px !important;
                        }
                      }
                      @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>

                    <div
                      className="modal-button-row"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          setEditingUser(null);
                          resetForm();
                        }}
                        style={{
                          ...btn.secondary,
                          padding: "12px 24px",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: 10,
                          width: "100%",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          border: `1.5px solid ${C.border}`,
                        }}
                      >
                        <FiX size={18} />
                        {getTranslation("cancel")}
                      </button>
                      <button
                        type="submit"
                        style={{
                          ...btn.primary,
                          padding: "12px 24px",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: 10,
                          width: "100%",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: `0 4px 14px ${C.primary}44`,
                        }}
                      >
                        {editingUser ? (
                          <>
                            <FiCheck size={18} />
                            {getTranslation("updateUser")}
                          </>
                        ) : (
                          <>
                            <FiUserPlus size={18} />
                            {getTranslation("createUser")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
