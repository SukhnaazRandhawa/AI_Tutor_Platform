import { motion } from 'framer-motion';
import {
    ArrowLeft,
    FileText,
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
import { useAuth } from '../components/AuthProvider';
import { sessionAPI } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date | string;
  attachments?: string[];
}

export default function VideoCall() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Initialize session
  useEffect(() => {
    if (currentSessionId) {
      initializeSession();
    }
  }, [currentSessionId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      const response = await sessionAPI.getActiveSession();
      if (response.data.success) {
        setCurrentSessionId(response.data.session.id);
        setMessages(response.data.session.messages || []);
        setIsCallActive(true);
      }
    } catch (error: any) {
      console.error('Failed to get session:', error);
      // If no active session, we'll start a new one
      setIsCallActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCall = async () => {
    try {
      setIsLoading(true);
      
      // First, try to clear any stale active sessions
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
      }
      setIsCallActive(false);
      setCurrentSessionId(null);
      setMessages([]);
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
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
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
    toast.success(isVolumeOn ? 'Volume muted' : 'Volume enabled');
  };

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  return (
    <div className="min-h-screen bg-secondary-900">
      {/* Header */}
      <header className="bg-secondary-800 border-b border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-secondary-400 hover:text-white hover:bg-secondary-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">Session with {user?.aiTutorName}</h1>
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
        </div>
      </header>

      <main className="flex h-[calc(100vh-80px)]">
        {/* Video Area */}
        <div className={`flex-1 p-6 ${showChat ? 'mr-4' : ''}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col"
          >
            {/* Main Video Display */}
            <div className="flex-1 bg-secondary-800 rounded-xl border border-secondary-700 flex items-center justify-center mb-4">
              {isCallActive ? (
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
                    <span className="text-sm text-green-400">Live</span>
                  </div>
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
            </div>

            {/* Call Controls */}
            {isCallActive && (
              <div className="flex justify-center space-x-4">
                <button
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
                  onClick={handleEndCall}
                  className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
                <button
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

        {/* Chat Sidebar */}
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-96 bg-secondary-800 border-l border-secondary-700 flex flex-col"
          >
            {/* Chat Header */}
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
                messages.map((message) => (
                  <motion.div
                    key={message.id}
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
                <div className="flex-1 relative">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
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
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
} 