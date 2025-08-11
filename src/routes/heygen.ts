import axios from 'axios';
import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// POST /api/heygen/streaming-token
// Returns a fresh HeyGen streaming session token for the SDK
router.post('/streaming-token', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, error: 'HEYGEN_API_KEY is not configured' });
      return;
    }

    // Generate a fresh session token
    const response = await axios.post('https://api.heygen.com/v1/streaming.create_token', {}, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.data?.data?.token) {
      res.json({ success: true, token: response.data.data.token });
    } else {
      res.status(500).json({ success: false, error: 'Failed to generate streaming token' });
    }
  } catch (error: any) {
    console.error('Error generating streaming token:', error.response?.data || error.message);
    const msg = error.response?.data?.message || error?.message || 'Failed to get HeyGen streaming token';
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;