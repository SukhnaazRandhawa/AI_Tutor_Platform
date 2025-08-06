import avatarService from './avatarService';
import demoVideoService from './demoVideoService';

interface VideoStreamConfig {
  tutorName: string;
  quality: 'low' | 'medium' | 'high';
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
}

interface StreamResponse {
  videoUrl: string;
  audioUrl: string;
  duration: number;
  isLive: boolean;
}

class VideoStreamService {
  private activeStreams: Map<string, StreamResponse> = new Map();
  private streamConfigs: Map<string, VideoStreamConfig> = new Map();

  async startTutorStream(
    sessionId: string,
    tutorName: string,
    initialMessage?: string
  ): Promise<StreamResponse> {
    try {
      const config: VideoStreamConfig = {
        tutorName,
        quality: 'medium',
        frameRate: 30,
        resolution: { width: 1280, height: 720 }
      };
      this.streamConfigs.set(sessionId, config);

      // Try to use real avatar service first
      if (avatarService.getServiceStatus().status === 'active') {
        try {
          const avatarConfig = avatarService.createAvatarConfig(tutorName);
          const speechConfig = avatarService.createSpeechConfig(tutorName);
          speechConfig.text = initialMessage || `Hello! I'm ${tutorName}, your AI tutor. How can I help you today?`;

          const result = await avatarService.generateTalkingAvatar(
            speechConfig.text,
            avatarConfig,
            speechConfig
          );

          const streamResponse: StreamResponse = {
            videoUrl: result.videoUrl,
            audioUrl: result.audioUrl,
            duration: this.estimateDuration(speechConfig.text),
            isLive: true
          };
          this.activeStreams.set(sessionId, streamResponse);
          console.log('✅ Real avatar stream started');
          return streamResponse;
        } catch (error) {
          console.error('Real avatar generation failed, falling back to demo:', error);
        }
      }

      // Fallback to demo video
      const demoVideo = demoVideoService.getDemoVideo(tutorName);
      const streamResponse: StreamResponse = {
        videoUrl: demoVideo.videoUrl,
        audioUrl: demoVideo.audioUrl,
        duration: demoVideo.duration,
        isLive: true
      };
      this.activeStreams.set(sessionId, streamResponse);
      console.log('✅ Demo video stream started');
      return streamResponse;
    } catch (error) {
      console.error('Failed to start tutor stream:', error);
      throw new Error('Failed to start video stream');
    }
  }

  async generateTalkingResponse(
    sessionId: string,
    message: string
  ): Promise<StreamResponse> {
    try {
      const config = this.streamConfigs.get(sessionId);
      if (!config) {
        throw new Error('No active stream configuration found');
      }

      // Try to use real avatar service first
      if (avatarService.getServiceStatus().status === 'active') {
        try {
          const avatarConfig = avatarService.createAvatarConfig(config.tutorName);
          const speechConfig = avatarService.createSpeechConfig(config.tutorName);
          speechConfig.text = message;

          const result = await avatarService.generateTalkingAvatar(
            message,
            avatarConfig,
            speechConfig
          );

          const streamResponse: StreamResponse = {
            videoUrl: result.videoUrl,
            audioUrl: result.audioUrl,
            duration: this.estimateDuration(message),
            isLive: true
          };
          this.activeStreams.set(sessionId, streamResponse);
          console.log('✅ Real avatar response generated');
          return streamResponse;
        } catch (error) {
          console.error('Real avatar generation failed, falling back to demo:', error);
        }
      }

      // Fallback to demo video
      const demoVideo = demoVideoService.generateTalkingResponse(config.tutorName, message);
      const streamResponse: StreamResponse = {
        videoUrl: demoVideo.videoUrl,
        audioUrl: demoVideo.audioUrl,
        duration: demoVideo.duration,
        isLive: true
      };
      this.activeStreams.set(sessionId, streamResponse);
      console.log('✅ Demo video response generated');
      return streamResponse;
    } catch (error) {
      console.error('Failed to generate talking response:', error);
      throw new Error('Failed to generate talking response');
    }
  }

  getStreamStatus(sessionId: string): StreamResponse | null {
    return this.activeStreams.get(sessionId) || null;
  }

  stopStream(sessionId: string): void {
    this.activeStreams.delete(sessionId);
    this.streamConfigs.delete(sessionId);
    console.log(`Stream stopped for session: ${sessionId}`);
  }

  private estimateDuration(text: string): number {
    // Rough estimate: 150 words per minute
    const words = text.split(' ').length;
    return Math.max(2, Math.ceil(words / 2.5)); // Minimum 2 seconds
  }

  async getAvailableTutors(): Promise<Array<{
    name: string;
    gender: 'male' | 'female';
    specialty: string[];
    avatarUrl: string;
  }>> {
    return demoVideoService.getAvailableTutors();
  }

  isStreamingSupported(): boolean {
    return avatarService.getServiceStatus().status === 'active' || true; // Always true for demo
  }

  getQualityOptions(): Array<{
    name: string;
    value: 'low' | 'medium' | 'high';
    resolution: { width: number; height: number };
    frameRate: number;
  }> {
    return [
      { name: 'Low Quality', value: 'low', resolution: { width: 640, height: 480 }, frameRate: 24 },
      { name: 'Medium Quality', value: 'medium', resolution: { width: 1280, height: 720 }, frameRate: 30 },
      { name: 'High Quality', value: 'high', resolution: { width: 1920, height: 1080 }, frameRate: 60 }
    ];
  }

  getServiceStatus(): { status: string; features: any } {
    const avatarStatus = avatarService.getServiceStatus();
    return {
      status: avatarStatus.status === 'active' ? 'active' : 'demo',
      features: {
        ...avatarStatus.features,
        realTimeStreaming: true,
        demoMode: avatarStatus.status !== 'active'
      }
    };
  }
}

export default new VideoStreamService(); 