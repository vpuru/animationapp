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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (trigger && !showConfetti) {
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

        // Clear confetti after duration
        timeoutRef.current = setTimeout(() => {
          setShowConfetti(false);
        }, duration);
      }, 100); // 100ms delay to ensure image is fully rendered
    }
  }, [trigger, showConfetti, duration]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    showConfetti,
    confettiSource,
  };
}