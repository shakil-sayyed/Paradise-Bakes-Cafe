const express = require('express');
const { body, validationResult } = require('express-validator');
const Menu = require('../models/Menu');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const menuItemValidation = [
  body('category').isIn(['cake', 'pizza', 'burger', 'sandwich', 'snacks', 'pastry']).withMessage('Invalid category'),
  body('variety').trim().notEmpty().withMessage('Variety is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('base_price').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('preparation_time').optional().isInt({ min: 0 }).withMessage('Preparation time must be a positive integer')
];

// @route   GET /api/menu
// @desc    Get all menu items (public)
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    is_vegan,
    is_gluten_free,
    is_featured,
    best_seller,
    sortBy = 'name',
    sortOrder = 'asc'
  } = req.query;

  const query = { availability: true };

  // Apply filters
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { variety: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }
  if (minPrice || maxPrice) {
    query.sale_price = {};
    if (minPrice) query.sale_price.$gte = parseFloat(minPrice);
    if (maxPrice) query.sale_price.$lte = parseFloat(maxPrice);
  }
  if (is_vegan !== undefined) query.is_vegan = is_vegan === 'true';
  if (is_gluten_free !== undefined) query.is_gluten_free = is_gluten_free === 'true';
  if (is_featured !== undefined) query.is_featured = is_featured === 'true';
  if (best_seller !== undefined) query.best_seller = best_seller === 'true';

  const options = {
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
  };

  const menuItems = await Menu.find(query).sort(options.sort);

  res.json({
    success: true,
    data: {
      menu: menuItems.map(item => item.getFormattedData()),
      count: menuItems.length
    }
  });
}));

// @route   GET /api/menu/category/:category
// @desc    Get menu items by category
// @access  Public
router.get('/category/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { includeUnavailable = false } = req.query;

  const menuItems = await Menu.getByCategory(category, includeUnavailable === 'true');

  res.json({
    success: true,
    data: {
      category,
      menu: menuItems.map(item => item.getFormattedData()),
      count: menuItems.length
    }
  });
}));

// @route   GET /api/menu/featured
// @desc    Get featured menu items
// @access  Public
router.get('/featured', asyncHandler(async (req, res) => {
  const menuItems = await Menu.getFeatured();

  res.json({
    success: true,
    data: {
      menu: menuItems.map(item => item.getFormattedData()),
      count: menuItems.length
    }
  });
}));

// @route   GET /api/menu/bestsellers
// @desc    Get best seller menu items
// @access  Public
router.get('/bestsellers', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const menuItems = await Menu.getBestSellers(parseInt(limit));

  res.json({
    success: true,
    data: {
      menu: menuItems.map(item => item.getFormattedData()),
      count: menuItems.length
    }
  });
}));

// @route   GET /api/menu/search
// @desc    Search menu items
// @access  Public
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    throw new AppError('Search query is required', 400);
  }

  const menuItems = await Menu.search(q);

  res.json({
    success: true,
    data: {
      query: q,
      menu: menuItems.map(item => item.getFormattedData()),
      count: menuItems.length
    }
  });
}));

// @route   GET /api/menu/price-range
// @desc    Get menu items by price range
// @access  Public
router.get('/price-range', asyncHandler(async (req, res) => {
  const { min, max } = req.query;

  if (!min || !max) {
    throw new AppError('Min and max price are required', 400);
  }

  const menuItems = await Menu.getByPriceRange(parseFloat(min), parseFloat(max));

  res.json({
    success: true,
    data: {
      minPrice: parseFloat(min),
      maxPrice: parseFloat(max),
      menu: menuItems.map(item => item.getFormattedData()),
      count: menuItems.length
    }
  });
}));

// @route   GET /api/menu/dietary
// @desc    Get menu items by dietary preferences
// @access  Public
router.get('/dietary', asyncHandler(async (req, res) => {
  const { vegan, glutenFree, spiceLevel } = req.query;

  const preferences = {};
  if (vegan !== undefined) preferences.vegan = vegan === 'true';
  if (glutenFree !== undefined) preferences.glutenFree = glutenFree === 'true';
  if (spiceLevel !== undefined) preferences.spiceLevel = parseInt(spiceLevel);

  const menuItems = await Menu.getByDietaryPreference(preferences);

  res.json({
    success: true,
    data: {
      preferences,
      menu: menuItems.map(item => item.getFormattedData()),
      count: menuItems.length
    }
  });
}));

// @route   GET /api/menu/:id
// @desc    Get specific menu item
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const menuItem = await Menu.findById(req.params.id);

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  res.json({
    success: true,
    data: {
      menu: menuItem.getFormattedData()
    }
  });
}));

