interface DemoVideo {
  videoUrl: string;
  audioUrl: string;
  duration: number;
  isLive: boolean;
}

class DemoVideoService {
  private demoVideos: Map<string, DemoVideo> = new Map();

  constructor() {
    this.initializeDemoVideos();
  }

  private initializeDemoVideos() {
    // Demo videos for different tutors
    this.demoVideos.set('john', {
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 10,
      isLive: true
    });

    this.demoVideos.set('sarah', {
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 15,
      isLive: true
    });

    this.demoVideos.set('mike', {
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 20,
      isLive: true
    });

    this.demoVideos.set('emma', {
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_10mb.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 25,
      isLive: true
    });
  }

  /**
   * Get demo video for a tutor
   */
  getDemoVideo(tutorName: string): DemoVideo {
    const normalizedName = tutorName.toLowerCase();
    return this.demoVideos.get(normalizedName) || this.demoVideos.get('john')!;
  }

  /**
   * Generate a talking response demo
   */
  generateTalkingResponse(tutorName: string, message: string): DemoVideo {
    const baseVideo = this.getDemoVideo(tutorName);
    
    // Simulate different response durations based on message length
    const duration = Math.max(3, Math.min(30, Math.ceil(message.length / 10)));
    
    return {
      ...baseVideo,
      duration,
      isLive: true
    };
  }

  /**
   * Get available demo tutors
   */
  getAvailableTutors(): Array<{
    name: string;
    gender: 'male' | 'female';
    specialty: string[];
    avatarUrl: string;
  }> {
    return [
      {
        name: 'John',
        gender: 'male',
        specialty: ['Mathematics', 'Physics', 'Computer Science'],
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Sarah',
        gender: 'female',
        specialty: ['Biology', 'Chemistry', 'English'],
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Mike',
        gender: 'male',
        specialty: ['History', 'Geography', 'Economics'],
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      },
      {
        name: 'Emma',
        gender: 'female',
        specialty: ['Literature', 'Art', 'Music'],
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      }
    ];
  }
}

export default new DemoVideoService(); 