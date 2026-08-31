// frontend/src/utils/roles.js
// Role definitions and permissions
export const ROLES = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  TEAM_LEADER: "leader",
  EMPLOYEE: "employee",
};

// Permission hierarchy (higher number = more access)
export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 4,
  [ROLES.ADMIN]: 3,
  [ROLES.TEAM_LEADER]: 2,
  [ROLES.EMPLOYEE]: 1,
};

// ─── Basic Role Checks ──────────────────────────────────────────────

// Check if user has required role or higher
export const hasMinRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Check if user is Super Admin
export const isSuperAdmin = (user) => user?.role === ROLES.SUPER_ADMIN;

// Check if user is Admin or higher
export const isAdminOrAbove = (user) => hasMinRole(user?.role, ROLES.ADMIN);

// Check if user is Team Leader or higher
export const isLeaderOrAbove = (user) =>
  hasMinRole(user?.role, ROLES.TEAM_LEADER);

// Check if user is Employee (base level)
export const isEmployee = (user) => user?.role === ROLES.EMPLOYEE;

// Check if user owns a resource (created by them)
export const isOwner = (user, resource) => {
  if (!user || !resource) return false;
  const ownerId =
    resource.createdBy?._id ||
    resource.createdBy ||
    resource.user?._id ||
    resource.user;
  return ownerId?.toString() === user._id?.toString();
};

// ─── DAILY REPORT PERMISSIONS ──────────────────────────────────────────────

// Check if user can delete a report
export const canDeleteReport = (user, report) => {
  if (!user || !report) return false;
  // Super Admin and Admin can delete any report
  if (isAdminOrAbove(user)) return true;
  // Team Leader can delete reports from their team
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = user.team?._id || user.team;
    const reportTeam = report.team?._id || report.team;
    return userTeam?.toString() === reportTeam?.toString();
  }
  // Employee can only delete their own reports
  return isOwner(user, report);
};

// Check if user can edit a report
export const canEditReport = (user, report) => {
  if (!user || !report) return false;
  // Super Admin and Admin can edit any report
  if (isAdminOrAbove(user)) return true;
  // Team Leader can edit team reports or their own
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = user.team?._id || user.team;
    const reportTeam = report.team?._id || report.team;
    if (userTeam?.toString() === reportTeam?.toString()) return true;
  }
  // Employee can only edit their own reports
  return isOwner(user, report);
};

// Check if user can view all reports (org-wide)
export const canViewAllReports = (user) => {
  return isAdminOrAbove(user);
};

// Check if user can view team reports
export const canViewTeamReports = (user) => {
  return isLeaderOrAbove(user);
};

// Check if user can comment on a report
export const canComment = (user, report) => {
  if (!user || !report) return false;
  // Admins can comment anywhere
  if (isAdminOrAbove(user)) return true;
  // Users can comment on their own reports
  if (isOwner(user, report)) return true;
  // Users can comment on same-team reports
  if (user.role === ROLES.TEAM_LEADER || user.role === ROLES.EMPLOYEE) {
    const userTeam = user.team?._id || user.team;
    const reportTeam = report.team?._id || report.team;
    return userTeam?.toString() === reportTeam?.toString();
  }
  return false;
};

// Check if user can react to a report (same as comment)
export const canReact = canComment;

// Check if user can delete a comment
export const canDeleteComment = (user, report, comment) => {
  if (!user || !report || !comment) return false;
  // Super Admin and Admin can delete any comment
  if (isAdminOrAbove(user)) return true;
  // User can delete their own comments
  if (isOwner(user, comment)) return true;
  // Team Leader can delete comments on their team's reports
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = user.team?._id || user.team;
    const reportTeam = report.team?._id || report.team;
    return userTeam?.toString() === reportTeam?.toString();
  }
  return false;
};

// Check if user can export a report as PDF
export const canExportPDF = (user, report) => {
  if (!user) return false;
  // Admins can export any report
  if (isAdminOrAbove(user)) return true;
  // Team Leaders can export team reports or their own
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = user.team?._id || user.team;
    const reportTeam = report.team?._id || report.team;
    if (userTeam?.toString() === reportTeam?.toString()) return true;
  }
  // Everyone can export their own reports
  return isOwner(user, report);
};

// Check if user can approve a report
export const canApproveReport = (user, report) => {
  if (!user || !report) return false;
  // Only Admins can approve reports
  return isAdminOrAbove(user);
};

