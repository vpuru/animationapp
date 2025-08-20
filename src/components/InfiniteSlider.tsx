'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

interface InfiniteSliderProps {
  images: string[]
  speed?: number
}

export default function InfiniteSlider({ images, speed = 50 }: InfiniteSliderProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  const duplicatedImages = [...images, ...images]

  return (
    <div className="relative w-full overflow-hidden h-48">
      <div 
        className="flex animate-slide"
        style={{
          animationDuration: `${speed}s`,
          width: `${duplicatedImages.length * 96}px`
        }}
      >
        {duplicatedImages.map((image, index) => (
          <div key={index} className="flex-shrink-0 w-32 h-48 mx-2">
            <Image
              src={image}
              alt={`Headshot ${index + 1}`}
              width={128}
              height={192}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
      
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      
      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-slide {
          animation: slide linear infinite;
        }
      `}</style>
    </div>
  )
}