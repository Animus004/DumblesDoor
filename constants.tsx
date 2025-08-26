import React from 'react';

const HEALTH_CHECK_3D = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F687B3" /> 
        <stop offset="100%" stopColor="#FF8A65" />
      </linearGradient>
      <filter id="hc-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="translate(0, 4)">
      <path d="M32 6 C18 6 6 18 6 32 C6 40 12 52 32 58 C52 52 58 40 58 32 C58 18 46 6 32 6 Z" fill="#FED7E2" /> 
      <path d="M32 8 C19.2 8 8 19.2 8 32 C8 39.2 13.6 50 32 55.2 C50.4 50 56 39.2 56 32 C56 19.2 44.8 8 32 8 Z" fill="url(#hc-grad)" filter="url(#hc-glow)" />
      <path d="M30 22 H34 V30 H42 V34 H34 V42 H30 V34 H22 V30 H30 Z" fill="white" opacity="0.9"/>
    </g>
  </svg>
);

const VET_BOOKING_3D = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="vb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4FD1C5" />
        <stop offset="100%" stopColor="#4C51BF" />
      </linearGradient>
    </defs>
    <g transform="translate(0, 2)">
      <path d="M32 4 C18 4 8 16 8 30 C8 48 32 60 32 60 C32 60 56 48 56 30 C56 16 46 4 32 4 Z" fill="#B2F5EA" />
      <path d="M32 6 C19.2 6 10 17.2 10 30 C10 46 32 57 32 57 C32 57 54 46 54 30 C54 17.2 44.8 6 32 6 Z" fill="url(#vb-grad)" />
      <circle cx="32" cy="28" r="10" fill="white" opacity="0.9" />
      <path d="M35 25 H33 V27 H31 C29.3 27 28 28.3 28 30 C28 31.7 29.3 33 31 33 H35 C36.7 33 38 31.7 38 30 C38 28.3 36.7 27 35 27 V25 Z" fill="#2D3748" />
    </g>
  </svg>
);

const PET_ESSENTIALS_3D = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
     <defs>
      <linearGradient id="pe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#68D391" />
        <stop offset="100%" stopColor="#4FD1C5" />
      </linearGradient>
    </defs>
    <g transform="translate(2, 2)">
      <path d="M12 18 L52 18 L58 58 L6 58 Z" fill="#C6F6D5" />
      <path d="M14 20 L50 20 L55 56 L9 56 Z" fill="url(#pe-grad)" />
      <path d="M22 24 C22 12 24 6 32 6 C40 6 42 12 42 24" stroke="#2F855A" strokeWidth="6" fill="none" strokeLinecap="round" />
       <circle cx="32" cy="40" r="6" fill="white" opacity="0.9" />
       <path d="M32 36.5 C30.5 36.5 29.5 38 29.5 39.5 C29.5 41.5 32 43.5 32 43.5 C32 43.5 34.5 41.5 34.5 39.5 C34.5 38 33.5 36.5 32 36.5 Z" fill="#2F855A" />
    </g>
  </svg>
);

const PET_BOOK_3D = (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#4C51BF" />
      </linearGradient>
    </defs>
    <g transform="translate(4,6) rotate(-10 32 32)">
        <path d="M56,50 H8 C5.8,50 4,48.2 4,46 V10 C4,7.8 5.8,6 8,6 H56 C58.2,6 60,7.8 60,10 V46 C60,48.2 58.2,50 56,50 Z" fill="#DDD6FE" />
        <path d="M54,48 H10 C7.8,48 6,46.2 6,44 V12 C6,9.8 7.8,8 10,8 H54 C56.2,8 58,9.8 58,12 V44 C58,46.2 56.2,48 54,48 Z" fill="url(#pb-grad)" />
        <path d="M31 8 H33 V48 H31 Z" fill="rgba(0,0,0,0.1)" />
        <circle cx="32" cy="28" r="4" fill="#5A67D8" />
        <path d="M32 24.5 C30.5 24.5 29.5 26 29.5 27.5 C29.5 29.5 32 31.5 32 31.5 C32 31.5 34.5 29.5 34.5 27.5 C34.5 26 33.5 24.5 32 24.5 Z" fill="white" />
    </g>
  </svg>
);

export const ICONS = {
  HEALTH_CHECK: HEALTH_CHECK_3D,
  VET_BOOKING: VET_BOOKING_3D,
  PET_ESSENTIALS: PET_ESSENTIALS_3D,
  PET_BOOK: PET_BOOK_3D,
  CHAT: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
  ),
  DATA_AI: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
      <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 0011 7v10zM4 17a1 1 0 001.447.894l4-2A1 1 0 0010 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 004 7v10z" />
    </svg>
  )
};