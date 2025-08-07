import { motion } from 'framer-motion';
import {
    BookOpen,
    Clock,
    FileText,
    Globe,
    LogOut,
    MessageSquare,
    Mic,
    Plus,
    Settings,
    Sparkles,
    User,
    Video
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { sessionAPI } from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartSession = async (subject: string) => {
    try {
      setLoading(true);
      const response = await sessionAPI.startSession(subject);
      const sessionId = response.data.session.id; // Fixed: was response.data.sessionId
      navigate(`/video-call/${sessionId}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to start session';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClearSessions = async () => {
    try {
      await sessionAPI.clearActiveSessions();
      toast.success('Active sessions cleared successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to clear sessions';
      toast.error(message);
    }
  };

  const quickSubjects = [
    { name: 'Mathematics', icon: '🔢', color: 'from-blue-500 to-blue-600' },
    { name: 'Science', icon: '🔬', color: 'from-green-500 to-green-600' },
    { name: 'History', icon: '📚', color: 'from-yellow-500 to-yellow-600' },
    { name: 'Literature', icon: '📖', color: 'from-purple-500 to-purple-600' },
    { name: 'Programming', icon: '💻', color: 'from-indigo-500 to-indigo-600' },
    { name: 'Language', icon: '🌍', color: 'from-pink-500 to-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">AI Tutor</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-secondary-600">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.language || 'English'}</span>
              </div>
              
              <div className="relative group">
                <button className="flex items-center space-x-2 text-secondary-700 hover:text-secondary-900 transition-colors">
                  <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">{user?.name}</span>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleClearSessions}
                      className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Clear Sessions</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-secondary-900 mb-4">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Ready to continue your learning journey with {user?.aiTutorName}? 
            Start a new session or pick up where you left off.
          </p>
        </motion.div>

        {/* Quick Start Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-secondary-900">Quick Start</h3>
            <div className="flex items-center space-x-2 text-accent-600">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">AI-Powered Learning</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickSubjects.map((subject, index) => (
              <motion.button
                key={subject.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                onClick={() => handleStartSession(subject.name)}
                disabled={loading}
                className="group relative bg-white rounded-xl shadow-sm border border-secondary-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-200 text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 bg-gradient-to-r ${subject.color} rounded-lg flex items-center justify-center text-2xl`}>
                    {subject.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                      {subject.name}
                    </h4>
                    <p className="text-sm text-secondary-600">
                      Start learning with {user?.aiTutorName}
                    </p>
                  </div>
                  <Video className="h-5 w-5 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-secondary-900 mb-6">Your AI Tutor Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-secondary-900 mb-2">Video Avatar</h4>
              <p className="text-sm text-secondary-600">
                See your AI Tutor in real-time with lifelike video interaction
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-secondary-900 mb-2">Voice Interaction</h4>
              <p className="text-sm text-secondary-600">
                Talk naturally with your AI Tutor using voice commands
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-secondary-900 mb-2">Document Upload</h4>
              <p className="text-sm text-secondary-600">
                Upload PDFs and slides for personalized explanations
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="h-12 w-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-secondary-900 mb-2">Real-time Chat</h4>
              <p className="text-sm text-secondary-600">
                Interactive conversations with instant responses
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-secondary-900 mb-6">Recent Activity</h3>
          
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-secondary-400" />
                <span className="font-medium text-secondary-900">No recent sessions</span>
              </div>
              <button
                onClick={() => handleStartSession('General Learning')}
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Start New Session</span>
              </button>
            </div>
            
            <p className="text-secondary-600">
              Start your first session with {user?.aiTutorName} to begin your learning journey!
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 