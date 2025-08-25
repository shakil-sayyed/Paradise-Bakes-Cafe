const mongoose = require('mongoose');

const customizationOptionSchema = new mongoose.Schema({
  option_name: {
    type: String,
    required: true,
    trim: true
  },
  additional_cost: {
    type: Number,
    required: true,
    min: 0
  },
  available: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
});

const nutritionalInfoSchema = new mongoose.Schema({
  calories: { type: Number, min: 0 },
  protein: { type: Number, min: 0 },
  carbohydrates: { type: Number, min: 0 },
  fat: { type: Number, min: 0 },
  fiber: { type: Number, min: 0 },
  sugar: { type: Number, min: 0 },
  sodium: { type: Number, min: 0 }
});

const menuSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['cake', 'pizza', 'burger', 'sandwich', 'snacks', 'pastry'],
    index: true
  },
  variety: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    trim: true
  }],
  base_price: {
    type: Number,
    required: true,
    min: 0
  },
  sale_price: {
    type: Number,
    min: 0
  },
  customization_options: [customizationOptionSchema],
  preparation_time: {
    type: Number, // in minutes
    default: 30,
    min: 0
  },
  availability: {
    type: Boolean,
    default: true,
    index: true
  },
  is_featured: {
    type: Boolean,
    default: false,
    index: true
  },
  is_vegan: {
    type: Boolean,
    default: false,
    index: true
  },
  is_gluten_free: {
    type: Boolean,
    default: false,
    index: true
  },
  is_spicy: {
    type: Boolean,
    default: false
  },
  spice_level: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  nutritional_info: nutritionalInfoSchema,
  image_urls: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  serving_size: {
    type: String,
    trim: true
  },
  best_seller: {
    type: Boolean,
    default: false,
    index: true
  },
  seasonal: {
    type: Boolean,
    default: false
  },
  seasonal_start: {
    type: Date
  },
  seasonal_end: {
    type: Date
  },
  stock_quantity: {
    type: Number,
    default: -1, // -1 means unlimited
    min: -1
  },
  min_order_quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  max_order_quantity: {
    type: Number,
    default: 10,
    min: 1
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
menuSchema.index({ category: 1, variety: 1 });
menuSchema.index({ availability: 1, is_featured: 1 });
menuSchema.index({ best_seller: 1 });
menuSchema.index({ tags: 1 });
menuSchema.index({ base_price: 1 });

// Pre-save middleware to set sale price if not provided
menuSchema.pre('save', function(next) {
  if (!this.sale_price) {
    this.sale_price = this.base_price;
  }
  
  // Check if item is in season
  if (this.seasonal && this.seasonal_start && this.seasonal_end) {
    const now = new Date();
    const isInSeason = now >= this.seasonal_start && now <= this.seasonal_end;
    this.availability = this.availability && isInSeason;
  }
  
  next();
});

// Static method to get menu by category
menuSchema.statics.getByCategory = async function(category, includeUnavailable = false) {
  const query = { category };
  if (!includeUnavailable) {
    query.availability = true;
  }
  
  return this.find(query)
    .sort({ is_featured: -1, name: 1 });
};

// Static method to get featured items
menuSchema.statics.getFeatured = async function() {
  return this.find({ 
    is_featured: true, 
    availability: true 
  }).sort({ category: 1, name: 1 });
};

// Static method to get best sellers
menuSchema.statics.getBestSellers = async function(limit = 10) {
  return this.find({ 
    best_seller: true, 
    availability: true 
  })
  .sort({ category: 1, name: 1 })
  .limit(limit);
};

// Static method to get items by dietary preference
menuSchema.statics.getByDietaryPreference = async function(preferences) {
  const query = { availability: true };
  
  if (preferences.vegan) {
    query.is_vegan = true;
  }
  
  if (preferences.glutenFree) {
    query.is_gluten_free = true;
  }
  
  if (preferences.spiceLevel) {
    query.spice_level = { $lte: preferences.spiceLevel };
  }
  
  return this.find(query).sort({ category: 1, name: 1 });
};

// Static method to search menu items
menuSchema.statics.search = async function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  
  return this.find({
    $or: [
      { name: regex },
      { description: regex },
      { variety: regex },
      { tags: regex }
    ],
    availability: true
  }).sort({ is_featured: -1, name: 1 });
};

// Static method to get items in price range
menuSchema.statics.getByPriceRange = async function(minPrice, maxPrice) {
  return this.find({
    sale_price: { $gte: minPrice, $lte: maxPrice },
    availability: true
  }).sort({ sale_price: 1 });
};

// Instance method to check if item is available
menuSchema.methods.isAvailable = function() {
  if (!this.availability) return false;
  
  if (this.stock_quantity === 0) return false;
  
  if (this.seasonal && this.seasonal_start && this.seasonal_end) {
    const now = new Date();
    return now >= this.seasonal_start && now <= this.seasonal_end;
  }
  
  return true;
};

// Instance method to calculate final price with customizations
menuSchema.methods.calculatePrice = function(customizations = []) {
  let finalPrice = this.sale_price;
  
  customizations.forEach(customization => {
    const option = this.customization_options.find(opt => 
      opt.option_name === customization && opt.available
    );
    if (option) {
      finalPrice += option.additional_cost;
    }
  });
  
  return finalPrice;
};

// Instance method to get formatted data
menuSchema.methods.getFormattedData = function() {
  return {
    id: this._id,
    category: this.category,
    variety: this.variety,
    name: this.name,
    description: this.description,
    ingredients: this.ingredients,
    allergens: this.allergens,
    base_price: this.base_price,
    sale_price: this.sale_price,
    customization_options: this.customization_options,
    preparation_time: this.preparation_time,
    availability: this.availability,
    is_featured: this.is_featured,
    is_vegan: this.is_vegan,
    is_gluten_free: this.is_gluten_free,
    is_spicy: this.is_spicy,
    spice_level: this.spice_level,
    nutritional_info: this.nutritional_info,
    image_urls: this.image_urls,
    tags: this.tags,
    serving_size: this.serving_size,
    best_seller: this.best_seller,
    seasonal: this.seasonal,
    seasonal_start: this.seasonal_start,
    seasonal_end: this.seasonal_end,
    stock_quantity: this.stock_quantity,
    min_order_quantity: this.min_order_quantity,
    max_order_quantity: this.max_order_quantity,
    created_by: this.created_by,
    updated_by: this.updated_by,
    created_at: this.createdAt,
    updated_at: this.updatedAt
  };
};

module.exports = mongoose.model('Menu', menuSchema);
