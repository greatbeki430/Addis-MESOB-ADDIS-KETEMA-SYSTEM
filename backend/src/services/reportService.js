// Future PDF generation service (can call jsPDF logic or use pdfkit)
const generateReportSummary = (meetings, evaluations) => {
  return {
    totalMeetings: meetings.length,
    averageScore:
      evaluations.length > 0
        ? evaluations.reduce((sum, ev) => sum + (ev.scores[0]?.total || 0), 0) /
          evaluations.length
        : 0,
    lastMeetingDate: meetings.length > 0 ? meetings[0].date : null,
  };
};

module.exports = { generateReportSummary };
