interface IconProps {
  className?: string;
  color?: string;
}

export function QualityIcon({ className, color = "currentColor" }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <path d="M12 1V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 21V23" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M4.22 4.22L5.64 5.64"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18.36 18.36L19.78 19.78"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M1 12H3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M21 12H23" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M4.22 19.78L5.64 18.36"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18.36 5.64L19.78 4.22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}