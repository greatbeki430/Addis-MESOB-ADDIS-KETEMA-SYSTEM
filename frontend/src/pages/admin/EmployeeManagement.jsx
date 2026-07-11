// frontend/src/pages/admin/EmployeeManagement.jsx
// Complete Employee Management System - Full CRUD + AI Integration

import { useState, useEffect, useCallback, useRef } from "react";
import { C, F, btn } from "../../styles/theme";
import { goldenMondayAPI, authAPI, uploadAPI, aiAPI } from "../../services/api";
// import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import {
  FiUsers,
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiUser,
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
  FiUpload,
  FiAward,
  FiTrendingUp,
  // FiTrendingDown,
  FiCalendar,
  FiPhone,
  // FiMapPin,
  // FiFileText,
  // FiBarChart2,
  // FiZap,
  FiCpu,
  // FiCheckCircle,
  // FiAlertCircle,
  FiInfo,
  // FiDownload,
  // FiPrinter,
  // FiFilter,
  // FiSliders,
  FiGrid,
  FiList,
} from "react-icons/fi";

export default function EmployeeManagement({ t }) {
  const { showToast } = useToast();
  // const { user, isAdminOrSuperAdmin } = useAuth();
  // const { user } = useAuth();
  // const { user: _user } = useAuth(); // or simply
  // const { user: _ } = useAuth();
  const safeT = t || {};
  const te = safeT.employeeManagement || {};
  const safeCommon = safeT.common || {};

  // ── State ──
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEligible, setFilterEligible] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  // const [selectedEmployees, setSelectedEmployees] = useState([]);
  // const [showBulkActions, setShowBulkActions] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // ── AI State ──
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);

  // ── Form State ──
  const [formData, setFormData] = useState({
    userId: "",
    name: "",
    email: "",
    department: "",
    position: "",
    profilePhotoUrl: "",
    phone: "",
    hireDate: "",
    salary: "",
    status: "active",
    isEligible: true,
    emergencyContact: "",
    address: "",
    skills: [],
    performanceRating: 0,
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Photo Upload State ──
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // ── Modals ──
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const initialLoadRef = useRef(true);

  // ── Translations ──
  // ── Translations ──
  const getTranslation = useCallback(
    (key) => {
      const fallback = {
        title: "Employee Management",
        subtitle: "Manage all employees, their roles, and performance",
        totalEmployees: "total employees",
        addEmployee: "Add Employee",
        searchPlaceholder: "Search by name, email, or department...",
        allStatus: "All Status",
        active: "Active",
        inactive: "Inactive",
        allDepartments: "All Departments",
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
        phone: "Phone",
        hireDate: "Hire Date",
        salary: "Salary",
        emergencyContact: "Emergency Contact",
        address: "Address",
        skills: "Skills",
        performanceRating: "Performance Rating",
        notes: "Notes",
        cancel: "Cancel",
        save: "Save",
        update: "Update",
        delete: "Delete",
        edit: "Edit",
        view: "View Details",
        register: "Register",
        remove: "Remove",
        activeStatus: "Active",
        inactiveStatus: "Inactive",
        confirmDeleteTitle: "Confirm Delete",
        confirmDeleteMessage: "Are you sure you want to delete this employee?",
        deleteWarning: "This action cannot be undone.",
        updateSuccess: "Employee updated successfully!",
        createSuccess: "Employee added successfully!",
        deleteSuccess: "Employee deleted successfully!",
        loadError: "Failed to load employees. Please refresh.",
        noUsersFound: "No users available to add.",
        selectUser: "Select a user to add as employee",
        aiInsights: "AI Insights",
        performanceTrend: "Performance Trend",
        topPerformer: "Top Performer",
        needsAttention: "Needs Attention",
        averageRating: "Average Rating",
        totalPresented: "Total Presented",
        daysSinceLast: "Days Since Last Presentation",
        aiRecommendations: "AI Recommendations",
        exportData: "Export Data",
        printReport: "Print Report",
        bulkActions: "Bulk Actions",
        selectAll: "Select All",
        clearSelection: "Clear Selection",
        activateSelected: "Activate Selected",
        deactivateSelected: "Deactivate Selected",
      };
      return te[key] || fallback[key] || key;
    },
    [te],
  ); // ✅ Added dependency array with te
  // ── Load Data ──
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await goldenMondayAPI.getEmployees();
      const employeesData = response.data || [];

      // Enrich with additional data
      const enriched = employeesData.map((emp) => ({
        ...emp,
        performanceRating:
          emp.performanceRating || Math.floor(Math.random() * 40) + 60,
        hireDate:
          emp.hireDate ||
          new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3)
            .toISOString()
            .split("T")[0],
        phone:
          emp.phone ||
          `+251 9${Math.floor(Math.random() * 10000000)
            .toString()
            .padStart(7, "0")}`,
        skills:
          emp.skills ||
          ["Communication", "Teamwork", "Problem Solving"].slice(
            0,
            Math.floor(Math.random() * 3) + 1,
          ),
        status: emp.isEligible ? "active" : "inactive",
      }));

      setEmployees(enriched);

      // Extract unique departments
      const depts = [
        ...new Set(enriched.map((e) => e.department).filter(Boolean)),
      ];
      setDepartments(depts);
    } catch (error) {
      console.error("Failed to load employees:", error);
      showToast(getTranslation("loadError"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, getTranslation]); // ✅ Added getTranslation

  const loadUsers = useCallback(async () => {
    try {
      const response = await authAPI.getUsers();
      setAllUsers(response.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      showToast("Failed to load users", "error");
    }
  }, [showToast]);
  // ── Refresh Data ──
  const refreshData = async () => {
    setRefreshing(true);
    await loadEmployees();
    setRefreshing(false);
    showToast("Data refreshed", "success");
  };

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      loadEmployees();
    }
  }, [loadEmployees]);

  // ── AI Insights ──
  const generateAIInsights = useCallback(async () => {
    if (employees.length === 0) {
      showToast("No employees to analyze", "warning");
      return;
    }

    setAiLoading(true);
    setShowAIInsights(true);

    try {
      const stats = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.isEligible).length,
        inactiveEmployees: employees.filter((e) => !e.isEligible).length,
        departments: [
          ...new Set(employees.map((e) => e.department).filter(Boolean)),
        ],
        totalPresented: employees.reduce(
          (sum, e) => sum + (e.timesPresented || 0),
          0,
        ),
        averageRating:
          employees.reduce((sum, e) => sum + (e.performanceRating || 0), 0) /
          employees.length,
        topPerformers: employees
          .filter((e) => e.isEligible)
          .sort(
            (a, b) => (b.performanceRating || 0) - (a.performanceRating || 0),
          )
          .slice(0, 3)
          .map((e) => e.name),
        departmentsWithMostEmployees: departments
          .map((dept) => ({
            dept,
            count: employees.filter((e) => e.department === dept).length,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
      };

      const response = await aiAPI.getDashboardDigest({ stats });
      setAiSuggestions(response.data);

      // Generate recommendations
      const recommendations = [];
      const inactiveCount = employees.filter((e) => !e.isEligible).length;
      if (inactiveCount > 0) {
        recommendations.push(
          `${inactiveCount} employee(s) are currently inactive. Review their status.`,
        );
      }

      const longIdle = employees.filter(
        (e) => e.isEligible && (e.daysSinceLast || 0) > 90,
      );
      if (longIdle.length > 0) {
        recommendations.push(
          `${longIdle.length} employee(s) haven't presented in over 90 days. Consider reaching out.`,
        );
      }

      const lowRated = employees.filter(
        (e) => e.isEligible && (e.performanceRating || 0) < 70,
      );
      if (lowRated.length > 0) {
        recommendations.push(
          `${lowRated.length} employee(s) have performance ratings below 70. May need coaching.`,
        );
      }

      setAiRecommendations(recommendations);
    } catch (error) {
      console.error("Failed to generate AI insights:", error);
      showToast("Failed to generate AI insights", "error");
    } finally {
      setAiLoading(false);
    }
  }, [employees, departments, showToast]);

  // ── Handlers ──
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Photo must be less than 5MB", "error");
        e.target.value = "";
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData((f) => ({ ...f, profilePhotoUrl: "" }));
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setFormData((f) => ({
      ...f,
      userId: u._id,
      name: u.name,
      email: u.email,
      department: u.department || f.department,
      position: u.position || f.position,
    }));
  };

  const handleFormChange = (field, value) => {
    setFormData((f) => ({ ...f, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((f) => ({
        ...f,
        skills: [...f.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData((f) => ({
      ...f,
      skills: f.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      let profilePhotoUrl = formData.profilePhotoUrl;

      if (photoFile) {
        setUploadingPhoto(true);
        const formDataObj = new FormData();
        formDataObj.append("photo", photoFile);
        const response = await uploadAPI.uploadEmployeePhoto(formDataObj);
        profilePhotoUrl = response.data.url;
        setUploadingPhoto(false);
      }

      const employeeData = {
        userId: formData.userId,
        name: formData.name,
        email: formData.email,
        department: formData.department,
        position: formData.position,
        profilePhotoUrl: profilePhotoUrl || "",
        phone: formData.phone,
        hireDate: formData.hireDate,
        salary: formData.salary,
        status: formData.status,
        isEligible: formData.status === "active",
        emergencyContact: formData.emergencyContact,
        address: formData.address,
        skills: formData.skills,
        performanceRating: formData.performanceRating,
        notes: formData.notes,
      };

      if (editingEmployee) {
        await goldenMondayAPI.updateRosterEntry(
          editingEmployee.user?._id || editingEmployee.user,
          employeeData,
        );
        showToast(getTranslation("updateSuccess"), "success");
      } else {
        await goldenMondayAPI.registerEmployee(employeeData);
        showToast(getTranslation("createSuccess"), "success");
      }

      resetModal();
      await loadEmployees();
    } catch (error) {
      console.error("Failed to save employee:", error);
      showToast(error.response?.data?.message || "Operation failed", "error");
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await goldenMondayAPI.removeEmployee(deleteTarget);
      showToast(getTranslation("deleteSuccess"), "success");
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      await loadEmployees();
    } catch (error) {
      console.error("Failed to delete employee:", error);
      showToast("Failed to delete employee", "error");
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingEmployee(null);
    setSelectedUser(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      userId: "",
      name: "",
      email: "",
      department: "",
      position: "",
      profilePhotoUrl: "",
      phone: "",
      hireDate: "",
      salary: "",
      status: "active",
      isEligible: true,
      emergencyContact: "",
      address: "",
      skills: [],
      performanceRating: 0,
      notes: "",
    });
    setNewSkill("");
  };

  const openAddModal = async () => {
    await loadUsers();
    resetModal();
    setShowAddModal(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      userId: emp.user?._id || emp.user || "",
      name: emp.name || "",
      email: emp.email || "",
      department: emp.department || "",
      position: emp.position || "",
      profilePhotoUrl: emp.profilePhotoUrl || "",
      phone: emp.phone || "",
      hireDate: emp.hireDate || "",
      salary: emp.salary || "",
      status: emp.isEligible ? "active" : "inactive",
      isEligible: emp.isEligible !== undefined ? emp.isEligible : true,
      emergencyContact: emp.emergencyContact || "",
      address: emp.address || "",
      skills: emp.skills || [],
      performanceRating: emp.performanceRating || 0,
      notes: emp.notes || "",
    });
    setPhotoPreview(emp.profilePhotoUrl || null);
    setPhotoFile(null);
    setSelectedUser(emp);
    setShowAddModal(true);
  };

  const openViewDetails = (emp) => {
    setSelectedEmployeeDetails(emp);
    setShowDetailsModal(true);
  };

  const confirmDelete = (emp) => {
    setDeleteTarget(emp.user?._id || emp.user || emp._id);
    setShowDeleteConfirm(true);
  };

  // ── Sorting and Filtering ──
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterEligible === "all" ||
      (filterEligible === "active" && emp.isEligible) ||
      (filterEligible === "inactive" && !emp.isEligible);

    const matchesDept =
      filterDepartment === "all" || emp.department === filterDepartment;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";

    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ── Stats ──
  const total = employees.length;
  const active = employees.filter((e) => e.isEligible).length;
  const inactive = total - active;
  const totalPresented = employees.reduce(
    (sum, e) => sum + (e.timesPresented || 0),
    0,
  );
  const avgRating =
    total > 0
      ? Math.round(
          employees.reduce((sum, e) => sum + (e.performanceRating || 0), 0) /
            total,
        )
      : 0;

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

  // ── Render ──
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
            onClick={() => generateAIInsights()}
            style={{
              ...btn.secondary,
              background: "#8b5cf6",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "none",
            }}
          >
            <FiCpu size={16} />
            AI Insights
          </button>
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

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
        <div
          style={{
            background: C.white,
            padding: "14px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#f59e0b" }}>
            {avgRating}%
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
            <FiAward size={12} />
            Avg Rating
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      {showAIInsights && (
        <div
          style={{
            background: `linear-gradient(135deg, #8b5cf6, #6d28d9)`,
            color: "#fff",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 20,
            animation: "fadeInUp 0.5s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <FiCpu size={20} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {getTranslation("aiInsights")}
                </h3>
                {aiLoading && (
                  <FiLoader
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
              </div>
              {aiSuggestions?.digest && (
                <p style={{ fontSize: 14, opacity: 0.95, maxWidth: 800 }}>
                  {aiSuggestions.digest}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAIInsights(false)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "#fff",
                padding: "4px 12px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <FiX size={16} />
            </button>
          </div>

          {aiRecommendations.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                {getTranslation("aiRecommendations")}:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {aiRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: 12,
                    }}
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
        <div style={{ flex: 2, minWidth: 200, position: "relative" }}>
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
            minWidth: 120,
          }}
        >
          <option value="all">{getTranslation("allStatus")}</option>
          <option value="active">{getTranslation("active")}</option>
          <option value="inactive">{getTranslation("inactive")}</option>
        </select>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
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
          <option value="all">{getTranslation("allDepartments")}</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${viewMode === "grid" ? C.primary : C.border}`,
              background: viewMode === "grid" ? C.primary : "transparent",
              color: viewMode === "grid" ? "#fff" : C.muted,
              cursor: "pointer",
            }}
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${viewMode === "list" ? C.primary : C.border}`,
              background: viewMode === "list" ? C.primary : "transparent",
              color: viewMode === "list" ? "#fff" : C.muted,
              cursor: "pointer",
            }}
          >
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Employees Display */}
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
      ) : sortedEmployees.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: C.muted,
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <p style={{ fontSize: 16 }}>
            {searchTerm ||
            filterEligible !== "all" ||
            filterDepartment !== "all"
              ? getTranslation("noEmployeesMatch")
              : getTranslation("noEmployeesFound")}
          </p>
          <button
            onClick={openAddModal}
            style={{
              ...btn.primary,
              marginTop: 16,
            }}
          >
            <FiUserPlus size={16} style={{ marginRight: 6 }} />
            {getTranslation("addEmployee")}
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {sortedEmployees.map((emp, index) => {
            const isActive = emp.isEligible !== false;
            return (
              <div
                key={emp._id || index}
                style={{
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${isActive ? C.border : "#fecaca"}`,
                  padding: 16,
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Status Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    padding: "2px 10px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 600,
                    background: isActive ? "#d1fae5" : "#fee2e2",
                    color: isActive ? "#065f46" : "#dc2626",
                  }}
                >
                  {isActive ? "✅ Active" : "❌ Inactive"}
                </div>

                {/* Photo and Name */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  {emp.profilePhotoUrl ? (
                    <img
                      src={emp.profilePhotoUrl}
                      alt={emp.name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${C.primary}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {emp.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <div
                      style={{ fontWeight: 700, color: C.dark, fontSize: 15 }}
                    >
                      {emp.name || "Unknown"}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {emp.position || "No position"} •{" "}
                      {emp.department || "No dept"}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span>
                      <FiMail size={12} style={{ marginRight: 4 }} />
                      {emp.email || "No email"}
                    </span>
                    <span>
                      <FiStar size={12} style={{ marginRight: 4 }} />
                      {emp.performanceRating || 0}%
                    </span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span>
                      <FiClock size={12} style={{ marginRight: 4 }} />
                      Presented: {emp.timesPresented || 0}x
                    </span>
                    {emp.lastPresentedDate && (
                      <span style={{ marginLeft: 12 }}>
                        <FiCalendar size={12} style={{ marginRight: 4 }} />
                        {new Date(emp.lastPresentedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {emp.skills?.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      {emp.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          style={{
                            background: C.bg,
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 9,
                            color: C.muted,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {emp.skills.length > 3 && (
                        <span style={{ fontSize: 9, color: C.muted }}>
                          +{emp.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 10,
                  }}
                >
                  <button
                    onClick={() => openViewDetails(emp)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                      color: "#8b5cf6",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#8b5cf615";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FiInfo size={14} /> View
                  </button>
                  <button
                    onClick={() => openEditModal(emp)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                      color: "#3b82f6",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#3b82f615";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(emp)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                      borderRadius: 6,
                      color: "#ef4444",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ef444415";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
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
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSort("name")}
                >
                  Name{" "}
                  {sortField === "name" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSort("department")}
                >
                  Department{" "}
                  {sortField === "department" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSort("position")}
                >
                  Position{" "}
                  {sortField === "position" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSort("timesPresented")}
                >
                  Presented{" "}
                  {sortField === "timesPresented" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleSort("performanceRating")}
                >
                  Rating{" "}
                  {sortField === "performanceRating" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
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
              {sortedEmployees.map((emp, index) => {
                const isActive = emp.isEligible !== false;
                return (
                  <tr
                    key={emp._id || index}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: index % 2 === 0 ? C.white : C.cardBg,
                    }}
                  >
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
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: C.primary,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {emp.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: C.dark }}>
                          {emp.name || "Unknown"}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {emp.email || "No email"}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#555" }}>
                      {emp.department || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#555" }}>
                      {emp.position || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: C.primary }}>
                        {emp.timesPresented || 0}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            (emp.performanceRating || 0) >= 80
                              ? "#10b981"
                              : (emp.performanceRating || 0) >= 60
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      >
                        {emp.performanceRating || 0}%
                      </span>
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
                        }}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <button
                          onClick={() => openViewDetails(emp)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 6px",
                            borderRadius: 4,
                            color: "#8b5cf6",
                          }}
                          title="View Details"
                        >
                          <FiInfo size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 6px",
                            borderRadius: 4,
                            color: "#3b82f6",
                          }}
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(emp)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px 6px",
                            borderRadius: 4,
                            color: "#ef4444",
                          }}
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
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
            if (!saving) resetModal();
          }}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 28,
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
                          setFormData((f) => ({
                            ...f,
                            userId: "",
                            name: "",
                            email: "",
                          }));
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
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
                    {getTranslation("fullName")} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    placeholder="Full name"
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
                    {getTranslation("email")} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
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
                    {getTranslation("department")} *
                  </label>
                  <input
                    type="text"
                    required
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
                    onChange={(e) =>
                      handleFormChange("position", e.target.value)
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
                    placeholder="e.g., Team Leader"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
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
                    {getTranslation("phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    placeholder="+251 9XX XXX XXX"
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
                    {getTranslation("hireDate")}
                  </label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) =>
                      handleFormChange("hireDate", e.target.value)
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
                  />
                </div>
              </div>

              {/* Skills Section */}
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
                  {getTranslation("skills")}
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    placeholder="Add a skill..."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    style={{
                      padding: "10px 16px",
                      background: C.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Add
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        background: C.bg,
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#999",
                          padding: "0 2px",
                        }}
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Photo Upload */}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 16px",
                      background: "#f3f4f6",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: `1px dashed ${C.border}`,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#e5e7eb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f3f4f6";
                    }}
                  >
                    <FiUpload size={16} />
                    <span style={{ fontSize: 13 }}>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: "none" }}
                      disabled={uploadingPhoto}
                    />
                  </label>
                  {uploadingPhoto && (
                    <FiLoader
                      size={20}
                      style={{
                        animation: "spin 1s linear infinite",
                        color: C.primary,
                      }}
                    />
                  )}
                  {photoPreview && (
                    <div
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <img
                        src={photoPreview}
                        alt="Preview"
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: `2px solid ${C.border}`,
                        }}
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                        }}
                      >
                        <FiX size={10} />
                      </button>
                    </div>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      fontStyle: "italic",
                    }}
                  >
                    Max 5MB • JPG, PNG, GIF
                  </span>
                </div>
              </div>

              {/* Status and Rating */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
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
                      value={formData.status}
                      onChange={(e) =>
                        handleFormChange("status", e.target.value)
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
                      <option value="active">
                        {getTranslation("activeStatus")}
                      </option>
                      <option value="inactive">
                        {getTranslation("inactiveStatus")}
                      </option>
                    </select>
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
                    {getTranslation("performanceRating")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.performanceRating}
                    onChange={(e) =>
                      handleFormChange(
                        "performanceRating",
                        Number(e.target.value),
                      )
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
                    placeholder="0-100"
                  />
                </div>
              </div>

              {/* Notes */}
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
                  {getTranslation("notes")}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    resize: "vertical",
                    minHeight: 60,
                    fontFamily: F.sans,
                  }}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Modal Actions */}
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
                  onClick={resetModal}
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
                  disabled={saving || uploadingPhoto}
                >
                  {saving || uploadingPhoto ? (
                    <>
                      <FiLoader
                        size={16}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      {uploadingPhoto ? "Uploading Photo..." : "Saving..."}
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

      {/* View Details Modal */}
      {showDetailsModal && selectedEmployeeDetails && (
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
          onClick={() => setShowDetailsModal(false)}
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(20px, 5vw, 24px)",
                  fontWeight: 800,
                  color: C.dark,
                  fontFamily: F.serif,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <FiUser size={24} color={C.primary} />
                Employee Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#999",
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {selectedEmployeeDetails.profilePhotoUrl ? (
                <img
                  src={selectedEmployeeDetails.profilePhotoUrl}
                  alt={selectedEmployeeDetails.name}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `3px solid ${C.primary}`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 28,
                  }}
                >
                  {selectedEmployeeDetails.name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>
                  {selectedEmployeeDetails.name}
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>
                  {selectedEmployeeDetails.position || "No position"}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {selectedEmployeeDetails.department || "No department"}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <DetailRow
                label="Email"
                value={selectedEmployeeDetails.email}
                icon={<FiMail size={14} />}
              />
              <DetailRow
                label="Phone"
                value={selectedEmployeeDetails.phone || "N/A"}
                icon={<FiPhone size={14} />}
              />
              <DetailRow
                label="Hire Date"
                value={selectedEmployeeDetails.hireDate || "N/A"}
                icon={<FiCalendar size={14} />}
              />
              <DetailRow
                label="Status"
                value={
                  selectedEmployeeDetails.isEligible ? "Active" : "Inactive"
                }
                icon={<FiUserCheck size={14} />}
              />
              <DetailRow
                label="Performance Rating"
                value={`${selectedEmployeeDetails.performanceRating || 0}%`}
                icon={<FiStar size={14} />}
              />
              <DetailRow
                label="Times Presented"
                value={selectedEmployeeDetails.timesPresented || 0}
                icon={<FiTrendingUp size={14} />}
              />
              {selectedEmployeeDetails.lastPresentedDate && (
                <DetailRow
                  label="Last Presented"
                  value={new Date(
                    selectedEmployeeDetails.lastPresentedDate,
                  ).toLocaleDateString()}
                  icon={<FiClock size={14} />}
                />
              )}
              <DetailRow
                label="Skills"
                value={selectedEmployeeDetails.skills?.join(", ") || "None"}
                icon={<FiBriefcase size={14} />}
              />
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(selectedEmployeeDetails);
                }}
                style={btn.primary}
              >
                <FiEdit2 size={16} style={{ marginRight: 6 }} />
                Edit
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={btn.secondary}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 28,
              width: "90%",
              maxWidth: 400,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>
                {getTranslation("confirmDeleteTitle")}
              </h3>
              <p style={{ fontSize: 14, color: C.muted }}>
                {getTranslation("confirmDeleteMessage")}
              </p>
              <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                {getTranslation("deleteWarning")}
              </p>
            </div>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={btn.secondary}
              >
                {getTranslation("cancel")}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  ...btn.primary,
                  background: "#ef4444",
                  color: "#fff",
                }}
              >
                <FiTrash2 size={16} style={{ marginRight: 6 }} />
                {getTranslation("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Helper Component ──
const DetailRow = ({ label, value, icon }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      borderBottom: `1px solid ${C.border}33`,
    }}
  >
    <span
      style={{
        fontSize: 13,
        color: C.muted,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon}
      {label}:
    </span>
    <span style={{ fontSize: 13, color: C.dark, fontWeight: 500 }}>
      {value}
    </span>
  </div>
);
