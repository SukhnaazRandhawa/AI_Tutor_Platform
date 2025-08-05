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
    body('platform').isIn(['d-id', 'heygen']).withMessage('Platform must be d-id or heygen'),
    body('avatarConfig').isObject().withMessage('Avatar configuration is required'),
    body('voiceId').optional().isString().withMessage('Voice ID must be a string'),
    body('background').optional().isString().withMessage('Background must be a string'),
    body('resolution').optional().isIn(['720p', '1080p']).withMessage('Resolution must be 720p or 1080p')
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

      const { text, platform, avatarConfig, voiceId, background, resolution } = req.body;
      const user = req.user;

      // Use default voice if not provided
      const defaultVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM';

      // Generate avatar video
      let videoId: string;
      if (platform === 'd-id') {
        videoId = await avatarService.generateDIDAvatar({
          text,
          voiceId: defaultVoiceId,
          avatarConfig,
          background,
          resolution
        });
      } else {
        videoId = await avatarService.generateHeyGenAvatar({
          text,
          voiceId: defaultVoiceId,
          avatarConfig,
          background,
          resolution
        });
      }

      res.json({
        success: true,
        message: 'Avatar video generation started',
        videoId,
        platform,
        status: 'processing'
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

// @route   GET /api/avatar/status/:videoId
// @desc    Get video generation status
// @access  Private
router.get('/status/:videoId', 
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      const { platform } = req.query;
      const user = req.user;

      if (!platform || (platform !== 'd-id' && platform !== 'heygen')) {
        res.status(400).json({
          success: false,
          error: 'Platform parameter is required and must be d-id or heygen'
        });
        return;
      }

      const status = await avatarService.getVideoStatus(videoId, platform as 'd-id' | 'heygen');

      res.json({
        success: true,
        videoId,
        platform,
        status: status.status,
        downloadUrl: status.downloadUrl,
        progress: status.progress
      });

    } catch (error) {
      console.error('Video status error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get video status'
      });
    }
  }
);

// @route   GET /api/avatar/download/:videoId
// @desc    Download generated video
// @access  Private
router.get('/download/:videoId', 
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      const { platform, downloadUrl } = req.query;
      const user = req.user;

      if (!platform || (platform !== 'd-id' && platform !== 'heygen')) {
        res.status(400).json({
          success: false,
          error: 'Platform parameter is required and must be d-id or heygen'
        });
        return;
      }

      if (!downloadUrl || typeof downloadUrl !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Download URL is required'
        });
        return;
      }

      const filename = `avatar-${videoId}-${Date.now()}.mp4`;
      const filePath = await avatarService.downloadVideo(downloadUrl, filename);

      res.json({
        success: true,
        message: 'Video downloaded successfully',
        filePath,
        filename
      });

    } catch (error) {
      console.error('Video download error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download video'
      });
    }
  }
);

// @route   GET /api/avatar/stream/:videoId
// @desc    Stream video for real-time viewing
// @access  Private
router.get('/stream/:videoId', 
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      const { platform } = req.query;
      const user = req.user;

      if (!platform || (platform !== 'd-id' && platform !== 'heygen')) {
        res.status(400).json({
          success: false,
          error: 'Platform parameter is required and must be d-id or heygen'
        });
        return;
      }

      const status = await avatarService.getVideoStatus(videoId, platform as 'd-id' | 'heygen');

      if (status.status !== 'done' || !status.downloadUrl) {
        res.status(400).json({
          success: false,
          error: 'Video is not ready for streaming',
          status: status.status
        });
        return;
      }

      // Redirect to video stream
      res.redirect(status.downloadUrl);

    } catch (error) {
      console.error('Video stream error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stream video'
      });
    }
  }
);

// @route   GET /api/avatar/available
// @desc    Get available avatar configurations
// @access  Private
router.get('/available', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const avatars = avatarService.getAvailableAvatars();

    res.json({
      success: true,
      avatars
    });

  } catch (error) {
    console.error('Error fetching avatars:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available avatars'
    });
  }
});

// @route   POST /api/avatar/create-config
// @desc    Create custom avatar configuration
// @access  Private
router.post('/create-config',
  authenticate,
  [
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
    body('age').isInt({ min: 18, max: 80 }).withMessage('Age must be between 18 and 80'),
    body('ethnicity').notEmpty().withMessage('Ethnicity is required'),
    body('style').isIn(['professional', 'friendly', 'casual']).withMessage('Style must be professional, friendly, or casual'),
    body('clothing').optional().isString().withMessage('Clothing must be a string')
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

      const { gender, age, ethnicity, style, clothing } = req.body;
      const user = req.user;

      const avatarConfig = avatarService.createAvatarConfig(
        gender,
        age,
        ethnicity,
        style,
        clothing
      );

      res.json({
        success: true,
        message: 'Avatar configuration created',
        avatarConfig
      });

    } catch (error) {
      console.error('Avatar config creation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create avatar configuration'
      });
    }
  }
);

// @route   GET /api/avatar/status
// @desc    Get avatar service status
// @access  Private
router.get('/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = avatarService.getServiceStatus();

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error getting avatar status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get avatar service status'
    });
  }
});

export default router; 