// ─── GOLDEN MONDAY GALLERY / RESOURCE VAULT PERMISSIONS ─────────────────
// These mirror the backend's `leaderOrAdmin` middleware used on the
// gallery, roster, and rotation routes in goldenMondayRoutes.js — the
// frontend must gate the same way or you get exactly the bug this was
// written to fix: a role that CAN call the upload/delete API (per the
// server) but never sees the button to do it (per the UI), or vice versa.

// Admin side: create folders, upload resources (images, PPTX, DOCX, PDF,
// video), delete resources, manage auto-clear, manage the roster.
export const canManageGoldenMondayResources = (user) => isLeaderOrAbove(user);

// Explicit aliases for call-site clarity where it matters what action
// is being gated — all resolve to the same leader-or-above check today,
// but keeping them separate means a future split (e.g. "leaders can
// upload but only admins can bulk-delete") is a one-line change here
// instead of a hunt through every component that imported a generic flag.
export const canUploadGoldenMondayResource = (user) =>
  canManageGoldenMondayResources(user);
export const canDeleteGoldenMondayResource = (user) =>
  canManageGoldenMondayResources(user);
export const canManageGoldenMondayRoster = (user) =>
  canManageGoldenMondayResources(user);
export const canConfigureGoldenMondayAutoClear = (user) =>
  canManageGoldenMondayResources(user);

// End-user side: every authenticated role (employee and up) can browse
// folders and download/view resources — there's no gate here by design,
// matching the backend's `anyRole` middleware on GET /gallery and
// GET /gallery/folders. Kept as an explicit function (not just "true")
// so call sites read the same way as the admin-side checks and stay
// easy to tighten later if that ever needs to change.
export const canViewGoldenMondayResources = (user) => !!user;

// ─── UI Helpers ──────────────────────────────────────────────────────

// Get role display name
export const getRoleDisplayName = (role) => {
  const names = {
    superadmin: "Super Admin",
    admin: "Admin",
    leader: "Team Leader",
    employee: "Employee",
  };
  return names[role] || role;
};

// Get role badge color
export const getRoleBadgeColor = (role) => {
  const colors = {
    superadmin: "#8B1A1A",
    admin: "#1A6B4A",
    leader: "#C25A00",
    employee: "#1E4D8C",
  };
  return colors[role] || "#666";
};

// Get role icon
export const getRoleIcon = (role) => {
  const icons = {
    superadmin: "👑",
    admin: "⚙️",
    leader: "⭐",
    employee: "👤",
  };
  return icons[role] || "👥";
};

// ─── Navigation Items ──────────────────────────────────────────────────

export const NAV_ITEMS = [
  // =============================================
  // CORE USER PAGES - Available based on role
  // =============================================
  {
    id: "dashboard",
    icon: "📊",
    label: "Dashboard",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "forum",
    icon: "💬",
    label: "Peer Forum",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "evaluation",
    icon: "📝",
    label: "Evaluation",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "report",
    icon: "📄",
    label: "Daily Report",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "services",
    icon: "🔧",
    label: "Services",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "documents",
    icon: "📁",
    label: "Document Vault",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "analytics",
    icon: "📊",
    label: "Analytics",
    roles: [ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "golden-monday",
    icon: "🌅",
    label: "Golden Monday",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },

  // =============================================
  // ADMIN MANAGEMENT PAGES
  // =============================================
  {
    id: "users",
    icon: "👥",
    label: "User Management",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "teams",
    icon: "👥",
    label: "Team Management",
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    id: "employees",
    icon: "👤",
    label: "Employee Management",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "admin/services",
    icon: "🔧",
    label: "Service Manager",
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    id: "digital-attendance",
    icon: "📱",
    label: "Digital Attendance",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "admin-attendance",
    icon: "⏰",
    label: "Attendance Management",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "admin-digital-attendance",
    icon: "📱",
    label: "Digital Attendance Logs",
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    id: "admin-alerts",
    icon: "🔔",
    label: "Alerts & Notifications",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "admin-evaluations",
    icon: "📝",
    label: "Manage Evaluations",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "admin-daily-reports",
    icon: "📄",
    label: "Manage Daily Reports",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "admin-forum-reports",
    icon: "💬",
    label: "Manage Forum Reports",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "admin-requests",
    icon: "🔧",
    label: "Manage Requests",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
];

export const getFilteredNavItems = (userRole) => {
  return NAV_ITEMS.filter((item) =>
    item.roles.some((role) => hasMinRole(userRole, role)),
  );
};
