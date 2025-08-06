import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import avatarService from '../services/avatarService';

interface AuthRequest extends Request {
  user?: any;
}

const router = express.Router();

// @route   POST /api/avatar/generate
// @desc    Generate AI avatar video
// @access  Private
router.post('/generate', 
  authenticate,
  [
    body('text').notEmpty().withMessage('Text is required'),
    body('tutorName').notEmpty().withMessage('Tutor name is required'),
    body('voice').optional().isString().withMessage('Voice must be a string'),
    body('speed').optional().isFloat({ min: 0.5, max: 2.0 }).withMessage('Speed must be between 0.5 and 2.0'),
    body('pitch').optional().isFloat({ min: 0.5, max: 2.0 }).withMessage('Pitch must be between 0.5 and 2.0')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array()
        });
        return;
      }

      const { text, tutorName, voice, speed, pitch } = req.body;
      const user = req.user;

      // Create avatar and speech configurations
      const avatarConfig = avatarService.createAvatarConfig(tutorName);
      const speechConfig = avatarService.createSpeechConfig(tutorName);
      
      // Override with provided values
      if (voice) speechConfig.voice = voice;
      if (speed) speechConfig.speed = speed;
      if (pitch) speechConfig.pitch = pitch;
      speechConfig.text = text;

      // Generate talking avatar
      const result = await avatarService.generateTalkingAvatar(
        text,
        avatarConfig,
        speechConfig
      );

      res.json({
        success: true,
        message: 'Avatar video generated successfully',
        videoUrl: result.videoUrl,
        audioUrl: result.audioUrl,
        tutorName,
        avatarConfig,
        speechConfig
      });

    } catch (error) {
      console.error('Avatar generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Avatar generation failed'
      });
    }
  }
);

// @route   GET /api/avatar/voices
// @desc    Get available voices for speech synthesis
// @access  Private
router.get('/voices', 
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const voices = await avatarService.getAvailableVoices();

      res.json({
        success: true,
        voices
      });

    } catch (error) {
      console.error('Voices fetch error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch voices'
      });
    }
  }
);

// @route   POST /api/avatar/config
// @desc    Create avatar configuration
// @access  Private
router.post('/config', 
  authenticate,
  [
    body('tutorName').notEmpty().withMessage('Tutor name is required')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array()
        });
        return;
      }

      const { tutorName } = req.body;
      const user = req.user;

      const avatarConfig = avatarService.createAvatarConfig(tutorName);
      const speechConfig = avatarService.createSpeechConfig(tutorName);

      res.json({
        success: true,
        avatarConfig,
        speechConfig
      });

    } catch (error) {
      console.error('Avatar config error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create avatar config'
      });
    }
  }
);

// @route   GET /api/avatar/status
// @desc    Get avatar service status
// @access  Private
router.get('/status', 
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;

      res.json({
        success: true,
        status: 'active',
        features: {
          textToSpeech: true,
          avatarGeneration: true,
          voiceSynthesis: true
        },
        message: 'Avatar service is operational'
      });

    } catch (error) {
      console.error('Avatar status error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get avatar status'
      });
    }
  }
);

export default router; 