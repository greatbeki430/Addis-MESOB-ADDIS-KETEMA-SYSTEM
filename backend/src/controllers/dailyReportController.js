const DailyReport = require("../models/DailyReport");

const createDailyReport = async (req, res) => {
  try {
    const report = await DailyReport.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDailyReports = async (req, res) => {
  try {
    const reports = await DailyReport.find({
      date: { $gte: req.query.start, $lte: req.query.end },
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDailyReport, getDailyReports };
