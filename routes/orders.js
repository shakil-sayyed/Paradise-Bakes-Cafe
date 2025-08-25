const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Menu = require('../models/Menu');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const orderValidation = [
  body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
  body('customer_mobile').trim().notEmpty().withMessage('Customer mobile is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.category').isIn(['cake', 'pizza', 'burger', 'sandwich', 'snacks', 'pastry']).withMessage('Invalid category'),
  body('items.*.variety').notEmpty().withMessage('Item variety is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('payment_method').isIn(['cash', 'card', 'upi', 'online']).withMessage('Invalid payment method'),
  body('delivery_type').isIn(['pickup', 'delivery']).withMessage('Invalid delivery type')
];

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', orderValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const {
    customer_name,
    customer_mobile,
    customer_email,
    customer_address,
    items,
    payment_method,
    delivery_type,
    delivery_address,
    delivery_charges = 0,
    special_instructions,
    estimated_time = 30,
    source = 'walk_in',
    priority = 'normal',
    notes
  } = req.body;

  // Find or create customer
  let customer = await Customer.findByMobile(customer_mobile);
  if (!customer) {
    customer = new Customer({
      name: customer_name,
      mobile_number: customer_mobile,
      email: customer_email,
      address: customer_address,
      created_by: req.user.username
    });
    await customer.save();
  }

  // Process order items and calculate totals
  const processedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const menuItem = await Menu.findOne({
      category: item.category,
      variety: item.variety,
      availability: true
    });

    if (!menuItem) {
      throw new AppError(`Item not found or unavailable: ${item.category} - ${item.variety}`, 400);
    }

    const itemTotal = menuItem.sale_price * item.quantity;
    totalAmount += itemTotal;

    processedItems.push({
      category: item.category,
      variety: item.variety,
      name: menuItem.name,
      quantity: item.quantity,
      unit_price: menuItem.sale_price,
      total_price: itemTotal,
      customizations: item.customizations || {},
      preparation_time: menuItem.preparation_time
    });
  }

  // Calculate tax (assuming 5% GST)
  const taxAmount = totalAmount * 0.05;
  const finalAmount = totalAmount + taxAmount + delivery_charges;

  // Create order
  const order = new Order({
    customer_id: customer._id,
    customer_name,
    customer_mobile,
    items: processedItems,
    total_amount: totalAmount,
    tax_amount: taxAmount,
    final_amount: finalAmount,
    payment_method,
    delivery_type,
    delivery_address,
    delivery_charges,
    special_instructions,
    estimated_time,
    source,
    priority,
    notes,
    created_by: req.user.username
  });

  await order.save();

  // Update customer with order history
  await customer.addOrder(
    order._id,
    order.order_date,
    order.final_amount,
    order.items.length
  );

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      order: order.getFormattedData(),
      customer: customer.getFormattedData()
    }
  });
}));

// @route   GET /api/orders
// @desc    Get orders with filters and pagination
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    payment_method,
    delivery_type,
    startDate,
    endDate,
    customer_mobile,
    sortBy = 'order_date',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  // Apply filters
  if (status) query.order_status = status;
  if (payment_method) query.payment_method = payment_method;
  if (delivery_type) query.delivery_type = delivery_type;
  if (customer_mobile) query.customer_mobile = customer_mobile;

  // Date range filter
  if (startDate || endDate) {
    query.order_date = {};
    if (startDate) query.order_date.$gte = new Date(startDate);
    if (endDate) query.order_date.$lte = new Date(endDate);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
  };

  const orders = await Order.find(query)
    .populate('customer_id', 'name mobile_number loyalty_tier')
    .sort(options.sort)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    data: {
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

// @route   GET /api/orders/:id
// @desc    Get specific order
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer_id', 'name mobile_number email address loyalty_tier');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({
    success: true,
    data: {
      order: order.getFormattedData()
    }
  });
}));

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', [
  body('status').isIn(['received', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    .withMessage('Invalid order status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  await order.updateStatus(status, req.user.username);

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: {
      order: order.getFormattedData()
    }
  });
}));

// @route   PUT /api/orders/:id
// @desc    Update order details
// @access  Private
router.put('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Only allow updates for certain statuses
  if (['delivered', 'cancelled'].includes(order.order_status)) {
    throw new AppError('Cannot update completed or cancelled orders', 400);
  }

  const {
    special_instructions,
    estimated_time,
    priority,
    notes,
    delivery_address,
    delivery_charges
  } = req.body;

  // Update allowed fields
  if (special_instructions !== undefined) order.special_instructions = special_instructions;
  if (estimated_time !== undefined) order.estimated_time = estimated_time;
  if (priority !== undefined) order.priority = priority;
  if (notes !== undefined) order.notes = notes;
  if (delivery_address !== undefined) order.delivery_address = delivery_address;
  if (delivery_charges !== undefined) order.delivery_charges = delivery_charges;

  order.updated_by = req.user.username;
  await order.save();

  res.json({
    success: true,
    message: 'Order updated successfully',
    data: {
      order: order.getFormattedData()
    }
  });
}));

// @route   GET /api/orders/status/:status
// @desc    Get orders by status
// @access  Private
router.get('/status/:status', asyncHandler(async (req, res) => {
  const { status } = req.params;
  const { limit = 50 } = req.query;

  const orders = await Order.getOrdersByStatus(status, parseInt(limit));

  res.json({
    success: true,
    data: {
      orders: orders.map(order => order.getFormattedData()),
      status,
      count: orders.length
    }
  });
}));

// @route   GET /api/orders/dashboard/summary
// @desc    Get orders dashboard summary
// @access  Private
router.get('/dashboard/summary', asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Today's orders summary
  const todaySummary = await Order.getDailySummary(today);

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    {
      $match: {
        order_date: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: '$order_status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$final_amount' }
      }
    }
  ]);

  // Recent orders
  const recentOrders = await Order.find({})
    .populate('customer_id', 'name mobile_number')
    .sort({ order_date: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      todaySummary: todaySummary[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        ordersByStatus: [],
        ordersByPayment: []
      },
      ordersByStatus,
      recentOrders: recentOrders.map(order => order.getFormattedData())
    }
  });
}));

// @route   POST /api/orders/:id/whatsapp
// @desc    Send WhatsApp notification for order
// @access  Private
router.post('/:id/whatsapp', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer_id', 'name mobile_number');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // TODO: Implement WhatsApp API integration
  // For now, just mark as sent
  order.whatsapp_sent = true;
  order.whatsapp_message_id = `msg_${Date.now()}`;
  await order.save();

  res.json({
    success: true,
    message: 'WhatsApp notification sent successfully',
    data: {
      order_id: order.order_id,
      whatsapp_sent: order.whatsapp_sent,
      whatsapp_message_id: order.whatsapp_message_id
    }
  });
}));

module.exports = router;
