'use client';

import { useEffect, useState } from 'react';

export default function AnimatedBanana() {
  const [revealHeight, setRevealHeight] = useState(0);

  useEffect(() => {
    const animate = () => {
      // Reset to 0
      setRevealHeight(0);
      
      const duration = 1500; // Total animation duration in ms
      const steps = 15; // Number of lines/steps for smooth animation
      const stepDuration = duration / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const newHeight = Math.min((currentStep / steps) * 100, 100);
        setRevealHeight(newHeight);
        
        if (newHeight >= 100) {
          clearInterval(interval);
          // Wait a moment, then restart
          setTimeout(() => {
            animate();
          }, 500);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    };

    const cleanup = animate();
    return cleanup;
  }, []);

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Banana emoji with line-by-line reveal from bottom */}
      <div className="relative inline-block">
        <div 
          className="relative"
          style={{
            height: '1.5em',
            width: '1.5em',
            lineHeight: '1.5em',
          }}
        >
          {/* Mask that reveals from bottom to top */}
          <div
            className="absolute bottom-0 left-0 right-0 overflow-hidden"
            style={{
              height: `${revealHeight}%`,
              transition: 'height 0.1s linear',
            }}
          >
            <span className="text-3xl md:text-4xl inline-block align-bottom">
              🍌
            </span>
          </div>
          
          {/* Base banana (invisible, used for spacing) */}
          <span 
            className="text-3xl md:text-4xl inline-block opacity-0"
            aria-hidden="true"
          >
            🍌
          </span>
        </div>
      </div>
      <span className="text-white font-bold text-sm md:text-base">
        Growing Strong
      </span>
    </div>
  );
}
