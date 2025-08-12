import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Eye,
    EyeOff,
    Mic,
    MicOff,
    Settings
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Advanced avatar state interface
interface AvatarState {
  currentExpression: 'neutral' | 'happy' | 'thinking' | 'explaining' | 'listening' | 'surprised' | 'concerned';
  isTalking: boolean;
  isAnimating: boolean;
  mouthFrame: number; // 0-7: closed, slightly open, open, wide open, rounded, wide, narrow, pursed
  headTilt: number; // -15 to 15 degrees
  headNod: number; // -10 to 10 degrees
  breathingOffset: number; // subtle breathing animation
  audioLevel: number; // 0-1 for volume visualization
  currentPhoneme: string; // current speech sound
}

// Props for the advanced TTS avatar
interface AdvancedTTSAvatarProps {
  isTalking?: boolean;
  isAnimating?: boolean;
  avatarName?: string;
  currentEmotion?: string;
  onAvatarReady?: () => void;
  audioUrl?: string;
  onAudioEnd?: () => void;
  speechText?: string; // Text to speak
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

// Professional animation configuration
const ANIMATION_CONFIG = {
  mouth: {
    frames: 8, // 8 different mouth positions for realistic speech
    frameDuration: 100, // ms per frame for smooth animation
    talkingCycle: 200, // ms for full talking cycle
    volumeThreshold: 0.1, // minimum volume to trigger mouth movement
  },
  breathing: {
    duration: 4000, // 4 seconds per breath cycle
    amplitude: 2, // pixels of movement
  },
  head: {
    tiltRange: 12, // degrees (more subtle)
    nodRange: 8, // degrees (more subtle)
    movementSpeed: 0.05, // smoother movement
    breathingInfluence: 0.3, // how much breathing affects head
  },
  expressions: {
    transitionDuration: 0.4, // seconds
    blendStrength: 0.9, // how much expression affects base
  },
  audio: {
    analysisInterval: 50, // ms between audio level checks
    smoothingFactor: 0.8, // audio level smoothing
  }
};

// Phoneme mapping for realistic mouth shapes
const PHONEME_MOUTH_MAP: { [key: string]: number } = {
  'AH': 3, // wide open (like "father")
  'EE': 6, // narrow (like "see")
  'OH': 4, // rounded (like "go")
  'OO': 5, // pursed (like "moon")
  'EH': 2, // slightly open (like "bed")
  'IH': 1, // very slightly open (like "sit")
  'UH': 2, // slightly open (like "but")
  'default': 0 // closed
};

export default function AdvancedTTSAvatar({
  isTalking = false,
  isAnimating = true,
  avatarName = "AI Tutor",
  currentEmotion = "neutral",
  onAvatarReady = () => {},
  audioUrl,
  onAudioEnd,
  speechText,
  onSpeechStart,
  onSpeechEnd
}: AdvancedTTSAvatarProps) {
  
  // Advanced state management
  const [avatarState, setAvatarState] = useState<AvatarState>({
    currentExpression: 'neutral',
    isTalking: false,
    isAnimating: false,
    mouthFrame: 0,
    headTilt: 0,
    headNod: 0,
    breathingOffset: 0,
    audioLevel: 0,
    currentPhoneme: 'default'
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  // Advanced refs
  const avatarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();
  const talkTimerRef = useRef<NodeJS.Timeout>();
  const headMovementRef = useRef<number>();
  const breathingRef = useRef<number>();
  const audioAnalysisRef = useRef<number>();
  const initializedRef = useRef(false);
  
  // Speech synthesis
  const speechSynthesis = window.speechSynthesis;
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Update avatar state when props change
  useEffect(() => {
    setAvatarState(prev => ({
      ...prev,
      isTalking,
      isAnimating
    }));
  }, [isTalking, isAnimating]);

  // Initialize speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Prefer female voices for AI tutor
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Victoria'))
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      setSelectedVoice(preferredVoice);
      console.log('🎭 Speech synthesis initialized with voice:', preferredVoice?.name);
    };

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, [speechSynthesis]);

  // Handle speech text changes
  useEffect(() => {
    if (speechText && !isSpeaking && selectedVoice) {
      speakText(speechText);
    }
  }, [speechText, isSpeaking, selectedVoice]);

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

  // Handle breathing animation
  useEffect(() => {
    if (isAnimating) {
      startBreathingAnimation();
    } else {
      stopBreathingAnimation();
    }

    return () => {
      stopBreathingAnimation();
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

  // Speech synthesis function
  const speakText = (text: string) => {
    if (!selectedVoice || isSpeaking) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setAvatarState(prev => ({ ...prev, isTalking: true }));
      if (onSpeechStart) onSpeechStart();
      console.log('🎭 Started speaking:', text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setAvatarState(prev => ({ ...prev, isTalking: false }));
      if (onSpeechEnd) onSpeechEnd();
      console.log('🎭 Finished speaking');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setAvatarState(prev => ({ ...prev, isTalking: false }));
    };

    speechSynthesis.speak(utterance);
  };

  // Start talking animation with phoneme detection
  const startTalkingAnimation = useCallback(() => {
    if (talkTimerRef.current) return;
    
    const animateMouth = () => {
      setAvatarState(prev => {
        // Simulate phoneme changes for realistic speech
        const phonemes = ['AH', 'EE', 'OH', 'OO', 'EH', 'IH', 'UH'];
        const randomPhoneme = phonemes[Math.floor(Math.random() * phonemes.length)];
        const mouthFrame = PHONEME_MOUTH_MAP[randomPhoneme] || 0;
        
        return {
          ...prev,
          mouthFrame,
          currentPhoneme: randomPhoneme,
          audioLevel: Math.random() * 0.5 + 0.3 // Simulate varying audio levels
        };
      });
      
      // Dynamic timing based on speech rate
      const randomDelay = ANIMATION_CONFIG.mouth.frameDuration + (Math.random() - 0.5) * 30;
      talkTimerRef.current = setTimeout(animateMouth, randomDelay);
    };
    
    animateMouth();
  }, []);

  // Stop talking animation
  const stopTalkingAnimation = useCallback(() => {
    if (talkTimerRef.current) {
      clearTimeout(talkTimerRef.current);
      talkTimerRef.current = undefined;
    }
    setAvatarState(prev => ({ 
      ...prev, 
      mouthFrame: 0, 
      audioLevel: 0,
      currentPhoneme: 'default'
    }));
  }, []);

  // Start breathing animation
  const startBreathingAnimation = useCallback(() => {
    const animateBreathing = () => {
      setAvatarState(prev => {
        const time = Date.now() / 1000;
        const breathingOffset = Math.sin(time * (2 * Math.PI / (ANIMATION_CONFIG.breathing.duration / 1000))) * ANIMATION_CONFIG.breathing.amplitude;
        
        return {
          ...prev,
          breathingOffset
        };
      });
      
      breathingRef.current = requestAnimationFrame(animateBreathing);
    };
    
    animateBreathing();
  }, []);

  // Stop breathing animation
  const stopBreathingAnimation = useCallback(() => {
    if (breathingRef.current) {
      cancelAnimationFrame(breathingRef.current);
      breathingRef.current = undefined;
    }
    setAvatarState(prev => ({ ...prev, breathingOffset: 0 }));
  }, []);

  // Start head movement with breathing influence
  const startHeadMovement = useCallback(() => {
    const animateHead = () => {
      setAvatarState(prev => {
        // Subtle random head movements influenced by breathing
        const newTilt = prev.headTilt + (Math.random() - 0.5) * ANIMATION_CONFIG.head.movementSpeed;
        const newNod = prev.headNod + (Math.random() - 0.5) * ANIMATION_CONFIG.head.movementSpeed;
        
        // Breathing influence on head movement
        const breathingInfluence = prev.breathingOffset * ANIMATION_CONFIG.head.breathingInfluence;
        
        return {
          ...prev,
          headTilt: Math.max(-ANIMATION_CONFIG.head.tiltRange, 
                            Math.min(ANIMATION_CONFIG.head.tiltRange, newTilt)),
          headNod: Math.max(-ANIMATION_CONFIG.head.nodRange, 
                           Math.min(ANIMATION_CONFIG.head.nodRange, newNod + breathingInfluence))
        };
      });
      
      // Slower, more natural head movement
      headMovementRef.current = requestAnimationFrame(() => {
        setTimeout(animateHead, 150);
      });
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
        
        // Only call onAvatarReady once
        if (!initializedRef.current) {
          onAvatarReady();
          initializedRef.current = true;
        }
        
        console.log('🎭 Advanced TTS Avatar ready!');
        
      } catch (error) {
        console.error('Failed to initialize advanced TTS avatar:', error);
        setError('Failed to load avatar');
        setIsLoaded(true);
        if (!initializedRef.current) {
          onAvatarReady();
          initializedRef.current = true;
        }
      }
    };

    initAvatar();
  }, [onAvatarReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTalkingAnimation();
      stopBreathingAnimation();
      stopHeadMovement();
      speechSynthesis.cancel();
    };
  }, [stopTalkingAnimation, stopBreathingAnimation, stopHeadMovement, speechSynthesis]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Loading Advanced TTS Avatar...</p>
          <p className="text-sm text-blue-400 mt-2">Professional speech synthesis & lip sync</p>
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
          <p className="text-white mb-2">Failed to load advanced TTS avatar</p>
          <p className="text-sm text-red-300 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate mouth position based on frame and phoneme
  const getMouthPosition = () => {
    const positions = [
      'translate-y-0', // 0: closed
      'translate-y-1', // 1: very slightly open
      'translate-y-2', // 2: slightly open
      'translate-y-3', // 3: open
      'translate-y-4', // 4: wide open
      'translate-y-3 scale-x-75', // 5: rounded/pursed
      'translate-y-2 scale-x-50', // 6: narrow
      'translate-y-1 scale-x-125' // 7: wide
    ];
    return positions[avatarState.mouthFrame] || positions[0];
  };

  // Calculate expression blend with enhanced effects
  const getExpressionBlend = () => {
    const expressions = {
      neutral: { opacity: 1, scale: 1, brightness: 1, saturation: 1 },
      happy: { opacity: 1, scale: 1.02, brightness: 1.05, saturation: 1.1 },
      thinking: { opacity: 0.98, scale: 0.99, brightness: 0.98, saturation: 0.95 },
      explaining: { opacity: 1, scale: 1.01, brightness: 1.02, saturation: 1.05 },
      listening: { opacity: 1, scale: 1, brightness: 1, saturation: 1 },
      surprised: { opacity: 1, scale: 1.03, brightness: 1.08, saturation: 1.15 },
      concerned: { opacity: 0.96, scale: 0.98, brightness: 0.95, saturation: 0.9 }
    };
    
    return expressions[avatarState.currentExpression] || expressions.neutral;
  };

  const expressionBlend = getExpressionBlend();

  return (
    <div className="w-full h-full relative">
      {/* Professional office background with enhanced lighting */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 rounded-xl overflow-hidden">
        {/* Enhanced office elements */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-20 h-72 bg-gradient-to-b from-amber-800 to-amber-900 rounded shadow-lg"></div>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-24 h-20 bg-gradient-to-b from-amber-700 to-amber-800 rounded shadow-lg"></div>
        
        {/* Lighting effects */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-radial from-white via-transparent to-transparent opacity-30"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-gradient-radial from-blue-100 via-transparent to-transparent opacity-20"></div>
      </div>

      {/* Main avatar container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${avatarState.currentExpression}-${avatarState.mouthFrame}-${avatarState.currentPhoneme}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: expressionBlend.opacity, 
              scale: expressionBlend.scale,
              filter: `brightness(${expressionBlend.brightness}) saturate(${expressionBlend.saturation})`
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: ANIMATION_CONFIG.expressions.transitionDuration, ease: "easeInOut" }}
            className="relative"
            style={{
              transform: `rotate(${avatarState.headTilt}deg) translateY(${avatarState.headNod + avatarState.breathingOffset}px)`
            }}
          >
            {/* Base avatar image */}
            <div className="relative w-80 h-96 rounded-full overflow-hidden shadow-2xl">
              <img
                src="/avatar/neutral-base.png"
                alt="Professional AI Tutor"
                className="w-full h-full object-cover"
              />
              
              {/* Advanced mouth animation overlay */}
              {avatarState.isTalking && (
                <div className={`absolute inset-0 ${getMouthPosition()} transition-all duration-100`}>
                  {/* Professional mouth overlay with phoneme-based shapes */}
                  <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-28 h-14 bg-gradient-to-b from-red-400 to-red-600 rounded-full border-4 border-white border-opacity-80 shadow-xl"></div>
                  
                  {/* Audio level visualization */}
                  <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 w-32 h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-100"
                      style={{ width: `${avatarState.audioLevel * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced expression indicator */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-white bg-opacity-95 px-4 py-2 rounded-full shadow-xl border border-gray-200">
                <span className="text-sm font-semibold text-gray-800 capitalize">
                  {avatarState.currentExpression}
                </span>
                {avatarState.isTalking && (
                  <span className="ml-2 text-xs text-blue-600 font-medium">
                    Speaking: {avatarState.currentPhoneme}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Enhanced avatar name and status */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">{avatarName}</h2>
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${avatarState.isTalking ? 'bg-green-400 animate-pulse' : 'bg-white'}`}></div>
            <span className="text-white text-sm font-medium">
              {avatarState.isTalking ? 'Speaking...' : 'Ready'}
            </span>
            {avatarState.isTalking && (
              <span className="text-xs text-blue-300 bg-blue-900 bg-opacity-50 px-2 py-1 rounded-full">
                TTS Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced control buttons */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
          title="Animation Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
        
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded-lg transition-colors ${
            isMuted 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
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

      {/* Enhanced status overlay */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-4 py-3 rounded-xl backdrop-blur-sm">
        <div className="text-xs space-y-1">
          <div className="font-semibold">🎭 Advanced TTS Mode</div>
          <div>Expression: {avatarState.currentExpression}</div>
          <div>Status: {avatarState.isTalking ? 'Speaking' : 'Idle'}</div>
          <div>Mouth: Frame {avatarState.mouthFrame} ({avatarState.currentPhoneme})</div>
          <div>Audio: {avatarState.audioLevel > 0 ? `${Math.round(avatarState.audioLevel * 100)}%` : 'Silent'}</div>
          <div>Voice: {selectedVoice?.name || 'None'}</div>
          <div>Volume: {Math.round(volume * 100)}%</div>
        </div>
      </div>

      {/* Enhanced settings panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 right-4 bg-white rounded-xl shadow-2xl p-6 w-80 border border-gray-200"
        >
          <h3 className="font-semibold text-gray-800 mb-4 text-lg">Advanced TTS Settings</h3>
          
          <div className="space-y-4">
            {/* Voice Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Voice Selection</label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find(v => v.name === e.target.value);
                  setSelectedVoice(voice || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableVoices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Volume Control */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Volume: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Mouth Animation Speed */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Mouth Speed: {ANIMATION_CONFIG.mouth.frameDuration}ms
              </label>
              <input
                type="range"
                min="50"
                max="200"
                value={ANIMATION_CONFIG.mouth.frameDuration}
                onChange={(e) => {
                  // In production, this would update the config
                  console.log('Mouth speed:', e.target.value);
                }}
                className="w-full"
              />
            </div>
            
            {/* Head Movement */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Head Movement: {ANIMATION_CONFIG.head.tiltRange}°
              </label>
              <input
                type="range"
                min="0"
                max="20"
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