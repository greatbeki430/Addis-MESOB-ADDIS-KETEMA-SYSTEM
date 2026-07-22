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

// Check if user has required role or higher
export const hasMinRole = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

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

// ✅ Navigation items with proper role requirements
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
    roles: [ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "services",
    icon: "🔧",
    label: "Services",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "admin/services",
    icon: "🔧",
    label: "Service Manager",
    roles: [ROLES.SUPER_ADMIN],
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
    id: "analytics",
    icon: "📊",
    label: "Analytics",
    roles: [ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "documents",
    icon: "📁",
    label: "Document Vault",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  {
    id: "golden-monday",
    icon: "🌅",
    label: "Golden Monday",
    roles: [ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  // frontend/src/utils/roles.js - Add to NAV_ITEMS array
  {
    id: "digital-attendance",
    icon: "📱",
    label: "Digital Attendance",
    roles: [ROLES.EMPLOYEE, ROLES.TEAM_LEADER, ROLES.ADMIN, ROLES.SUPER_ADMIN],
    path: "/digital-attendance",
  },
  {
    id: "admin-attendance",
    icon: "⏰",
    label: "Attendance Management",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    path: "/admin/attendance",
  },
  {
    id: "admin-digital-attendance",
    icon: "📱",
    label: "Digital Attendance Logs",
    roles: [ROLES.SUPER_ADMIN],
    path: "/admin/digital-attendance",
  },
  {
    id: "alerts",
    icon: "🔔",
    label: "Alerts & Notifications",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    path: "/admin/alerts",
  },
];

export const getFilteredNavItems = (userRole) => {
  return NAV_ITEMS.filter((item) =>
    item.roles.some((role) => hasMinRole(userRole, role)),
  );
};
