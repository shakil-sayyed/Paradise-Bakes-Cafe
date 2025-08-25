const express = require('express');
const { body, validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const customerValidation = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('mobile_number').trim().notEmpty().withMessage('Mobile number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
];

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private
router.post('/', customerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const {
    name,
    mobile_number,
    email,
    address,
    preferences,
    notes
  } = req.body;

  // Check if customer already exists
  const existingCustomer = await Customer.findByMobile(mobile_number);
  if (existingCustomer) {
    throw new AppError('Customer with this mobile number already exists', 400);
  }

  const customer = new Customer({
    name,
    mobile_number,
    email,
    address,
    preferences,
    notes,
    created_by: req.user.username
  });

  await customer.save();

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: {
      customer: customer.getFormattedData()
    }
  });
}));

// @route   GET /api/customers
// @desc    Get customers with filters and pagination
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search,
    loyalty_tier,
    is_active,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile_number: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Other filters
  if (loyalty_tier) query.loyalty_tier = loyalty_tier;
  if (is_active !== undefined) query.is_active = is_active === 'true';

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
  };

  const customers = await Customer.find(query)
    .sort(options.sort)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const total = await Customer.countDocuments(query);

  res.json({
    success: true,
    data: {
      customers: customers.map(customer => customer.getFormattedData()),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    }
  });
}));

// @route   GET /api/customers/:id
// @desc    Get specific customer
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({
    success: true,
    data: {
      customer: customer.getFormattedData()
    }
  });
}));

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', customerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const {
    name,
    mobile_number,
    email,
    address,
    preferences,
    notes,
    marketing_consent,
    whatsapp_consent
  } = req.body;

  // Check if mobile number is already taken by another customer
  if (mobile_number && mobile_number !== customer.mobile_number) {
    const existingCustomer = await Customer.findByMobile(mobile_number);
    if (existingCustomer) {
      throw new AppError('Mobile number already exists', 400);
    }
  }

  // Update fields
  if (name) customer.name = name;
  if (mobile_number) customer.mobile_number = mobile_number;
  if (email !== undefined) customer.email = email;
  if (address) customer.address = address;
  if (preferences) customer.preferences = { ...customer.preferences, ...preferences };
  if (notes !== undefined) customer.notes = notes;
  if (marketing_consent !== undefined) customer.marketing_consent = marketing_consent;
  if (whatsapp_consent !== undefined) customer.whatsapp_consent = whatsapp_consent;

  customer.updated_by = req.user.username;
  await customer.save();

  res.json({
    success: true,
    message: 'Customer updated successfully',
    data: {
      customer: customer.getFormattedData()
    }
  });
}));

// @route   DELETE /api/customers/:id
// @desc    Delete customer (soft delete)
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Soft delete - mark as inactive
  customer.is_active = false;
  customer.updated_by = req.user.username;
  await customer.save();

  res.json({
    success: true,
    message: 'Customer deactivated successfully'
  });
}));

// @route   GET /api/customers/:id/orders
// @desc    Get customer order history
// @access  Private
router.get('/:id/orders', asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const {
    page = 1,
    limit = 20,
    sortBy = 'order_date',
    sortOrder = 'desc'
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
  };

  const orders = await Order.find({ customer_id: customer._id })
    .sort(options.sort)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const total = await Order.countDocuments({ customer_id: customer._id });

  res.json({
    success: true,
    data: {
      customer: customer.getFormattedData(),
      orders: orders.map(order => order.getFormattedData()),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    }
  });
}));

// @route   PUT /api/customers/:id/loyalty
// @desc    Update customer loyalty points
// @access  Private
router.put('/:id/loyalty', [
  body('action').isIn(['add', 'redeem']).withMessage('Action must be add or redeem'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const { action, points } = req.body;

  if (action === 'add') {
    customer.loyalty_points += points;
  } else if (action === 'redeem') {
    const redeemed = await customer.redeemPoints(points);
    if (!redeemed) {
      throw new AppError('Insufficient loyalty points', 400);
    }
  }

  customer.updated_by = req.user.username;
  await customer.save();

  res.json({
    success: true,
    message: `Loyalty points ${action === 'add' ? 'added' : 'redeemed'} successfully`,
    data: {
      customer: customer.getFormattedData()
    }
  });
}));

// @route   GET /api/customers/search/mobile/:mobile
// @desc    Search customer by mobile number
// @access  Private
router.get('/search/mobile/:mobile', asyncHandler(async (req, res) => {
  const { mobile } = req.params;

  const customer = await Customer.findByMobile(mobile);

  if (!customer) {
    return res.json({
      success: true,
      data: {
        customer: null,
        message: 'Customer not found'
      }
    });
  }

  res.json({
    success: true,
    data: {
      customer: customer.getFormattedData()
    }
  });
}));

// @route   GET /api/customers/dashboard/top
// @desc    Get top customers
// @access  Private
router.get('/dashboard/top', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const topCustomers = await Customer.getTopCustomers(parseInt(limit));

  res.json({
    success: true,
    data: {
      topCustomers
    }
  });
}));

// @route   GET /api/customers/dashboard/tier/:tier
// @desc    Get customers by loyalty tier
// @access  Private
router.get('/dashboard/tier/:tier', asyncHandler(async (req, res) => {
  const { tier } = req.params;

  const customers = await Customer.getCustomersByTier(tier);

  res.json({
    success: true,
    data: {
      customers: customers.map(customer => customer.getFormattedData()),
      tier,
      count: customers.length
    }
  });
}));

// @route   GET /api/customers/dashboard/inactive
// @desc    Get inactive customers
// @access  Private
router.get('/dashboard/inactive', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const inactiveCustomers = await Customer.getInactiveCustomers(parseInt(days));

  res.json({
    success: true,
    data: {
      customers: inactiveCustomers.map(customer => customer.getFormattedData()),
      days: parseInt(days),
      count: inactiveCustomers.length
    }
  });
}));

// @route   GET /api/customers/dashboard/summary
// @desc    Get customers dashboard summary
// @access  Private
router.get('/dashboard/summary', asyncHandler(async (req, res) => {
  // Total customers
  const totalCustomers = await Customer.countDocuments({ is_active: true });

  // Customers by loyalty tier
  const customersByTier = await Customer.aggregate([
    {
      $match: { is_active: true }
    },
    {
      $group: {
        _id: '$loyalty_tier',
        count: { $sum: 1 },
        totalSpent: { $sum: '$total_spent' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // New customers this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const newCustomersThisMonth = await Customer.countDocuments({
    created_at: { $gte: startOfMonth },
    is_active: true
  });

  // Average order value
  const avgOrderValue = await Customer.aggregate([
    {
      $match: { is_active: true, total_orders: { $gt: 0 } }
    },
    {
      $group: {
        _id: null,
        avgOrderValue: { $avg: '$average_order_value' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalCustomers,
      customersByTier,
      newCustomersThisMonth,
      avgOrderValue: avgOrderValue[0]?.avgOrderValue || 0
    }
  });
}));

module.exports = router;
