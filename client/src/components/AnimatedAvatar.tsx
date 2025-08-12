import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Eye,
    EyeOff,
    Settings
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Avatar state interface
interface AvatarState {
  currentExpression: 'neutral' | 'happy' | 'thinking' | 'explaining' | 'listening' | 'surprised' | 'concerned';
  isTalking: boolean;
  isBlinking: boolean;
  isAnimating: boolean;
  mouthFrame: number; // 0 = closed, 1 = slightly open, 2 = open, 3 = wide open
  eyeState: 'open' | 'closed' | 'squint';
  headTilt: number; // -15 to 15 degrees
  headNod: number; // -10 to 10 degrees
}

// Props for the animated avatar
interface AnimatedAvatarProps {
  isTalking?: boolean;
  isAnimating?: boolean;
  avatarName?: string;
  currentEmotion?: string;
  onAvatarReady?: () => void;
  audioUrl?: string;
  onAudioEnd?: () => void;
}

// Animation configuration
const ANIMATION_CONFIG = {
  mouth: {
    frames: 4, // 0-3 mouth positions
    frameDuration: 150, // ms per frame
    talkingCycle: 300, // ms for full talking cycle
  },
  blink: {
    duration: 150, // ms
    interval: { min: 2000, max: 5000 }, // random blink interval
  },
  head: {
    tiltRange: 15, // degrees
    nodRange: 10, // degrees
    movementSpeed: 0.1, // smoothness factor
  },
  expressions: {
    transitionDuration: 0.3, // seconds
    blendStrength: 0.8, // how much expression affects base
  }
};

