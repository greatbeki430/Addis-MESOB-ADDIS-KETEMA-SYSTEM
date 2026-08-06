// adminDataController.js
const DailyReport = require("../models/DailyReport");
const Evaluation = require("../models/Evaluation");
const Meeting = require("../models/Meeting");
const User = require("../models/User");

exports.getData = async (req, res) => {
  try {
    const { dataType } = req.params;
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    let model;
    let query = {};
    let populateFields = [];

    switch(dataType) {
      case 'daily-reports':
        model = DailyReport;
        populateFields = ['createdBy', 'team'];
        if (status) query.status = status;
        break;
      case 'evaluations':
        model = Evaluation;
        populateFields = ['employeeId', 'evaluatorId'];
        if (status) query.status = status;
        break;
      case 'forum-reports':
        model = Meeting;
        populateFields = ['createdBy', 'teamId'];
        if (status) query.status = status;
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    if (search) {
      query.$or = [
        { summary: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await model.countDocuments(query);
    const data = await model.find(query)
      .populate(populateFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).json({ error: 'Failed to fetch admin data' });
  }
};

exports.bulkAction = async (req, res) => {
  try {
    const { dataType } = req.params;
    const { action, ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    let model;
    switch(dataType) {
      case 'daily-reports':
        model = DailyReport;
        break;
      case 'evaluations':
        model = Evaluation;
        break;
      case 'forum-reports':
        model = Meeting;
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    let result;
    switch(action) {
      case 'delete':
        result = await model.deleteMany({ _id: { $in: ids } });
        break;
      case 'archive':
        result = await model.updateMany(
          { _id: { $in: ids } },
          { status: 'archived' }
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json({
      message: `${action} completed successfully`,
      result
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
};

exports.exportData = async (req, res) => {
  try {
    const { dataType } = req.params;
    const { ids } = req.query;

    let model;
    let data;
    const query = ids ? { _id: { $in: ids.split(',') } } : {};

    switch(dataType) {
      case 'daily-reports':
        model = DailyReport;
        data = await model.find(query).populate('createdBy', 'firstName lastName email');
        data = data.map(item => ({
          'Date': item.date?.toLocaleDateString() || 'N/A',
          'Employee': item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : 'N/A',
          'Summary': item.summary || 'N/A',
          'Status': item.status || 'N/A'
        }));
        break;
      default:
        return res.status(400).json({ error: 'Export not supported for this data type' });
    }

    res.status(200).json({ data });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { dataType, id } = req.params;

    let model;
    switch(dataType) {
      case 'daily-reports':
        model = DailyReport;
        break;
      case 'evaluations':
        model = Evaluation;
        break;
      case 'forum-reports':
        model = Meeting;
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    const result = await model.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};
