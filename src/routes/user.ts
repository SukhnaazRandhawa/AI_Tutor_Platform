import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: any;
}

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        aiTutorName: user.aiTutorName,
        isCustomTutor: user.isCustomTutor,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, language, aiTutorName } = req.body;
    const user = req.user;

    // Update user fields
    if (name) user.name = name;
    if (language) user.language = language;
    if (aiTutorName) user.aiTutorName = aiTutorName;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        aiTutorName: user.aiTutorName,
        isCustomTutor: user.isCustomTutor
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during profile update'
    });
  }
});

export default router; 