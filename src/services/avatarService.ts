import axios from 'axios';
import demoVideoService from './demoVideoService';

interface AvatarConfig {
  tutorName: string;
  gender: 'male' | 'female';
  age: number;
  ethnicity: string;
  style: 'professional' | 'friendly' | 'casual';
}

interface SpeechConfig {
  text: string;
  voice: string;
  speed: number;
  pitch: number;
}

class AvatarService {
  private elevenLabsApiKey: string | undefined;
  private didApiKey: string | undefined;
  private heygenApiKey: string | undefined;
  private isConfigured: boolean = false;

  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.didApiKey = process.env.DID_API_KEY;
    this.heygenApiKey = process.env.HEYGEN_API_KEY;
    
    console.log('🔍 Avatar Service - Checking API keys...');
    console.log('🔍 ElevenLabs API Key exists:', !!this.elevenLabsApiKey);
    console.log('🔍 D-ID API Key exists:', !!this.didApiKey);
    console.log('🔍 HeyGen API Key exists:', !!this.heygenApiKey);
    
    if (this.elevenLabsApiKey && (this.didApiKey || this.heygenApiKey)) {
      this.isConfigured = true;
      console.log('✅ Avatar service configured with real APIs');
    } else {
      console.warn('⚠️ Some API keys missing. Avatar service will use fallbacks.');
      console.warn('⚠️ Required: ELEVENLABS_API_KEY and either DID_API_KEY or HEYGEN_API_KEY');
    }
  }

  async generateTalkingAvatar(
    text: string,
    avatarConfig: AvatarConfig,
    speechConfig: SpeechConfig
  ): Promise<{ videoUrl: string; audioUrl: string }> {
    try {
      console.log('🎬 Generating talking avatar for:', avatarConfig.tutorName);
      console.log('🎬 Using real APIs:', this.isConfigured);

      if (this.isConfigured) {
        // Try to use real APIs
        const audioUrl = await this.generateSpeech(text, speechConfig);
        const videoUrl = await this.generateAvatarVideo(avatarConfig, audioUrl, text);
        
        return { videoUrl, audioUrl };
      } else {
        // Use demo video service
        console.log('🎬 Using demo video service');
        const demoVideo = demoVideoService.generateTalkingResponse(avatarConfig.tutorName, text);
        return {
          videoUrl: demoVideo.videoUrl,
          audioUrl: demoVideo.audioUrl
        };
      }
    } catch (error) {
      console.error('❌ Avatar generation failed, using demo fallback:', error);
      // Fallback to demo video
      const demoVideo = demoVideoService.generateTalkingResponse(avatarConfig.tutorName, text);
      return {
        videoUrl: demoVideo.videoUrl,
        audioUrl: demoVideo.audioUrl
      };
    }
  }

  private async generateSpeech(text: string, config: SpeechConfig): Promise<string> {
    if (!this.elevenLabsApiKey) {
      console.log('⚠️ ElevenLabs API not configured, using demo audio');
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    }

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.voice}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        },
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      console.log('✅ ElevenLabs speech generation successful');
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'; // Placeholder for now
    } catch (error) {
      console.error('❌ ElevenLabs API error:', error);
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    }
  }

  private async generateAvatarVideo(
    avatarConfig: AvatarConfig, 
    audioUrl: string, 
    text: string
  ): Promise<string> {
    // Try D-ID first (user has 12 credits available), then HeyGen as fallback
    if (this.didApiKey) {
      try {
        console.log('🎬 Trying D-ID first (12 credits available)...');
        const didResult = await this.generateDIDAvatar(avatarConfig, audioUrl, text);
        console.log('✅ D-ID avatar generation successful!');
        return didResult;
      } catch (error) {
        console.error('❌ D-ID avatar generation failed:', error);
        console.log('🔄 Falling back to HeyGen...');
      }
    }

    if (this.heygenApiKey) {
      try {
        console.log('🎬 Trying HeyGen as fallback...');
        const heygenResult = await this.generateHeyGenAvatar(avatarConfig, audioUrl, text);
        console.log('✅ HeyGen avatar generation successful!');
        return heygenResult;
      } catch (error) {
        console.error('❌ HeyGen avatar generation failed:', error);
      }
    }

    // Fallback to demo video
    console.log('⚠️ Falling back to demo video (no API configured or all APIs failed)');
    const demoVideo = demoVideoService.getDemoVideo(avatarConfig.tutorName);
    return demoVideo.videoUrl;
  }

  private async generateDIDAvatar(
    avatarConfig: AvatarConfig, 
    audioUrl: string, 
    text: string
  ): Promise<string> {
    try {
      console.log('🎬 Starting D-ID avatar generation...');
      console.log('🎬 Using D-ID API key:', this.didApiKey ? 'Present' : 'Missing');
      
      // Simplified request to avoid circular structure error
      const requestBody = {
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-JennyNeural'
          }
        },
        config: {
          fluent: true,
          pad_audio: 0
        },
        source_url: 'https://create-images-results.d-id.com/DefaultPresenters/Sarah/image.jpeg'
      };

      console.log('🎬 D-ID request body:', JSON.stringify(requestBody, null, 2));

      // Fix: Use proper Basic auth format
      const authHeader = `Basic ${Buffer.from(this.didApiKey + ':').toString('base64')}`;

      const response = await axios.post(
        'https://api.d-id.com/talks',
        requestBody,
        {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ D-ID video generation request successful!');
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);

      if (response.data.id) {
        const talkId = response.data.id;
        console.log('✅ Talk ID received:', talkId);
        
        // Poll for video completion
        let videoUrl = '';
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max (30 * 10 seconds)
        
        while (attempts < maxAttempts) {
          console.log(`🔄 Polling for video completion (attempt ${attempts + 1}/${maxAttempts})...`);
          
          try {
            const statusResponse = await axios.get(
              `https://api.d-id.com/talks/${talkId}`,
              {
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );
            
            console.log('✅ Status response status:', statusResponse.status);
            console.log('✅ Status response data:', statusResponse.data);
            
            if (statusResponse.data.status === 'done') {
              videoUrl = statusResponse.data.result_url;
              console.log('✅ Video completed! URL:', videoUrl);
              break;
            } else if (statusResponse.data.status === 'error') {
              throw new Error('Video generation failed');
            } else if (statusResponse.data.status === 'created' || statusResponse.data.status === 'started') {
              console.log('⏳ Video still processing...');
            }
            
            // Wait 10 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 10000));
            attempts++;
            
          } catch (error: any) {
            console.error('❌ Error polling video status:', error);
            if (error.response) {
              console.error('❌ Status response error:', error.response.status, error.response.data);
            }
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
        
        if (videoUrl) {
          return videoUrl;
        } else {
          throw new Error('Video generation timed out');
        }
      } else {
        throw new Error('No talk ID received from D-ID');
      }
      
    } catch (error: any) {
      console.error('❌ D-ID avatar generation failed:', error);
      if (error.response) {
        console.error('❌ D-ID API error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  private async generateHeyGenAvatar(
    avatarConfig: AvatarConfig, 
    audioUrl: string, 
    text: string
  ): Promise<string> {
    try {
      console.log('🎬 Starting HeyGen avatar generation...');
      console.log('🎬 Using HeyGen API key:', this.heygenApiKey ? 'Present' : 'Missing');
      console.log('🎬 Text to generate:', text.substring(0, 100) + '...');
      
      // Use the user's actual avatar ID
      const avatarId = 'Brandon_expressive_public';
      
      const response = await axios.post(
        'https://api.heygen.com/v2/video/generate',
        {
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: avatarId
              },
              voice: {
                type: 'text',
                input_text: text,
                voice_id: '8661cd40d6c44c709e2d0031c0186ada' // Using the correct voice ID
              }
            }
          ],
          test: false,
          // Force lower resolution for basic plan
          aspect_ratio: '1:1',
          resolution: '512x512'
        },
        {
          headers: {
            'X-Api-Key': this.heygenApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('✅ HeyGen video generation request successful!');
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);
      
      if (response.data.data?.video_id) {
        const videoId = response.data.data.video_id;
        console.log('✅ Video ID received:', videoId);
        
        // Poll for video completion using the CORRECT v1 endpoint
        const videoUrl = await this.pollHeyGenVideoStatus(videoId);
        return videoUrl;
      } else {
        throw new Error('No video ID received from HeyGen');
      }
      
    } catch (error: any) {
      console.error('❌ HeyGen avatar generation failed:', error);
      if (error.response) {
        console.error('❌ HeyGen API error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }

  private async pollHeyGenVideoStatus(videoId: string): Promise<string> {
    console.log('🔄 Starting HeyGen video status polling...');
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
    
    while (attempts < maxAttempts) {
      console.log(`🔄 Polling for video completion (attempt ${attempts + 1}/${maxAttempts})...`);
      
      try {
        // ✅ CORRECT: Use v1 endpoint with proper structure
        const statusResponse = await axios.get(
          `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
          {
            headers: {
              'X-Api-Key': this.heygenApiKey,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        console.log('✅ Status response status:', statusResponse.status);
        console.log('✅ Status response data:', statusResponse.data);
        
        // ✅ CORRECT: Check for code: 100 first, then data.status
        if (statusResponse.data.code === 100) {
          const status = statusResponse.data.data?.status;
          
          if (status === 'completed') {
            const videoUrl = statusResponse.data.data?.video_url;
            if (videoUrl) {
              console.log('✅ Video completed! URL:', videoUrl);
              return videoUrl;
            } else {
              throw new Error('Video completed but no URL provided');
            }
          } else if (status === 'failed') {
            const error = statusResponse.data.data?.error;
            const errorMessage = error?.message || error?.detail || 'Unknown error';
            throw new Error(`Video generation failed: ${errorMessage}`);
          } else if (status === 'processing' || status === 'pending') {
            console.log('⏳ Video still processing...');
          } else {
            console.log(`⏳ Unknown status: ${status}`);
          }
        } else {
          console.error('❌ HeyGen API returned error code:', statusResponse.data.code);
          console.error('❌ Error message:', statusResponse.data.message);
          throw new Error(`HeyGen API error: ${statusResponse.data.message || 'Unknown error'}`);
        }
        
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        
      } catch (error: any) {
        console.error('❌ Error polling video status:', error);
        if (error.response) {
          console.error('❌ Status response error:', error.response.status, error.response.data);
          
          // If it's a 404, the video might not exist or be invalid
          if (error.response.status === 404) {
            console.error('❌ Video ID not found or invalid:', videoId);
            throw new Error('Video ID not found or invalid');
          }
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error('Video generation timed out');
  }

  async getAvailableVoices(): Promise<Array<{ id: string; name: string; gender: string }>> {
    if (!this.elevenLabsApiKey) {
      return [
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Josh', gender: 'male' },
        { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female' }
      ];
    }

    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.elevenLabsApiKey
        }
      });

      return response.data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || 'unknown'
      }));
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Josh', gender: 'male' },
        { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female' }
      ];
    }
  }

  createAvatarConfig(tutorName: string): AvatarConfig {
    return {
      tutorName,
      gender: tutorName.toLowerCase().includes('john') || tutorName.toLowerCase().includes('mike') ? 'male' : 'female',
      age: 30,
      ethnicity: 'mixed',
      style: 'professional'
    };
  }

  createSpeechConfig(tutorName: string): SpeechConfig {
    return {
      text: '',
      voice: '21m00Tcm4TlvDq8ikWAM', // Default voice
      speed: 1.0,
      pitch: 1.0
    };
  }

  getServiceStatus(): { status: string; features: any } {
    return {
      status: this.isConfigured ? 'active' : 'limited',
      features: {
        textToSpeech: !!this.elevenLabsApiKey,
        avatarGeneration: !!(this.didApiKey || this.heygenApiKey),
        voiceSynthesis: !!this.elevenLabsApiKey,
        dId: !!this.didApiKey,
        heygen: !!this.heygenApiKey
      }
    };
  }
}

export default new AvatarService(); 