export default function AnimatedAvatar({
  isTalking = false,
  isAnimating = true,
  avatarName = "AI Tutor",
  currentEmotion = "neutral",
  onAvatarReady = () => {},
  audioUrl,
  onAudioEnd
}: AnimatedAvatarProps) {
  
  // State management
  const [avatarState, setAvatarState] = useState<AvatarState>({
    currentExpression: 'neutral',
    isTalking: false,
    isBlinking: false,
    isAnimating: false,
    mouthFrame: 0,
    eyeState: 'open',
    headTilt: 0,
    headNod: 0
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const avatarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const blinkTimerRef = useRef<NodeJS.Timeout>();
  const talkTimerRef = useRef<NodeJS.Timeout>();
  const headMovementRef = useRef<number>();

  // Update avatar state when props change
  useEffect(() => {
    setAvatarState(prev => ({
      ...prev,
      isTalking,
      isAnimating
    }));
  }, [isTalking, isAnimating]);

  // Handle talking animation
  useEffect(() => {
    if (isTalking) {
      startTalkingAnimation();
    } else {
      stopTalkingAnimation();
    }

    return () => {
      stopTalkingAnimation();
    };
  }, [isTalking]);

  // Handle blinking animation
  useEffect(() => {
    if (isAnimating) {
      startBlinkingAnimation();
    } else {
      stopBlinkingAnimation();
    }

    return () => {
      stopBlinkingAnimation();
    };
  }, [isAnimating]);

  // Handle head movements
  useEffect(() => {
    if (isAnimating) {
      startHeadMovement();
    } else {
      stopHeadMovement();
    }

    return () => {
      stopHeadMovement();
    };
  }, [isAnimating]);

  // Handle audio
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      
      audioRef.current.onended = () => {
        if (onAudioEnd) onAudioEnd();
      };
      
      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        if (onAudioEnd) onAudioEnd();
      };
    }
  }, [audioUrl, onAudioEnd]);

  // Start talking animation
  const startTalkingAnimation = useCallback(() => {
    if (talkTimerRef.current) return;
    
    const animateMouth = () => {
      setAvatarState(prev => ({
        ...prev,
        mouthFrame: (prev.mouthFrame + 1) % ANIMATION_CONFIG.mouth.frames
      }));
      
      talkTimerRef.current = setTimeout(animateMouth, ANIMATION_CONFIG.mouth.frameDuration);
    };
    
    animateMouth();
  }, []);

  // Stop talking animation
  const stopTalkingAnimation = useCallback(() => {
    if (talkTimerRef.current) {
      clearTimeout(talkTimerRef.current);
      talkTimerRef.current = undefined;
    }
    setAvatarState(prev => ({ ...prev, mouthFrame: 0 }));
  }, []);

  // Start blinking animation
  const startBlinkingAnimation = useCallback(() => {
    const blink = () => {
      setAvatarState(prev => ({ ...prev, isBlinking: true, eyeState: 'closed' }));
      
      setTimeout(() => {
        setAvatarState(prev => ({ ...prev, isBlinking: false, eyeState: 'open' }));
      }, ANIMATION_CONFIG.blink.duration);
      
      // Schedule next blink
      const nextBlink = Math.random() * 
        (ANIMATION_CONFIG.blink.interval.max - ANIMATION_CONFIG.blink.interval.min) + 
        ANIMATION_CONFIG.blink.interval.min;
      
      blinkTimerRef.current = setTimeout(blink, nextBlink);
    };
    
    blink();
  }, []);

  // Stop blinking animation
  const stopBlinkingAnimation = useCallback(() => {
    if (blinkTimerRef.current) {
      clearTimeout(blinkTimerRef.current);
      blinkTimerRef.current = undefined;
    }
    setAvatarState(prev => ({ ...prev, isBlinking: false, eyeState: 'open' }));
  }, []);

  // Start head movement
  const startHeadMovement = useCallback(() => {
    const animateHead = () => {
      setAvatarState(prev => {
        // Subtle random head movements
        const newTilt = prev.headTilt + (Math.random() - 0.5) * 2;
        const newNod = prev.headNod + (Math.random() - 0.5) * 1;
        
        return {
          ...prev,
          headTilt: Math.max(-ANIMATION_CONFIG.head.tiltRange, 
                            Math.min(ANIMATION_CONFIG.head.tiltRange, newTilt)),
          headNod: Math.max(-ANIMATION_CONFIG.head.nodRange, 
                           Math.min(ANIMATION_CONFIG.head.nodRange, newNod))
        };
      });
      
      headMovementRef.current = requestAnimationFrame(animateHead);
    };
    
    animateHead();
  }, []);

  // Stop head movement
  const stopHeadMovement = useCallback(() => {
    if (headMovementRef.current) {
      cancelAnimationFrame(headMovementRef.current);
      headMovementRef.current = undefined;
    }
    setAvatarState(prev => ({ ...prev, headTilt: 0, headNod: 0 }));
  }, []);

  // Initialize avatar
  useEffect(() => {
    const initAvatar = async () => {
      try {
        // Simulate loading time for assets
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setIsLoaded(true);
        onAvatarReady();
        
        console.log('🎭 Animated Avatar ready!');
        
      } catch (error) {
        console.error('Failed to initialize animated avatar:', error);
        setError('Failed to load avatar');
        setIsLoaded(true); // Still mark as loaded to show error state
        onAvatarReady();
      }
    };

    initAvatar();
  }, [onAvatarReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTalkingAnimation();
      stopBlinkingAnimation();
      stopHeadMovement();
    };
  }, [stopTalkingAnimation, stopBlinkingAnimation, stopHeadMovement]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Loading Animated Avatar...</p>
          <p className="text-sm text-blue-400 mt-2">Using your professional screenshot</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white mb-2">Failed to load animated avatar</p>
          <p className="text-sm text-red-300 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate mouth position based on frame
  const getMouthPosition = () => {
    const positions = [
      'translate-y-0', // closed
      'translate-y-1', // slightly open
      'translate-y-2', // open
      'translate-y-3'  // wide open
    ];
    return positions[avatarState.mouthFrame] || positions[0];
  };

  // Calculate expression blend
  const getExpressionBlend = () => {
    const expressions = {
      neutral: { opacity: 1, scale: 1, brightness: 1 },
      happy: { opacity: 1, scale: 1.02, brightness: 1.05 },
      thinking: { opacity: 0.95, scale: 0.98, brightness: 0.95 },
      explaining: { opacity: 1, scale: 1.01, brightness: 1.02 },
      listening: { opacity: 1, scale: 1, brightness: 1 },
      surprised: { opacity: 1, scale: 1.03, brightness: 1.1 },
      concerned: { opacity: 0.9, scale: 0.97, brightness: 0.9 }
    };
    
    return expressions[avatarState.currentExpression] || expressions.neutral;
  };

  const expressionBlend = getExpressionBlend();

  return (
    <div className="w-full h-full relative">
      {/* Professional office background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
        {/* Bookshelf */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-16 h-64 bg-amber-800 rounded"></div>
        {/* Professional chair */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-20 h-16 bg-amber-700 rounded"></div>
      </div>

      {/* Main avatar container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${avatarState.currentExpression}-${avatarState.mouthFrame}-${avatarState.isBlinking}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: expressionBlend.opacity, 
              scale: expressionBlend.scale,
              filter: `brightness(${expressionBlend.brightness})`
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: ANIMATION_CONFIG.expressions.transitionDuration, ease: "easeInOut" }}
            className="relative"
            style={{
              transform: `rotate(${avatarState.headTilt}deg) translateY(${avatarState.headNod}px)`
            }}
          >
            {/* Base avatar image */}
            <div className="relative w-80 h-96 rounded-full overflow-hidden shadow-2xl">
              <img
                src="/avatar/neutral-base.png"
                alt="Professional AI Tutor"
                className="w-full h-full object-cover"
              />
              
              {/* Mouth animation overlay */}
              {avatarState.isTalking && (
                <div className={`absolute inset-0 ${getMouthPosition()} transition-transform duration-75`}>
                  {/* This would be a mouth overlay image in production */}
                  <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-black bg-opacity-20 rounded-full"></div>
                </div>
              )}
              
              {/* Eye blink overlay */}
              {avatarState.isBlinking && (
                <div className="absolute inset-0">
                  {/* This would be closed eyes overlay in production */}
                  <div className="absolute top-1/3 left-1/4 w-8 h-4 bg-black bg-opacity-20 rounded-full"></div>
                  <div className="absolute top-1/3 right-1/4 w-8 h-4 bg-black bg-opacity-20 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Expression indicator */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full shadow-lg">
                <span className="text-sm font-medium text-gray-800 capitalize">
                  {avatarState.currentExpression}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Avatar name */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">{avatarName}</h2>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${avatarState.isTalking ? 'bg-green-400' : 'bg-white'}`}></div>
            <span className="text-white text-sm">
              {avatarState.isTalking ? 'Speaking...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
          title="Animation Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          onClick={() => setAvatarState(prev => ({ ...prev, isAnimating: !prev.isAnimating }))}
          className={`p-2 rounded-lg transition-colors ${
            avatarState.isAnimating 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-white'
          }`}
          title={avatarState.isAnimating ? 'Stop Animations' : 'Start Animations'}
        >
          {avatarState.isAnimating ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </button>
      </div>

      {/* Status overlay */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
        <div className="text-xs">
          <div>🎭 Animated Mode</div>
          <div>Expression: {avatarState.currentExpression}</div>
          <div>Status: {avatarState.isTalking ? 'Talking' : 'Idle'}</div>
          <div>Mouth: Frame {avatarState.mouthFrame}</div>
          <div>Eyes: {avatarState.eyeState}</div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 right-4 bg-white rounded-lg shadow-xl p-4 w-64"
        >
          <h3 className="font-semibold text-gray-800 mb-3">Animation Settings</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Mouth Animation Speed</label>
              <input
                type="range"
                min="50"
                max="300"
                value={ANIMATION_CONFIG.mouth.frameDuration}
                onChange={(e) => {
                  // In production, this would update the config
                  console.log('Mouth speed:', e.target.value);
                }}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-600">Blink Frequency</label>
              <input
                type="range"
                min="1000"
                max="8000"
                value={ANIMATION_CONFIG.blink.interval.max}
                onChange={(e) => {
                  // In production, this would update the config
                  console.log('Blink frequency:', e.target.value);
                }}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-600">Head Movement</label>
              <input
                type="range"
                min="0"
                max="30"
                value={ANIMATION_CONFIG.head.tiltRange}
                onChange={(e) => {
                  // In production, this would update the config
                  console.log('Head movement:', e.target.value);
                }}
                className="w-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        className="hidden"
        controls={false}
        onEnded={onAudioEnd}
      />
    </div>
  );
} 