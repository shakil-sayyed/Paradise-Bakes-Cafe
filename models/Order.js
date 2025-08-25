const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['cake', 'pizza', 'burger', 'sandwich', 'snacks', 'pastry']
  },
  variety: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  customizations: {
    size: { type: String, enum: ['small', 'medium', 'large', 'custom'] },
    flavor: { type: String },
    toppings: [String],
    special_instructions: { type: String, trim: true },
    message: { type: String, trim: true },
    photo_url: { type: String }
  },
  preparation_time: {
    type: Number, // in minutes
    default: 0
  },
  is_ready: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customer_name: {
    type: String,
    required: true,
    trim: true
  },
  customer_mobile: {
    type: String,
    required: true,
    trim: true
  },
  order_date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  items: [orderItemSchema],
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  final_amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online'],
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  order_status: {
    type: String,
    enum: ['received', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'received'
  },
  delivery_type: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  delivery_address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    landmark: { type: String, trim: true }
  },
  delivery_charges: {
    type: Number,
    default: 0,
    min: 0
  },
  special_instructions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  estimated_time: {
    type: Number, // in minutes
    default: 30
  },
  actual_completion_time: {
    type: Date
  },
  delivery_time: {
    type: Date
  },
  created_by: {
    type: String,
    required: true
  },
  updated_by: {
    type: String
  },
  whatsapp_sent: {
    type: Boolean,
    default: false
  },
  whatsapp_message_id: {
    type: String
  },
  source: {
    type: String,
    enum: ['walk_in', 'phone', 'online', 'whatsapp'],
    default: 'walk_in'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ order_date: -1 });
orderSchema.index({ customer_id: 1 });
orderSchema.index({ order_status: 1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ created_by: 1 });
orderSchema.index({ 'items.category': 1 });

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  // Calculate total amount from items
  this.total_amount = this.items.reduce((sum, item) => sum + item.total_price, 0);
  
  // Calculate final amount
  this.final_amount = this.total_amount + this.tax_amount - this.discount_amount + this.delivery_charges;
  
  // Generate order ID if not exists
  if (!this.order_id) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.order_id = `PBC${year}${month}${day}${random}`;
  }
  
  next();
});

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = async function(status, limit = 50) {
  return this.find({ order_status: status })
    .sort({ order_date: -1 })
    .limit(limit)
    .populate('customer_id', 'name mobile_number');
};

// Static method to get daily orders summary
orderSchema.statics.getDailySummary = async function(date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        order_date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$final_amount' },
        avgOrderValue: { $avg: '$final_amount' },
        ordersByStatus: {
          $push: {
            status: '$order_status',
            amount: '$final_amount'
          }
        },
        ordersByPayment: {
          $push: {
            method: '$payment_method',
            amount: '$final_amount'
          }
        }
      }
    }
  ]);
};

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.order_status = newStatus;
  this.updated_by = updatedBy;
  
  if (newStatus === 'ready') {
    this.actual_completion_time = new Date();
  } else if (newStatus === 'delivered') {
    this.delivery_time = new Date();
  }
  
  return this.save();
};

// Instance method to get formatted data
orderSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    order_id: this.order_id,
    customer_id: this.customer_id,
    customer_name: this.customer_name,
    customer_mobile: this.customer_mobile,
    order_date: this.order_date,
    items: this.items,
    total_amount: this.total_amount,
    tax_amount: this.tax_amount,
    discount_amount: this.discount_amount,
    final_amount: this.final_amount,
    payment_method: this.payment_method,
    payment_status: this.payment_status,
    order_status: this.order_status,
    delivery_type: this.delivery_type,
    delivery_address: this.delivery_address,
    delivery_charges: this.delivery_charges,
    special_instructions: this.special_instructions,
    estimated_time: this.estimated_time,
    actual_completion_time: this.actual_completion_time,
    delivery_time: this.delivery_time,
    created_by: this.created_by,
    updated_by: this.updated_by,
    whatsapp_sent: this.whatsapp_sent,
    source: this.source,
    priority: this.priority,
    notes: this.notes,
    created_at: this.createdAt,
    updated_at: this.updatedAt
  };
};

module.exports = mongoose.model('Order', orderSchema);
