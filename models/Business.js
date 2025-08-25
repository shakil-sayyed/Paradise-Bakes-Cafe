const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  online_revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  cash_revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  total_revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  online_expense: {
    type: Number,
    default: 0,
    min: 0
  },
  cash_expense: {
    type: Number,
    default: 0,
    min: 0
  },
  total_expense: {
    type: Number,
    default: 0,
    min: 0
  },
  net_profit: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  created_by: {
    type: String,
    required: true
  },
  updated_by: {
    type: String
  },
  is_locked: {
    type: Boolean,
    default: false
  },
  payment_breakdown: {
    cash: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    upi: { type: Number, default: 0 },
    online: { type: Number, default: 0 }
  },
  expense_categories: [{
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true }
  }],
  special_events: [{
    event_name: { type: String, required: true },
    impact: { type: String, enum: ['positive', 'negative'], required: true },
    description: { type: String, trim: true }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
businessSchema.index({ date: -1 });
businessSchema.index({ created_by: 1 });
businessSchema.index({ total_revenue: -1 });
businessSchema.index({ net_profit: -1 });

// Pre-save middleware to calculate totals
businessSchema.pre('save', function(next) {
  // Calculate total revenue
  this.total_revenue = this.online_revenue + this.cash_revenue;
  
  // Calculate total expense
  this.total_expense = this.online_expense + this.cash_expense;
  
  // Calculate net profit
  this.net_profit = this.total_revenue - this.total_expense;
  
  next();
});

// Static method to get monthly summary
businessSchema.statics.getMonthlySummary = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total_revenue' },
        totalExpense: { $sum: '$total_expense' },
        totalProfit: { $sum: '$net_profit' },
        avgDailyRevenue: { $avg: '$total_revenue' },
        avgDailyExpense: { $avg: '$total_expense' },
        avgDailyProfit: { $avg: '$net_profit' },
        daysCounted: { $sum: 1 },
        bestDay: { $max: '$total_revenue' },
        worstDay: { $min: '$total_revenue' }
      }
    }
  ]);
};

// Static method to get yearly summary
businessSchema.statics.getYearlySummary = async function(year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $month: '$date' },
        totalRevenue: { $sum: '$total_revenue' },
        totalExpense: { $sum: '$total_expense' },
        totalProfit: { $sum: '$net_profit' },
        daysCounted: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Instance method to get formatted data
businessSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    date: this.date.toISOString().split('T')[0],
    online_revenue: this.online_revenue,
    cash_revenue: this.cash_revenue,
    total_revenue: this.total_revenue,
    online_expense: this.online_expense,
    cash_expense: this.cash_expense,
    total_expense: this.total_expense,
    net_profit: this.net_profit,
    notes: this.notes,
    created_by: this.created_by,
    updated_by: this.updated_by,
    is_locked: this.is_locked,
    payment_breakdown: this.payment_breakdown,
    expense_categories: this.expense_categories,
    special_events: this.special_events,
    created_at: this.createdAt,
    updated_at: this.updatedAt
  };
};

module.exports = mongoose.model('Business', businessSchema);
