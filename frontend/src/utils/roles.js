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

export const hasMinRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const isSuperAdmin = (user) => user?.role === ROLES.SUPER_ADMIN;
export const isAdminOrAbove = (user) => hasMinRole(user?.role, ROLES.ADMIN);
export const isLeaderOrAbove = (user) =>
  hasMinRole(user?.role, ROLES.TEAM_LEADER);
export const isEmployee = (user) => user?.role === ROLES.EMPLOYEE;

export const isOwner = (user, resource) => {
  if (!user || !resource) return false;
  const ownerId =
    resource.createdBy?._id ||
    resource.createdBy ||
    resource.user?._id ||
    resource.user;
  return ownerId?.toString() === user._id?.toString();
};

// ─── TEAM MEMBERSHIP CHECKS ──────────────────────────────────────────

export const getUserTeamId = (user) => {
  if (!user) return null;
  return user.team?._id || user.team || user.teamId || null;
};

export const isUserInTeam = (user, teamId) => {
  if (!user || !teamId) return false;
  const userTeamId = getUserTeamId(user);
  return userTeamId?.toString() === teamId?.toString();
};

export const canManageTeam = (user, teamId) => {
  if (!user) return false;
  // Super Admin and Admin can manage any team
  if (isAdminOrAbove(user)) return true;
  // Team Leader can only manage their own team
  if (user.role === ROLES.TEAM_LEADER) {
    return isUserInTeam(user, teamId);
  }
  return false;
};

// ─── EVALUATION PERMISSIONS ──────────────────────────────────────────

/**
 * Check if user can EVALUATE (score/rate) members in a team
 * - Super Admin: YES (any team)
 * - Admin: YES (any team)
 * - Team Leader: YES (only their own team)
 * - Employee: NO
 */
export const canEvaluateTeam = (user, teamId) => {
  if (!user) return false;
  // Super Admin and Admin can evaluate any team
  if (isAdminOrAbove(user)) return true;
  // Team Leader can only evaluate their own team
  if (user.role === ROLES.TEAM_LEADER) {
    return isUserInTeam(user, teamId);
  }
  // Employees cannot evaluate
  return false;
};

/**
 * Check if user can VIEW evaluation form (scoring interface)
 * - Super Admin: YES (any team)
 * - Admin: YES (any team)
 * - Team Leader: YES (only their own team)
 * - Employee: NO (they see the feed instead)
 */
export const canViewEvaluationForm = (user, teamId) => {
  if (!user) return false;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    return isUserInTeam(user, teamId);
  }
  return false;
};

/**
 * Check if user can CREATE/SAVE an evaluation
 * - Super Admin: YES (any team)
 * - Admin: YES (any team)
 * - Team Leader: YES (only their own team)
 * - Employee: NO
 */
export const canCreateEvaluation = (user, teamId) => {
  return canEvaluateTeam(user, teamId);
};

/**
 * Check if user can EDIT an existing evaluation
 * - Super Admin: YES (any team)
 * - Admin: YES (any team)
 * - Team Leader: YES (only their own team's evaluations)
 * - Employee: NO
 */
export const canEditEvaluation = (user, evaluation) => {
  if (!user || !evaluation) return false;
  const teamId = evaluation.team?._id || evaluation.teamId || evaluation.team;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    return isUserInTeam(user, teamId);
  }
  return false;
};

/**
 * Check if user can DELETE an evaluation
 * - Super Admin: YES (any team)
 * - Admin: YES (any team)
 * - Team Leader: YES (only their own team's evaluations)
 * - Employee: NO
 */
export const canDeleteEvaluation = (user, evaluation) => {
  return canEditEvaluation(user, evaluation);
};

/**
 * Check if user can VIEW an evaluation (read-only)
 * - Everyone authenticated can view evaluations
 * - But with different levels of interaction
 */
export const canViewEvaluation = (user) => {
  return !!user;
};

/**
 * Check if user can COMMENT on an evaluation
 * - Super Admin: YES (any team)
 * - Admin: YES (any team)
 * - Team Leader: YES (any team - they can comment on others)
 * - Employee: YES (their own team only)
 */
export const canCommentOnEvaluation = (user, evaluation) => {
  if (!user || !evaluation) return false;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) return true; // Leaders can comment on any team
  if (user.role === ROLES.EMPLOYEE) {
    const teamId = evaluation.team?._id || evaluation.teamId || evaluation.team;
    return isUserInTeam(user, teamId);
  }
  return false;
};

/**
 * Check if user can REACT to an evaluation
 * Same as comment permissions
 */
export const canReactToEvaluation = canCommentOnEvaluation;

/**
 * Check if user can DELETE a comment
 * - Super Admin: YES (any)
 * - Admin: YES (any)
 * - Team Leader: YES (their own team's evaluations only)
 * - Employee: NO (only their own comments)
 */
export const canDeleteEvaluationComment = (user, evaluation, comment) => {
  if (!user || !evaluation) return false;
  // Super Admin and Admin can delete any comment
  if (isAdminOrAbove(user)) return true;
  // User can delete their own comments
  if (isOwner(user, comment)) return true;
  // Team Leader can delete comments on their own team's evaluations
  if (user.role === ROLES.TEAM_LEADER) {
    const teamId = evaluation.team?._id || evaluation.teamId || evaluation.team;
    return isUserInTeam(user, teamId);
  }
  return false;
};

/**
 * Check if user can EXPORT an evaluation as PDF
 * - Super Admin: YES (any)
 * - Admin: YES (any)
 * - Team Leader: YES (their own team's evaluations only)
 * - Employee: NO
 */
export const canExportEvaluationPDF = (user, evaluation) => {
  if (!user || !evaluation) return false;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    const teamId = evaluation.team?._id || evaluation.teamId || evaluation.team;
    return isUserInTeam(user, teamId);
  }
  return false;
};

