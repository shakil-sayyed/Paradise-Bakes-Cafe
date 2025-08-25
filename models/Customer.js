const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    landmark: { type: String, trim: true }
  },
  order_history: [{
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    order_date: { type: Date },
    total_amount: { type: Number },
    items_count: { type: Number }
  }],
  preferences: {
    favorite_categories: [String],
    favorite_items: [String],
    dietary_restrictions: [String],
    spice_preference: { type: String, enum: ['mild', 'medium', 'hot'] },
    delivery_preference: { type: String, enum: ['pickup', 'delivery'] },
    payment_preference: { type: String, enum: ['cash', 'card', 'upi', 'online'] }
  },
  loyalty_points: {
    type: Number,
    default: 0,
    min: 0
  },
  loyalty_tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  last_order_date: {
    type: Date
  },
  total_orders: {
    type: Number,
    default: 0,
    min: 0
  },
  total_spent: {
    type: Number,
    default: 0,
    min: 0
  },
  average_order_value: {
    type: Number,
    default: 0,
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_code: {
    type: String
  },
  verification_expires: {
    type: Date
  },
  marketing_consent: {
    type: Boolean,
    default: true
  },
  whatsapp_consent: {
    type: Boolean,
    default: true
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
customerSchema.index({ mobile_number: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ loyalty_tier: 1 });
customerSchema.index({ total_orders: -1 });
customerSchema.index({ total_spent: -1 });
customerSchema.index({ last_order_date: -1 });

// Pre-save middleware to generate customer ID and calculate loyalty tier
customerSchema.pre('save', function(next) {
  // Generate customer ID if not exists
  if (!this.customer_id) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.customer_id = `CUST${year}${month}${random}`;
  }
  
  // Calculate average order value
  if (this.total_orders > 0) {
    this.average_order_value = this.total_spent / this.total_orders;
  }
  
  // Update loyalty tier based on total spent
  if (this.total_spent >= 10000) {
    this.loyalty_tier = 'platinum';
  } else if (this.total_spent >= 5000) {
    this.loyalty_tier = 'gold';
  } else if (this.total_spent >= 2000) {
    this.loyalty_tier = 'silver';
  } else {
    this.loyalty_tier = 'bronze';
  }
  
  next();
});

// Static method to find customer by mobile number
customerSchema.statics.findByMobile = async function(mobileNumber) {
  return this.findOne({ mobile_number: mobileNumber });
};

// Static method to get top customers
customerSchema.statics.getTopCustomers = async function(limit = 10) {
  return this.find({ is_active: true })
    .sort({ total_spent: -1 })
    .limit(limit)
    .select('name mobile_number total_spent total_orders loyalty_tier');
};

// Static method to get customers by loyalty tier
customerSchema.statics.getCustomersByTier = async function(tier) {
  return this.find({ loyalty_tier: tier, is_active: true })
    .sort({ total_spent: -1 });
};

// Static method to get inactive customers
customerSchema.statics.getInactiveCustomers = async function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    last_order_date: { $lt: cutoffDate },
    is_active: true
  }).sort({ last_order_date: 1 });
};

// Instance method to add order to history
customerSchema.methods.addOrder = function(orderId, orderDate, totalAmount, itemsCount) {
  this.order_history.push({
    order_id: orderId,
    order_date: orderDate,
    total_amount: totalAmount,
    items_count: itemsCount
  });
  
  this.last_order_date = orderDate;
  this.total_orders += 1;
  this.total_spent += totalAmount;
  
  // Add loyalty points (1 point per 10 rupees spent)
  const pointsEarned = Math.floor(totalAmount / 10);
  this.loyalty_points += pointsEarned;
  
  return this.save();
};

// Instance method to update preferences
customerSchema.methods.updatePreferences = function(newPreferences) {
  this.preferences = { ...this.preferences, ...newPreferences };
  return this.save();
};

// Instance method to redeem loyalty points
customerSchema.methods.redeemPoints = function(pointsToRedeem) {
  if (this.loyalty_points >= pointsToRedeem) {
    this.loyalty_points -= pointsToRedeem;
    return this.save().then(() => true);
  }
  return Promise.resolve(false);
};

// Instance method to get formatted data
customerSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    customer_id: this.customer_id,
    name: this.name,
    mobile_number: this.mobile_number,
    email: this.email,
    address: this.address,
    order_history: this.order_history,
    preferences: this.preferences,
    loyalty_points: this.loyalty_points,
    loyalty_tier: this.loyalty_tier,
    last_order_date: this.last_order_date,
    total_orders: this.total_orders,
    total_spent: this.total_spent,
    average_order_value: this.average_order_value,
    is_active: this.is_active,
    is_verified: this.is_verified,
    marketing_consent: this.marketing_consent,
    whatsapp_consent: this.whatsapp_consent,
    notes: this.notes,
    created_by: this.created_by,
    updated_by: this.updated_by,
    created_at: this.createdAt,
    updated_at: this.updatedAt
  };
};

module.exports = mongoose.model('Customer', customerSchema);
