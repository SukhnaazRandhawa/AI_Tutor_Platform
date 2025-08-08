import StreamingAvatar, { AvatarQuality, StreamingEvents } from '@heygen/streaming-avatar';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneOff,
  Play,
  Send,
  Upload,
  Video,
  VideoOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { heygenAPI, sessionAPI, videoAPI } from '../services/api';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date | string;
  attachments?: string[];
}

interface VideoStream {
  videoUrl: string;
  audioUrl: string;
  duration: number;
  isLive: boolean;
}

export default function VideoCall() {
  const { sessionId } = useParams();
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State management - ALL HOOKS MUST BE AT THE TOP
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  
  // Video streaming state
  const [videoStream, setVideoStream] = useState<VideoStream | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  
  // HeyGen Streaming SDK state - FIXED: Added more detailed state tracking
  const [streamingReady, setStreamingReady] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  
  // Add state for reconnection
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const maxReconnectionAttempts = 3;
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamingAvatarRef = useRef<any>(null);
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  
  // ALL useEffect hooks must be before any early returns
  // Check if user is authenticated
  useEffect(() => {
    console.log('🔐 Auth state:', { token: !!token, user: !!user, authLoading });
    if (!authLoading && (!token || !user)) {
      console.log('❌ User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    if (token && user) {
      console.log('✅ User authenticated:', user.name);
    }
  }, [token, user, authLoading, navigate]);
  
  // Initialize session
  useEffect(() => {
    if (currentSessionId) {
      const initSession = async () => {
        try {
          setIsLoading(true);
          const response = await sessionAPI.getActiveSession();
          if (response.data.success) {
            setCurrentSessionId(response.data.session.id);
            setMessages(response.data.session.messages || []);
            setIsCallActive(true);
            
            // Start video stream
            await startVideoStream(response.data.session.id);
          }
        } catch (error: any) {
          console.error('Failed to get session:', error);
          setIsCallActive(false);
        } finally {
          setIsLoading(false);
        }
      };
      initSession();
    } else if (sessionId) {
      setCurrentSessionId(sessionId);
    } else {
      console.log('No session ID available, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [currentSessionId, sessionId, navigate]);

  // Initialize voice recognition
  useEffect(() => {
    initializeVoiceRecognition();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle video stream updates
  useEffect(() => {
    if (videoStream && videoRef.current) {
      const url = videoStream.videoUrl || '';
      if (!/^https?:\/\//i.test(url)) {
        return;
      }
      videoRef.current.src = url;
      videoRef.current.load();
    }
  }, [videoStream]);

  // Handle audio stream updates
  useEffect(() => {
    if (videoStream && audioRef.current) {
      const url = videoStream.audioUrl || '';
      if (!/^https?:\/\//i.test(url)) {
        return;
      }
      audioRef.current.src = url;
      audioRef.current.load();
    }
  }, [videoStream]);

  // FIXED: Debug avatar container mounting
  useEffect(() => {
    if (avatarContainerRef.current) {
      console.log('🎬 Avatar container ref is ready:', {
        width: avatarContainerRef.current.offsetWidth,
        height: avatarContainerRef.current.offsetHeight,
        mounted: !!avatarContainerRef.current.parentElement
      });
    }
  }, [streamingReady, avatarReady]);
  
  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render if not authenticated
  if (!token || !user) {
    return null;
  }
  
  // Enhanced tryStartHeyGenStreaming with reconnection logic
  const tryStartHeyGenStreaming = async (isReconnection = false) => {
    try {
      setStreamingError(null);
      if (isReconnection) {
        setIsReconnecting(true);
        console.log('🔄 Attempting to reconnect avatar...');
      } else {
        console.log('🎬 Starting HeyGen streaming process...');
      }
      
      // Get fresh token for each attempt
      const { data } = await heygenAPI.createStreamingToken();
      const token: string | undefined = data?.token;
      if (!token) {
        throw new Error('No HeyGen streaming token returned from backend');
      }

      console.log('🎬 HeyGen token received:', token.substring(0, 20) + '...');

      // Clean up previous instance
      if (streamingAvatarRef.current) {
        try {
          await streamingAvatarRef.current.stopAvatar?.();
        } catch (e) {
          console.log('Error stopping previous avatar:', e);
        }
      }

      // Init new SDK instance
      const sdk = new StreamingAvatar({ token });
      streamingAvatarRef.current = sdk;

      console.log('🎬 HeyGen SDK initialized');

      // Enhanced event handlers with reconnection logic
      sdk.on(StreamingEvents.STREAM_READY, () => {
        console.log('🎬 HeyGen stream ready!');
        setStreamingReady(true);
        setReconnectionAttempts(0); // Reset on successful connection
        setIsReconnecting(false);
      });
      
      sdk.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('🎬 HeyGen stream disconnected');
        setStreamingReady(false);
        setAvatarReady(false);
        
        // Auto-reconnection logic
        if (isCallActive && reconnectionAttempts < maxReconnectionAttempts) {
          console.log(`🔄 Auto-reconnecting in 3 seconds... (Attempt ${reconnectionAttempts + 1}/${maxReconnectionAttempts})`);
          setTimeout(() => {
            setReconnectionAttempts(prev => prev + 1);
            tryStartHeyGenStreaming(true);
          }, 3000);
        } else if (reconnectionAttempts >= maxReconnectionAttempts) {
          console.log('❌ Max reconnection attempts reached');
          setStreamingError('Avatar disconnected. Max reconnection attempts reached.');
          setIsReconnecting(false);
          toast.error('Avatar connection lost. Please restart the call.');
        }
      });

      // Add connection quality monitoring
      sdk.on(StreamingEvents.STREAM_READY, () => {
        console.log('🎬 Stream quality check...');
        // Monitor connection quality
        setInterval(() => {
          if (sdk && streamingReady) {
            // Check if stream is still active - simplified check
            if (!isCallActive) {
              console.log('⚠️ Call no longer active, stopping monitoring');
              return;
            }
          }
        }, 30000); // Check every 30 seconds
      });

      sdk.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('🎬 Avatar started talking');
      });

      sdk.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('🎬 Avatar stopped talking');
      });

      // Create avatar with error handling
      const avatarId = process.env.REACT_APP_HEYGEN_AVATAR_ID || 'Graham_ProfessionalLook2_public';
      console.log('🎬 Creating HeyGen avatar with ID:', avatarId);
      
      await sdk.createStartAvatar({
        quality: AvatarQuality.Low, // Use Low for better stability
        avatarName: avatarId,
        language: 'en'
      });

      console.log('🎬 HeyGen avatar created successfully');
      setAvatarReady(true);

      // Enhanced container attachment with size preservation
      setTimeout(() => {
        if (avatarContainerRef.current && sdk) {
          console.log('🎬 Attempting to attach avatar to container...');
          
          // Store original container dimensions
          const originalWidth = avatarContainerRef.current.offsetWidth;
          const originalHeight = avatarContainerRef.current.offsetHeight;
          
          console.log('🎬 Container dimensions:', { width: originalWidth, height: originalHeight });

          if (sdk.mediaStream) {
            console.log('🎬 Media stream available, creating video element');
            
            // Create video element with size preservation
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.muted = false;
            video.style.cssText = `
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              background: #000 !important;
              min-width: ${originalWidth}px !important;
              min-height: ${originalHeight}px !important;
            `;
            video.srcObject = sdk.mediaStream;
            
            // Add CSS class for additional styling
            video.className = 'heygen-avatar-video';
            
            // Clear container and add video
            avatarContainerRef.current.innerHTML = '';
            avatarContainerRef.current.appendChild(video);
            
            // Ensure container maintains its size
            avatarContainerRef.current.style.cssText += `
              width: ${originalWidth}px !important;
              height: ${originalHeight}px !important;
              min-width: ${originalWidth}px !important;
              min-height: ${originalHeight}px !important;
              position: relative !important;
              overflow: hidden !important;
            `;
            
            console.log('🎬 Video element attached with size preservation');
            
            // Monitor for size changes and fix them
            const sizeObserver = new ResizeObserver(() => {
              if (avatarContainerRef.current && video) {
                const currentWidth = avatarContainerRef.current.offsetWidth;
                const currentHeight = avatarContainerRef.current.offsetHeight;
                
                if (currentWidth < originalWidth * 0.8 || currentHeight < originalHeight * 0.8) {
                  console.log('🔧 Fixing avatar size shrinkage');
                  avatarContainerRef.current.style.width = originalWidth + 'px';
                  avatarContainerRef.current.style.height = originalHeight + 'px';
                  video.style.width = '100%';
                  video.style.height = '100%';
                }
              }
            });
            
            sizeObserver.observe(avatarContainerRef.current);
            
            // Store cleanup function
            (video as any)._cleanup = () => sizeObserver.disconnect();
            
          } else if ((sdk as any).attach) {
            console.log('🎬 Using SDK attach method');
            (sdk as any).attach(avatarContainerRef.current);
          } else {
            console.warn('�� No media stream or attach method available');
          }
        }
      }, 1000);

      return true;
    } catch (err: any) {
      console.error('❌ HeyGen streaming init failed:', err);
      setStreamingError(err.message || 'Failed to initialize avatar');
      setStreamingReady(false);
      setAvatarReady(false);
      setIsReconnecting(false);
      
      // Auto-retry logic for connection failures
      if (isCallActive && reconnectionAttempts < maxReconnectionAttempts && !isReconnection) {
        console.log('🔄 Retrying avatar connection in 5 seconds...');
        setTimeout(() => {
          setReconnectionAttempts(prev => prev + 1);
          tryStartHeyGenStreaming(true);
        }, 5000);
      } else {
        toast.error('Avatar failed to load. Using fallback display.');
      }
      
      return false;
    }
  };

  // Add manual reconnect function
  const handleManualReconnect = async () => {
    if (!isCallActive) return;
    
    setReconnectionAttempts(0);
    await tryStartHeyGenStreaming(true);
  };

  const initializeVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        toast.success('Listening... Speak now!');
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
        toast.success(`You said: "${transcript}"`);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
      setIsVoiceSupported(false);
    }
  };

  const startVideoStream = async (sessionId: string) => {
    try {
      console.log('🎬 Starting video stream for session:', sessionId);
      console.log('🎬 User:', user?.name);
      console.log('🎬 Tutor:', user?.aiTutorName);

      // Try real-time streaming first
      const started = await tryStartHeyGenStreaming();
      if (started) {
        setIsVideoPlaying(true);
        return;
      }
      
      // Fallback to regular video API
      const response = await videoAPI.startStream(sessionId, user?.aiTutorName || 'John', `Hello ${user?.name}! I'm ${user?.aiTutorName}, your AI tutor. How can I help you today?`);
      console.log('✅ Video stream response:', response.data);
      
      if (response.data.success) {
        setVideoStream(response.data.videoStream);
        setIsVideoPlaying(true);
        console.log('✅ Video stream started successfully');
      }
    } catch (error) {
      console.error('❌ Failed to start video stream:', error);
      toast.error('Failed to start video stream. Please try again.');
    }
  };

  const handleStartCall = async () => {
    try {
      setIsLoading(true);
      
      // Clear any stale active sessions
      try {
        await sessionAPI.clearActiveSessions();
        console.log('Cleared any stale active sessions');
      } catch (error) {
        console.log('No stale sessions to clear or error clearing:', error);
      }
      
      // Start a new session
      const response = await sessionAPI.startSession('General Learning');
      if (response.data.success) {
        setCurrentSessionId(response.data.session.id);
        setMessages(response.data.session.messages || []);
        setIsCallActive(true);
        
        // Start video stream
        await startVideoStream(response.data.session.id);
        
        toast.success('Call started! Your AI tutor is ready.');
      }
      
    } catch (error: any) {
      console.error('Failed to start call:', error);
      const errorMessage = error.response?.data?.error || 'Failed to start call';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    try {
      if (currentSessionId) {
        await sessionAPI.endSession(currentSessionId);
        await videoAPI.stopStream(currentSessionId);
      }
      
      // Stop HeyGen streaming if active
      try {
        await streamingAvatarRef.current?.stopAvatar?.();
        streamingAvatarRef.current = null;
      } catch (error) {
        console.log('Error stopping avatar:', error);
      }
      
      setIsCallActive(false);
      setCurrentSessionId(null);
      setMessages([]);
      setVideoStream(null);
      setStreamingReady(false);
      setAvatarReady(false);
      setStreamingError(null);
      setIsVideoPlaying(false);
      
      toast.success('Call ended');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = newMessage;
    setNewMessage('');

    try {
      const response = await sessionAPI.sendMessage(messageToSend, currentSessionId);
      if (response.data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

        // FIXED: Make avatar speak the response
        if (streamingAvatarRef.current && avatarReady) {
          try {
            await streamingAvatarRef.current.speak({
              text: response.data.response,
              taskType: 'talk',
            });
            console.log('🎬 Avatar speaking response');
          } catch (error) {
            console.error('Failed to make avatar speak:', error);
          }
        }

        // Generate talking response for fallback video
        await generateTalkingResponse(response.data.response);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const generateTalkingResponse = async (message: string) => {
    try {
      if (!currentSessionId) return;
      
      const response = await videoAPI.generateTalkingResponse(currentSessionId, message);
      if (response.data.success) {
        setVideoStream(response.data.stream);
        setIsVideoPlaying(true);
      }
    } catch (error) {
      console.error('Failed to generate talking response:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Microphone enabled' : 'Microphone muted');
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    toast.success(isVideoOn ? 'Video disabled' : 'Video enabled');
  };

  const toggleVolume = () => {
    setIsVolumeOn(!isVolumeOn);
    if (audioRef.current) {
      audioRef.current.muted = !isVolumeOn;
    }
    toast.success(isVolumeOn ? 'Volume muted' : 'Volume enabled');
  };

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const startVoiceInput = () => {
    if (recognitionRef.current && isVoiceSupported) {
      recognitionRef.current.start();
    } else {
      toast.error('Voice recognition not supported in this browser');
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div key={`video-call-${currentSessionId || 'no-session'}`} className="h-screen bg-secondary-900 flex flex-col">
      <header className="bg-secondary-800 border-b border-secondary-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-secondary-400 hover:text-white hover:bg-secondary-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                Session with {user?.aiTutorName}
              </h1>
              <p className="text-sm text-secondary-400">
                Session ID: {currentSessionId || 'Not started'}
              </p>
              {/* FIXED: Show streaming status */}
              {streamingError && (
                <p className="text-xs text-red-400">
                  Avatar Error: {streamingError}
                </p>
              )}
              {isReconnecting && (
                <p className="text-xs text-yellow-400">
                  🔄 Reconnecting... (Attempt {reconnectionAttempts + 1}/{maxReconnectionAttempts})
                </p>
              )}
            </div>
          </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted 
                    ? 'bg-red-600 text-white' 
                    : 'text-secondary-400 hover:text-white hover:bg-secondary-700'
                }`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-2 rounded-lg transition-colors ${
                  !isVideoOn 
                    ? 'bg-red-600 text-white' 
                    : 'text-secondary-400 hover:text-white hover:bg-secondary-700'
                }`}
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
              <button
                onClick={toggleVolume}
                className={`p-2 rounded-lg transition-colors ${
                  !isVolumeOn 
                    ? 'bg-red-600 text-white' 
                    : 'text-secondary-400 hover:text-white hover:bg-secondary-700'
                }`}
              >
                {isVolumeOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              <button
                onClick={toggleChat}
                className={`p-2 rounded-lg transition-colors ${
                  showChat 
                    ? 'bg-primary-600 text-white' 
                    : 'text-secondary-400 hover:text-white hover:bg-secondary-700'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

      <main className="flex h-[calc(100vh-80px)]">
        {/* Video Area */}
        <div className={`flex-1 p-6 ${showChat ? 'mr-4' : ''}`}>
          <motion.div
            key="video-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col"
          >
            {/* Main Video Display */}
            <div className="flex-1 bg-secondary-800 rounded-xl border border-secondary-700 flex items-center justify-center mb-4 relative overflow-hidden">
              {/* FIXED: Better conditional rendering for avatar */}
              {isCallActive && (streamingReady || avatarReady) ? (
                <div className="w-full h-full relative">
                  {/* HeyGen Avatar Container - FIXED: Always render with proper styling */}
                  <div 
                    ref={avatarContainerRef} 
                    className="w-full h-full bg-black rounded-xl"
                    style={{ minHeight: '400px' }}
                  />
                  
                  {/* Status overlay */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                    {streamingReady ? '🔴 Live Avatar' : '🔄 Loading Avatar...'}
                  </div>
                  
                  {/* Debug info - remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Stream: {streamingReady ? 'Ready' : 'Not Ready'} | 
                      Avatar: {avatarReady ? 'Ready' : 'Not Ready'}
                      {isReconnecting && ` | Reconnecting: ${reconnectionAttempts}/${maxReconnectionAttempts}`}
                    </div>
                  )}
                </div>
              ) : isCallActive && videoStream ? (
                <div className="w-full h-full relative">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-xl"
                    autoPlay
                    muted={!isVolumeOn}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={toggleVideoPlayback}
                      className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
                    >
                      {isVideoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                    {videoQuality} Quality
                  </div>
                </div>
              ) : isCallActive ? (
                <div className="text-center">
                  <div className="h-32 w-32 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-bold text-white">
                      {user?.aiTutorName?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {user?.aiTutorName}
                  </h3>
                  <p className="text-secondary-400">Your AI Tutor</p>
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">
                      {streamingReady ? 'Avatar Loading...' : 'Connecting...'}
                    </span>
                  </div>
                  {streamingError && (
                    <p className="text-red-400 text-sm mt-2">
                      Avatar failed to load. Using fallback display.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Video className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-400 mb-4">Ready to start your learning session</p>
                  <button
                    onClick={handleStartCall}
                    disabled={isLoading}
                    className="btn-primary flex items-center space-x-2 mx-auto"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Phone className="h-4 w-4" />
                        <span>Start Call</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* Hidden audio element for AI tutor speech */}
              <audio
                ref={audioRef}
                autoPlay
                muted={!isVolumeOn}
                style={{ display: 'none' }}
              />
            </div>

            {/* Call Controls */}
            {isCallActive && (
              <div className="flex justify-center space-x-4">
                <button
                  key="mute-button"
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted 
                      ? 'bg-red-600 text-white' 
                      : 'bg-secondary-700 text-white hover:bg-secondary-600'
                  }`}
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                <button
                  key="end-call-button"
                  onClick={handleEndCall}
                  className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
                <button
                  key="video-toggle-button"
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    !isVideoOn 
                      ? 'bg-red-600 text-white' 
                      : 'bg-secondary-700 text-white hover:bg-secondary-600'
                  }`}
                >
                  {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </button>
                {/* Manual reconnect button */}
                {streamingError && (
                  <button
                    key="reconnect-button"
                    onClick={handleManualReconnect}
                    disabled={isReconnecting}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                    title="Reconnect Avatar"
                  >
                    <div className="h-6 w-6 flex items-center justify-center">
                      {isReconnecting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <span className="text-sm">🔄</span>
                      )}
                    </div>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Chat Sidebar - Same as original */}
        {showChat && (
          <motion.div
            key="chat-sidebar"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-96 bg-secondary-800 border-l border-secondary-700 flex flex-col"
          >
            <div className="p-4 border-b border-secondary-700">
              <h3 className="text-lg font-semibold text-white">Chat with {user?.aiTutorName}</h3>
              <p className="text-sm text-secondary-400">
                {isCallActive ? 'Live session' : 'Session not started'}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-secondary-400 mt-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the call to begin chatting</p>
                </div>
              ) : (
                messages.map((message, idx) => (
                  <motion.div
                    key={`${message.id || message.timestamp || 'msg'}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-secondary-700 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-secondary-700">
              <div className="flex space-x-2">
                <button className="p-2 text-secondary-400 hover:text-white hover:bg-secondary-700 rounded-lg transition-colors">
                  <Upload className="h-5 w-5" />
                </button>
                <button className="p-2 text-secondary-400 hover:text-white hover:bg-secondary-700 rounded-lg transition-colors">
                  <FileText className="h-5 w-5" />
                </button>
                {/* Voice Input Button */}
                {isVoiceSupported && (
                  <button
                    onClick={isListening ? stopVoiceInput : startVoiceInput}
                    disabled={!isCallActive}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'text-secondary-400 hover:text-white hover:bg-secondary-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                )}
                <div className="flex-1 relative">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isVoiceSupported ? "Type your message or use voice input..." : "Type your message..."}
                    disabled={!isCallActive}
                    className="w-full px-3 py-2 bg-secondary-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isCallActive}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              {isVoiceSupported && (
                <p className="text-xs text-secondary-400 mt-2">
                  💡 Tip: Click the microphone button to speak with your AI tutor!
                </p>
              )}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}