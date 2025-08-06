import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import videoStreamService from '../services/videoStreamService';

interface AuthRequest extends Request {
  user?: any;
}

const router = express.Router();

// @route   POST /api/video/start-stream
// @desc    Start real-time video stream for AI tutor
// @access  Private
router.post('/start-stream', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId, tutorName, initialMessage } = req.body;
    const user = req.user;

    if (!sessionId || !tutorName) {
      res.status(400).json({
        success: false,
        error: 'Session ID and tutor name are required'
      });
      return;
    }

    // Start the video stream
    const streamResponse = await videoStreamService.startTutorStream(
      sessionId,
      tutorName,
      initialMessage
    );

    res.json({
      success: true,
      message: 'Video stream started successfully',
      stream: streamResponse
    });

  } catch (error) {
    console.error('Start stream error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start video stream'
    });
  }
});

// @route   POST /api/video/talking-response
// @desc    Generate talking response for AI tutor
// @access  Private
router.post('/talking-response', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId, message } = req.body;
    const user = req.user;

    if (!sessionId || !message) {
      res.status(400).json({
        success: false,
        error: 'Session ID and message are required'
      });
      return;
    }

    // Generate talking response
    const streamResponse = await videoStreamService.generateTalkingResponse(
      sessionId,
      message
    );

    res.json({
      success: true,
      message: 'Talking response generated successfully',
      stream: streamResponse
    });

  } catch (error) {
    console.error('Talking response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate talking response'
    });
  }
});

// @route   GET /api/video/stream-status/:sessionId
// @desc    Get current stream status
// @access  Private
router.get('/stream-status/:sessionId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const user = req.user;

    const streamStatus = videoStreamService.getStreamStatus(sessionId);

    if (!streamStatus) {
      res.status(404).json({
        success: false,
        error: 'No active stream found for this session'
      });
      return;
    }

    res.json({
      success: true,
      stream: streamStatus
    });

  } catch (error) {
    console.error('Stream status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stream status'
    });
  }
});

// @route   DELETE /api/video/stop-stream/:sessionId
// @desc    Stop video stream
// @access  Private
router.delete('/stop-stream/:sessionId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const user = req.user;

    videoStreamService.stopStream(sessionId);

    res.json({
      success: true,
      message: 'Video stream stopped successfully'
    });

  } catch (error) {
    console.error('Stop stream error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop video stream'
    });
  }
});

// @route   GET /api/video/available-tutors
// @desc    Get available tutor avatars
// @access  Private
router.get('/available-tutors', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tutors = await videoStreamService.getAvailableTutors();

    res.json({
      success: true,
      tutors
    });

  } catch (error) {
    console.error('Available tutors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available tutors'
    });
  }
});

// @route   GET /api/video/quality-options
// @desc    Get stream quality options
// @access  Private
router.get('/quality-options', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const qualityOptions = videoStreamService.getQualityOptions();

    res.json({
      success: true,
      qualityOptions
    });

  } catch (error) {
    console.error('Quality options error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quality options'
    });
  }
});

// @route   GET /api/video/streaming-supported
// @desc    Check if streaming is supported
// @access  Private
router.get('/streaming-supported', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSupported = videoStreamService.isStreamingSupported();

    res.json({
      success: true,
      streamingSupported: isSupported
    });

  } catch (error) {
    console.error('Streaming support check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check streaming support'
    });
  }
});

export default router; 