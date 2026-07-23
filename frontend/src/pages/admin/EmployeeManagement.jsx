// frontend/src/pages/admin/EmployeeManagement.jsx
// Complete Employee Management System - Full CRUD + AI Integration with AI Auto-Fill

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { C, F, btn } from "../../styles/theme";
import {
  goldenMondayAPI,
  authAPI,
  uploadAPI,
  aiAPI,
  departmentAPI,
} from "../../services/api";
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
  FiCalendar,
  FiPhone,
  FiCpu,
  FiInfo,
  FiGrid,
  FiList,
  FiPlus,
  FiCpu as FiAi,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

export default function EmployeeManagement({ t }) {
  const { showToast } = useToast();
  const safeT = useMemo(() => t || {}, [t]);
  const safeCommon = useMemo(() => safeT.common || {}, [safeT]);

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
  const [viewMode, setViewMode] = useState("grid");
  const [departments, setDepartments] = useState([]);
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // ── Department Modal State ──
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [departmentModalError, setDepartmentModalError] = useState("");

  // ── AI Auto-Fill State ──
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState({});
  const [aiConfidence, setAiConfidence] = useState(null);
  const [aiNotes, setAiNotes] = useState("");
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [showPendingRegistrations, setShowPendingRegistrations] =
    useState(false);
  const [processingApproval, setProcessingApproval] = useState(null);

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
  const getTranslation = useCallback(
    (key) => {
      const translations = safeT.employeeManagement || {};
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
        addDepartment: "Add Department",
        departmentName: "Department Name",
        departmentNamePlaceholder: "Enter department name...",
        departmentExists: "That department already exists",
        departmentAdded: "Department added successfully",
        departmentError: "Failed to create department. Please try again.",
        departmentWarning:
          "Couldn't save the department to the registry, but it's set for this employee",
        aiAutoFill: "AI Auto-Fill",
        analyzeWithAI: "Analyze with AI",
        aiAnalysisComplete: "AI analysis complete",
        aiFilledFields: "fields filled by AI",
        highConfidence: "High confidence",
        mediumConfidence: "Medium confidence",
        lowConfidence: "Low confidence",
        reviewFields: "Please review the AI-filled fields before submitting",
        aiAnalysisFailed: "AI analysis failed. Please fill in fields manually.",
        loadingUsers: "Loading users...",
        allUsersAlreadyEmployees: "All users are already employees.",
        noUsersInSystem:
          "No users found in the system. Please create users first.",
      };
      return translations[key] || fallback[key] || key;
    },
    [safeT], // ✅ Now depends on safeT (stable)
  );

  // ── Load Data ──
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await goldenMondayAPI.getEmployees();
      const employeesData = response.data || [];

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
  }, [showToast, getTranslation]);

  // ── Load Users with better error handling ──
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      console.log("🔄 Loading users from database...");
      const response = await authAPI.getUsers();
      console.log("✅ Users loaded:", response.data);
      console.log("📊 Total users:", response.data?.length || 0);

      // Ensure we have an array
      const usersArray = Array.isArray(response.data) ? response.data : [];
      setAllUsers(usersArray);

      if (usersArray.length === 0) {
        showToast(getTranslation("noUsersInSystem"), "info");
      }

      return usersArray;
    } catch (error) {
      console.error("❌ Failed to load users:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Handle specific error cases
      if (error.response?.status === 401) {
        showToast("Session expired. Please login again.", "error");
        setTimeout(() => (window.location.href = "/login"), 1500);
      } else if (error.response?.status === 403) {
        showToast("You don't have permission to view users.", "error");
      } else {
        showToast("Failed to load users. Please refresh the page.", "error");
      }

      setAllUsers([]);
      return [];
    } finally {
      setIsLoadingUsers(false);
    }
  }, [showToast, getTranslation]);
  const loadPendingRegistrations = useCallback(async () => {
    try {
      const response = await goldenMondayAPI.getPendingRegistrations();
      setPendingRegistrations(response.data || []);
    } catch (error) {
      console.error("Failed to load pending registrations:", error);
    }
  }, []);

  const handleApproveRegistration = async (registrationId) => {
    setProcessingApproval(registrationId);
    try {
      await goldenMondayAPI.approveRegistration(registrationId);
      showToast("Employee approved successfully! 🎉", "success");
      await loadPendingRegistrations();
      await loadEmployees();
    } catch (error) {
      console.error("Failed to approve registration:", error);
      showToast("Failed to approve registration", "error");
    } finally {
      setProcessingApproval(null);
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    setProcessingApproval(registrationId);
    try {
      await goldenMondayAPI.rejectRegistration(registrationId);
      showToast("Registration rejected", "info");
      await loadPendingRegistrations();
    } catch (error) {
      console.error("Failed to reject registration:", error);
      showToast("Failed to reject registration", "error");
    } finally {
      setProcessingApproval(null);
    }
  };

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
      loadPendingRegistrations();
    }
  }, [loadEmployees, loadPendingRegistrations]);

  // ── AI Auto-Fill Function ──
  const runAIAnalysis = async (userData) => {
    setIsAnalyzing(true);
    setShowAIAnalysis(false);
    setAiFilledFields({});
    setAiConfidence(null);
    setAiNotes("");

    try {
      // Call AI API to analyze user data and suggest employee fields
      const response = await aiAPI.suggestEmployeeFields({
        name: userData.name,
        email: userData.email,
        department: userData.department || "",
        position: userData.position || "",
        userRole: userData.role || "employee",
      });

      const analysis = response.data || {};

      // Auto-fill form fields
      const filled = {};
      setFormData((prev) => {
        const next = { ...prev };

        if (analysis.suggestedDepartment) {
          next.department = analysis.suggestedDepartment;
          filled.department = true;
        }
        if (analysis.suggestedPosition) {
          next.position = analysis.suggestedPosition;
          filled.position = true;
        }
        if (analysis.suggestedPhone) {
          next.phone = analysis.suggestedPhone;
          filled.phone = true;
        }
        if (
          analysis.suggestedSkills &&
          Array.isArray(analysis.suggestedSkills)
        ) {
          next.skills = analysis.suggestedSkills;
          filled.skills = true;
        }
        if (analysis.suggestedPerformanceRating) {
          next.performanceRating = analysis.suggestedPerformanceRating;
          filled.performanceRating = true;
        }
        if (analysis.suggestedNotes) {
          next.notes = analysis.suggestedNotes;
          filled.notes = true;
        }
        if (analysis.suggestedHireDate) {
          next.hireDate = analysis.suggestedHireDate;
          filled.hireDate = true;
        }

        return next;
      });

      setAiFilledFields(filled);
      setAiConfidence(analysis.confidence || "medium");
      setAiNotes(
        analysis.notes || `AI filled ${Object.keys(filled).length} field(s)`,
      );
      setShowAIAnalysis(true);

      // Store full AI suggestions for reference
      setAiSuggestions(analysis);

      showToast(
        `AI analysis complete: ${Object.keys(filled).length} fields filled`,
        "success",
      );
    } catch (error) {
      console.error("AI analysis failed:", error);
      setAiNotes("AI analysis failed. Please fill in fields manually.");
      setAiConfidence("low");
      setShowAIAnalysis(true);
      showToast(
        "AI analysis failed. Please fill in fields manually.",
        "warning",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

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

    // Trigger AI analysis when a user is selected (for new employees only)
    if (!editingEmployee) {
      runAIAnalysis(u);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((f) => ({ ...f, [field]: value }));
    // Clear AI filled flag for this field if user manually changes it
    if (aiFilledFields[field]) {
      setAiFilledFields((prev) => ({ ...prev, [field]: false }));
    }
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

  // ── Department Modal Handlers ──
  const openDepartmentModal = () => {
    setNewDepartmentName("");
    setDepartmentModalError("");
    setShowDepartmentModal(true);
  };

  const closeDepartmentModal = () => {
    setShowDepartmentModal(false);
    setNewDepartmentName("");
    setDepartmentModalError("");
  };

  const handleCreateDepartment = async () => {
    const trimmed = newDepartmentName.trim();

    if (!trimmed) {
      setDepartmentModalError("Department name is required");
      return;
    }

    if (departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setDepartmentModalError(getTranslation("departmentExists"));
      return;
    }

    setAddingDepartment(true);
    try {
      await departmentAPI.create({ name: trimmed });
      setDepartments((prev) => [...prev, trimmed]);
      handleFormChange("department", trimmed);
      showToast(
        `${getTranslation("departmentAdded")}: "${trimmed}"`,
        "success",
      );
      closeDepartmentModal();
    } catch (error) {
      console.error("Failed to create department:", error);
      setDepartments((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed],
      );
      handleFormChange("department", trimmed);
      showToast(getTranslation("departmentWarning"), "warning");
      closeDepartmentModal();
    } finally {
      setAddingDepartment(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== SUBMIT FORM START ===");
    console.log("Form Data:", formData);
    console.log("Editing Employee:", editingEmployee);
    console.log("Selected User:", selectedUser);

    try {
      if (!formData.userId && !editingEmployee) {
        showToast("Please select a user first", "error");
        return;
      }

      if (!formData.name || !formData.email || !formData.department) {
        showToast(
          "Please fill in all required fields (Name, Email, Department)",
          "error",
        );
        return;
      }

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
        position: formData.position || "",
        profilePhotoUrl: profilePhotoUrl || "",
        phone: formData.phone || "",
        hireDate: formData.hireDate || "",
        salary: formData.salary || "",
        status: formData.status,
        isEligible: formData.status === "active",
        emergencyContact: formData.emergencyContact || "",
        address: formData.address || "",
        skills: formData.skills || [],
        performanceRating: formData.performanceRating || 0,
        notes: formData.notes || "",
      };

      console.log(
        "Employee Data to send:",
        JSON.stringify(employeeData, null, 2),
      );

      if (!editingEmployee) {
        const userAlreadyEmployee = employees.some(
          (e) =>
            e.userId === formData.userId || e.user?._id === formData.userId,
        );
        if (userAlreadyEmployee) {
          showToast("This user is already an employee", "error");
          setSaving(false);
          return;
        }
      }

      if (editingEmployee) {
        const employeeId =
          editingEmployee._id ||
          editingEmployee.user?._id ||
          editingEmployee.user;
        console.log("Updating employee with ID:", employeeId);
        if (!employeeId) {
          throw new Error("No valid employee ID found");
        }
        await goldenMondayAPI.updateRosterEntry(employeeId, employeeData);
        showToast(getTranslation("updateSuccess"), "success");
      } else {
        await goldenMondayAPI.registerEmployee(employeeData);
        showToast(getTranslation("createSuccess"), "success");
      }

      resetModal();
      await loadEmployees();
    } catch (error) {
      console.error("=== ERROR IN SUBMIT ===");
      console.error("Error object:", error);

      let errorDetails = "";
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);

        if (error.response.data) {
          if (typeof error.response.data === "string") {
            errorDetails = error.response.data;
          } else if (error.response.data.message) {
            errorDetails = error.response.data.message;
          } else if (error.response.data.error) {
            errorDetails = error.response.data.error;
          } else {
            errorDetails = JSON.stringify(error.response.data);
          }
        }

        const errorMessage = `Server Error (${error.response.status}): ${errorDetails}`;
        showToast(errorMessage, "error");
      } else if (error.request) {
        console.error("No response received:", error.request);
        showToast(
          "No response from server. Please check your connection.",
          "error",
        );
      } else {
        console.error("Error message:", error.message);
        showToast(error.message || "An unexpected error occurred", "error");
      }
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const handleDelete = async () => {
  if (!deleteTarget) return;

  try {
    // Ask for reason
    const reason = prompt(
      "Enter a reason for deleting this employee (optional):",
      "Account removed by administrator."
    );

    if (reason === null) return; // User cancelled

    await goldenMondayAPI.deleteEmployeeWithNotification(deleteTarget, reason);
    
    showToast("Employee deleted successfully! Telegram notification sent.", "success");
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    await loadEmployees();
  } catch (error) {
    console.error("Failed to delete employee:", error);
    showToast(error.response?.data?.error || "Failed to delete employee", "error");
  }
};

  // Add this function after handleDelete
const handleDeleteWithReason = async (reason) => {
  if (!deleteTarget) return;

  try {
    await goldenMondayAPI.deleteEmployeeWithNotification(deleteTarget, reason);
    showToast("Employee deleted successfully! Telegram notification sent.", "success");
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    await loadEmployees();
  } catch (error) {
    console.error("Failed to delete employee:", error);
    showToast(error.response?.data?.error || "Failed to delete employee", "error");
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
    setAiFilledFields({});
    setAiConfidence(null);
    setAiNotes("");
    setShowAIAnalysis(false);
    setAiSuggestions(null);
    setUserSearch("");
  };

  const openAddModal = async () => {
    resetModal();
    setShowAddModal(true);
    // Load users when modal opens
    await loadUsers();
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

  // ── Filter users for the dropdown ──
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

  // Debug logging for user loading
  console.log("🔍 User filtering debug:", {
    allUsersCount: allUsers.length,
    employeesCount: employees.length,
    availableUsersCount: availableUsers.length,
    filteredUsersCount: filteredUsers.length,
    userSearch: userSearch,
    isLoadingUsers: isLoadingUsers,
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

        {/* 🆕 PENDING APPROVALS CARD */}
        <div
          style={{
            background: C.white,
            padding: "14px 16px",
            borderRadius: 10,
            textAlign: "center",
            border: `2px solid ${pendingRegistrations.filter((p) => p.status === "pending_approval").length > 0 ? "#8b5cf6" : C.border}`,
            cursor: "pointer",
            transition: "all 0.2s ease",
            position: "relative",
          }}
          onClick={() => setShowPendingRegistrations(!showPendingRegistrations)}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(139, 92, 246, 0.15)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: "#8b5cf6" }}>
            {
              pendingRegistrations.filter(
                (p) => p.status === "pending_approval",
              ).length
            }
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
            <FiUserPlus size={12} />
            Pending Approvals
            {pendingRegistrations.filter((p) => p.status === "pending_approval")
              .length > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 4,
                  animation: "pulse 2s infinite",
                }}
              >
                {
                  pendingRegistrations.filter(
                    (p) => p.status === "pending_approval",
                  ).length
                }
              </span>
            )}
          </div>
          {pendingRegistrations.filter((p) => p.status === "pending_approval")
            .length > 0 && (
            <div
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ef4444",
                animation: "pulse 2s infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* Pending Registrations Panel */}
      {showPendingRegistrations && (
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            border: `2px solid #8b5cf6`,
            padding: "20px 24px",
            marginBottom: 20,
            animation: "fadeInUp 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.dark,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FiUserPlus size={20} color="#8b5cf6" />
                Pending Employee Registrations
                {pendingRegistrations.filter(
                  (p) => p.status === "pending_approval",
                ).length > 0 && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "white",
                      borderRadius: 20,
                      padding: "2px 12px",
                      fontSize: 12,
                    }}
                  >
                    {
                      pendingRegistrations.filter(
                        (p) => p.status === "pending_approval",
                      ).length
                    }{" "}
                    new
                  </span>
                )}
              </h3>
              <p style={{ fontSize: 13, color: C.muted }}>
                Review and approve new employee registrations from Telegram
              </p>
            </div>
            <button
              onClick={() => setShowPendingRegistrations(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.muted,
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          {pendingRegistrations.filter((p) => p.status === "pending_approval")
            .length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px 20px",
                color: C.muted,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 14 }}>No pending registrations to review</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingRegistrations
                .filter((p) => p.status === "pending_approval")
                .map((registration) => (
                  <div
                    key={registration._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      background: C.bg,
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, #8b5cf6, #6d28d9)`,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {registration.name?.charAt(0) || "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: C.dark,
                          }}
                        >
                          {registration.name}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted }}>
                          <FiMail size={12} style={{ marginRight: 4 }} />
                          {registration.email}
                          {registration.phone && (
                            <>
                              <span style={{ margin: "0 8px" }}>•</span>
                              <FiPhone size={12} style={{ marginRight: 4 }} />
                              {registration.phone}
                            </>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#8b5cf6",
                            marginTop: 2,
                          }}
                        >
                          <FiUser size={11} style={{ marginRight: 4 }} />@
                          {registration.telegramUsername || "n/a"} •
                          {new Date(
                            registration.createdAt,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() =>
                          handleApproveRegistration(registration._id)
                        }
                        disabled={processingApproval === registration._id}
                        style={{
                          padding: "6px 16px",
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor:
                            processingApproval === registration._id
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          opacity:
                            processingApproval === registration._id ? 0.6 : 1,
                        }}
                      >
                        {processingApproval === registration._id ? (
                          <FiLoader
                            size={14}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                        ) : (
                          <FiCheck size={14} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleRejectRegistration(registration._id)
                        }
                        disabled={processingApproval === registration._id}
                        style={{
                          padding: "6px 16px",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor:
                            processingApproval === registration._id
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          opacity:
                            processingApproval === registration._id ? 0.6 : 1,
                        }}
                      >
                        <FiX size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

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
            style={{ ...btn.primary, marginTop: 16 }}
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

      {/* Add/Edit Modal with AI Auto-Fill */}
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
                          setShowAIAnalysis(false);
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
                        {isLoadingUsers ? (
                          <div
                            style={{
                              padding: 10,
                              fontSize: 12,
                              color: C.muted,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <FiLoader
                              size={14}
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                            {getTranslation("loadingUsers")}
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div
                            style={{
                              padding: 10,
                              fontSize: 12,
                              color: C.muted,
                            }}
                          >
                            {allUsers.length === 0
                              ? getTranslation("noUsersInSystem")
                              : availableUsers.length === 0
                                ? getTranslation("allUsersAlreadyEmployees")
                                : getTranslation("noUsersFound")}
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

              {/* AI Auto-Fill Status Banner */}
              {!editingEmployee && selectedUser && (
                <>
                  {isAnalyzing ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#EFF6FF",
                        border: "1px solid #BFDBFE",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        marginBottom: "16px",
                        fontSize: "13px",
                        color: "#1D4ED8",
                      }}
                    >
                      <span style={{ animation: "spin 1s linear infinite" }}>
                        <FiLoader size={16} />
                      </span>
                      <div>
                        <div>AI is analyzing employee data...</div>
                      </div>
                    </div>
                  ) : (
                    showAIAnalysis && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          background:
                            aiConfidence === "high"
                              ? "#F0FDF4"
                              : aiConfidence === "medium"
                                ? "#FFFBEB"
                                : "#FEF2F2",
                          border: `1px solid ${
                            aiConfidence === "high"
                              ? "#86EFAC"
                              : aiConfidence === "medium"
                                ? "#FDE68A"
                                : "#FECACA"
                          }`,
                          borderRadius: "8px",
                          padding: "12px 14px",
                          marginBottom: "16px",
                        }}
                      >
                        {aiConfidence === "high" ? (
                          <FiCheck
                            size={18}
                            color="#15803D"
                            style={{ flexShrink: 0, marginTop: "1px" }}
                          />
                        ) : aiConfidence === "medium" ? (
                          <FiInfo
                            size={18}
                            color="#B45309"
                            style={{ flexShrink: 0, marginTop: "1px" }}
                          />
                        ) : (
                          <FiAlertCircle
                            size={18}
                            color="#B91C1C"
                            style={{ flexShrink: 0, marginTop: "1px" }}
                          />
                        )}
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color:
                                aiConfidence === "high"
                                  ? "#15803D"
                                  : aiConfidence === "medium"
                                    ? "#B45309"
                                    : "#B91C1C",
                            }}
                          >
                            {aiConfidence === "high"
                              ? getTranslation("highConfidence")
                              : aiConfidence === "medium"
                                ? getTranslation("mediumConfidence")
                                : getTranslation("lowConfidence")}{" "}
                            <span style={{ fontWeight: 400, fontSize: "12px" }}>
                              ({Object.keys(aiFilledFields).length}{" "}
                              {getTranslation("aiFilledFields")})
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color:
                                aiConfidence === "high"
                                  ? "#15803D"
                                  : aiConfidence === "medium"
                                    ? "#B45309"
                                    : "#B91C1C",
                              marginTop: "2px",
                            }}
                          >
                            {aiNotes || getTranslation("reviewFields")}
                          </div>
                          {aiConfidence === "low" && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#B91C1C",
                                marginTop: "4px",
                              }}
                            >
                              {getTranslation("aiAnalysisFailed")}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </>
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
                      border: `1.5px solid ${aiFilledFields.name ? C.primary : C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: aiFilledFields.name ? "#F0F9FF" : "white",
                    }}
                    placeholder="Full name"
                  />
                  {aiFilledFields.name && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginTop: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </div>
                  )}
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
                      border: `1.5px solid ${aiFilledFields.email ? C.primary : C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: aiFilledFields.email ? "#F0F9FF" : "white",
                    }}
                    placeholder="email@example.com"
                  />
                  {aiFilledFields.email && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginTop: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </div>
                  )}
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
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      required
                      list="department-options"
                      value={formData.department}
                      onChange={(e) =>
                        handleFormChange("department", e.target.value)
                      }
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        border: `1.5px solid ${aiFilledFields.department ? C.primary : C.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        outline: "none",
                        transition: "border-color 0.2s",
                        background: aiFilledFields.department
                          ? "#F0F9FF"
                          : "white",
                      }}
                      placeholder="e.g., Revenue"
                    />
                    <datalist id="department-options">
                      {departments.map((dept) => (
                        <option key={dept} value={dept} />
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={openDepartmentModal}
                      disabled={addingDepartment}
                      title={getTranslation("addDepartment")}
                      style={{
                        padding: "0 14px",
                        border: `1.5px solid ${C.border}`,
                        borderRadius: 8,
                        background: C.primary,
                        color: "#fff",
                        fontWeight: 700,
                        cursor: addingDepartment ? "default" : "pointer",
                        opacity: addingDepartment ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <FiPlus size={14} />
                      {getTranslation("addDepartment")}
                    </button>
                  </div>
                  {aiFilledFields.department && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginTop: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </div>
                  )}
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
                      border: `1.5px solid ${aiFilledFields.position ? C.primary : C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: aiFilledFields.position ? "#F0F9FF" : "white",
                    }}
                    placeholder="e.g., Team Leader"
                  />
                  {aiFilledFields.position && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginTop: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </div>
                  )}
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
                      border: `1.5px solid ${aiFilledFields.phone ? C.primary : C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: aiFilledFields.phone ? "#F0F9FF" : "white",
                    }}
                    placeholder="+251 9XX XXX XXX"
                  />
                  {aiFilledFields.phone && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginTop: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </div>
                  )}
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
                      border: `1.5px solid ${aiFilledFields.hireDate ? C.primary : C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: aiFilledFields.hireDate ? "#F0F9FF" : "white",
                    }}
                  />
                  {aiFilledFields.hireDate && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginTop: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </div>
                  )}
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
                  {aiFilledFields.skills && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginLeft: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </span>
                  )}
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
                        background: aiFilledFields.skills ? "#F0F9FF" : C.bg,
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: aiFilledFields.skills
                          ? `1px solid ${C.primary}33`
                          : "none",
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
                    {aiFilledFields.performanceRating && (
                      <span
                        style={{
                          fontSize: "10px",
                          color: C.primary,
                          marginLeft: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FiAi size={10} /> AI filled
                      </span>
                    )}
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
                      border: `1.5px solid ${aiFilledFields.performanceRating ? C.primary : C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: aiFilledFields.performanceRating
                        ? "#F0F9FF"
                        : "white",
                    }}
                    placeholder="0-100"
                  />
                  {aiFilledFields.performanceRating && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginTop: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </div>
                  )}
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
                  {aiFilledFields.notes && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: C.primary,
                        marginLeft: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAi size={10} /> AI filled
                    </span>
                  )}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1.5px solid ${aiFilledFields.notes ? C.primary : C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    resize: "vertical",
                    minHeight: 60,
                    fontFamily: F.sans,
                    background: aiFilledFields.notes ? "#F0F9FF" : "white",
                  }}
                  placeholder="Additional notes..."
                />
                {aiFilledFields.notes && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: C.primary,
                      marginTop: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FiAi size={10} /> AI filled
                  </div>
                )}
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

      {/* Department Creation Modal */}
      {showDepartmentModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 16,
            backdropFilter: "blur(4px)",
          }}
          onClick={closeDepartmentModal}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 28,
              width: "90%",
              maxWidth: 450,
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
                  fontSize: "clamp(18px, 4vw, 22px)",
                  fontWeight: 800,
                  color: C.dark,
                  fontFamily: F.serif,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <FiBriefcase size={22} color={C.primary} />
                {getTranslation("addDepartment")}
              </h2>
              <button
                onClick={closeDepartmentModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#999",
                  padding: "4px",
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                marginBottom: 20,
                fontFamily: F.sans,
              }}
            >
              Create a new department to organize employees more effectively.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.dark,
                }}
              >
                {getTranslation("departmentName")} *
              </label>
              <input
                type="text"
                value={newDepartmentName}
                onChange={(e) => {
                  setNewDepartmentName(e.target.value);
                  if (departmentModalError) setDepartmentModalError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateDepartment();
                  }
                }}
                placeholder={getTranslation("departmentNamePlaceholder")}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1.5px solid ${departmentModalError ? "#ef4444" : C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                autoFocus
              />
              {departmentModalError && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiInfo size={14} />
                  {departmentModalError}
                </div>
              )}
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
                onClick={closeDepartmentModal}
                style={btn.secondary}
                disabled={addingDepartment}
              >
                {getTranslation("cancel")}
              </button>
              <button
                onClick={handleCreateDepartment}
                style={{
                  ...btn.primary,
                  opacity: addingDepartment ? 0.7 : 1,
                  cursor: addingDepartment ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                disabled={addingDepartment}
              >
                {addingDepartment ? (
                  <>
                    <FiLoader
                      size={16}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    {getTranslation("addDepartment")}
                  </>
                )}
              </button>
            </div>
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
        <p style={{ fontSize: 12, color: "#8b5cf6", marginTop: 8 }}>
          A Telegram notification will be sent to the employee.
        </p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
          Reason for deletion (optional):
        </label>
        <input
          type="text"
          id="deleteReason"
          placeholder="e.g., Employee resigned, moved to other department..."
          style={{
            width: "100%",
            padding: "10px 14px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowDeleteConfirm(false)}
          style={btn.secondary}
        >
          {getTranslation("cancel")}
        </button>
        <button
          onClick={() => {
            const reasonInput = document.getElementById("deleteReason");
            const reason = reasonInput?.value || "Account removed by administrator.";
            setDeleteTarget(deleteTarget);
            handleDeleteWithReason(reason);
          }}
          style={{ ...btn.primary, background: "#ef4444", color: "#fff" }}
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
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
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
