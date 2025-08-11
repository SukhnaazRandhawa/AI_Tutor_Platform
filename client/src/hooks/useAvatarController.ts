import { useCallback, useRef, useState } from 'react';

export interface AvatarState {
  isTalking: boolean;
  isAnimating: boolean;
  currentEmotion: 'neutral' | 'happy' | 'thinking' | 'explaining' | 'listening';
  headRotation: number;
  armMovement: number;
  mouthOpenness: number;
}

export interface AvatarController {
  state: AvatarState;
  startTalking: () => void;
  stopTalking: () => void;
  setEmotion: (emotion: AvatarState['currentEmotion']) => void;
  animateHead: (rotation: number) => void;
  animateArms: (movement: number) => void;
  resetPose: () => void;
  triggerGesture: (gesture: string) => void;
}

export function useAvatarController(): AvatarController {
  const [state, setState] = useState<AvatarState>({
    isTalking: false,
    isAnimating: true,
    currentEmotion: 'neutral',
    headRotation: 0,
    armMovement: 0,
    mouthOpenness: 0,
  });

  const animationRef = useRef<number>();
  const talkingIntervalRef = useRef<NodeJS.Timeout>();

  // Start talking animation
  const startTalking = useCallback(() => {
    setState(prev => ({ ...prev, isTalking: true }));
    
    // Create talking animation loop
    talkingIntervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        mouthOpenness: Math.random() * 0.5 + 0.2, // Random mouth movement
      }));
    }, 100);
  }, []);

  // Stop talking animation
  const stopTalking = useCallback(() => {
    setState(prev => ({ ...prev, isTalking: false, mouthOpenness: 0 }));
    
    if (talkingIntervalRef.current) {
      clearInterval(talkingIntervalRef.current);
    }
  }, []);

  // Set emotional state
  const setEmotion = useCallback((emotion: AvatarState['currentEmotion']) => {
    setState(prev => ({ ...prev, currentEmotion: emotion }));
    
    // Trigger emotion-specific animations
    switch (emotion) {
      case 'happy':
        // Trigger smile animation
        break;
      case 'thinking':
        // Trigger thinking pose
        break;
      case 'explaining':
        // Trigger explaining gestures
        break;
      case 'listening':
        // Trigger attentive pose
        break;
      default:
        // Reset to neutral
        break;
    }
  }, []);

  // Animate head rotation
  const animateHead = useCallback((rotation: number) => {
    setState(prev => ({ ...prev, headRotation: rotation }));
  }, []);

  // Animate arm movement
  const animateArms = useCallback((movement: number) => {
    setState(prev => ({ ...prev, armMovement: movement }));
  }, []);

  // Reset avatar to neutral pose
  const resetPose = useCallback(() => {
    setState(prev => ({
      ...prev,
      headRotation: 0,
      armMovement: 0,
      mouthOpenness: 0,
      currentEmotion: 'neutral',
    }));
  }, []);

  // Trigger specific gestures
  const triggerGesture = useCallback((gesture: string) => {
    switch (gesture) {
      case 'wave':
        // Trigger waving animation
        animateArms(0.5);
        setTimeout(() => animateArms(0), 1000);
        break;
      case 'point':
        // Trigger pointing animation
        animateArms(0.8);
        setTimeout(() => animateArms(0), 800);
        break;
      case 'nod':
        // Trigger nodding animation
        animateHead(0.3);
        setTimeout(() => animateHead(-0.3), 300);
        setTimeout(() => animateHead(0), 600);
        break;
      case 'shake':
        // Trigger head shake animation
        animateHead(0.2);
        setTimeout(() => animateHead(-0.2), 200);
        setTimeout(() => animateHead(0.2), 400);
        setTimeout(() => animateHead(0), 600);
        break;
      default:
        break;
    }
  }, [animateArms, animateHead]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (talkingIntervalRef.current) {
      clearInterval(talkingIntervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // Auto-cleanup
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

  return {
    state,
    startTalking,
    stopTalking,
    setEmotion,
    animateHead,
    animateArms,
    resetPose,
    triggerGesture,
  };
} 