// @route   POST /api/menu
// @desc    Create new menu item (admin only)
// @access  Private
router.post('/', menuItemValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const {
    category,
    variety,
    name,
    description,
    ingredients,
    allergens,
    base_price,
    sale_price,
    customization_options,
    preparation_time,
    availability,
    is_featured,
    is_vegan,
    is_gluten_free,
    is_spicy,
    spice_level,
    nutritional_info,
    image_urls,
    tags,
    serving_size,
    best_seller,
    seasonal,
    seasonal_start,
    seasonal_end,
    stock_quantity,
    min_order_quantity,
    max_order_quantity
  } = req.body;

  // Check if menu item already exists
  const existingItem = await Menu.findOne({ category, variety });
  if (existingItem) {
    throw new AppError('Menu item with this category and variety already exists', 400);
  }

  const menuItem = new Menu({
    category,
    variety,
    name,
    description,
    ingredients,
    allergens,
    base_price,
    sale_price,
    customization_options,
    preparation_time,
    availability,
    is_featured,
    is_vegan,
    is_gluten_free,
    is_spicy,
    spice_level,
    nutritional_info,
    image_urls,
    tags,
    serving_size,
    best_seller,
    seasonal,
    seasonal_start,
    seasonal_end,
    stock_quantity,
    min_order_quantity,
    max_order_quantity,
    created_by: req.user.username
  });

  await menuItem.save();

  res.status(201).json({
    success: true,
    message: 'Menu item created successfully',
    data: {
      menu: menuItem.getFormattedData()
    }
  });
}));

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private
router.put('/:id', menuItemValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const menuItem = await Menu.findById(req.params.id);

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  const {
    category,
    variety,
    name,
    description,
    ingredients,
    allergens,
    base_price,
    sale_price,
    customization_options,
    preparation_time,
    availability,
    is_featured,
    is_vegan,
    is_gluten_free,
    is_spicy,
    spice_level,
    nutritional_info,
    image_urls,
    tags,
    serving_size,
    best_seller,
    seasonal,
    seasonal_start,
    seasonal_end,
    stock_quantity,
    min_order_quantity,
    max_order_quantity
  } = req.body;

  // Check if category/variety combination already exists for different item
  if (category && variety) {
    const existingItem = await Menu.findOne({
      category,
      variety,
      _id: { $ne: req.params.id }
    });
    if (existingItem) {
      throw new AppError('Menu item with this category and variety already exists', 400);
    }
  }

  // Update fields
  if (category) menuItem.category = category;
  if (variety) menuItem.variety = variety;
  if (name) menuItem.name = name;
  if (description) menuItem.description = description;
  if (ingredients) menuItem.ingredients = ingredients;
  if (allergens) menuItem.allergens = allergens;
  if (base_price !== undefined) menuItem.base_price = base_price;
  if (sale_price !== undefined) menuItem.sale_price = sale_price;
  if (customization_options) menuItem.customization_options = customization_options;
  if (preparation_time !== undefined) menuItem.preparation_time = preparation_time;
  if (availability !== undefined) menuItem.availability = availability;
  if (is_featured !== undefined) menuItem.is_featured = is_featured;
  if (is_vegan !== undefined) menuItem.is_vegan = is_vegan;
  if (is_gluten_free !== undefined) menuItem.is_gluten_free = is_gluten_free;
  if (is_spicy !== undefined) menuItem.is_spicy = is_spicy;
  if (spice_level !== undefined) menuItem.spice_level = spice_level;
  if (nutritional_info) menuItem.nutritional_info = nutritional_info;
  if (image_urls) menuItem.image_urls = image_urls;
  if (tags) menuItem.tags = tags;
  if (serving_size) menuItem.serving_size = serving_size;
  if (best_seller !== undefined) menuItem.best_seller = best_seller;
  if (seasonal !== undefined) menuItem.seasonal = seasonal;
  if (seasonal_start) menuItem.seasonal_start = seasonal_start;
  if (seasonal_end) menuItem.seasonal_end = seasonal_end;
  if (stock_quantity !== undefined) menuItem.stock_quantity = stock_quantity;
  if (min_order_quantity !== undefined) menuItem.min_order_quantity = min_order_quantity;
  if (max_order_quantity !== undefined) menuItem.max_order_quantity = max_order_quantity;

  menuItem.updated_by = req.user.username;
  await menuItem.save();

  res.json({
    success: true,
    message: 'Menu item updated successfully',
    data: {
      menu: menuItem.getFormattedData()
    }
  });
}));

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const menuItem = await Menu.findById(req.params.id);

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  await Menu.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Menu item deleted successfully'
  });
}));

// @route   PUT /api/menu/:id/availability
// @desc    Toggle menu item availability
// @access  Private
router.put('/:id/availability', asyncHandler(async (req, res) => {
  const menuItem = await Menu.findById(req.params.id);

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  menuItem.availability = !menuItem.availability;
  menuItem.updated_by = req.user.username;
  await menuItem.save();

  res.json({
    success: true,
    message: `Menu item ${menuItem.availability ? 'activated' : 'deactivated'} successfully`,
    data: {
      menu: menuItem.getFormattedData()
    }
  });
}));

module.exports = router;
