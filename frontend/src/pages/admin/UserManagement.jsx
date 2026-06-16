/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { C, F, btn, card } from "../../styles/theme";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  getRoleDisplayName,
  getRoleBadgeColor,
  getRoleIcon,
  // ROLES,
} from "../../utils/roles";

// eslint-disable-next-line no-unused-vars
export default function UserManagement({ t }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    phone: "",
  });
  const { user: currentUser, isSuperAdmin } = useAuth();

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
      } else {
        await authAPI.register(formData);
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
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await authAPI.deleteUser(userId);
        loadUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert(error.response?.data?.message || "Delete failed");
      }
    }
  };

  // Role options based on current user's permissions
  const getAvailableRoles = () => {
    if (isSuperAdmin) {
      return [
        { value: "employee", label: "Employee" },
        { value: "leader", label: "Team Leader" },
        { value: "admin", label: "Admin" },
        { value: "superadmin", label: "Super Admin" },
      ];
    }
    // Admin can only create employee and leader
    return [
      { value: "employee", label: "Employee" },
      { value: "leader", label: "Team Leader" },
    ];
  };

  return (
    <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
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
          👥 User Management
        </h1>
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
          style={btn.primary}
        >
          + Add New User
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: C.white,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: C.dark, color: C.light }}>
                <th style={{ padding: 12, textAlign: "left" }}>Name</th>
                <th style={{ padding: 12, textAlign: "left" }}>Email</th>
                <th style={{ padding: 12, textAlign: "left" }}>Role</th>
                <th style={{ padding: 12, textAlign: "left" }}>Phone</th>
                <th style={{ padding: 12, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  style={{ borderBottom: `1px solid ${C.border}` }}
                >
                  <td style={{ padding: 12 }}>{user.name}</td>
                  <td style={{ padding: 12 }}>{user.email}</td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        background: getRoleBadgeColor(user.role) + "20",
                        color: getRoleBadgeColor(user.role),
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {getRoleIcon(user.role)} {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{user.phone || "—"}</td>
                  <td style={{ padding: 12, textAlign: "center" }}>
                    <button
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
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        marginRight: 8,
                        fontSize: 18,
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    {currentUser._id !== user._id && (
                      <button
                        onClick={() => handleDelete(user._id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 18,
                          color: "#dc2626",
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: C.white,
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
              {editingUser ? "Edit User" : "Add New User"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  Full Name
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
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                  }}
                />
              </div>
              {!editingUser && (
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                    }}
                  />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                  }}
                >
                  {getAvailableRoles().map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{ display: "block", marginBottom: 4, fontWeight: 600 }}
                >
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                  }}
                />
              </div>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={btn.secondary}
                >
                  Cancel
                </button>
                <button type="submit" style={btn.primary}>
                  {editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
