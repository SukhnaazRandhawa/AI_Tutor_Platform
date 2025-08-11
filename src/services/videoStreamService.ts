import { IMessage } from '../models/Session';
import aiService from './aiService';
import demoVideoService from './demoVideoService';
import streamingAvatarService from './streamingAvatarService';

interface VideoStream {
  videoUrl: string;
  audioUrl: string;
  isStreaming: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'tutor';
  timestamp: Date;
}

class VideoStreamService {
  private activeStreams: Map<string, VideoStream> = new Map();
  private streamingSessions: Map<string, any> = new Map();

  async startTutorStream(
    sessionId: string,
    userMessage: string,
    tutorName: string,
    subject: string,
    language: string
  ): Promise<VideoStream> {
    try {
      console.log('🎬 Starting real-time tutor stream...');
      console.log('🎬 Session ID:', sessionId);
      console.log('🎬 User message:', userMessage);
      console.log('🎬 Tutor name:', tutorName);
      console.log('🎬 Subject:', subject);
      console.log('🎬 Language:', language);

      // Check if streaming avatar service is available
      const streamingStatus = streamingAvatarService.isStreamActive();
      console.log('🎬 Streaming avatar service status:', streamingStatus);

      if (streamingStatus) {
        console.log('🎬 Using real-time streaming avatar...');
        return await this.startRealTimeStream(sessionId, userMessage, tutorName, subject, language);
      } else {
        console.log('⚠️ Streaming not available, falling back to demo video');
        return await this.startDemoStream(sessionId, userMessage, tutorName, subject, language);
      }
    } catch (error: any) {
      console.error('❌ Error starting tutor stream:', error);
      console.log('⚠️ Falling back to demo video due to error');
      return await this.startDemoStream(sessionId, userMessage, tutorName, subject, language);
    }
  }

  private async startRealTimeStream(
    sessionId: string,
    userMessage: string,
    tutorName: string,
    subject: string,
    language: string
  ): Promise<VideoStream> {
    try {
      console.log('🎬 Starting real-time streaming session...');

      // Create message array for AI service
      const messages: IMessage[] = [
        {
          sender: 'user',
          content: userMessage,
          timestamp: new Date()
        }
      ];

      // Generate AI response
      const aiResponse = await aiService.generateResponse(messages, 'User', tutorName, language, subject);
      console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');

      // Create streaming session with proper avatar ID
      const avatarId = process.env.HEYGEN_AVATAR_ID || 'Marianne_Red_Suit_public';
      const streamingSessionId = await streamingAvatarService.createStreamingSession({
        apiKey: '', // Not needed when using access token
        avatarId: avatarId,
        voiceId: '8661cd40d6c44c709e2d0031c0186ada' // Use the same voice
      });

      console.log('✅ Streaming session created:', streamingSessionId);

      // Connect to stream
      await streamingAvatarService.connectToStream(
        streamingSessionId,
        (videoFrame) => {
          // Handle video frame updates
          console.log('📹 Video frame received');
          // Here you would update the video element with the frame
        },
        (audioFrame) => {
          // Handle audio frame updates
          console.log('🔊 Audio frame received');
          // Here you would play the audio frame
        }
      );

      // Send the AI response to the stream
      await streamingAvatarService.sendTextToStream(streamingSessionId, aiResponse);

      // Store the streaming session
      this.streamingSessions.set(sessionId, streamingSessionId);

      // Return streaming URLs (these will be handled by the SDK)
      const videoStream: VideoStream = {
        videoUrl: `streaming://${streamingSessionId}`,
        audioUrl: `streaming://${streamingSessionId}`,
        isStreaming: true
      };

      // Store the stream
      this.activeStreams.set(sessionId, videoStream);

      console.log('✅ Real-time streaming started successfully');
      return videoStream;

    } catch (error: any) {
      console.error('❌ Error in real-time streaming:', error);
      throw error;
    }
  }

