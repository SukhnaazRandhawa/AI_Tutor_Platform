import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, Globe, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

interface RegisterFormData {
  name: string;
  language: string;
  email: string;
  password: string;
  confirmPassword: string;
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

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      console.log('📝 Form data submitted:', { ...data, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' });
      console.log('📝 Form errors:', errors);
      console.log('📝 Form is valid:', Object.keys(errors).length === 0);
      console.log('📝 Current step:', currentStep);
      
      // Check if user is on the final step
      if (currentStep !== 4) {
        console.error('❌ User must complete all steps before submitting');
        return;
      }
      
      // Check if form is valid
      if (Object.keys(errors).length > 0) {
        console.error('❌ Form has validation errors:', errors);
        return;
      }
      
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        language: data.language,
        aiTutorName: data.aiTutorName,
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Form submission error:', error);
      // Error is handled in AuthProvider
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
          Full Name
        </label>
        <div className="mt-1 relative">
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
            className="input-field pl-10"
            placeholder="Enter your full name"
            autoComplete="name"
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="language" className="block text-sm font-medium text-secondary-700">
          Preferred Language
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-secondary-400" />
          </div>
          <select
            {...register('language', {
              required: 'Language is required',
            })}
            className="input-field pl-10"
          >
            <option value="">Select your preferred language</option>
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

      <button
        type="button"
        onClick={nextStep}
        className="btn-primary w-full flex justify-center items-center py-3 text-lg"
      >
        Continue
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
          Email Address
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-secondary-400" />
          </div>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            type="email"
            className="input-field pl-10"
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
          Password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-secondary-400" />
          </div>
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            type={showPassword ? 'text' : 'password'}
            className="input-field pl-10 pr-10"
            placeholder="Create a password"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-secondary-400" />
            ) : (
              <Eye className="h-5 w-5 text-secondary-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700">
          Confirm Password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-secondary-400" />
          </div>
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
            type={showConfirmPassword ? 'text' : 'password'}
            className="input-field pl-10 pr-10"
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-secondary-400" />
            ) : (
              <Eye className="h-5 w-5 text-secondary-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={prevStep}
          className="btn-secondary flex-1 flex justify-center items-center py-3 text-lg"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="btn-primary flex-1 flex justify-center items-center py-3 text-lg"
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label htmlFor="aiTutorName" className="block text-sm font-medium text-secondary-700">
          Name Your AI Tutor
        </label>
        <div className="mt-1 relative">
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
            className="input-field pl-10"
            placeholder="What would you like to call your AI Tutor?"
          />
        </div>
        {errors.aiTutorName && (
          <p className="mt-1 text-sm text-red-600">{errors.aiTutorName.message}</p>
        )}
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-primary-800 mb-2">Default AI Tutor</h3>
        <p className="text-sm text-primary-700">
          You'll be using our default AI Tutor with advanced capabilities including voice interaction and video avatar.
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={prevStep}
          className="btn-secondary flex-1 flex justify-center items-center py-3 text-lg"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="btn-primary flex-1 flex justify-center items-center py-3 text-lg"
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-secondary-900 mb-2">
          Ready to Start Learning!
        </h3>
        <p className="text-sm text-secondary-600">
          Your AI Tutor is ready to help you learn. Click the button below to complete your registration.
        </p>
      </div>

      <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-secondary-800 mb-2">What you'll get:</h4>
        <ul className="text-sm text-secondary-700 space-y-1">
          <li>• Personalized AI Tutor with voice interaction</li>
          <li>• Real-time video avatar for immersive learning</li>
          <li>• Multi-language support</li>
          <li>• Interactive sessions with document upload</li>
        </ul>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={prevStep}
          className="btn-secondary flex-1 flex justify-center items-center py-3 text-lg"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1 flex justify-center items-center py-3 text-lg"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            'Complete Registration'
          )}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full flex items-center justify-center"
          >
            <BookOpen className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-3xl font-bold text-secondary-900"
          >
            Join AI Tutor
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-secondary-600"
          >
            Create your account and start your learning journey
          </motion.p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-secondary-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-primary-600 to-accent-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </AnimatePresence>
        </motion.form>

        <div className="text-center">
          <p className="text-sm text-secondary-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </p>
          <p className="text-xs text-secondary-500 mt-2">
            If you're getting an error about an existing account, try logging in instead.
          </p>
        </div>
      </motion.div>
    </div>
  );
} 