
import React from 'react';
import type { ActiveScreen } from '../types';

interface NavItemProps {
  screen: ActiveScreen;
  activeScreen: ActiveScreen;
  label: string;
  icon: React.ReactNode;
  onNavigate: (screen: ActiveScreen) => void;
}

const NavItem: React.FC<NavItemProps> = ({ screen, activeScreen, label, icon, onNavigate }) => {
  const isActive = screen === activeScreen;
  const color = isActive ? 'text-teal-500' : 'text-gray-500';
  return (
    <button onClick={() => onNavigate(screen)} className={`flex flex-col items-center justify-center flex-1 space-y-1 focus:outline-none transition-colors ${color} hover:text-teal-400`}>
      {icon}
      <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
  );
};

interface BottomNavProps {
    activeScreen: ActiveScreen;
    onNavigate: (screen: ActiveScreen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-30">
      <div className="flex justify-around items-center h-16 px-2">
        <NavItem
          screen="home"
          activeScreen={activeScreen}
          label="Home"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
          onNavigate={onNavigate}
        />
        <NavItem
          screen="book"
          activeScreen={activeScreen}
          label="Pet Book"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          onNavigate={onNavigate}
        />
        <NavItem
          screen="essentials"
          activeScreen={activeScreen}
          label="Shop"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
          onNavigate={onNavigate}
        />
        <NavItem
          screen="vet"
          activeScreen={activeScreen}
          label="Book Vet"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13a5 5 0 00-5-5h-1a2 2 0 00-2 2v2m7-4a5 5 0 015-5h1a2 2 0 012 2v2"/>
            <circle cx="12" cy="18" r="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>}
          onNavigate={onNavigate}
        />
        <NavItem
          screen="profile"
          activeScreen={activeScreen}
          label="Profile"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          onNavigate={onNavigate}
        />
      </div>
    </footer>
  );
};

export default BottomNav;