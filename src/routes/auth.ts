import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('language').optional().isString().withMessage('Language must be a string'),
  body('aiTutorName').optional().isString().withMessage('AI tutor name must be a string')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { name, email, password, language, aiTutorName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      language: language || 'English',
      aiTutorName: aiTutorName || 'AI Tutor'
    });

    // Generate token - safely handle user._id
    const userId = (user as any)._id?.toString() || '';
    const token = generateToken(userId);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: (user as any)._id,
        name: user.name,
        email: user.email,
        language: user.language,
        aiTutorName: user.aiTutorName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate token - safely handle user._id
    const userId = (user as any)._id?.toString() || '';
    const token = generateToken(userId);

    res.json({
      success: true,
      token,
      user: {
        id: (user as any)._id,
        name: user.name,
        email: user.email,
        language: user.language,
        aiTutorName: user.aiTutorName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

export default router; 