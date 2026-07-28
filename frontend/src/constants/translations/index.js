// frontend/src/constants/translations/index.js
// 🆕 Modular translation aggregator - NO CONFLICTS with existing translations.js

// Import modular translations
import { commonTranslations } from "./common";
import { authTranslations } from "./auth";
import { dashboardTranslations } from "./dashboard";
import { changePasswordTranslations } from "./changePassword";
import { profileTranslations } from "./profile";
import { dailyReportTranslations } from "./dailyReport";
import { evaluationTranslations } from "./evaluation";
import { forumReportTranslations } from "./forumReport";
import { reportTranslations } from "./report";
import { servicesTranslations } from "./services";
import { userManagementTranslations } from "./userManagement";
import { employeeManagementTranslations } from "./employeeManagement";
import { documentVaultTranslations } from "./documentVault";
import { landingTranslations } from "./landing";

// ✅ CORRECTED: Import existing Golden Monday translations from the original location
// NOT from "./goldenMonday" - that file should be deleted
import { goldenMondayTranslations } from "../goldenMondayTranslations";

// Combine all modular translations
export const modularTranslations = {
  en: {
    ...commonTranslations.en,
    ...authTranslations.en,
    ...dashboardTranslations.en,
    ...changePasswordTranslations.en,
    ...profileTranslations.en,
    ...dailyReportTranslations.en,
    ...evaluationTranslations.en,
    ...forumReportTranslations.en,
    ...reportTranslations.en,
    ...servicesTranslations.en,
    ...userManagementTranslations.en,
    ...employeeManagementTranslations.en,
    ...documentVaultTranslations.en,
    ...landingTranslations.en,
    goldenMonday: goldenMondayTranslations.en,
  },
  am: {
    ...commonTranslations.am,
    ...authTranslations.am,
    ...dashboardTranslations.am,
    ...changePasswordTranslations.am,
    ...profileTranslations.am,
    ...dailyReportTranslations.am,
    ...evaluationTranslations.am,
    ...forumReportTranslations.am,
    ...reportTranslations.am,
    ...servicesTranslations.am,
    ...userManagementTranslations.am,
    ...employeeManagementTranslations.am,
    ...documentVaultTranslations.am,
    ...landingTranslations.am,
    goldenMonday: goldenMondayTranslations.am,
  },
  om: {
    ...commonTranslations.om,
    ...authTranslations.om,
    ...dashboardTranslations.om,
    ...changePasswordTranslations.om,
    ...profileTranslations.om,
    ...dailyReportTranslations.om,
    ...evaluationTranslations.om,
    ...forumReportTranslations.om,
    ...reportTranslations.om,
    ...servicesTranslations.om,
    ...userManagementTranslations.om,
    ...employeeManagementTranslations.om,
    ...documentVaultTranslations.om,
    ...landingTranslations.om,
    goldenMonday: goldenMondayTranslations.om,
  },
};

// Export languages
export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "am", label: "አማርኛ", flag: "🇪🇹" },
  { code: "om", label: "Afaan Oromo", flag: "🇪🇹" },
];

// For backward compatibility, also export as 'translations'
// so existing imports don't break
export const translations = modularTranslations;

export default modularTranslations;
