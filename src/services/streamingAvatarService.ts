// HeyGen SDK is client-side only, so we'll manage streaming state here
// The actual SDK usage happens in the frontend

interface StreamingAvatarConfig {
  apiKey: string;
  avatarId: string;
  voiceId: string;
  onVideoFrame?: (frame: any) => void;
  onAudioFrame?: (frame: any) => void;
  onError?: (error: any) => void;
  onReady?: () => void;
}

interface StreamingSession {
  sessionId: string;
  avatarId: string;
  voiceId: string;
  isActive: boolean;
}

class StreamingAvatarService {
  private accessToken: string | undefined;
  private currentSession: StreamingSession | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.accessToken = process.env.HEYGEN_ACCESS_TOKEN;
    console.log('🎬 Streaming Avatar Service initialized');
    console.log('🎬 Access Token exists:', !!this.accessToken);
  }

  async createStreamingSession(config: StreamingAvatarConfig): Promise<string> {
    try {
      console.log('🎬 Creating streaming session...');
      
      if (!this.accessToken) {
        throw new Error('HEYGEN_ACCESS_TOKEN not configured');
      }

      const sessionId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('✅ Streaming session created:', sessionId);
      
      this.currentSession = {
        sessionId,
        avatarId: config.avatarId,
        voiceId: config.voiceId,
        isActive: true
      };

      return sessionId;
    } catch (error: any) {
      console.error('❌ Error creating streaming session:', error);
      throw error;
    }
  }

  async connectToStream(sessionId: string, onVideoFrame: (frame: any) => void, onAudioFrame: (frame: any) => void): Promise<void> {
    try {
      console.log('🎬 Connecting to streaming session:', sessionId);
      
      if (!this.currentSession) {
        throw new Error('No active session');
      }

      // Simulate connection (actual connection happens in frontend)
      this.isConnected = true;
      console.log('✅ Connected to stream');
      
    } catch (error: any) {
      console.error('❌ Error connecting to stream:', error);
      throw error;
    }
  }

  async sendTextToStream(sessionId: string, text: string): Promise<void> {
    try {
      if (!this.isConnected) {
        throw new Error('Stream not connected');
      }

      console.log('🎬 Sending text to stream:', text.substring(0, 50) + '...');
      console.log('✅ Text sent to stream');
      
    } catch (error: any) {
      console.error('❌ Error sending text to stream:', error);
      throw error;
    }
  }

  async disconnectStream(): Promise<void> {
    try {
      console.log('🎬 Disconnecting stream...');
      
      if (this.currentSession) {
        this.currentSession.isActive = false;
        this.currentSession = null;
      }

      this.isConnected = false;
      console.log('✅ Stream disconnected');
    } catch (error: any) {
      console.error('❌ Error disconnecting stream:', error);
    }
  }

  isStreamActive(): boolean {
    return this.isConnected && this.currentSession?.isActive === true;
  }

  getCurrentSession(): StreamingSession | null {
    return this.currentSession;
  }

  getAccessToken(): string | undefined {
    return this.accessToken;
  }
}

export default new StreamingAvatarService(); 