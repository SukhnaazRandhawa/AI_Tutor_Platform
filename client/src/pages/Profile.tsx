import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Bell,
    BookOpen,
    Globe,
    Languages,
    Mail,
    Palette,
    Save,
    Shield,
    User
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

interface ProfileFormData {
  name: string;
  language: string;
  aiTutorName: string;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];

export default function Profile() {
  const { user, updateProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      language: user?.language || 'en',
      aiTutorName: user?.aiTutorName || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      // Error is handled in AuthProvider
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-secondary-900">Profile Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Personal Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      {...register('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                      })}
                      type="text"
                      disabled={!isEditing}
                      className={`input-field pl-10 ${!isEditing ? 'bg-secondary-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input-field pl-10 bg-secondary-50 cursor-not-allowed"
                      placeholder="Your email address"
                    />
                  </div>
                  <p className="mt-1 text-sm text-secondary-500">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-secondary-700 mb-2">
                    Preferred Language
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-secondary-400" />
                    </div>
                    <select
                      {...register('language', {
                        required: 'Language is required',
                      })}
                      disabled={!isEditing}
                      className={`input-field pl-10 ${!isEditing ? 'bg-secondary-50 cursor-not-allowed' : ''}`}
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.language && (
                    <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="aiTutorName" className="block text-sm font-medium text-secondary-700 mb-2">
                    AI Tutor Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookOpen className="h-5 w-5 text-secondary-400" />
                    </div>
                    <input
                      {...register('aiTutorName', {
                        required: 'AI Tutor name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                      })}
                      type="text"
                      disabled={!isEditing}
                      className={`input-field pl-10 ${!isEditing ? 'bg-secondary-50 cursor-not-allowed' : ''}`}
                      placeholder="What would you like to call your AI Tutor?"
                    />
                  </div>
                  {errors.aiTutorName && (
                    <p className="mt-1 text-sm text-red-600">{errors.aiTutorName.message}</p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-secondary flex-1 flex justify-center items-center py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-1 flex justify-center items-center py-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </motion.div>

          {/* Settings Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Member since</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Account type</span>
                  <span className="text-sm font-medium text-primary-600">Free</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Status</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 text-left text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors">
                  <Shield className="h-5 w-5 text-secondary-400" />
                  <span className="text-sm font-medium">Privacy Settings</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 text-left text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors">
                  <Bell className="h-5 w-5 text-secondary-400" />
                  <span className="text-sm font-medium">Notifications</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 text-left text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors">
                  <Palette className="h-5 w-5 text-secondary-400" />
                  <span className="text-sm font-medium">Appearance</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 text-left text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors">
                  <Languages className="h-5 w-5 text-secondary-400" />
                  <span className="text-sm font-medium">Language Settings</span>
                </button>
              </div>
            </div>

            {/* AI Tutor Info */}
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">{user?.aiTutorName}</h3>
                  <p className="text-sm text-secondary-600">Your AI Tutor</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-secondary-700">
                <p>• Voice interaction enabled</p>
                <p>• Video avatar available</p>
                <p>• Multi-language support</p>
                <p>• Document analysis</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 