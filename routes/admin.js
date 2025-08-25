const express = require('express');
const Business = require('../models/Business');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Menu = require('../models/Menu');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private (Admin only)
router.get('/dashboard', asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Business metrics
  const todayBusiness = await Business.findOne({ date: today });
  const monthBusiness = await Business.getMonthlySummary(today.getFullYear(), today.getMonth() + 1);
  const yearBusiness = await Business.getYearlySummary(today.getFullYear());

  // Order metrics
  const todayOrders = await Order.getDailySummary(today);
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ order_status: { $in: ['received', 'confirmed', 'preparing'] } });

  // Customer metrics
  const totalCustomers = await Customer.countDocuments({ is_active: true });
  const newCustomersThisMonth = await Customer.countDocuments({
    created_at: { $gte: startOfMonth },
    is_active: true
  });

  // Menu metrics
  const totalMenuItems = await Menu.countDocuments();
  const availableMenuItems = await Menu.countDocuments({ availability: true });
  const featuredItems = await Menu.countDocuments({ is_featured: true });

  // User metrics
  const totalUsers = await User.countDocuments({ is_active: true });
  const activeUsers = await User.countDocuments({ is_active: true });

  // Recent activity
  const recentOrders = await Order.find({})
    .populate('customer_id', 'name mobile_number')
    .sort({ order_date: -1 })
    .limit(5);

  const recentCustomers = await Customer.find({ is_active: true })
    .sort({ created_at: -1 })
    .limit(5);

  // Sales trends (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const businessEntry = await Business.findOne({ date });
    const orderSummary = await Order.getDailySummary(date);
    
    last7Days.push({
      date: date.toISOString().split('T')[0],
      revenue: businessEntry ? businessEntry.total_revenue : 0,
      orders: orderSummary[0] ? orderSummary[0].totalOrders : 0,
      customers: orderSummary[0] ? orderSummary[0].uniqueCustomers || 0 : 0
    });
  }

  res.json({
    success: true,
    data: {
      business: {
        today: todayBusiness ? todayBusiness.getFormattedData() : null,
        month: monthBusiness[0] || {
          totalRevenue: 0,
          totalExpense: 0,
          totalProfit: 0,
          avgDailyRevenue: 0,
          avgDailyExpense: 0,
          avgDailyProfit: 0,
          daysCounted: 0
        },
        year: yearBusiness
      },
      orders: {
        today: todayOrders[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0
        },
        total: totalOrders,
        pending: pendingOrders
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth
      },
      menu: {
        total: totalMenuItems,
        available: availableMenuItems,
        featured: featuredItems
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      recentActivity: {
        orders: recentOrders.map(order => order.getFormattedData()),
        customers: recentCustomers.map(customer => customer.getFormattedData())
      },
      trends: {
        last7Days
      }
    }
  });
}));

