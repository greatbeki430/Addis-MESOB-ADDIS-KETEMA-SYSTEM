// frontend/src/pages/admin/EmployeeManagement.jsx
// Employee Management - Full CRUD for Golden Monday rotation roster

import { useState, useEffect, useCallback, useRef } from "react";
import { C, F, btn } from "../../styles/theme";
import { goldenMondayAPI, authAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiTrash2,
  FiEdit2,
  FiSearch,
  FiX,
  FiLoader,
  FiBriefcase,
  FiMail,
  FiRefreshCw,
  FiStar,
  FiClock,
  FiSave,
} from "react-icons/fi";

export default function EmployeeManagement({ t }) {
  const { showToast } = useToast();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const safeT = t || {};
  const te = safeT.employeeManagement || {};
  const safeCommon = safeT.common || {};

  // State
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEligible, setFilterEligible] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [formData, setFormData] = useState({
    userId: "",
    department: "",
    position: "",
    profilePhotoUrl: "",
    isEligible: true,
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Use ref to prevent multiple initial loads
  const initialLoadRef = useRef(true);

  // Translations fallback
  const getTranslation = (key) => {
    const fallback = {
      title: "Employee Management",
      subtitle: "Manage Golden Monday rotation roster",
      totalEmployees: "total employees",
      addEmployee: "Add Employee",
      searchPlaceholder: "Search by name or department...",
      allStatus: "All Status",
      active: "Active",
      inactive: "Inactive",
      noEmployeesFound: "No employees found",
      noEmployeesMatch: "No employees match your search criteria",
      editEmployee: "Edit Employee",
      addNewEmployee: "Add New Employee",
      fullName: "Full Name",
      email: "Email",
      department: "Department",
      position: "Position",
      photoUrl: "Photo URL",
      status: "Status",
      timesPresented: "Times Presented",
      lastPresented: "Last Presented",
      daysSince: "Days Since",
      cancel: "Cancel",
      save: "Save",
      update: "Update",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      register: "Register",
      remove: "Remove",
      activeStatus: "Active",
      inactiveStatus: "Inactive",
      confirmDeleteTitle: "Confirm Delete",
      confirmDeleteMessage:
        "Are you sure you want to remove this employee from the rotation roster?",
      deleteWarning: "This action cannot be undone.",
      updateSuccess: "Employee updated successfully!",
      createSuccess: "Employee added to rotation roster!",
      deleteSuccess: "Employee removed from rotation roster!",
      loadError: "Failed to load employees. Please refresh.",
      noUsersFound:
        "No users available to add. All users may already be registered.",
      selectUser: "Select a user to add to the rotation roster",
    };
    return te[key] || fallback[key] || key;
  };

  // Load employees - no dependencies
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await goldenMondayAPI.getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
      showToast(getTranslation("loadError"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load users for add modal
  const loadUsers = useCallback(async () => {
    try {
      const response = await authAPI.getUsers();
      setAllUsers(response.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      showToast("Failed to load users", "error");
    }
  }, [showToast]);

  // ✅ Only load on initial mount
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      loadEmployees();
    }
  }, [loadEmployees]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await loadEmployees();
    setRefreshing(false);
    showToast("Data refreshed", "success");
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterEligible === "all" ||
      (filterEligible === "active" && emp.isEligible) ||
      (filterEligible === "inactive" && !emp.isEligible);

    return matchesSearch && matchesFilter;
  });

  // Get users not already in roster
  const availableUsers = allUsers.filter(
    (u) => !employees.some((e) => e.user?._id === u._id || e.user === u._id),
  );

  const filteredUsers = availableUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  // Handle select user
  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setFormData((f) => ({ ...f, userId: u._id }));
  };

  // Handle form change
  const handleFormChange = (field, value) => {
    setFormData((f) => ({ ...f, [field]: value }));
  };

  // Handle add/edit submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId) {
      showToast("Please select a user", "warning");
      return;
    }

    try {
      setSaving(true);

      if (editingEmployee) {
        await goldenMondayAPI.updateEmployeeEligibility(
          editingEmployee.user?._id || editingEmployee.user,
          formData.isEligible,
        );
        showToast(getTranslation("updateSuccess"), "success");
      } else {
        await goldenMondayAPI.registerEmployee({
          userId: formData.userId,
          department: formData.department,
          position: formData.position,
          profilePhotoUrl: formData.profilePhotoUrl || "",
        });
        showToast(getTranslation("createSuccess"), "success");
      }

      setShowAddModal(false);
      setEditingEmployee(null);
      setSelectedUser(null);
      setFormData({
        userId: "",
        department: "",
        position: "",
        profilePhotoUrl: "",
        isEligible: true,
      });
      await loadEmployees();
    } catch (error) {
      console.error("Failed to save employee:", error);
      showToast(error.response?.data?.message || "Operation failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (userId) => {
    if (!window.confirm(getTranslation("confirmDeleteMessage"))) return;

    try {
      await goldenMondayAPI.removeEmployee(userId);
      showToast(getTranslation("deleteSuccess"), "success");
      await loadEmployees();
    } catch (error) {
      console.error("Failed to remove employee:", error);
      showToast("Failed to remove employee", "error");
    }
  };

  // Handle toggle eligibility
  const handleToggleEligibility = async (emp) => {
    try {
      const userId = emp.user?._id || emp.user;
      await goldenMondayAPI.updateEmployeeEligibility(userId, !emp.isEligible);
      showToast(
        `Employee ${emp.isEligible ? "deactivated" : "activated"}`,
        "success",
      );
      await loadEmployees();
    } catch (error) {
      console.error("Failed to toggle eligibility:", error);
      showToast("Failed to update status", "error");
    }
  };

  // Open edit modal
  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      userId: emp.user?._id || emp.user || "",
      department: emp.department || "",
      position: emp.position || "",
      profilePhotoUrl: emp.profilePhotoUrl || "",
      isEligible: emp.isEligible !== undefined ? emp.isEligible : true,
    });
    setSelectedUser(emp);
    setShowAddModal(true);
  };

  // Open add modal
  const openAddModal = async () => {
    await loadUsers();
    setEditingEmployee(null);
    setSelectedUser(null);
    setFormData({
      userId: "",
      department: "",
      position: "",
      profilePhotoUrl: "",
      isEligible: true,
    });
    setUserSearch("");
    setShowAddModal(true);
  };

  // Stats
  const total = employees.length;
  const active = employees.filter((e) => e.isEligible).length;
  const inactive = total - active;
  const totalPresented = employees.reduce(
    (sum, e) => sum + (e.timesPresented || 0),
    0,
  );

  return (
    <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
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
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FiUsers size={24} color={C.primary} />
            {getTranslation("title")}
          </h1>
          <p
            style={{
              fontSize: "clamp(11px, 3vw, 13px)",
              color: C.muted,
              marginTop: 4,
              fontFamily: F.sans,
            }}
          >
            {getTranslation("subtitle")} • {total}{" "}
            {getTranslation("totalEmployees")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{
              ...btn.secondary,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiRefreshCw
              size={16}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button onClick={openAddModal} style={btn.primary}>
            <FiUserPlus size={16} style={{ marginRight: 6 }} />
            {getTranslation("addEmployee")}
          </button>
        </div>
      </div>

      {/* Stats Cards - unchanged */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: C.white,
            padding: "14px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: C.dark }}>
            {total}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <FiUsers size={12} />
            Total
          </div>
        </div>
        <div
          style={{
            background: C.white,
            padding: "14px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981" }}>
            {active}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <FiUserCheck size={12} />
            Active
          </div>
        </div>
        <div
          style={{
            background: C.white,
            padding: "14px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#ef4444" }}>
            {inactive}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <FiUserX size={12} />
            Inactive
          </div>
        </div>
        <div
          style={{
            background: C.white,
            padding: "14px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: C.primary }}>
            {totalPresented}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <FiStar size={12} />
            Total Presented
          </div>
        </div>
      </div>

      {/* Search and Filter - unchanged */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
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
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />
        </div>
        <select
          value={filterEligible}
          onChange={(e) => setFilterEligible(e.target.value)}
          style={{
            padding: "10px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            background: C.white,
            outline: "none",
            minWidth: 140,
          }}
        >
          <option value="all">{getTranslation("allStatus")}</option>
          <option value="active">{getTranslation("active")}</option>
          <option value="inactive">{getTranslation("inactive")}</option>
        </select>
      </div>

      {/* Employees Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          <FiLoader
            size={32}
            style={{
              animation: "spin 1s linear infinite",
              display: "block",
              margin: "0 auto 12px",
            }}
          />
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
            }}
          >
            <thead>
              <tr style={{ background: C.dark, color: C.light }}>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Employee
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  <FiBriefcase size={12} style={{ marginRight: 4 }} />
                  Department
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Position
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  <FiStar size={12} style={{ marginRight: 4 }} />
                  Presented
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 13,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: 40, color: C.muted }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                    <p>
                      {searchTerm || filterEligible !== "all"
                        ? getTranslation("noEmployeesMatch")
                        : getTranslation("noEmployeesFound")}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const userId = emp.user?._id || emp.user;
                  const isActive = emp.isEligible !== false;

                  return (
                    <tr
                      key={emp._id || userId}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: index % 2 === 0 ? C.white : C.cardBg,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8faf8")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          index % 2 === 0 ? C.white : C.cardBg)
                      }
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#999",
                          textAlign: "center",
                        }}
                      >
                        {index + 1}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {emp.profilePhotoUrl ? (
                          <img
                            src={emp.profilePhotoUrl}
                            alt={emp.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: C.primary,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {emp.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: C.dark,
                              fontSize: 14,
                            }}
                          >
                            {emp.name || "Unknown"}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>
                            <FiMail size={11} style={{ marginRight: 3 }} />
                            {emp.email || "No email"}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#555",
                          fontSize: 13,
                        }}
                      >
                        {emp.department || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#555",
                          fontSize: 13,
                        }}
                      >
                        {emp.position || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ fontWeight: 700, color: C.primary }}>
                          {emp.timesPresented || 0}
                        </span>
                        {emp.lastPresentedDate && (
                          <div style={{ fontSize: 10, color: C.muted }}>
                            <FiClock size={10} style={{ marginRight: 2 }} />
                            {new Date(
                              emp.lastPresentedDate,
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            background: isActive ? "#d1fae5" : "#fee2e2",
                            color: isActive ? "#065f46" : "#dc2626",
                            display: "inline-block",
                            border: `1px solid ${isActive ? "#a7f3d0" : "#fecaca"}`,
                          }}
                        >
                          {isActive ? "✅ Active" : "❌ Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 4,
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => handleEdit(emp)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "6px 8px",
                              borderRadius: 6,
                              color: "#3b82f6",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#3b82f615";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            title={getTranslation("edit")}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleEligibility(emp)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "6px 8px",
                              borderRadius: 6,
                              color: isActive ? "#f59e0b" : "#10b981",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = isActive
                                ? "#f59e0b15"
                                : "#10b98115";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            title={isActive ? "Deactivate" : "Activate"}
                          >
                            {isActive ? (
                              <FiUserX size={16} />
                            ) : (
                              <FiUserCheck size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(userId)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "6px 8px",
                              borderRadius: 6,
                              color: "#ef4444",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#ef444415";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            title={getTranslation("delete")}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal - unchanged */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => {
            if (!saving) {
              setShowAddModal(false);
              setEditingEmployee(null);
              setSelectedUser(null);
            }
          }}
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
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {editingEmployee ? (
                <>
                  <FiEdit2 size={22} color="#3b82f6" />{" "}
                  {getTranslation("editEmployee")}
                </>
              ) : (
                <>
                  <FiUserPlus size={22} color={C.primary} />{" "}
                  {getTranslation("addNewEmployee")}
                </>
              )}
            </h2>
            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                marginBottom: 20,
                fontFamily: F.sans,
              }}
            >
              {editingEmployee
                ? `Update employee information for ${editingEmployee.name}`
                : getTranslation("selectUser")}
            </p>

            <form onSubmit={handleSubmit}>
              {!editingEmployee && (
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
                    {getTranslation("selectUser")} *
                  </label>
                  {selectedUser ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1.5px solid ${C.border}`,
                        background: C.bg,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: C.primary,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {selectedUser.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {selectedUser.name}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>
                            {selectedUser.email}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setFormData((f) => ({ ...f, userId: "" }));
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: C.muted,
                        }}
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
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
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = C.border)
                        }
                      />
                      <div
                        style={{
                          maxHeight: 150,
                          overflowY: "auto",
                          marginTop: 6,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                        }}
                      >
                        {filteredUsers.length === 0 ? (
                          <div
                            style={{
                              padding: 10,
                              fontSize: 12,
                              color: C.muted,
                            }}
                          >
                            {getTranslation("noUsersFound")}
                          </div>
                        ) : (
                          filteredUsers.map((u) => (
                            <div
                              key={u._id}
                              onClick={() => handleSelectUser(u)}
                              style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                fontSize: 13,
                                borderBottom: `1px solid ${C.border}`,
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = C.bg)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <div style={{ fontWeight: 600 }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>
                                {u.email}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
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
                  {getTranslation("department")}
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    handleFormChange("department", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="e.g., Revenue"
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = C.primary)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
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
                  {getTranslation("position")}
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleFormChange("position", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="e.g., Team Leader"
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = C.primary)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
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
                  {getTranslation("photoUrl")}
                </label>
                <input
                  type="text"
                  value={formData.profilePhotoUrl}
                  onChange={(e) =>
                    handleFormChange("profilePhotoUrl", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  placeholder="https://example.com/photo.jpg"
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = C.primary)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>

              {editingEmployee && (
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
                    {getTranslation("status")}
                  </label>
                  <select
                    value={formData.isEligible}
                    onChange={(e) =>
                      handleFormChange("isEligible", e.target.value === "true")
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
                    <option value="true">
                      {getTranslation("activeStatus")}
                    </option>
                    <option value="false">
                      {getTranslation("inactiveStatus")}
                    </option>
                  </select>
                </div>
              )}

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
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEmployee(null);
                    setSelectedUser(null);
                  }}
                  style={btn.secondary}
                  disabled={saving}
                >
                  {getTranslation("cancel")}
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
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <FiLoader
                        size={16}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      Saving...
                    </>
                  ) : editingEmployee ? (
                    <>
                      <FiSave size={16} />
                      {getTranslation("update")}
                    </>
                  ) : (
                    <>
                      <FiUserPlus size={16} />
                      {getTranslation("register")}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
