import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Mic, Phone, PhoneOff, Video } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

export default function VideoCall() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
                <p className="text-sm text-secondary-400">Session ID: {sessionId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-secondary-400 hover:text-white hover:bg-secondary-700 rounded-lg transition-colors">
                <Mic className="h-5 w-5" />
              </button>
              <button className="p-2 text-secondary-400 hover:text-white hover:bg-secondary-700 rounded-lg transition-colors">
                <Video className="h-5 w-5" />
              </button>
              <button className="p-2 text-secondary-400 hover:text-white hover:bg-secondary-700 rounded-lg transition-colors">
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="h-64 bg-secondary-800 rounded-xl border border-secondary-700 flex items-center justify-center mb-6">
              <div className="text-center">
                <Video className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
                <p className="text-secondary-400">Video call interface coming soon!</p>
              </div>
            </div>
            
            <div className="bg-secondary-800 rounded-xl border border-secondary-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Video Call Features
              </h2>
              <div className="space-y-3 text-sm text-secondary-400">
                <p>• Real-time video avatar of {user?.aiTutorName}</p>
                <p>• Voice interaction with speech-to-text</p>
                <p>• Live chat messaging</p>
                <p>• Document upload and analysis</p>
                <p>• Multi-language support</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <button className="btn-primary flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Start Call</span>
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-secondary flex items-center space-x-2"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Session</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 