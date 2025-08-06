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
    // Demo videos for different tutors - using more reliable URLs
    this.demoVideos.set('john', {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 10,
      isLive: true
    });

    this.demoVideos.set('sarah', {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 15,
      isLive: true
    });

    this.demoVideos.set('sonia', {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 12,
      isLive: true
    });

    this.demoVideos.set('mike', {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 20,
      isLive: true
    });

    this.demoVideos.set('emma', {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 25,
      isLive: true
    });

    // Default fallback
    this.demoVideos.set('default', {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      duration: 10,
      isLive: true
    });
  }

  /**
   * Get demo video for a tutor
   */
  getDemoVideo(tutorName: string): DemoVideo {
    const normalizedName = tutorName.toLowerCase();
    return this.demoVideos.get(normalizedName) || this.demoVideos.get('default')!;
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
        name: 'Sonia',
        gender: 'female',
        specialty: ['Mathematics', 'Science', 'General Tutoring'],
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
        specialty: ['Literature', 'Art', 'Languages'],
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      }
    ];
  }

  /**
   * Get service status
   */
  getServiceStatus(): { status: string; features: any } {
    return {
      status: 'active',
      features: {
        demoVideos: true,
        multipleTutors: true,
        talkingResponses: true
      }
    };
  }
}

export default new DemoVideoService(); 