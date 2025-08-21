'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface InfiniteSliderProps {
  images: string[]
  speed?: number
  direction?: 'left' | 'right'
}

export default function InfiniteSlider({ images, speed = 50, direction = 'left' }: InfiniteSliderProps) {
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isClient) {
    return null
  }

  const duplicatedImages = [...images, ...images, ...images] // Triple to ensure smooth infinite scroll
  const imageWidth = isMobile ? 176 : 336 // 40*4 = 160 + margins = ~176, 80*4 = 320 + margins = ~336

  return (
    <div className="relative w-full overflow-hidden h-24 md:h-64">
      <div 
        className={`flex ${direction === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}
        style={{
          animationDuration: `${speed}s`,
          width: `${duplicatedImages.length * imageWidth}px`
        }}
      >
        {duplicatedImages.map((image, index) => (
          <div key={index} className="flex-shrink-0 w-40 h-24 md:w-80 md:h-64 mx-2">
            <Image
              src={image}
              alt={`Headshot ${index + 1}`}
              width={320}
              height={256}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
      
      <div className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10" style={{background: 'linear-gradient(to right, #EEF0EB, transparent)'}} />
      <div className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10" style={{background: 'linear-gradient(to left, #EEF0EB, transparent)'}} />
      
      <style jsx>{`
        @keyframes slide-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        @keyframes slide-right {
          0% {
            transform: translateX(-33.333%);
          }
          100% {
            transform: translateX(0);
          }
        }
        
        .animate-slide-left {
          animation: slide-left linear infinite;
        }
        
        .animate-slide-right {
          animation: slide-right linear infinite;
        }
      `}</style>
    </div>
  )
}