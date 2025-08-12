import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
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
import AdvancedTTSAvatar from '../components/AdvancedTTSAvatar';
import { useAuth } from '../components/AuthProvider';
import { useAvatarController } from '../hooks/useAvatarController';
import { sessionAPI, videoAPI } from '../services/api';

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

export default function VideoCall() {
  const { sessionId } = useParams();
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Avatar controller hook
  const avatarController = useAvatarController();
  
  // State management
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [speechText, setSpeechText] = useState<string>(''); // Text for TTS avatar to speak
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const avatarReadyRef = useRef(false);
  
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize voice recognition
  useEffect(() => {
    initializeVoiceRecognition();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const response = await videoAPI.startStream(sessionId, user?.aiTutorName || 'John', `Hello ${user?.name}! I'm ${user?.aiTutorName}, your AI tutor. How can I help you today?`);
      console.log('✅ Video stream response:', response.data);
      
      if (response.data.success) {
        // setVideoStream(response.data.videoStream); // Removed as per edit hint
        // setIsVideoPlaying(true); // Removed as per edit hint
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
      
      // Reset avatar ready state for new session
      avatarReadyRef.current = false;
      
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
        
        // Make avatar wave and show happy emotion
        avatarController.triggerGesture('wave');
        avatarController.setEmotion('happy');
        
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
      
      // Stop video stream
      if (currentSessionId) {
        await videoAPI.stopStream(currentSessionId);
      }
      
      // Make avatar nod and show neutral emotion
      avatarController.triggerGesture('nod');
      avatarController.setEmotion('neutral');
      
      // Reset avatar ready state
      avatarReadyRef.current = false;
      
      setIsCallActive(false);
      setCurrentSessionId(null);
      setMessages([]);
      // setVideoStream(null); // Removed as per edit hint
      // setIsVideoPlaying(false); // Removed as per edit hint
      
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
      // Make avatar show thinking emotion
      avatarController.setEmotion('thinking');
      
      const response = await sessionAPI.sendMessage(messageToSend, currentSessionId);
      if (response.data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          content: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

        // Set speech text for TTS avatar to speak
        setSpeechText(response.data.response);

        // Make avatar speak and show explaining emotion
        avatarController.startTalking();
        avatarController.setEmotion('explaining');
        
        // Stop talking after a delay
        setTimeout(() => {
          avatarController.stopTalking();
          avatarController.setEmotion('listening');
          setSpeechText(''); // Clear speech text
        }, 5000); // Increased to 5 seconds for longer responses

      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      avatarController.setEmotion('neutral');
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
    if (!isMuted) {
      avatarController.triggerGesture('wave');
      avatarController.setEmotion('happy');
    } else {
      avatarController.setEmotion('listening');
    }
    toast.success(isMuted ? 'Microphone enabled' : 'Microphone muted');
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (!isVideoOn) {
      avatarController.triggerGesture('point');
      avatarController.setEmotion('explaining');
    } else {
      avatarController.setEmotion('listening');
    }
    toast.success(isVideoOn ? 'Video disabled' : 'Video enabled');
  };

  const toggleVolume = () => {
    setIsVolumeOn(!isVolumeOn);
    if (!isVolumeOn) {
      avatarController.triggerGesture('nod');
      avatarController.setEmotion('happy');
    } else {
      avatarController.setEmotion('listening');
    }
    toast.success(isVolumeOn ? 'Volume muted' : 'Volume enabled');
  };

  const toggleChat = () => {
    setShowChat(!showChat);
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
            {/* Status Bar */}
            <div className="flex items-center justify-between text-sm text-secondary-400 mb-4">
              <div className="flex items-center space-x-4">
                <span>Session: {sessionId}</span>
                <span>User: {user?.name}</span>
                <span>Tutor: {user?.aiTutorName}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span>Status: {isCallActive ? 'Active' : 'Ready'}</span>
              </div>
            </div>
            {/* Main Video Display */}
            <div className="flex-1 bg-secondary-800 rounded-xl border border-secondary-700 flex items-center justify-center mb-4 relative overflow-hidden">
              {isCallActive ? (
                <AdvancedTTSAvatar
                  isTalking={avatarController.state.isTalking}
                  isAnimating={avatarController.state.isAnimating}
                  avatarName={user?.aiTutorName || 'AI Tutor'}
                  currentEmotion={avatarController.state.currentEmotion}
                  speechText={speechText}
                  onSpeechStart={() => {
                    console.log('🎭 TTS Avatar started speaking');
                  }}
                  onSpeechEnd={() => {
                    console.log('🎭 TTS Avatar finished speaking');
                  }}
                  onAvatarReady={() => {
                    if (!avatarReadyRef.current) {
                      console.log('🎭 Advanced TTS Avatar ready!');
                      avatarController.setEmotion('listening');
                      avatarReadyRef.current = true;
                    }
                  }}
                />
              ) : (
                <div className="text-center">
                  <Video className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-400 mb-4">Ready to start your learning session</p>
                  <div className="space-y-3">
                    <button
                      onClick={handleStartCall}
                      disabled={isLoading}
                      className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
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
                    
                    {/* Test TTS Button */}
                    <button
                      onClick={() => {
                        setSpeechText("Hello! I'm your AI tutor. This is a demonstration of my advanced text-to-speech capabilities with realistic lip sync and natural voice synthesis.");
                        avatarController.startTalking();
                        avatarController.setEmotion('explaining');
                        setTimeout(() => {
                          avatarController.stopTalking();
                          avatarController.setEmotion('listening');
                          setSpeechText('');
                        }, 8000);
                      }}
                      disabled={isLoading}
                      className="bg-secondary-600 hover:bg-secondary-700 disabled:bg-secondary-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Test TTS Voice</span>
                    </button>
                    
                    {/* Avatar Info */}
                    <div className="text-center text-xs text-secondary-500 max-w-md mx-auto mt-3">
                      <p>🎭 <strong>Advanced TTS Avatar:</strong> Real speech synthesis with lip sync!</p>
                      <p>Features: 8 mouth positions, phoneme detection, breathing, head movements.</p>
                      <p>Uses browser Speech Synthesis API for natural voice.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hidden audio element for AI tutor speech */}
              {/* Audio is now handled by the 3D avatar */}
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
                  {/* Removed FileText icon */}
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