import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

interface AvatarConfig {
  gender: 'male' | 'female';
  age: number;
  ethnicity: string;
  style: 'professional' | 'friendly' | 'casual';
  clothing: string;
}

interface VideoGenerationRequest {
  text: string;
  voiceId: string;
  avatarConfig: AvatarConfig;
  background?: string;
  resolution?: '720p' | '1080p';
}

class AvatarService {
  private dIdApiKey: string;
  private heyGenApiKey: string;
  private isConfigured: boolean = false;

  constructor() {
    this.dIdApiKey = process.env.DID_API_KEY || '';
    this.heyGenApiKey = process.env.HEYGEN_API_KEY || '';
    
    if (this.dIdApiKey || this.heyGenApiKey) {
      this.isConfigured = true;
    } else {
      console.warn('No avatar API keys found. Avatar generation will not work.');
    }
  }

  /**
   * Generate AI avatar video using D-ID
   */
  async generateDIDAvatar(request: VideoGenerationRequest): Promise<string> {
    if (!this.dIdApiKey) {
      throw new Error('D-ID API not configured');
    }

    try {
      const response = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.dIdApiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: request.text,
            provider: {
              type: 'elevenlabs',
              voice_id: request.voiceId
            }
          },
          config: {
            fluent: true,
            pad_audio: 0.0,
            stitch: true
          },
          source_url: this.getAvatarSourceUrl(request.avatarConfig)
        })
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.statusText}`);
      }

      const data = await response.json() as { id: string };
      return data.id;
    } catch (error) {
      console.error('D-ID avatar generation error:', error);
      throw new Error('Failed to generate D-ID avatar');
    }
  }

  /**
   * Generate AI avatar video using HeyGen
   */
  async generateHeyGenAvatar(request: VideoGenerationRequest): Promise<string> {
    if (!this.heyGenApiKey) {
      throw new Error('HeyGen API not configured');
    }

    try {
      const response = await fetch('https://api.heygen.com/v1/video.generate', {
        method: 'POST',
        headers: {
          'X-Api-Key': this.heyGenApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: this.getHeyGenAvatarId(request.avatarConfig),
                input_text: request.text
              },
              voice: {
                type: 'text',
                input_text: request.text,
                voice_id: request.voiceId
              }
            }
          ],
          test: false,
          aspect_ratio: '16:9',
          background: request.background || 'transparent'
        })
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }

      const data = await response.json() as { data: { video_id: string } };
      return data.data.video_id;
    } catch (error) {
      console.error('HeyGen avatar generation error:', error);
      throw new Error('Failed to generate HeyGen avatar');
    }
  }

  /**
   * Get video status and download URL
   */
  async getVideoStatus(videoId: string, platform: 'd-id' | 'heygen'): Promise<{
    status: string;
    downloadUrl?: string;
    progress?: number;
  }> {
    try {
      if (platform === 'd-id') {
        return await this.getDIDVideoStatus(videoId);
      } else {
        return await this.getHeyGenVideoStatus(videoId);
      }
    } catch (error) {
      console.error('Video status check error:', error);
      throw new Error('Failed to get video status');
    }
  }

  /**
   * Get D-ID video status
   */
  private async getDIDVideoStatus(videoId: string): Promise<{
    status: string;
    downloadUrl?: string;
    progress?: number;
  }> {
    const response = await fetch(`https://api.d-id.com/talks/${videoId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(this.dIdApiKey + ':').toString('base64')}`
      }
    });

    if (!response.ok) {
      throw new Error(`D-ID API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      status: string;
      result_url?: string;
      progress?: number;
    };

    return {
      status: data.status,
      downloadUrl: data.result_url,
      progress: data.progress
    };
  }

  /**
   * Get HeyGen video status
   */
  private async getHeyGenVideoStatus(videoId: string): Promise<{
    status: string;
    downloadUrl?: string;
    progress?: number;
  }> {
    const response = await fetch(`https://api.heygen.com/v1/video.status?video_id=${videoId}`, {
      headers: {
        'X-Api-Key': this.heyGenApiKey
      }
    });

    if (!response.ok) {
      throw new Error(`HeyGen API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      data: {
        status: string;
        video_url?: string;
        progress?: number;
      };
    };

    return {
      status: data.data.status,
      downloadUrl: data.data.video_url,
      progress: data.data.progress
    };
  }

  /**
   * Download video file
   */
  async downloadVideo(downloadUrl: string, filename: string): Promise<string> {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      const videoBuffer = await response.arrayBuffer();
      const videoDir = path.join(process.cwd(), 'videos');
      
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
      }

      const filePath = path.join(videoDir, filename);
      fs.writeFileSync(filePath, Buffer.from(videoBuffer));
      
      return filePath;
    } catch (error) {
      console.error('Video download error:', error);
      throw new Error('Failed to download video');
    }
  }

  /**
   * Get avatar source URL based on configuration
   */
  private getAvatarSourceUrl(config: AvatarConfig): string {
    // This would map to actual avatar images based on configuration
    // For now, return a placeholder
    const baseUrl = 'https://d-id-talks-prod.s3.us-west-2.amazonaws.com/api/talks/';
    
    // Map configuration to avatar image
    const avatarMap: Record<string, string> = {
      'male-professional': 'male-professional-1.jpg',
      'female-professional': 'female-professional-1.jpg',
      'male-friendly': 'male-friendly-1.jpg',
      'female-friendly': 'female-friendly-1.jpg'
    };

    const key = `${config.gender}-${config.style}`;
    return baseUrl + (avatarMap[key] || 'default-avatar.jpg');
  }

  /**
   * Get HeyGen avatar ID based on configuration
   */
  private getHeyGenAvatarId(config: AvatarConfig): string {
    // Map configuration to HeyGen avatar IDs
    const avatarMap: Record<string, string> = {
      'male-professional': 'male-1',
      'female-professional': 'female-1',
      'male-friendly': 'male-2',
      'female-friendly': 'female-2'
    };

    const key = `${config.gender}-${config.style}`;
    return avatarMap[key] || 'default';
  }

  /**
   * Create custom avatar configuration
   */
  createAvatarConfig(
    gender: 'male' | 'female',
    age: number,
    ethnicity: string,
    style: 'professional' | 'friendly' | 'casual',
    clothing: string = 'business casual'
  ): AvatarConfig {
    return {
      gender,
      age,
      ethnicity,
      style,
      clothing
    };
  }

  /**
   * Get available avatar configurations
   */
  getAvailableAvatars(): AvatarConfig[] {
    return [
      {
        gender: 'male',
        age: 30,
        ethnicity: 'caucasian',
        style: 'professional',
        clothing: 'business suit'
      },
      {
        gender: 'female',
        age: 28,
        ethnicity: 'caucasian',
        style: 'professional',
        clothing: 'business suit'
      },
      {
        gender: 'male',
        age: 35,
        ethnicity: 'asian',
        style: 'friendly',
        clothing: 'casual'
      },
      {
        gender: 'female',
        age: 32,
        ethnicity: 'african',
        style: 'friendly',
        clothing: 'casual'
      }
    ];
  }

  /**
   * Check if avatar services are available
   */
  isAvatarEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    dId: boolean;
    heyGen: boolean;
    configured: boolean;
  } {
    return {
      dId: !!this.dIdApiKey,
      heyGen: !!this.heyGenApiKey,
      configured: this.isConfigured
    };
  }
}

export default new AvatarService(); 