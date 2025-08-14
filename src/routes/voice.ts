import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import voiceService from '../services/voiceService';

interface AuthRequest extends Request {
  user?: any;
}

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// @route   POST /api/voice/speech-to-text
// @desc    Convert speech to text
// @access  Private
router.post('/speech-to-text', 
  authenticate, 
  upload.single('audio'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No audio file provided'
        });
        return;
      }

      const { language = 'en' } = req.body;
      const user = req.user;

      // Convert speech to text
      const text = await voiceService.speechToText(req.file.buffer, language);

      res.json({
        success: true,
        text: text,
        language: language,
        confidence: 0.95 // Placeholder confidence score
      });

    } catch (error) {
      console.error('Speech-to-text error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Speech-to-text processing failed'
      });
    }
  }
);

// @route   POST /api/voice/text-to-speech
// @desc    Convert text to speech
// @access  Private
router.post('/text-to-speech', 
  authenticate,
  [
    body('text').notEmpty().withMessage('Text is required'),
    body('voiceId').optional().isString().withMessage('Voice ID must be a string')
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

      const { text, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body;
      const user = req.user;

      // Convert text to speech
      const audioBuffer = await voiceService.textToSpeech(text, voiceId);

      // Set response headers for audio
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Content-Disposition': 'attachment; filename="ai-response.mp3"'
      });

      res.send(audioBuffer);

    } catch (error) {
      console.error('Text-to-speech error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Text-to-speech processing failed'
      });
    }
  }
);

// @route   GET /api/voice/voices
// @desc    Get available voices
// @access  Private
router.get('/voices', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const voices = await voiceService.getAvailableVoices();

    res.json({
      success: true,
      voices: voices
    });

  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available voices'
    });
  }
});

// @route   GET /api/voice/status
// @desc    Get voice service status
// @access  Private
router.get('/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = voiceService.getServiceStatus();

    res.json({
      success: true,
      status: status
    });

  } catch (error) {
    console.error('Error getting voice status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voice service status'
    });
  }
});

// @route   POST /api/voice/process-audio
// @desc    Process audio for better quality
// @access  Private
router.post('/process-audio',
  authenticate,
  upload.single('audio'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No audio file provided'
        });
        return;
      }

      // Process audio for better quality
      const processedAudio = await voiceService.processAudio(req.file.buffer);

      // Set response headers for processed audio
      res.set({
        'Content-Type': req.file.mimetype,
        'Content-Length': processedAudio.length.toString(),
        'Content-Disposition': 'attachment; filename="processed-audio.wav"'
      });

      res.send(processedAudio);

    } catch (error) {
      console.error('Audio processing error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Audio processing failed'
      });
    }
  }
);

export default router; 