  private async startDemoStream(
    sessionId: string,
    userMessage: string,
    tutorName: string,
    subject: string,
    language: string
  ): Promise<VideoStream> {
    try {
      console.log('🎬 Starting demo video stream...');

      // Create message array for AI service
      const messages: IMessage[] = [
        {
          sender: 'user',
          content: userMessage,
          timestamp: new Date()
        }
      ];

      // Generate AI response
      const aiResponse = await aiService.generateResponse(messages, 'User', tutorName, language, subject);
      console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');

      // Get demo video
      const demoVideo = demoVideoService.getDemoVideo(tutorName);
      
      const videoStream: VideoStream = {
        videoUrl: demoVideo.videoUrl,
        audioUrl: demoVideo.audioUrl,
        isStreaming: false
      };

      this.activeStreams.set(sessionId, videoStream);
      console.log('✅ Demo video stream started');
      console.log('✅ Video URL:', videoStream.videoUrl);
      console.log('✅ Audio URL:', videoStream.audioUrl);

      return videoStream;

    } catch (error: any) {
      console.error('❌ Error in demo streaming:', error);
      throw error;
    }
  }

  async generateTalkingResponse(
    sessionId: string,
    userMessage: string,
    tutorName: string,
    subject: string,
    language: string
  ): Promise<{ videoUrl: string; audioUrl: string; aiResponse: string }> {
    try {
      console.log('🎬 Generating talking response...');
      console.log('🎬 Session ID:', sessionId);
      console.log('🎬 User message:', userMessage);

      // Create message array for AI service
      const messages: IMessage[] = [
        {
          sender: 'user',
          content: userMessage,
          timestamp: new Date()
        }
      ];

      // Check if we have an active streaming session
      const streamingSession = this.streamingSessions.get(sessionId);
      
      if (streamingSession && streamingSession.isActive) {
        console.log('🎬 Using real-time streaming for response...');
        
        // Generate AI response
        const aiResponse = await aiService.generateResponse(messages, 'User', tutorName, language, subject);
        console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');

        // Send to streaming session
        await streamingAvatarService.sendTextToStream(streamingSession.streamingSessionId, aiResponse);
        console.log('✅ Response sent to streaming session');

        return {
          videoUrl: `streaming://${streamingSession.streamingSessionId}`,
          audioUrl: `streaming://${streamingSession.streamingSessionId}`,
          aiResponse
        };
      } else {
        console.log('⚠️ No active streaming session, using demo response...');
        
        // Generate AI response
        const aiResponse = await aiService.generateResponse(messages, 'User', tutorName, language, subject);
        console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');

        // Get demo video
        const demoVideo = demoVideoService.getDemoVideo(tutorName);
        
        return {
          videoUrl: demoVideo.videoUrl,
          audioUrl: demoVideo.audioUrl,
          aiResponse
        };
      }

    } catch (error: any) {
      console.error('❌ Error generating talking response:', error);
      throw error;
    }
  }

  stopStream(sessionId: string): void {
    try {
      console.log('🎬 Stopping stream for session:', sessionId);
      
      // Stop streaming session if active
      const streamingSession = this.streamingSessions.get(sessionId);
      if (streamingSession && streamingSession.isActive) {
        streamingAvatarService.disconnectStream();
        streamingSession.isActive = false;
        console.log('✅ Streaming session stopped');
      }

      // Remove from active streams
      this.activeStreams.delete(sessionId);
      this.streamingSessions.delete(sessionId);
      
      console.log('✅ Stream stopped for session:', sessionId);
    } catch (error: any) {
      console.error('❌ Error stopping stream:', error);
    }
  }

  getActiveStream(sessionId: string): VideoStream | undefined {
    return this.activeStreams.get(sessionId);
  }

  isStreamActive(sessionId: string): boolean {
    return this.activeStreams.has(sessionId);
  }
}

export default new VideoStreamService(); 