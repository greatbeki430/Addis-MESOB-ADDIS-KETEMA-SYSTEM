// frontend/src/constants/translations/forumReport.js
// Forum Report page translations - COMPLETE with all keys
//
// Coverage audit (D3): every `tf()` call in ForumReport.jsx,
// ForumReportHistory.jsx, MeetingTimer.jsx, TimeExpiredModal.jsx,
// RequestExtensionModal.jsx, SignatureModal.jsx, SignatureCanvas.jsx,
// AutoSaveIndicator.jsx, and every `t.*` call in the admin Extensions
// tab (ForumReportManagement.jsx) resolves to a key present below.

export const forumReportTranslations = {
  en: {
    forum: {
      // ─── Page Header ──────────────────────────────────────────
      title: "Peer Forum Report Form",
      subtitle: "Addis Ababa City Admin · Addis MESOB · Addis Ketema Center",

      // ─── Meeting Time ─────────────────────────────────────────
      meetingTime: "📅 Meeting Time",
      date: "Date",
      startTime: "Start Time",
      endTime: "End Time",

      // ─── Members ──────────────────────────────────────────────
      presentMembers: "👥 Present Members",
      absentMembers: "🚫 Absent Members & Reasons",
      memberN: " Member",
      memberPlaceholder: "Member",
      presentHelper: "Add all team members who attended the forum meeting",
      absentMemberLabel: "Absent Member",
      name: "Name",
      reason: "Reason",
      namePlaceholder: "Member name",
      reasonPlaceholder: "Reason for absence",

      // ─── Previous Results ─────────────────────────────────────
      prevResults: "📋 Results from Previous Meeting",
      resultLabel: "Result",
      prevResultHelper:
        "List outcomes and action items from the previous meeting",
      prevResultPlaceholder: "Previous result",

      // ─── Topics ───────────────────────────────────────────────
      todayTopics: "💬 Today's Discussion Topics",
      topic: "Topic",
      topicHelper: "Enter each discussion topic separately",
      topicPlaceholder: "Discussion topic",

      // ─── Standing Agendas ─────────────────────────────────────
      // ── RESTORE 1: keep the trailing colon that StandingAgendasPanel
      //    and the pre-merge PDF expected. ──
      standingAgendas: "📋 Standing Agendas:",
      // ── end RESTORE 1
      // 7 items — kept in sync with the Amharic wording that
      // ForumReport.jsx originally hard-coded as STANDING_AGENDAS_AM.
      agendas: [
        "Establishing good governance in the institution",
        "Fighting maladministration",
        "Streamlining regular service delivery",
        "Working to the QMS standard",
        "Weekly exemplary work",
        "Problems encountered",
        "How they were resolved",
      ],

      // ─── Explanation ──────────────────────────────────────────
      explanation: "📝 Explanation Given (Brief)",
      explanationPlaceholder: "Write explanation...",

      // ─── Gaps ──────────────────────────────────────────────────
      gaps: "⚠️ Identified Gaps",
      gapLabel: "Gap",
      gapHelper: "Identify gaps or challenges discussed in the forum",
      gapPlaceholder: "Identified gap",

      // ─── Agreements ───────────────────────────────────────────
      agreements: "✅ Agreed Points",
      agreementLabel: "Agreement",
      agreementHelper: "Document all points of agreement reached",
      agreementPlaceholder: "Agreed point",

      // ─── Signatures ───────────────────────────────────────────
      signatures: "✍️ Signatures",
      signatureN: " Signature",
      addSignature: "Add Signature",
      signaturePlaceholder: "Signature line",

      // ─── Buttons ──────────────────────────────────────────────
      save: "💾 Save Report",
      updateReport: "💾 Update Report",
      newReport: "📄 New Report",
      addTeam: " Add Team",
      createFirstTeam: "Create First Team",
      openReport: "Open Report",
      backToTeams: "← Back to Teams",
      addNewTeam: "Add New Team",
      createTeam: "Create Team",
      changeTeam: "Change Team",
      exportPdf: "📄 Export PDF",
      addAbsent: "Add Absent Member",

      // ─── Team Selector ────────────────────────────────────────
      teamsTitle: "📊 Forum Reports by Team",
      yourTeam: "Your Team",
      selectTeamToReport: "Select a team to create or view their forum report",
      noTeamsYet:
        "No teams created yet. Click the button below to add your first team.",
      selectTeamPrompt: "Select a Team",
      selectTeamHelper:
        "Choose a team from the list below to start or view their forum report",
      loadingTeams: "Loading teams...",
      noTeamsAssigned: "You are not assigned to any team",
      noTeamsYetShort: "No teams yet",
      noDepartment: "No department",
      searchTeams: "Search teams...",
      noTeamsFound: "No teams found",
      teamName: "Team Name",
      teamDescription: "Team Description",
      teamLeader: "Team Leader",

      // ─── Status Messages ──────────────────────────────────────
      saved: "✅ Report Saved!",
      savedSub: "Peer Forum report completed successfully.",
      exportSuccess: "✅ Report exported successfully!",
      exportError: "❌ Failed to export report",
      generatingSummary: "Generating summary...",
      summaryGenerated: "✅ AI summary generated and applied!",
      summaryError: "❌ Failed to generate AI summary",
      fullReportGenerated: "✅ Full report generated and applied!",
      fullReportError: "❌ Failed to generate full report",
      saving: "Saving...",
      saveSuccess: "✅ Report saved successfully!",
      updateSuccess: "✅ Report updated successfully!",
      saveError: "Failed to save report. Please try again.",
      selectDate: "Please select a date",
      fillFields: "Please fill in all required fields",
      autoSaveReady: "Auto-save ready",
      autoSaveError: "Auto-save failed",

      // ─── AI Features ──────────────────────────────────────────
      generateSummary: "🤖 AI Writing Assistant",
      summarize: "📝 Summarize",
      fullReport: "📋 Full Report",
      aiActions: "AI Actions:",
      aiSummaryLabel: "🤖 AI Meeting Minutes",
      aiContentApplied: "AI Generated Content Applied",
      aiApplied: "✅ AI suggestion applied to explanation!",
      noContent: "No content to apply",
      noContentGenerated: "No content generated. Please try again.",

      // ─── Progress ─────────────────────────────────────────────
      complete: "complete",
      progressStart: "🚀 Start filling in the report details below",
      progressMiddle: "💪 You're making good progress! Keep going.",
      progressEnd: "🎯 Almost there! Review and save your report.",

      // ─── Feed ──────────────────────────────────────────────────
      feed: "Feed",

      // ─── Extension & Lock flow ────────────────────────────────
      reportLocked: "🔒 This report is locked. Please contact an admin.",
      extensionPending: "⏳ Extension request pending admin approval.",
      extensionRequested: "✅ Extension request submitted to admin",
      extensionRequestError: "Failed to request extension",
      reportResumed: "✅ Report resumed successfully",
      resumeError: "Failed to resume report",
      reasonRequired: "Please provide a reason",

      // ─── TimeExpiredModal ─────────────────────────────────────
      timeExpiredTitle: "⏰ Meeting Time Expired!",
      timeExpiredMessage:
        "Your 30-minute meeting time has ended. Your progress has been auto-saved and is now only visible to Admins and Super Admins.",
      progressSavedMessage:
        "✅ Your progress has been automatically saved to the system.",
      adminOnlyMessage:
        "🔒 Only Admins and Super Admins can view your saved progress.",
      reasonLabel: "Reason for extension:",
      requestExtension: "Request Extension",
      submitRequest: "Submit Extension Request",
      viewSavedProgress: "View Saved Progress",
      cancel: "Cancel",
      close: "Close",

      // ─── RequestExtensionModal ────────────────────────────────
      extensionRequestTitle: "Request Time Extension",
      extensionRequestMessage:
        "Your meeting time has expired. Request additional time from an admin by providing a reason below.",
      extensionInfo:
        "Your request will be sent to an admin for approval. You will be notified once a decision is made.",
      durationLabel: "Additional time needed:",
      teamLabel: "Team",
      submitting: "Submitting...",
      submittedSuccess: "✅ Request Sent!",
      adminNotification:
        "🔔 An admin will review your request and notify you of their decision.",

      // ─── Signature Modal ──────────────────────────────────────
      signatureModalTitle: "Sign Your Report",
      drawSignature: "Draw",
      typeSignature: "Type",
      drawing: "Drawing...",
      signed: "✓ Signed",
      signatureRecorded: "✓ Recorded",
      signatureVerified: "Signature verified",
      drawOrTypeSignature: "Draw or type your signature",
      readOnly: "Read only",
      touchToSign: "Touch to sign",
      clickToSign: "Click and drag to sign",
      typeNameToSign: "Type your name below",
      confirm: "Confirm",
      signatureVerificationNotice:
        "Your signature will be attached to this report.",

      // ─── Misc ──────────────────────────────────────────────────
      notAssigned: "Not assigned",
      time: "Time",
      signatureLocked: "🔒 Locked",
      signatureClickToSign: "Click to sign",
      historyTab: "History",
      addFirst: "Add First",
      addAnother: "Add Another",

      // ─── Admin: Extensions tab ────────────────────────────────
      extensionsTab: "Extensions",
      extensionRequestsTitle: "Extension Requests",
      extensionRequestStatusPending: "Pending",
      extensionRequestStatusApproved: "Approved",
      extensionRequestStatusRejected: "Rejected",
      extensionRequestedBy: "Requested by",
      extensionTeam: "Team",
      extensionRequestedMinutes: "Requested minutes",
      extensionRequestedAt: "Requested",
      extensionReason: "Reason",
      extensionAdminNotes: "Admin notes",
      extensionApprove: "Approve",
      extensionReject: "Reject",
      extensionApproveSuccess: "✅ Extension approved",
      extensionRejectSuccess: "Extension rejected",
      extensionRejectError: "Failed to reject",
      extensionNoRequests: "No extension requests in this filter.",
      extensionFilterPending: "Pending",
      extensionFilterApproved: "Approved",
      extensionFilterRejected: "Rejected",
      extensionFilterAll: "All",
      extensionLoading: "Loading extension requests...",
      extensionRejectReasonLabel: "Rejection reason (required):",
      extensionRejectReasonRequired: "Rejection reason is required.",
      extensionApproveNoteLabel: "Approval note (optional):",
      extensionRequestedForMeeting: "Report",
      extensionPendingBadge: "pending",
      extensionRefresh: "Refresh",

      // ─── Admin: Lock / Unlock (B9) ────────────────────────────
      adminLock: "Lock",
      adminUnlock: "Unlock",
      adminLockReason: "Reason for locking (required):",
      adminLockConfirm:
        "Lock this report? The owner will not be able to edit it.",
      adminUnlockConfirm: "Unlock this report and allow editing again?",
      adminLockSuccess: "✅ Report locked",
      adminUnlockSuccess: "✅ Report unlocked",
      adminLockedBadge: "Locked",
      adminUnlockedBadge: "Unlocked",
      adminReasonRequired: "A reason is required.",
    },
  },

  am: {
    forum: {
      // ─── Page Header ──────────────────────────────────────────
      title: "የአቻ ፎረም ሪፖርት ቅጽ",
      subtitle: "በአዲስ አበባ ከተማ አስተዳደር አዲስ መሶብ · አዲስ ከተማ ማዕከል",

      // ─── Meeting Time ─────────────────────────────────────────
      meetingTime: "📅 ስብሰባ ጊዜ",
      date: "ቀን",
      startTime: "ጀምሮ (ሰዓት)",
      endTime: "ጨርሶ (ሰዓት)",

      // ─── Members ──────────────────────────────────────────────
      presentMembers: "👥 ስብሰባው ላይ የተገኙ አባላት",
      absentMembers: "🚫 ያልተገኙ አባላትና ምክንያት",
      memberN: "ኛ አባል",
      memberPlaceholder: "አባል",
      presentHelper: "በፎረም ስብሰባ ላይ የተገኙ አባላትን ሁሉ ያክሉ",
      absentMemberLabel: "ያልተገኘ አባል",
      name: "ስም",
      reason: "ምክንያት",
      namePlaceholder: "የአባል ስም",
      reasonPlaceholder: "የአለመገኘት ምክንያት",

      // ─── Previous Results ─────────────────────────────────────
      prevResults: "📋 ባለፈው ስብሰባ ላይ የታዩ ውጤቶች",
      resultLabel: "ውጤት",
      prevResultHelper: "ካለፈው ስብሰባ የወጡ ውጤቶች እና የተግባር እቅዶች",
      prevResultPlaceholder: "ባለፈው ውጤት",

      // ─── Topics ───────────────────────────────────────────────
      todayTopics: "💬 የእለቱ መወያያ ርዕሶች",
      topic: "ርዕስ",
      topicHelper: "እያንዳንዱን የውይይት ርዕስ ለየብቻ ያስገቡ",
      topicPlaceholder: "የውይይት ርዕስ",

      // ─── Standing Agendas ─────────────────────────────────────
      // ── RESTORE 2: keep the Ethiopian colon (፡) that the panel used. ──
      standingAgendas: "📋 ቋሚ አጀንዳዎች፡",
      // ── end RESTORE 2
      // Preserved verbatim from the original STANDING_AGENDAS_AM
      // constant in ForumReport.jsx — do not paraphrase.
      agendas: [
        "በተቋሙ መልካም አስተዳደር ማስፈን በተመለከተ",
        "በተቋሙ ብልሹ አሰራር ከመታገል አንጻር",
        "መደበኛ አገልግሎት አሰጣጥን ከማሳለጥ አንጻር",
        "QMS ስታንዳርድ በመስራት",
        "ሳምንታዊ አብነታዊ ስራዎች",
        "ያጋጠሙ ችግሮች",
        "የተፈታበት አግባብ",
      ],

      // ─── Explanation ──────────────────────────────────────────
      explanation: "📝 የተሰጠ ማብራሪያ (በአጭሩ)",
      explanationPlaceholder: "ማብራሪያ ይጻፉ...",

      // ─── Gaps ──────────────────────────────────────────────────
      gaps: "⚠️ የታዩ ክፍተቶች",
      gapLabel: "ክፍተት",
      gapHelper: "በፎረሙ ላይ የተወያዩ ክፍተቶች ወይም ተግዳሮቶች",
      gapPlaceholder: "የታየ ክፍተት",

      // ─── Agreements ───────────────────────────────────────────
      agreements: "✅ የጋራ ስምምነት የተደረገባቸው ነጥቦች",
      agreementLabel: "ስምምነት",
      agreementHelper: "የተደረሱትን ሁሉንም የስምምነት ነጥቦች ይመዝግቡ",
      agreementPlaceholder: "የተስማማበት ነጥብ",

      // ─── Signatures ───────────────────────────────────────────
      signatures: "✍️ ፊርማዎች",
      signatureN: "ኛ ፊርማ",
      addSignature: "ፊርማ ጨምር",
      signaturePlaceholder: "የፊርማ መስመር",

      // ─── Buttons ──────────────────────────────────────────────
      save: "ሪፖርቱን አስቀምጥ",
      updateReport: "ሪፖርቱን አዘምን",
      newReport: "አዲስ ሪፖርት",
      addTeam: "ቡድን ጨምር",
      createFirstTeam: "የመጀመሪያ ቡድን ፍጠር",
      openReport: "ሪፖርት ክፈት",
      backToTeams: "← ወደ ቡድኖች ተመለስ",
      addNewTeam: "አዲስ ቡድን ጨምር",
      createTeam: "ቡድን ፍጠር",
      changeTeam: "ቡድን ቀይር",
      exportPdf: "PDF ላክ",
      addAbsent: "ያልተገኘ አባል ጨምር",

      // ─── Team Selector ────────────────────────────────────────
      teamsTitle: "በቡድን የአቻ ፎረም ሪፖርቶች",
      yourTeam: "ቡድንህ",
      selectTeamToReport: "ሪፖርት ለመሙላት ቡድን ይምረጡ",
      noTeamsYet: "እስካሁን ምንም ቡድን አልተፈጠረም። አዲስ ቡድን ለመፍጠር ቁልፉን ይጫኑ።",
      // ── RESTORE 3: original richer Amharic wording (the sidebar hint). ──
      selectTeamPrompt: "ሪፖርት ለመጀመር ከጎን ባር ላይ ቡድን ይምረጡ",
      selectTeamHelper: "በጎን ባር ላይ 'አቻ ፎረም' ን ጠቅ ያድርጉ፣ ከዚያ ቡድን ይምረጡ",
      // ── end RESTORE 3
      loadingTeams: "ቡድኖችን በመጫን ላይ...",
      noTeamsAssigned: "ለምንም ቡድን አልተመደቡም",
      noTeamsYetShort: "እስካሁን ምንም ቡድን የለም",
      noDepartment: "ዘርፍ የለም",
      searchTeams: "ቡድኖችን ፈልግ...",
      noTeamsFound: "ምንም ቡድን አልተገኘም",
      teamName: "የቡድን ስም",
      teamDescription: "የቡድን መግለጫ",
      teamLeader: "የቡድን መሪ",

      // ─── Status Messages ──────────────────────────────────────
      saved: "✅ ሪፖርቱ ተሞልቷል!",
      savedSub: "የአቻ ፎረም ሪፖርት በተሳካ ሁኔታ ተጠናቋል።",
      exportSuccess: "✅ ሪፖርቱ በተሳካ ሁኔታ ወጥቷል!",
      exportError: "❌ ሪፖርቱን ማውጣት አልተቻለም",
      generatingSummary: "ማጠቃለያ በማዘጋጀት ላይ...",
      summaryGenerated: "✅ የAI ማጠቃለያ ተዘጋጅቶ ተተግብሯል!",
      summaryError: "❌ የAI ማጠቃለያ ማዘጋጀት አልተቻለም",
      fullReportGenerated: "✅ ሙሉ ሪፖርት ተዘጋጅቶ ተተግብሯል!",
      fullReportError: "❌ ሙሉ ሪፖርት ማዘጋጀት አልተቻለም",
      saving: "በማስቀመጥ ላይ...",
      saveSuccess: "✅ ሪፖርቱ በተሳካ ሁኔታ ተቀምጧል!",
      updateSuccess: "✅ ሪፖርቱ በተሳካ ሁኔታ ተዘምኗል!",
      saveError: "ሪፖርቱን ማስቀመጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
      selectDate: "እባክዎ ቀን ይምረጡ",
      fillFields: "እባክዎ ሁሉንም አስፈላጊ መስኮች ይሙሉ",
      autoSaveReady: "ራስ-ሰር ማስቀመጥ ዝግጁ ነው",
      autoSaveError: "ራስ-ሰር ማስቀመጥ አልተሳካም",

      // ─── AI Features ──────────────────────────────────────────
      generateSummary: "🤖 የAI ጽሑፍ ረዳት",
      summarize: "አጭር ያድርጉ",
      fullReport: "ሙሉ ሪፖርት",
      aiActions: "የAI ተግባራት:",
      aiSummaryLabel: "🤖 የAI ስብሰባ ደቂቃዎች",
      aiContentApplied: "በAI የተፈጠረ ይዘት ተተግብሯል",
      aiApplied: "✅ የAI ሐሳብ በማብራሪያ ላይ ተተግብሯል!",
      noContent: "ለመተግበር ምንም ይዘት የለም",
      noContentGenerated: "ምንም ይዘት አልተፈጠረም። እባክዎ እንደገና ይሞክሩ።",

      // ─── Progress ─────────────────────────────────────────────
      complete: "ተጠናቋል",
      progressStart: "🚀 ከታች የሪፖርት ዝርዝሮችን መሙላት ይጀምሩ",
      progressMiddle: "💪 ጥሩ እድገት እያደረጉ ነው! ይቀጥሉ።",
      progressEnd: "🎯 ሊጠናቀቅ ተቃርቧል! ሪፖርትዎን ይገምግሙ እና ያስቀምጡ።",

      // ─── Feed ──────────────────────────────────────────────────
      feed: "መጋቢ",

      // ─── Extension & Lock flow ────────────────────────────────
      reportLocked: "🔒 ይህ ሪፖርት ተቆልፏል። እባክዎ አስተዳዳሪን ያግኙ።",
      extensionPending: "⏳ የጊዜ ማራዘሚያ ጥያቄ በአስተዳዳሪ ማጽደቅ በመጠበቅ ላይ።",
      extensionRequested: "✅ የጊዜ ማራዘሚያ ጥያቄ ለአስተዳዳሪ ተልኳል",
      extensionRequestError: "የጊዜ ማራዘሚያ ጥያቄ ማስገባት አልተቻለም",
      reportResumed: "✅ ሪፖርቱ በተሳካ ሁኔታ ተቀጥሏል",
      resumeError: "ሪፖርቱን ማስቀጠል አልተቻለም",
      reasonRequired: "እባክዎ ምክንያት ያስገቡ",

      // ─── TimeExpiredModal ─────────────────────────────────────
      timeExpiredTitle: "⏰ የስብሰባ ጊዜ አልቋል!",
      timeExpiredMessage:
        "የ30 ደቂቃ ስብሰባ ጊዜዎ አልቋል። ሂደትዎ በራስ-ሰር ተቀምጧል እና አሁን ለአስተዳዳሪዎች ብቻ ይታያል።",
      progressSavedMessage: "✅ ሂደትዎ በራስ-ሰር በስርዓቱ ተቀምጧል።",
      adminOnlyMessage: "🔒 የተቀመጠውን ሂደትዎን ማየት የሚችሉት አስተዳዳሪዎች ብቻ ናቸው።",
      reasonLabel: "የማራዘሚያ ምክንያት:",
      requestExtension: "ጊዜ ማራዘም ጠይቅ",
      submitRequest: "የማራዘሚያ ጥያቄ አስገባ",
      viewSavedProgress: "የተቀመጠ ሂደት ይመልከቱ",
      cancel: "ሰርዝ",
      close: "ዝጋ",

      // ─── RequestExtensionModal ────────────────────────────────
      extensionRequestTitle: "የጊዜ ማራዘሚያ ጠይቅ",
      extensionRequestMessage:
        "የስብሰባ ጊዜዎ አልቋል። ከታች ምክንያት በመስጠት ከአስተዳዳሪ ተጨማሪ ጊዜ ይጠይቁ።",
      extensionInfo: "ጥያቄዎ ለአስተዳዳሪ ማጽደቅ ይላካል። ውሳኔ ከተደረገ በኋላ ይነገርዎታል።",
      durationLabel: "የሚያስፈልግ ተጨማሪ ጊዜ:",
      teamLabel: "ቡድን",
      submitting: "በማስገባት ላይ...",
      submittedSuccess: "✅ ጥያቄ ተልኳል!",
      adminNotification: "🔔 አስተዳዳሪ ጥያቄዎን ይገመግማል እና ውሳኔውን ያሳውቅዎታል።",

      // ─── Signature Modal ──────────────────────────────────────
      signatureModalTitle: "ሪፖርትዎን ይፈርሙ",
      drawSignature: "ይሳሉ",
      typeSignature: "ይተይቡ",
      drawing: "በመሳል ላይ...",
      signed: "✓ ተፈርሟል",
      signatureRecorded: "✓ ተመዝግቧል",
      signatureVerified: "ፊርማ ተረጋግጧል",
      drawOrTypeSignature: "ፊርማዎን ይሳሉ ወይም ይተይቡ",
      readOnly: "ለንባብ ብቻ",
      touchToSign: "ለመፈረም ይንኩ",
      clickToSign: "ለመፈረም ጠቅ ያድርጉና ይጎትቱ",
      typeNameToSign: "ስምዎን ከታች ይተይቡ",
      confirm: "አረጋግጥ",
      signatureVerificationNotice: "ፊርማዎ ከዚህ ሪፖርት ጋር ይያያዛል።",

      // ─── Misc ──────────────────────────────────────────────────
      notAssigned: "አልተመደበም",
      time: "ሰዓት",
      signatureLocked: "🔒 ተቆልፏል",
      signatureClickToSign: "ለመፈረም ይጫኑ",
      historyTab: "ታሪክ",
      addFirst: "መጀመሪያውን ጨምር",
      addAnother: "ሌላ ጨምር",

      // ─── Admin: Extensions tab ────────────────────────────────
      extensionsTab: "ማራዘሚያዎች",
      extensionRequestsTitle: "የጊዜ ማራዘሚያ ጥያቄዎች",
      extensionRequestStatusPending: "በመጠባበቅ ላይ",
      extensionRequestStatusApproved: "ተፈቅዷል",
      extensionRequestStatusRejected: "ተከልክሏል",
      extensionRequestedBy: "የጠየቀው በ",
      extensionTeam: "ቡድን",
      extensionRequestedMinutes: "የተጠየቀ ደቂቃ",
      extensionRequestedAt: "የተጠየቀበት",
      extensionReason: "ምክንያት",
      extensionAdminNotes: "የአስተዳዳሪ ማስታወሻ",
      extensionApprove: "ፍቀድ",
      extensionReject: "አትፍቀድ",
      extensionApproveSuccess: "✅ ማራዘሚያ ተፈቅዷል",
      extensionRejectSuccess: "ማራዘሚያ ተከልክሏል",
      extensionRejectError: "ማራዘሚያ ማክልከል አልተቻለም",
      extensionNoRequests: "በዚህ ማጣሪያ ውስጥ ምንም ጥያቄ የለም።",
      extensionFilterPending: "በመጠባበቅ ላይ",
      extensionFilterApproved: "ተፈቅዷል",
      extensionFilterRejected: "ተከልክሏል",
      extensionFilterAll: "ሁሉም",
      extensionLoading: "የማራዘሚያ ጥያቄዎችን በመጫን ላይ...",
      extensionRejectReasonLabel: "የማክልከል ምክንያት (የግዴታ):",
      extensionRejectReasonRequired: "የማክልከል ምክንያት ያስፈልጋል።",
      extensionApproveNoteLabel: "የማጽደቅ ማስታወሻ (አማራጭ):",
      extensionRequestedForMeeting: "ሪፖርት",
      extensionPendingBadge: "በመጠባበቅ",
      extensionRefresh: "አድስ",

      // ─── Admin: Lock / Unlock (B9) ────────────────────────────
      adminLock: "ቆልፍ",
      adminUnlock: "ክፈት",
      adminLockReason: "የመቆለፍ ምክንያት (የግዴታ):",
      adminLockConfirm: "ይህን ሪፖርት ይቆልፉ? ባለቤቱ ማሻሻል አይችልም።",
      adminUnlockConfirm: "ይህን ሪፖርት ይክፈቱና እንደገና ማሻሻል ይፍቀዱ?",
      adminLockSuccess: "✅ ሪፖርቱ ተቆልፏል",
      adminUnlockSuccess: "✅ ሪፖርቱ ተከፍቷል",
      adminLockedBadge: "ተቆልፏል",
      adminUnlockedBadge: "ተከፍቷል",
      adminReasonRequired: "ምክንያት ያስፈልጋል።",
    },
  },

  om: {
    forum: {
      // ─── Page Header ──────────────────────────────────────────
      title: "Unka Gabaasa Fooraamii Hiriyyaa",
      subtitle:
        "Bulchiinsa Magaalaa Finfinnee · Addis MESOB · Giddugala Addis Ketema",

      // ─── Meeting Time ─────────────────────────────────────────
      meetingTime: "📅 Yeroo Walgahii",
      date: "Guyyaa",
      startTime: "Yeroo Jalqabaa",
      endTime: "Yeroo Xumuraa",

      // ─── Members ──────────────────────────────────────────────
      presentMembers: "👥 Miseensota Argaman",
      absentMembers: "🚫 Miseensota Hin Argamne & Sababa",
      memberN: " Miseensa",
      memberPlaceholder: "Miseensa",
      presentHelper:
        "Miseensota walga'ii fooraamii irratti argaman hunda dabali",
      absentMemberLabel: "Miseensa hin argamne",
      name: "Maqaa",
      reason: "Sababa",
      namePlaceholder: "Maqaa miseensaa",
      reasonPlaceholder: "Sababa hin argamne",

      // ─── Previous Results ─────────────────────────────────────
      prevResults: "📋 Bu'aa Walgahii Darbee",
      resultLabel: "Bu'aa",
      prevResultHelper: "Bu'aalee fi wantoota walga'ii darbee irraa tarreessi",
      prevResultPlaceholder: "Bu'aa darbee",

      // ─── Topics ───────────────────────────────────────────────
      todayTopics: "💬 Mata-duree Marii Har'aa",
      topic: "Mata-duree",
      topicHelper: "Mata-duree marii tokkoon tokkoon galchi",
      topicPlaceholder: "Mata-duree marii",

      // ─── Standing Agendas ─────────────────────────────────────
      // ── RESTORE 4: keep the trailing colon. ──
      standingAgendas: "📋 Ajandaa Dhaabbataa:",
      // ── end RESTORE 4
      // Oromoo wording aligned to the 7-item Amharic list.
      agendas: [
        "Bulchiinsa gaarii dhaabbata keessatti mirkaneessuu",
        "Badaa bulchiinsaa loluu",
        "Tajaajila yeroo yeroon kennamu salphisuun",
        "Sadarkaa QMS irratti hojjechuu",
        "Hojii fakkeenyaa torbanii",
        "Rakkoolee mudatan",
        "Akkamitti furaman",
      ],

      // ─── Explanation ──────────────────────────────────────────
      explanation: "📝 Ibsa Kenname (Gabaabaa)",
      explanationPlaceholder: "Ibsa barreessi...",

      // ─── Gaps ──────────────────────────────────────────────────
      gaps: "⚠️ Hanqinaalee Mul'atan",
      gapLabel: "Hanqina",
      gapHelper:
        "Hanqinaalee ykn rakkinaalee fooraamii keessatti mariifataman adda baasi",
      gapPlaceholder: "Hanqina mul'ate",

      // ─── Agreements ───────────────────────────────────────────
      agreements: "✅ Qabxii Irratti Walii Galame",
      agreementLabel: "Walii Galii",
      agreementHelper: "Qabxii walii galii hunda barreessi",
      agreementPlaceholder: "Qabxii walii galame",

      // ─── Signatures ───────────────────────────────────────────
      signatures: "✍️ Mallattoo",
      signatureN: " Mallattoo",
      addSignature: "Mallattoo Dabali",
      signaturePlaceholder: "Sarara mallattoo",

      // ─── Buttons ──────────────────────────────────────────────
      save: "💾 Gabaasa Olkaayi",
      updateReport: "💾 Gabaasa Haaromsi",
      newReport: "📄 Gabaasa Haaraa",
      addTeam: "➕ Garee Dabali",
      createFirstTeam: "Garee Jalqabaa Uumi",
      openReport: "Gabaasa Bani",
      backToTeams: "← Gareetti Deebi'i",
      addNewTeam: "Garee Haaraa Dabali",
      createTeam: "Garee Uumi",
      changeTeam: "Garee Jijjiiri",
      exportPdf: "📄 PDF Ergi",
      addAbsent: "Miseensa hin Argamne Dabali",

      // ─── Team Selector ────────────────────────────────────────
      teamsTitle: "📊 Gabaasa Fooraamii Gareen",
      yourTeam: "Garee Kee",
      selectTeamToReport: "Garee gabaasa uumuuf ykn ilaaluuf filadhu",
      noTeamsYet:
        "Gareen uumame hin jiru. Garee kee isa jalqabaa uumuu mallattoo armaan gadii cuqaasi.",
      // ── RESTORE 3: original richer Oromo wording (the sidebar hint). ──
      selectTeamPrompt: "Gabaasa jalqabuuf garee filadhu",
      selectTeamHelper:
        "'Fooraamii Hiriyyaa' sidebaar irratti cuqaasi, ergasii garee filadhu",
      // ── end RESTORE 3
      loadingTeams: "Gareewwan fe'aa jira...",
      noTeamsAssigned: "Garee kamiifuu hin ramadamne",
      noTeamsYetShort: "Gareen hin jiru",
      noDepartment: "Kutaan hin jiru",
      searchTeams: "Gareewwan barbaadi...",
      noTeamsFound: "Gareewwan hin argamne",
      teamName: "Maqaa Garee",
      teamDescription: "Ibsa Garee",
      teamLeader: "Hoogganaa Garee",

      // ─── Status Messages ──────────────────────────────────────
      saved: "✅ Gabaasni Olkaayameera!",
      savedSub: "Gabaasni Fooraamii Hiriyyaa milkiin xumurameera.",
      exportSuccess: "✅ Gabaasni milkiin ergame!",
      exportError: "❌ Gabaasa erguun hin dandeenye",
      generatingSummary: "Cuunfaa uumaa jira...",
      summaryGenerated: "✅ Cuunfaan AI uumamee hojiirra oolame!",
      summaryError: "❌ Cuunfaa AI uumuu hin dandeenye",
      fullReportGenerated: "✅ Gabaasni guutuu uumamee hojiirra oolame!",
      fullReportError: "❌ Gabaasa guutuu uumuu hin dandeenye",
      saving: "Olkaayaa jira...",
      saveSuccess: "✅ Gabaasni milkiin olkaayame!",
      updateSuccess: "✅ Gabaasni milkiin haaromfame!",
      saveError: "Gabaasa olkaa'uun hin dandeenye. Maaloo irra deebi'ii yaali.",
      selectDate: "Maaloo guyyaa filadhu",
      fillFields: "Maaloo dirree barbaachisoo hunda guuti",
      autoSaveReady: "Olkaa'uun ofumaa qophiidha",
      autoSaveError: "Olkaa'uun ofumaa hin milkoofne",

      // ─── AI Features ──────────────────────────────────────────
      generateSummary: "🤖 Gargaaraa Barreessaa AI",
      summarize: "📝 Gabaabi",
      fullReport: "📋 Gabaasa Guutuu",
      aiActions: "Gochaa AI:",
      aiSummaryLabel: "🤖 Yaada Walgahii AI",
      aiContentApplied: "Waan AI uume hojiirra oole",
      aiApplied: "✅ Yaanni AI ibsa irratti hojiirra oole!",
      noContent: "Waan hojiirra oolchu hin jiru",
      noContentGenerated: "Waan hin uumamne. Maaloo irra deebi'ii yaali.",

      // ─── Progress ─────────────────────────────────────────────
      complete: "xumurame",
      progressStart: "🚀 Gabaasa jalqabuuf gadii ilaali",
      progressMiddle: "💪 Fooyya'aa jirta! Itti fufi.",
      progressEnd: "🎯 Dhuma irra jirta! Gabaasa kee ilaali fi olkaayi.",

      // ─── Feed ──────────────────────────────────────────────────
      feed: "Soorata",

      // ─── Extension & Lock flow ────────────────────────────────
      reportLocked: "🔒 Gabaasni kun cufaa jira. Maaloo bulchaa quunnamaa.",
      extensionPending:
        "⏳ Gaaffiin yeroo dheereffannaa eeyyama bulchaa eegaa jira.",
      extensionRequested: "✅ Gaaffiin yeroo dheereffannaa bulchaaf ergameera",
      extensionRequestError:
        "Gaaffii yeroo dheereffannaa galchuun hin dandeenye",
      reportResumed: "✅ Gabaasni milkiin irra deebi'ee jalqabameera",
      resumeError: "Gabaasa irra deebi'ee jalqabuun hin dandeenye",
      reasonRequired: "Maaloo sababa galchi",

      // ─── TimeExpiredModal ─────────────────────────────────────
      timeExpiredTitle: "⏰ Yeroon Walgahii Xumurameera!",
      timeExpiredMessage:
        "Yeroon walgahii daqiiqaa 30 kee xumurameera. Adeemsi kee ofumaan olkaayameera, amma bulchtootaaf qofa mul'ata.",
      progressSavedMessage:
        "✅ Adeemsi kee ofumaan sirna keessatti olkaayameera.",
      adminOnlyMessage:
        "🔒 Adeemsa olkaa'ame kee kan ilaalan bulchtoonni qofa.",
      reasonLabel: "Sababa yeroo dheereffannaa:",
      requestExtension: "Yeroo Dheereffachuu Gaafadhu",
      submitRequest: "Gaaffii Yeroo Dheereffannaa Galchi",
      viewSavedProgress: "Adeemsa Olkaa'ame Ilaali",
      cancel: "Haqi",
      close: "Cufi",

      // ─── RequestExtensionModal ────────────────────────────────
      extensionRequestTitle: "Yeroo Dheereffachuu Gaafadhu",
      extensionRequestMessage:
        "Yeroon walgahii kee xumurameera. Sababa gadii kennuun bulchaa irraa yeroo dabalataa gaafadhu.",
      extensionInfo:
        "Gaaffiin kee bulchaaf eeyyamamuuf ni ergama. Murtiin yeroo kennamu siif himama.",
      durationLabel: "Yeroo dabalataa barbaachisu:",
      teamLabel: "Garee",
      submitting: "Galchaa jira...",
      submittedSuccess: "✅ Gaaffiin ergameera!",
      adminNotification:
        "🔔 Bulchaan gaaffii kee gamaaggamee murtii isaa siif ni beeksisa.",

      // ─── Signature Modal ──────────────────────────────────────
      signatureModalTitle: "Gabaasa Kee Mallatteessi",
      drawSignature: "Suuraa",
      typeSignature: "Barreessi",
      drawing: "Suuraa jira...",
      signed: "✓ Mallatteeffameera",
      signatureRecorded: "✓ Galmeeffameera",
      signatureVerified: "Mallattoon mirkanaa'eera",
      drawOrTypeSignature: "Mallattoo kee suuraa ykn barreessi",
      readOnly: "Dubbisuuf qofa",
      touchToSign: "Mallatteessuuf tuqi",
      clickToSign: "Mallatteessuuf cuqaasii harkisi",
      typeNameToSign: "Maqaa kee gadii barreessi",
      confirm: "Mirkaneessi",
      signatureVerificationNotice: "Mallattoon kee gabaasa kanaan walqabata.",

      // ─── Misc ──────────────────────────────────────────────────
      notAssigned: "Hin ramadamne",
      time: "Yeroo",
      signatureLocked: "🔒 Cufaa",
      signatureClickToSign: "Mallatteessuuf cuqaasi",
      historyTab: "Seenaa",
      addFirst: "Isa Jalqabaa Dabali",
      addAnother: "Kan Biraa Dabali",

      // ─── Admin: Extensions tab ────────────────────────────────
      extensionsTab: "Yeroo Dheereffannaa",
      extensionRequestsTitle: "Gaaffiiwwan Yeroo Dheereffannaa",
      extensionRequestStatusPending: "Eegaa jira",
      extensionRequestStatusApproved: "Eeyyamameera",
      extensionRequestStatusRejected: "Kufeera",
      extensionRequestedBy: "Kan gaafate",
      extensionTeam: "Garee",
      extensionRequestedMinutes: "Daqiiqaa gaafatame",
      extensionRequestedAt: "Yeroo gaafatame",
      extensionReason: "Sababa",
      extensionAdminNotes: "Yaada bulchaa",
      extensionApprove: "Eeyyami",
      extensionReject: "Kufi",
      extensionApproveSuccess: "✅ Yeroon dheereffannaa eeyyamameera",
      extensionRejectSuccess: "Yeroon dheereffannaa kufeera",
      extensionRejectError: "Yeroo dheereffannaa kufuu hin dandeenye",
      extensionNoRequests: "Gaaffiin calaltamuu kana keessatti hin jiru.",
      extensionFilterPending: "Eegaa jira",
      extensionFilterApproved: "Eeyyamameera",
      extensionFilterRejected: "Kufeera",
      extensionFilterAll: "Hunda",
      extensionLoading: "Gaaffiiwwan yeroo dheereffannaa fe'aa jira...",
      extensionRejectReasonLabel: "Sababa kufaatii (dirqama):",
      extensionRejectReasonRequired: "Sababni kufaatii barbaachisa.",
      extensionApproveNoteLabel: "Yaada eeyyamaa (filannoo):",
      extensionRequestedForMeeting: "Gabaasa",
      extensionPendingBadge: "eegaa jira",
      extensionRefresh: "Haaromsi",

      // ─── Admin: Lock / Unlock (B9) ────────────────────────────
      adminLock: "Cufi",
      adminUnlock: "Bani",
      adminLockReason: "Sababa cufuuf (dirqama):",
      adminLockConfirm:
        "Gabaasa kana cufuu barbaadda? Abbootiin isaa gulaaluu hin danda'u.",
      adminUnlockConfirm:
        "Gabaasa kana bantee gulaaluu irra deebi'ee hayyamuu barbaadda?",
      adminLockSuccess: "✅ Gabaasni cufameera",
      adminUnlockSuccess: "✅ Gabaasni banameera",
      adminLockedBadge: "Cufaa",
      adminUnlockedBadge: "Banaa",
      adminReasonRequired: "Sababni barbaachisa.",
    },
  },
};

export default forumReportTranslations;
