const express = require('express');
const { body, validationResult } = require('express-validator');
const Business = require('../models/Business');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const businessEntryValidation = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('online_revenue').isFloat({ min: 0 }).withMessage('Online revenue must be a positive number'),
  body('cash_revenue').isFloat({ min: 0 }).withMessage('Cash revenue must be a positive number'),
  body('online_expense').isFloat({ min: 0 }).withMessage('Online expense must be a positive number'),
  body('cash_expense').isFloat({ min: 0 }).withMessage('Cash expense must be a positive number'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
];

// @route   POST /api/business
// @desc    Create daily business entry
// @access  Private
router.post('/', businessEntryValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const {
    date,
    online_revenue,
    cash_revenue,
    online_expense,
    cash_expense,
    notes,
    payment_breakdown,
    expense_categories,
    special_events
  } = req.body;

  // Check if entry already exists for this date
  const existingEntry = await Business.findOne({ date: new Date(date) });
  if (existingEntry) {
    throw new AppError('Business entry already exists for this date', 400);
  }

  const businessEntry = new Business({
    date: new Date(date),
    online_revenue,
    cash_revenue,
    online_expense,
    cash_expense,
    notes,
    payment_breakdown,
    expense_categories,
    special_events,
    created_by: req.user.username
  });

  await businessEntry.save();

  res.status(201).json({
    success: true,
    message: 'Business entry created successfully',
    data: {
      business: businessEntry.getFormattedData()
    }
  });
}));

// @route   GET /api/business
// @desc    Get business entries with pagination and filters
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 30,
    startDate,
    endDate,
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  // Date range filter
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
  };

  const businessEntries = await Business.find(query)
    .sort(options.sort)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const total = await Business.countDocuments(query);

  res.json({
    success: true,
    data: {
      business: businessEntries.map(entry => entry.getFormattedData()),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    }
  });
}));

// @route   GET /api/business/:id
// @desc    Get specific business entry
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const businessEntry = await Business.findById(req.params.id);
  
  if (!businessEntry) {
    throw new AppError('Business entry not found', 404);
  }

  res.json({
    success: true,
    data: {
      business: businessEntry.getFormattedData()
    }
  });
}));

// @route   PUT /api/business/:id
// @desc    Update business entry
// @access  Private
router.put('/:id', businessEntryValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const businessEntry = await Business.findById(req.params.id);
  
  if (!businessEntry) {
    throw new AppError('Business entry not found', 404);
  }

  // Check if entry is locked
  if (businessEntry.is_locked) {
    throw new AppError('Cannot update locked business entry', 400);
  }

  const {
    online_revenue,
    cash_revenue,
    online_expense,
    cash_expense,
    notes,
    payment_breakdown,
    expense_categories,
    special_events
  } = req.body;

  // Update fields
  if (online_revenue !== undefined) businessEntry.online_revenue = online_revenue;
  if (cash_revenue !== undefined) businessEntry.cash_revenue = cash_revenue;
  if (online_expense !== undefined) businessEntry.online_expense = online_expense;
  if (cash_expense !== undefined) businessEntry.cash_expense = cash_expense;
  if (notes !== undefined) businessEntry.notes = notes;
  if (payment_breakdown !== undefined) businessEntry.payment_breakdown = payment_breakdown;
  if (expense_categories !== undefined) businessEntry.expense_categories = expense_categories;
  if (special_events !== undefined) businessEntry.special_events = special_events;

  businessEntry.updated_by = req.user.username;
  await businessEntry.save();

  res.json({
    success: true,
    message: 'Business entry updated successfully',
    data: {
      business: businessEntry.getFormattedData()
    }
  });
}));

// @route   DELETE /api/business/:id
// @desc    Delete business entry
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const businessEntry = await Business.findById(req.params.id);
  
  if (!businessEntry) {
    throw new AppError('Business entry not found', 404);
  }

  // Check if entry is locked
  if (businessEntry.is_locked) {
    throw new AppError('Cannot delete locked business entry', 400);
  }

  await Business.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Business entry deleted successfully'
  });
}));

// @route   GET /api/business/summary/monthly
// @desc    Get monthly business summary
// @access  Private
router.get('/summary/monthly', asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  
  if (!year || !month) {
    throw new AppError('Year and month are required', 400);
  }

  const summary = await Business.getMonthlySummary(parseInt(year), parseInt(month));

  res.json({
    success: true,
    data: {
      summary: summary[0] || {
        totalRevenue: 0,
        totalExpense: 0,
        totalProfit: 0,
        avgDailyRevenue: 0,
        avgDailyExpense: 0,
        avgDailyProfit: 0,
        daysCounted: 0,
        bestDay: 0,
        worstDay: 0
      },
      year: parseInt(year),
      month: parseInt(month)
    }
  });
}));

// @route   GET /api/business/summary/yearly
// @desc    Get yearly business summary
// @access  Private
router.get('/summary/yearly', asyncHandler(async (req, res) => {
  const { year } = req.query;
  
  if (!year) {
    throw new AppError('Year is required', 400);
  }

  const summary = await Business.getYearlySummary(parseInt(year));

  res.json({
    success: true,
    data: {
      summary,
      year: parseInt(year)
    }
  });
}));

// @route   GET /api/business/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/dashboard/overview', asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Today's data
  const todayEntry = await Business.findOne({ date: today });
  
  // This month's summary
  const monthSummary = await Business.getMonthlySummary(today.getFullYear(), today.getMonth() + 1);
  
  // This year's summary
  const yearSummary = await Business.getYearlySummary(today.getFullYear());

  // Last 7 days data
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const entry = await Business.findOne({ date });
    last7Days.push({
      date: date.toISOString().split('T')[0],
      revenue: entry ? entry.total_revenue : 0,
      expense: entry ? entry.total_expense : 0,
      profit: entry ? entry.net_profit : 0
    });
  }

  res.json({
    success: true,
    data: {
      today: todayEntry ? todayEntry.getFormattedData() : null,
      monthSummary: monthSummary[0] || {
        totalRevenue: 0,
        totalExpense: 0,
        totalProfit: 0,
        avgDailyRevenue: 0,
        avgDailyExpense: 0,
        avgDailyProfit: 0,
        daysCounted: 0
      },
      yearSummary: yearSummary,
      last7Days
    }
  });
}));

// @route   PUT /api/business/:id/lock
// @desc    Lock/unlock business entry
// @access  Private
router.put('/:id/lock', asyncHandler(async (req, res) => {
  const businessEntry = await Business.findById(req.params.id);
  
  if (!businessEntry) {
    throw new AppError('Business entry not found', 404);
  }

  businessEntry.is_locked = !businessEntry.is_locked;
  businessEntry.updated_by = req.user.username;
  await businessEntry.save();

  res.json({
    success: true,
    message: `Business entry ${businessEntry.is_locked ? 'locked' : 'unlocked'} successfully`,
    data: {
      business: businessEntry.getFormattedData()
    }
  });
}));

module.exports = router;
