import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Session management
  joinSession(sessionId: string) {
    if (this.socket) {
      this.socket.emit('join-session', sessionId);
    }
  }

  leaveSession(sessionId: string) {
    if (this.socket) {
      this.socket.emit('leave-session', sessionId);
    }
  }

  // Chat messaging
  sendMessage(data: { sessionId: string; message: string; sender: 'user' | 'ai' }) {
    if (this.socket) {
      this.socket.emit('send-message', data);
    }
  }

  onNewMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  // Voice communication
  startVoice(data: { sessionId: string }) {
    if (this.socket) {
      this.socket.emit('voice-start', data);
    }
  }

  sendVoiceData(data: { sessionId: string; audioData: any }) {
    if (this.socket) {
      this.socket.emit('voice-data', data);
    }
  }

  endVoice(data: { sessionId: string }) {
    if (this.socket) {
      this.socket.emit('voice-end', data);
    }
  }

  onVoiceStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('voice-started', callback);
    }
  }

  onVoiceReceived(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('voice-received', callback);
    }
  }

  onVoiceEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('voice-ended', callback);
    }
  }

  // Avatar video communication
  startAvatar(data: { sessionId: string; avatarConfig: any }) {
    if (this.socket) {
      this.socket.emit('avatar-start', data);
    }
  }

  sendAvatarVideo(data: { sessionId: string; videoData: any }) {
    if (this.socket) {
      this.socket.emit('avatar-stream', data);
    }
  }

  avatarVideoReady(data: { sessionId: string; videoUrl: string; videoId: string }) {
    if (this.socket) {
      this.socket.emit('avatar-video-ready', data);
    }
  }

  endAvatar(data: { sessionId: string }) {
    if (this.socket) {
      this.socket.emit('avatar-end', data);
    }
  }

  onAvatarStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('avatar-started', callback);
    }
  }

  onAvatarVideoAvailable(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('avatar-video-available', callback);
    }
  }

  onAvatarStreamReceived(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('avatar-stream-received', callback);
    }
  }

  onAvatarEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('avatar-ended', callback);
    }
  }

  // Utility methods
  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Clean up event listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  removeListener(event: string) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }
}

export default new SocketService(); 