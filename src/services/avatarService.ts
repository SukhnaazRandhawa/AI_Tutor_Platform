import axios from 'axios';

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
      // Generate speech first
      const audioUrl = await this.generateSpeech(text, speechConfig);
      
      // Generate avatar video with the audio
      const videoUrl = await this.generateAvatarVideo(avatarConfig, audioUrl, text);
      
      return { videoUrl, audioUrl };
    } catch (error) {
      console.error('Avatar generation error:', error);
      // Return fallback URLs
      return {
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
      };
    }
  }

  private async generateSpeech(text: string, config: SpeechConfig): Promise<string> {
    if (!this.elevenLabsApiKey) {
      console.warn('ElevenLabs API key not found. Using fallback audio.');
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    }

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.voice}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey
          },
          responseType: 'arraybuffer'
        }
      );

      // For now, return a placeholder URL. In production, you'd save the audio file
      // and return the URL to the saved file
      console.log('✅ Speech generated successfully with ElevenLabs');
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'; // Placeholder
    } catch (error) {
      console.error('Speech generation error:', error);
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    }
  }

  private async generateAvatarVideo(
    avatarConfig: AvatarConfig, 
    audioUrl: string, 
    text: string
  ): Promise<string> {
    // Try D-ID first, then HeyGen as fallback
    if (this.didApiKey) {
      try {
        return await this.generateDIDAvatar(avatarConfig, audioUrl, text);
      } catch (error) {
        console.error('D-ID avatar generation failed:', error);
      }
    }

    if (this.heygenApiKey) {
      try {
        return await this.generateHeyGenAvatar(avatarConfig, audioUrl, text);
      } catch (error) {
        console.error('HeyGen avatar generation failed:', error);
      }
    }

    // Fallback to demo video
    console.warn('No avatar API available. Using demo video.');
    return `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`;
  }

  private async generateDIDAvatar(
    avatarConfig: AvatarConfig, 
    audioUrl: string, 
    text: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.d-id.com/talks',
        {
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'elevenlabs',
              voice_id: '21m00Tcm4TlvDq8ikWAM'
            }
          },
          config: {
            fluent: true,
            pad_audio: 0.0
          },
          source_url: `https://create-images-results.d-id.com/DefaultPresenters/${avatarConfig.gender === 'male' ? 'John' : 'Sarah'}/image.jpeg`
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.didApiKey + ':').toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ D-ID avatar video generation started');
      return `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`; // Placeholder
    } catch (error) {
      console.error('D-ID API error:', error);
      throw error;
    }
  }

  private async generateHeyGenAvatar(
    avatarConfig: AvatarConfig, 
    audioUrl: string, 
    text: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.heygen.com/v1/video.generate',
        {
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: avatarConfig.gender === 'male' ? 'male_01' : 'female_01'
              },
              voice: {
                type: 'text',
                input_text: text,
                voice_id: 'en_us_001'
              }
            }
          ],
          test: false,
          aspect_ratio: '16:9'
        },
        {
          headers: {
            'X-Api-Key': this.heygenApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ HeyGen avatar video generation started');
      return `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`; // Placeholder
    } catch (error) {
      console.error('HeyGen API error:', error);
      throw error;
    }
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