// @route   GET /api/admin/analytics/sales
// @desc    Get sales analytics
// @access  Private (Admin only)
router.get('/analytics/sales', asyncHandler(async (req, res) => {
  const { period = 'month', year, month } = req.query;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

  let salesData = [];

  if (period === 'month') {
    // Monthly data for the year
    for (let m = 1; m <= 12; m++) {
      const monthData = await Business.getMonthlySummary(currentYear, m);
      salesData.push({
        month: m,
        monthName: new Date(currentYear, m - 1).toLocaleString('default', { month: 'long' }),
        ...monthData[0]
      });
    }
  } else if (period === 'week') {
    // Weekly data for the current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);
    
    for (let week = 1; week <= 5; week++) {
      const weekStart = new Date(startOfMonth);
      weekStart.setDate(weekStart.getDate() + (week - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekData = await Business.aggregate([
        {
          $match: {
            date: { $gte: weekStart, $lte: weekEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total_revenue' },
            totalExpense: { $sum: '$total_expense' },
            totalProfit: { $sum: '$net_profit' },
            daysCounted: { $sum: 1 }
          }
        }
      ]);
      
      salesData.push({
        week,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        ...weekData[0]
      });
    }
  }

  res.json({
    success: true,
    data: {
      period,
      year: currentYear,
      month: currentMonth,
      salesData
    }
  });
}));

// @route   GET /api/admin/analytics/orders
// @desc    Get order analytics
// @access  Private (Admin only)
router.get('/analytics/orders', asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const today = new Date();

  let orderData = [];

  if (period === 'month') {
    // Orders by status for current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const ordersByStatus = await Order.aggregate([
      {
        $match: {
          order_date: { $gte: startOfMonth }
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

    // Orders by payment method
    const ordersByPayment = await Order.aggregate([
      {
        $match: {
          order_date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$payment_method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$final_amount' }
        }
      }
    ]);

    // Orders by category
    const ordersByCategory = await Order.aggregate([
      {
        $match: {
          order_date: { $gte: startOfMonth }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.category',
          count: { $sum: '$items.quantity' },
          totalAmount: { $sum: '$items.total_price' }
        }
      }
    ]);

    orderData = {
      byStatus: ordersByStatus,
      byPayment: ordersByPayment,
      byCategory: ordersByCategory
    };
  }

  res.json({
    success: true,
    data: {
      period,
      orderData
    }
  });
}));

// @route   GET /api/admin/analytics/customers
// @desc    Get customer analytics
// @access  Private (Admin only)
router.get('/analytics/customers', asyncHandler(async (req, res) => {
  // Customer growth over time
  const customerGrowth = await Customer.aggregate([
    {
      $match: { is_active: true }
    },
    {
      $group: {
        _id: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Customers by loyalty tier
  const customersByTier = await Customer.aggregate([
    {
      $match: { is_active: true }
    },
    {
      $group: {
        _id: '$loyalty_tier',
        count: { $sum: 1 },
        totalSpent: { $sum: '$total_spent' },
        avgOrderValue: { $avg: '$average_order_value' }
      }
    }
  ]);

  // Top customers
  const topCustomers = await Customer.getTopCustomers(10);

  // Customer retention
  const retentionData = await Customer.aggregate([
    {
      $match: { is_active: true, total_orders: { $gt: 1 } }
    },
    {
      $group: {
        _id: null,
        avgOrdersPerCustomer: { $avg: '$total_orders' },
        avgSpentPerCustomer: { $avg: '$total_spent' },
        avgLoyaltyPoints: { $avg: '$loyalty_points' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      growth: customerGrowth,
      byTier: customersByTier,
      topCustomers,
      retention: retentionData[0] || {
        avgOrdersPerCustomer: 0,
        avgSpentPerCustomer: 0,
        avgLoyaltyPoints: 0
      }
    }
  });
}));

// @route   GET /api/admin/analytics/menu
// @desc    Get menu analytics
// @access  Private (Admin only)
router.get('/analytics/menu', asyncHandler(async (req, res) => {
  // Menu items by category
  const menuByCategory = await Menu.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        available: { $sum: { $cond: ['$availability', 1, 0] } },
        featured: { $sum: { $cond: ['$is_featured', 1, 0] } },
        avgPrice: { $avg: '$sale_price' }
      }
    }
  ]);

  // Dietary preferences
  const dietaryStats = await Menu.aggregate([
    {
      $group: {
        _id: null,
        vegan: { $sum: { $cond: ['$is_vegan', 1, 0] } },
        glutenFree: { $sum: { $cond: ['$is_gluten_free', 1, 0] } },
        spicy: { $sum: { $cond: ['$is_spicy', 1, 0] } }
      }
    }
  ]);

  // Price ranges
  const priceRanges = await Menu.aggregate([
    {
      $group: {
        _id: null,
        minPrice: { $min: '$sale_price' },
        maxPrice: { $max: '$sale_price' },
        avgPrice: { $avg: '$sale_price' }
      }
    }
  ]);

  // Best sellers
  const bestSellers = await Menu.find({ best_seller: true, availability: true })
    .sort({ sale_price: 1 });

  res.json({
    success: true,
    data: {
      byCategory: menuByCategory,
      dietary: dietaryStats[0] || { vegan: 0, glutenFree: 0, spicy: 0 },
      pricing: priceRanges[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 },
      bestSellers: bestSellers.map(item => item.getFormattedData())
    }
  });
}));

// @route   GET /api/admin/reports/export
// @desc    Export data reports
// @access  Private (Admin only)
router.get('/reports/export', asyncHandler(async (req, res) => {
  const { type, startDate, endDate, format = 'json' } = req.query;

  if (!type || !startDate || !endDate) {
    throw new AppError('Type, startDate, and endDate are required', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  let data = {};

  switch (type) {
    case 'business':
      data = await Business.find({
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });
      break;
    
    case 'orders':
      data = await Order.find({
        order_date: { $gte: start, $lte: end }
      }).populate('customer_id', 'name mobile_number')
        .sort({ order_date: 1 });
      break;
    
    case 'customers':
      data = await Customer.find({
        created_at: { $gte: start, $lte: end }
      }).sort({ created_at: 1 });
      break;
    
    default:
      throw new AppError('Invalid report type', 400);
  }

  if (format === 'csv') {
    // TODO: Implement CSV export
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report_${startDate}_${endDate}.csv`);
    res.send('CSV export not implemented yet');
  } else {
    res.json({
      success: true,
      data: {
        type,
        startDate,
        endDate,
        count: data.length,
        records: data
      }
    });
  }
}));

// @route   GET /api/admin/system/status
// @desc    Get system status
// @access  Private (Admin only)
router.get('/system/status', asyncHandler(async (req, res) => {
  const systemInfo = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  // Database connection status
  const dbStatus = {
    connected: mongoose.connection.readyState === 1,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME
  };

  res.json({
    success: true,
    data: {
      system: systemInfo,
      database: dbStatus
    }
  });
}));

module.exports = router;
