import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import Session, { IMessage } from '../models/Session';
import aiService from '../services/aiService';

interface AuthRequest extends Request {
  user?: any;
}

const router = express.Router();

// @route   POST /api/session/start
// @desc    Start a new AI tutoring session
// @access  Private
router.post('/start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { subject } = req.body;
    const user = req.user;

    // Check if user has an active session
    const activeSession = await Session.findOne({
      userId: user._id,
      status: 'active'
    });

    if (activeSession) {
      res.status(400).json({
        success: false,
        error: 'You already have an active session. Please end the current session first.'
      });
      return;
    }

    // Create new session
    const session = new Session({
      userId: user._id,
      user: {
        name: user.name,
        language: user.language,
        aiTutorName: user.aiTutorName
      },
      subject: subject || 'General Tutoring',
      messages: [],
      status: 'active'
    });

    await session.save();

    // Generate initial AI greeting
    const aiResponse = await aiService.generateResponse(
      [],
      user.name,
      user.aiTutorName,
      user.language,
      subject
    );

    // Add AI greeting to session
    session.messages.push({
      sender: 'ai',
      content: aiResponse,
      timestamp: new Date()
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Session started successfully',
      session: {
        id: session._id,
        subject: session.subject,
        startTime: session.startTime,
        messages: session.messages
      }
    });

  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during session start'
    });
  }
});

// @route   POST /api/session/message
// @desc    Send a message to AI tutor
// @access  Private
router.post('/message', authenticate, [
  body('message').notEmpty().withMessage('Message is required'),
  body('sessionId').notEmpty().withMessage('Session ID is required')
], async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const { message, sessionId, attachments } = req.body;
    const user = req.user;

    // Find session
    const session = await Session.findOne({
      _id: sessionId,
      userId: user._id,
      status: 'active'
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Active session not found'
      });
      return;
    }

    // Add user message to session
    const userMessage: IMessage = {
      sender: 'user',
      content: message,
      timestamp: new Date(),
      attachments: attachments || []
    };

    session.messages.push(userMessage);

    // Generate AI response
    const aiResponse = await aiService.generateResponse(
      session.messages,
      user.name,
      user.aiTutorName,
      user.language,
      session.subject
    );

    // Add AI response to session
    const aiMessage: IMessage = {
      sender: 'ai',
      content: aiResponse,
      timestamp: new Date()
    };

    session.messages.push(aiMessage);
    await session.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      response: aiResponse,
      session: {
        id: session._id,
        messages: session.messages.slice(-2) // Return last 2 messages
      }
    });

  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during message processing'
    });
  }
});

// @route   GET /api/session/active
// @desc    Get user's active session
// @access  Private
router.get('/active', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const session = await Session.findOne({
      userId: user._id,
      status: 'active'
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'No active session found'
      });
      return;
    }

    res.json({
      success: true,
      session: {
        id: session._id,
        subject: session.subject,
        startTime: session.startTime,
        messages: session.messages,
        user: session.user
      }
    });

  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/session/end
// @desc    End the current session
// @access  Private
router.put('/end', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const session = await Session.findOne({
      userId: user._id,
      status: 'active'
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'No active session found'
      });
      return;
    }

    // End session
    session.status = 'ended';
    session.endTime = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Session ended successfully',
      session: {
        id: session._id,
        totalDuration: session.totalDuration,
        messageCount: session.messages.length
      }
    });

  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during session end'
    });
  }
});

// @route   GET /api/session/history
// @desc    Get user's session history
// @access  Private
router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const sessions = await Session.find({
      userId: user._id,
      status: 'ended'
    })
    .sort({ endTime: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .select('subject startTime endTime totalDuration messages');

    const total = await Session.countDocuments({
      userId: user._id,
      status: 'ended'
    });

    res.json({
      success: true,
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 