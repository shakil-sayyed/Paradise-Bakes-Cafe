const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'manager', 'staff']).withMessage('Invalid role')
];

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { username, password } = req.body;

  // Find user by username
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw new AppError('Account is temporarily locked. Please try again later.', 423);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incLoginAttempts();
    throw new AppError('Invalid credentials', 401);
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    }
  });
}));

// @route   POST /api/auth/register
// @desc    Register new user (admin only)
// @access  Private
router.post('/register', authMiddleware, registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  const { username, password, name, email, role } = req.body;

  // Check if username already exists
  const existingUser = await User.findOne({ username: username.toLowerCase() });
  if (existingUser) {
    throw new AppError('Username already exists', 400);
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new AppError('Email already exists', 400);
  }

  // Create new user
  const user = new User({
    username: username.toLowerCase(),
    password,
    name,
    email: email.toLowerCase(),
    role,
    created_by: req.user.username
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { name, email } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (email) {
    // Check if email is already taken by another user
    const existingEmail = await User.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: req.user._id } 
    });
    if (existingEmail) {
      throw new AppError('Email already exists', 400);
    }
    user.email = email.toLowerCase();
  }

  user.updated_by = req.user.username;
  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
}));

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  user.updated_by = req.user.username;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// @route   GET /api/auth/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/users', authMiddleware, asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  const users = await User.find({}).select('-password').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      users
    }
  });
}));

// @route   PUT /api/auth/users/:id/status
// @desc    Toggle user active status (admin only)
// @access  Private
router.put('/users/:id/status', authMiddleware, asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  user.isActive = !user.isActive;
  user.updated_by = req.user.username;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    }
  });
}));

module.exports = router;
