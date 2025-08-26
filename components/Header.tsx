
import React from 'react';

interface HeaderProps {
    onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onProfileClick }) => {
  return (
    <header className="bg-teal-500 text-white p-4 shadow-md w-full sticky top-0 z-20">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
            </svg>
            <h1 className="text-3xl font-bold tracking-tight">Dumble's Door</h1>
        </div>
        <button onClick={onProfileClick} className="rounded-full h-10 w-10 bg-cyan-400 hover:bg-cyan-500 flex items-center justify-center transition-colors" aria-label="Open Profile">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;