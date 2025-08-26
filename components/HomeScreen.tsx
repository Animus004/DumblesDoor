
import React from 'react';
import type { Pet, UserProfile } from '../types';
import ServiceCard from './ServiceCard';

interface HomeScreenProps {
  onNavigate: (screen: 'home' | 'book' | 'essentials' | 'vet' | 'profile' | 'health') => void;
  pet: Pet | null;
  profile: UserProfile | null;
}

// Custom SVG Icon to perfectly match the design
const AiScanIcon: React.FC = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 md:h-20 md:w-20">
    <path d="M7 3H5a2 2 0 0 0-2 2v2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M3 17v2a2 2 0 0 0 2 2h2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);


const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, pet, profile }) => {
  const isVetDisabled = true; 
  const isEncyclopediaDisabled = true;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Title */}
      <h1 className="text-xl font-semibold text-gray-700 text-center pt-4">Your Pet's Wellness Hub</h1>

      {/* Main Action */}
      <section className="flex flex-col items-center space-y-4">
        <button
          onClick={() => onNavigate('health')}
          className="bg-pink-500 text-white rounded-3xl shadow-lg w-40 h-40 md:w-48 md:h-48 flex flex-col items-center justify-center space-y-2 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300"
          aria-label="Start AI Health Scan"
        >
          <AiScanIcon />
          <span className="font-semibold text-base">AI Health Scan</span>
        </button>

        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('vet')}
            className="bg-gray-100/70 border border-gray-200/80 rounded-lg px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            Book a Vet
          </button>
          <button
            onClick={() => onNavigate('book')}
            className="bg-gray-100/70 border border-gray-200/80 rounded-lg px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            Pet Book
          </button>
        </div>
      </section>

      {/* Our Services */}
      <section className="space-y-4 pt-6">
        <h2 className="text-xl font-bold text-gray-800">Our Services</h2>
        <div className="grid grid-cols-2 gap-4">
          <ServiceCard
            title="AI Health Check"
            subtitle="Quick health analysis"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            onClick={() => onNavigate('health')}
            iconBgColor="bg-red-100"
          />
          <ServiceCard
            title="Book a Vet"
            subtitle="Find trusted vets"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13a5 5 0 00-5-5h-1a2 2 0 00-2 2v2m7-4a5 5 0 015-5h1a2 2 0 012 2v2"/>
              <circle cx="12" cy="18" r="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>}
            onClick={() => onNavigate('vet')}
            iconBgColor="bg-blue-100"
            disabled={isVetDisabled}
          />
          <ServiceCard
            title="Marketplace"
            subtitle="Pet essentials store"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
            onClick={() => onNavigate('essentials')}
            iconBgColor="bg-green-100"
          />
          <ServiceCard
            title="Pet Encyclopedia"
            subtitle="Breed information"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            onClick={() => alert('Pet Encyclopedia is coming soon!')}
            iconBgColor="bg-purple-100"
            disabled={isEncyclopediaDisabled}
          />
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;
