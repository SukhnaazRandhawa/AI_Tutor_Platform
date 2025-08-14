import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import videoStreamService from '../services/videoStreamService';

interface AuthRequest extends Request {
  user?: any;
}

const router = express.Router();

// @route   POST /api/video/start-stream
// @desc    Start a real-time tutor video stream
// @access  Private
router.post('/start-stream', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId, userMessage, tutorName, subject, language } = req.body;
    const userId = req.user?.id;

    if (!sessionId || !userMessage || !tutorName) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userMessage, tutorName'
      });
      return;
    }

    console.log('🎬 Starting video stream...');
    console.log('🎬 Session ID:', sessionId);
    console.log('🎬 User ID:', userId);
    console.log('🎬 User message:', userMessage);
    console.log('🎬 Tutor name:', tutorName);
    console.log('🎬 Subject:', subject);
    console.log('🎬 Language:', language);

    const videoStream = await videoStreamService.startTutorStream(
      sessionId,
      userMessage,
      tutorName,
      subject || 'General',
      language || 'English'
    );

    res.json({
      success: true,
      videoStream: {
        videoUrl: videoStream.videoUrl,
        audioUrl: videoStream.audioUrl,
        isStreaming: videoStream.isStreaming
      }
    });

  } catch (error: any) {
    console.error('❌ Error starting video stream:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start video stream'
    });
  }
});

// @route   POST /api/video/talking-response
// @desc    Generate a real-time talking response from the AI tutor
// @access  Private
router.post('/talking-response', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId, userMessage, tutorName, subject, language } = req.body;
    const userId = req.user?.id;

    if (!sessionId || !userMessage || !tutorName) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, userMessage, tutorName'
      });
      return;
    }

    console.log('🎬 Generating talking response...');
    console.log('🎬 Session ID:', sessionId);
    console.log('🎬 User ID:', userId);
    console.log('🎬 User message:', userMessage);
    console.log('🎬 Tutor name:', tutorName);

    const response = await videoStreamService.generateTalkingResponse(
      sessionId,
      userMessage,
      tutorName,
      subject || 'General',
      language || 'English'
    );

    res.json({
      success: true,
      videoStream: {
        videoUrl: response.videoUrl,
        audioUrl: response.audioUrl,
        isStreaming: response.videoUrl.startsWith('streaming://')
      },
      aiResponse: response.aiResponse
    });

  } catch (error: any) {
    console.error('❌ Error generating talking response:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate talking response'
    });
  }
});

// @route   DELETE /api/video/stop-stream/:sessionId
// @desc    Stop a video stream
// @access  Private
router.delete('/stop-stream/:sessionId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
      return;
    }

    console.log('🎬 Stopping video stream...');
    console.log('🎬 Session ID:', sessionId);
    console.log('🎬 User ID:', userId);

    videoStreamService.stopStream(sessionId);

    res.json({
      success: true,
      message: 'Video stream stopped successfully'
    });

  } catch (error: any) {
    console.error('❌ Error stopping video stream:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop video stream'
    });
  }
});

// @route   GET /api/video/stream-status/:sessionId
// @desc    Get the status of a video stream
// @access  Private
router.get('/stream-status/:sessionId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
      return;
    }

    console.log('🎬 Getting stream status...');
    console.log('🎬 Session ID:', sessionId);
    console.log('🎬 User ID:', userId);

    const isActive = videoStreamService.isStreamActive(sessionId);
    const activeStream = videoStreamService.getActiveStream(sessionId);

    res.json({
      success: true,
      isActive,
      videoStream: activeStream ? {
        videoUrl: activeStream.videoUrl,
        audioUrl: activeStream.audioUrl,
        isStreaming: activeStream.isStreaming
      } : null
    });

  } catch (error: any) {
    console.error('❌ Error getting stream status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stream status'
    });
  }
});

export default router; 