import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Basic humanoid avatar component
function HumanoidAvatar({ isTalking = false, isAnimating = false }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  // Animation state
  const [headRotation, setHeadRotation] = useState(0);
  const [armSwing, setArmSwing] = useState(0);
  const [talkingIntensity, setTalkingIntensity] = useState(0);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (isAnimating) {
      // Gentle head movement
      setHeadRotation(Math.sin(time * 0.5) * 0.1);
      
      // Arm swinging animation
      setArmSwing(Math.sin(time * 1.5) * 0.3);
    }

    if (isTalking) {
      // Talking animation - mouth movement
      setTalkingIntensity(Math.sin(time * 8) * 0.5 + 0.5);
    } else {
      setTalkingIntensity(0);
    }

    // Apply animations to meshes
    if (headRef.current) {
      headRef.current.rotation.y = headRotation;
    }
    
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = armSwing;
    }
    
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -armSwing;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#fdbcb4" />
        
        {/* Eyes */}
        <mesh position={[-0.15, 0.1, 0.4]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.15, 0.1, 0.4]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Mouth */}
        <mesh position={[0, -0.15, 0.4]}>
          <boxGeometry args={[0.2, talkingIntensity * 0.1, 0.05]} />
          <meshStandardMaterial color="#8b0000" />
        </mesh>
        
        {/* Hair */}
        <mesh position={[0, 0.3, 0.2]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#4a3000" />
        </mesh>
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, 1.2, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.4]} />
        <meshStandardMaterial color="#2c5aa0" />
        
        {/* Shirt collar */}
        <mesh position={[0, 0.4, 0.25]}>
          <boxGeometry args={[0.7, 0.1, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </mesh>

      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.9, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      <mesh ref={rightArmRef} position={[0.9, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.25, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.8, 16]} />
        <meshStandardMaterial color="#2c2c2c" />
      </mesh>
      <mesh position={[0.25, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.8, 16]} />
        <meshStandardMaterial color="#2c2c2c" />
      </mesh>

      {/* Shoes */}
      <mesh position={[-0.25, -0.2, 0.1]}>
        <boxGeometry args={[0.25, 0.1, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.25, -0.2, 0.1]}>
        <boxGeometry args={[0.25, 0.1, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

// Professional background environment
function ProfessionalBackground() {
  return (
    <>
      {/* Office background */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Bookshelf */}
      <group position={[-3, 0, -4]}>
        <mesh>
          <boxGeometry args={[0.1, 4, 2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        {/* Books */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0, -1.5 + i * 0.5, 0]}>
            <boxGeometry args={[0.05, 0.3, 1.8]} />
            <meshStandardMaterial color={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][i]} />
          </mesh>
        ))}
      </group>
      
      {/* Professional lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
    </>
  );
}

// Main 3D Avatar component
export default function Avatar3D({ 
  isTalking = false, 
  isAnimating = true, 
  avatarName = "AI Tutor",
  onAvatarReady = () => {}
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading time for 3D assets
    const timer = setTimeout(() => {
      setIsLoaded(true);
      onAvatarReady();
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Remove onAvatarReady from dependencies to prevent infinite loops

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-white">Loading 3D Avatar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 60 }}
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <ProfessionalBackground />
        <HumanoidAvatar isTalking={isTalking} isAnimating={isAnimating} />
        
        {/* Avatar name label - using simple text for now */}
        <mesh position={[0, 3.5, 0]}>
          <boxGeometry args={[2, 0.1, 0.1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        {/* Status indicator */}
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[1.5, 0.1, 0.1]} />
          <meshStandardMaterial color={isTalking ? "#00ff00" : "#ffffff"} />
        </mesh>
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
} 