/**
 * Get the list of teams a user can evaluate
 */
export const getEvaluableTeams = (user, allTeams) => {
  if (!user || !allTeams) return [];
  if (isAdminOrAbove(user)) return allTeams;
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeamId = getUserTeamId(user);
    return allTeams.filter(
      (team) => team._id?.toString() === userTeamId?.toString(),
    );
  }
  return [];
};

// ─── DAILY REPORT PERMISSIONS ──────────────────────────────────────────

export const canDeleteReport = (user, report) => {
  if (!user || !report) return false;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = getUserTeamId(user);
    const reportTeam = report.team?._id || report.team;
    return userTeam?.toString() === reportTeam?.toString();
  }
  return isOwner(user, report);
};

export const canEditReport = (user, report) => {
  if (!user || !report) return false;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = getUserTeamId(user);
    const reportTeam = report.team?._id || report.team;
    if (userTeam?.toString() === reportTeam?.toString()) return true;
  }
  return isOwner(user, report);
};

export const canViewAllReports = (user) => isAdminOrAbove(user);
export const canViewTeamReports = (user) => isLeaderOrAbove(user);
export const canComment = (user, report) => {
  if (!user || !report) return false;
  if (isAdminOrAbove(user)) return true;
  if (isOwner(user, report)) return true;
  if (user.role === ROLES.TEAM_LEADER || user.role === ROLES.EMPLOYEE) {
    const userTeam = getUserTeamId(user);
    const reportTeam = report.team?._id || report.team;
    return userTeam?.toString() === reportTeam?.toString();
  }
  return false;
};

export const canReact = canComment;
export const canDeleteComment = (user, report, comment) => {
  if (!user || !report || !comment) return false;
  if (isAdminOrAbove(user)) return true;
  if (isOwner(user, comment)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = getUserTeamId(user);
    const reportTeam = report.team?._id || report.team;
    return userTeam?.toString() === reportTeam?.toString();
  }
  return false;
};

export const canExportPDF = (user, report) => {
  if (!user) return false;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = getUserTeamId(user);
    const reportTeam = report.team?._id || report.team;
    if (userTeam?.toString() === reportTeam?.toString()) return true;
  }
  return isOwner(user, report);
};

export const canApproveReport = (user) => isAdminOrAbove(user);

// ─── FORUM REPORT PERMISSIONS ──────────────────────────────────────────

export const canCreateForumReport = (user) => {
  if (!user) return false;
  // Team Leaders and above can create forum reports
  return isLeaderOrAbove(user);
};

export const canEditForumReport = (user, report) => {
  if (!user || !report) return false;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = getUserTeamId(user);
    const reportTeam = report.teamId || report.team?._id || report.team;
    return userTeam?.toString() === reportTeam?.toString();
  }
  return isOwner(user, report);
};

export const canDeleteForumReport = canEditForumReport;

// ─── NEW: FORUM REPORT TIMER & EXTENSION PERMISSIONS ──────────────────

/**
 * Check if user can request extension for a forum report
 * - Super Admin: YES
 * - Admin: YES
 * - Team Leader: YES (only their own team's reports)
 * - Employee: NO
 */
export const canRequestExtension = (user, report) => {
  if (!user || !report) return false;
  if (isAdminOrAbove(user)) return true;
  if (user.role === ROLES.TEAM_LEADER) {
    const userTeam = getUserTeamId(user);
    const reportTeam = report.teamId || report.team?._id || report.team;
    return userTeam?.toString() === reportTeam?.toString();
  }
  return false;
};

/**
 * Check if user can approve/reject extension requests (Admin only)
 */
export const canManageExtensions = (user) => {
  return isAdminOrAbove(user);
};

/**
 * Check if user can view locked/expired report progress (Admin only)
 */
export const canViewLockedProgress = (user) => {
  return isAdminOrAbove(user);
};

/**
 * Check if user can resume a locked report (Admin only)
 */
export const canResumeReport = (user) => {
  return isAdminOrAbove(user);
};

/**
 * Check if user can unlock a report (Admin only)
 */
export const canUnlockReport = (user) => {
  return isAdminOrAbove(user);
};

// ─── GOLDEN MONDAY PERMISSIONS ─────────────────────────────────────────

export const canManageGoldenMondayResources = (user) =>
  isLeaderOrAbove(user) || user?.isGoldenMondayAdmin === true;

export const canUploadGoldenMondayResource = canManageGoldenMondayResources;
export const canDeleteGoldenMondayResource = canManageGoldenMondayResources;
export const canManageGoldenMondayRoster = canManageGoldenMondayResources;
export const canConfigureGoldenMondayAutoClear = canManageGoldenMondayResources;
export const canViewGoldenMondayResources = (user) => !!user;

// ─── UI Helpers ──────────────────────────────────────────────────────

export const getRoleDisplayName = (role) => {
  const names = {
    superadmin: "Super Admin",
    admin: "Admin",
    leader: "Team Leader",
    employee: "Employee",
  };
  return names[role] || role;
};

export const getRoleBadgeColor = (role) => {
  const colors = {
    superadmin: "#8B1A1A",
    admin: "#1A6B4A",
    leader: "#C25A00",
    employee: "#1E4D8C",
  };
  return colors[role] || "#666";
};

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
  // ─── NEW: Admin Extensions Navigation Item ─────────────────────────
  {
    id: "admin-extensions",
    icon: "⏰",
    label: "Extension Requests",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
];

export const getFilteredNavItems = (userRole) => {
  return NAV_ITEMS.filter((item) =>
    item.roles.some((role) => hasMinRole(userRole, role)),
  );
};
