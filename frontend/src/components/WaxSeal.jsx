import React from 'react';

export default function WaxSeal({ size = 56, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="48" fill="#B3492B" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#8F3A22" strokeWidth="2" />
      {/* drips */}
      <path d="M14 60 C 10 70, 14 78, 22 76 C 18 70, 18 64, 14 60 Z" fill="#B3492B" />
      <path d="M86 55 C 92 62, 90 72, 82 70 C 86 64, 84 58, 86 55 Z" fill="#B3492B" />
      {/* inner emblem: a quill nib */}
      <g transform="translate(50 50)">
        <path
          d="M-14 16 L10 -18 C 14 -23, 20 -22, 18 -16 L-6 18 C -9 22, -16 21, -14 16 Z"
          fill="#F7F3E9"
          opacity="0.92"
        />
        <line x1="-10" y1="12" x2="14" y2="-20" stroke="#8F3A22" strokeWidth="1.4" opacity="0.6" />
      </g>
    </svg>
  );
}