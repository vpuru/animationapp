import React from "react";

interface AnimatedWaveTextProps {
  text: string;
  className?: string;
}

export default function AnimatedWaveText({ text }: AnimatedWaveTextProps) {
  const letters = text.split("");

  return (
    <span className="inline-block">
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`inline-block animate-wave-slow text-blue-600 font-bold`}
          style={{
            animationDelay: `${index * 0.15}s`,
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </span>
  );
}
