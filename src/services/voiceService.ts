import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import path from 'path';

class VoiceService {
  private openai!: OpenAI;
  private elevenLabsApiKey: string;
  private isConfigured: boolean = false;

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY;
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '';
    
    if (openaiKey) {
      this.openai = new OpenAI({
        apiKey: openaiKey
      });
      this.isConfigured = true;
    } else {
      console.warn('OpenAI API key not found. Speech-to-text will not work.');
    }

    if (!this.elevenLabsApiKey) {
      console.warn('ElevenLabs API key not found. Text-to-speech will not work.');
    }
  }

  /**
   * Convert speech to text using OpenAI Whisper
   */
  async speechToText(audioBuffer: Buffer, language: string = 'en'): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('OpenAI API not configured');
    }

    try {
      // Create a temporary file for the audio
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFile = path.join(tempDir, `audio_${Date.now()}.webm`);
      fs.writeFileSync(tempFile, audioBuffer);

      // Use OpenAI Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        language: language,
        response_format: 'text'
      });

      // Clean up temporary file
      fs.unlinkSync(tempFile);

      return transcription;
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw new Error('Failed to convert speech to text');
    }
  }

  /**
   * Convert text to speech using ElevenLabs
   */
  async textToSpeech(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<Buffer> {
    if (!this.elevenLabsApiKey) {
      throw new Error('ElevenLabs API not configured');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw new Error('Failed to convert text to speech');
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices(): Promise<any[]> {
    if (!this.elevenLabsApiKey) {
      return [];
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.elevenLabsApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const data = await response.json() as { voices?: any[] };
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  /**
   * Create a custom voice (for future use)
   */
  async createCustomVoice(name: string, description: string, audioFile: Buffer): Promise<string> {
    if (!this.elevenLabsApiKey) {
      throw new Error('ElevenLabs API not configured');
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('files', audioFile, {
        filename: 'voice_sample.wav',
        contentType: 'audio/wav'
      });

      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': this.elevenLabsApiKey,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const data = await response.json() as { voice_id?: string };
      return data.voice_id || '';
    } catch (error) {
      console.error('Error creating custom voice:', error);
      throw new Error('Failed to create custom voice');
    }
  }

  /**
   * Process audio for better quality (noise reduction, etc.)
   */
  async processAudio(audioBuffer: Buffer): Promise<Buffer> {
    // For now, return the original buffer
    // In the future, this could include noise reduction, normalization, etc.
    return audioBuffer;
  }

  /**
   * Check if voice services are available
   */
  isVoiceEnabled(): boolean {
    return this.isConfigured && !!this.elevenLabsApiKey;
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    speechToText: boolean;
    textToSpeech: boolean;
    configured: boolean;
  } {
    return {
      speechToText: this.isConfigured,
      textToSpeech: !!this.elevenLabsApiKey,
      configured: this.isConfigured && !!this.elevenLabsApiKey
    };
  }
}

export default new VoiceService(); 