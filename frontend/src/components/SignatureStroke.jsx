import React from 'react';

// A hand-drawn signature path that animates as if being signed live.
// This is the "signature" design element referenced across the auth screens.
export default function SignatureStroke({ className = '', strokeColor = '#C9A227', delay = 0.2 }) {
  return (
    <svg
      viewBox="0 0 420 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 85 C 35 40, 55 30, 65 60 C 75 90, 85 95, 95 65 C 100 50, 108 45, 112 60
           C 118 80, 128 88, 145 70 C 165 48, 185 35, 205 55 C 218 68, 210 90, 195 88
           C 215 88, 240 60, 260 45 C 275 33, 285 38, 282 55 C 278 75, 290 78, 305 60
           C 318 45, 332 42, 340 58 C 346 70, 358 72, 368 55 C 378 38, 390 35, 398 50"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: `signature-draw 1.8s ease-out ${delay}s forwards`,
        }}
      />
      <style>{`
        @keyframes signature-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}