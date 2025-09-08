import { useEffect, useState, useRef } from 'react';

interface ConfettiSource {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface UseConfettiOptions {
  trigger: boolean;
  duration?: number;
}

export function useConfetti({ 
  trigger, 
  duration = 3000
}: UseConfettiOptions) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiSource, setConfettiSource] = useState<ConfettiSource | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (trigger && !hasTriggered) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Calculate confetti source from center of the image
        const imageElement = document.querySelector('[data-confetti-target]');
        
        if (imageElement) {
          const rect = imageElement.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          setConfettiSource({
            x: centerX - 10, // Smaller area around center point for more precise explosion
            y: centerY - 10, 
            w: 20,
            h: 20,
          });
        } else {
          // Fallback: use window center
          setConfettiSource({
            x: window.innerWidth / 2 - 10,
            y: window.innerHeight / 2 - 10,
            w: 20,
            h: 20,
          });
        }

        setShowConfetti(true);
        setIsGenerating(true);
        setHasTriggered(true);

        // Stop generating new pieces after duration, but let existing ones fall
        timeoutRef.current = setTimeout(() => {
          setIsGenerating(false);
        }, duration);

        // Don't hide the confetti component - let pieces fall naturally off screen
        // The recycle={false} prop ensures pieces aren't recycled when they fall off
      }, 100); // 100ms delay to ensure image is fully rendered
    }
  }, [trigger, hasTriggered, duration]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      const cleanupTimeout = cleanupTimeoutRef.current;
      if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
      }
    };
  }, []);

  return {
    showConfetti,
    confettiSource,
    isGenerating,
    numberOfPieces: isGenerating ? 300 : 0, // Generate pieces only when active
  };
}