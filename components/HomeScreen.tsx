import React, { useRef, useState, useEffect } from 'react';
import type { Pet, UserProfile, ActiveScreen } from '../types';
import ServiceCard from './ServiceCard';
import { ICONS } from '../constants';

// Updated AiScanIcon to be more vibrant and fit the new design
const AiScanIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16">
    <defs>
      <radialGradient id="ai-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
      </radialGradient>
    </defs>
    <path d="M7 3H5a2 2 0 0 0-2 2v2" stroke="var(--color-text-primary)" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="var(--color-text-primary)" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="var(--color-text-primary)" />
    <path d="M3 17v2a2 2 0 0 0 2 2h2" stroke="var(--color-text-primary)" />
    <circle cx="12" cy="12" r="5" fill="url(#ai-glow)" stroke="none" />
    <circle cx="12" cy="12" r="3" stroke="var(--color-text-primary)" />
  </svg>
);


const HomeScreenSkeleton: React.FC = () => (
  <div className="min-h-screen w-full animated-gradient p-4 md:p-6">
    <div className="space-y-6 animate-pulse">
      {/* Title */}
      <div className="h-10 w-3/4 mx-auto bg-white/10 rounded-lg mt-4"></div>

      {/* Main Action */}
      <section className="flex flex-col items-center space-y-4 pt-8">
        <div className="w-44 h-44 bg-white/10 rounded-3xl"></div>
         <div className="h-5 w-1/2 bg-white/10 rounded-lg mt-2"></div>
        <div className="flex items-center gap-4 pt-2">
          <div className="w-28 h-10 bg-white/10 rounded-xl"></div>
          <div className="w-28 h-10 bg-white/10 rounded-xl"></div>
        </div>
      </section>

      {/* Our Services */}
      <section className="space-y-4 pt-8">
        <div className="h-8 w-1/3 bg-white/10 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-white/10 rounded-2xl"></div>
          ))}
        </div>
      </section>
    </div>
  </div>
);


interface HomeScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  pet: Pet | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const PullToRefreshIndicator: React.FC<{ pullDistance: number, isRefreshing: boolean }> = ({ pullDistance, isRefreshing }) => {
    const PULL_THRESHOLD = 80;
    const clampedDistance = Math.min(pullDistance, PULL_THRESHOLD * 1.5);
    const rotation = Math.min(pullDistance, PULL_THRESHOLD) * 2;
    const dashOffset = 250 - (Math.min(pullDistance / PULL_THRESHOLD, 1) * 250);

    return (
        <div
            className="pull-to-refresh-indicator h-20"
            style={{ transform: `translateY(${clampedDistance - 80}px)` }}
        >
            <div className={`paw-loader ${isRefreshing ? 'refreshing' : ''}`} style={{ transform: `rotate(${rotation}deg)` }}>
                <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        className="paw-path"
                        d="M22 6C15.4 6 10 11.4 10 18C10 21.3 11.4 24.3 13.5 26.5M22 38C28.6 38 34 32.6 34 26C34 22.7 32.6 19.7 30.5 17.5M15 11C13.9 11 13 11.9 13 13C13 14.1 13.9 15 15 15C16.1 15 17 14.1 17 13C17 11.9 16.1 11 15 11ZM29 29C27.9 29 27 29.9 27 31C27 32.1 27.9 33 29 33C30.1 33 31 32.1 31 31C31 29.9 30.1 29 29 29Z"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ strokeDashoffset: isRefreshing ? undefined : dashOffset }}
                    />
                </svg>
            </div>
        </div>
    );
};


const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, pet, profile, isLoading }) => {
  const isVetDisabled = true; 
  const isEncyclopediaDisabled = true;
  const isPetFeatureDisabled = !pet;

  const contentRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Pull to refresh state
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Carousel state
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  const services = [
    { title: "AI Health Check", subtitle: "Quick health analysis", icon: ICONS.HEALTH_CHECK, onClick: () => onNavigate('health'), disabled: isPetFeatureDisabled, iconBgColor: "" },
    { title: "Book a Vet", subtitle: "Find trusted vets", icon: ICONS.VET_BOOKING, onClick: () => onNavigate('vet'), disabled: isVetDisabled, iconBgColor: "" },
    { title: "Marketplace", subtitle: "Pet essentials store", icon: ICONS.PET_ESSENTIALS, onClick: () => onNavigate('essentials'), disabled: false, iconBgColor: "" },
    { title: "Pet Encyclopedia", subtitle: "Breed information", icon: ICONS.PET_BOOK, onClick: () => alert('Pet Encyclopedia is coming soon!'), disabled: isEncyclopediaDisabled, iconBgColor: "" }
  ];
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (contentRef.current?.scrollTop === 0) {
      setPullStartY(e.targetTouches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pullStartY === 0) return;
    const currentY = e.targetTouches[0].clientY;
    const distance = currentY - pullStartY;
    if (distance > 0) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) { // Refresh threshold
      setIsRefreshing(true);
      // Simulate data fetching
      setTimeout(() => {
        setIsRefreshing(false);
      }, 2000);
    }
    setPullStartY(0);
    setPullDistance(0);
  };
  
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.children[0]?.clientWidth || 0;
    const gap = 8; // from `gap-2` -> 0.5rem
    const index = Math.round(scrollLeft / (cardWidth + gap));
    setActiveServiceIndex(index);
  };
  
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
        carousel.addEventListener('scroll', handleCarouselScroll, { passive: true });
        return () => carousel.removeEventListener('scroll', handleCarouselScroll);
    }
  }, []);

  if (isLoading) {
    return <HomeScreenSkeleton />;
  }

  return (
    <>
      {/* Background elements */}
      <div className="parallax-bg">
          <div className="parallax-layer layer-1"></div>
          <div className="parallax-layer layer-2"></div>
      </div>
      <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
      </div>

      <div 
        className="min-h-screen w-full animated-gradient relative z-10 overflow-y-auto" 
        style={{ animation: 'fade-in 0.5s ease-in-out' }}
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
        <div className="p-4 md:p-6 space-y-8">
          {/* Title */}
          <h1 className="font-poppins text-3xl md:text-4xl font-extrabold text-center pt-4 text-glow" style={{ color: 'var(--color-text-primary)'}}>
            Wellness Hub for {pet?.name || 'Your Pet'}
          </h1>

          {/* Main Action */}
          <section className="flex flex-col items-center space-y-3 pt-4">
            <button
              onClick={() => !isPetFeatureDisabled && onNavigate('health')}
              disabled={isPetFeatureDisabled}
              className="relative overflow-hidden backdrop-blur-lg rounded-3xl shadow-xl w-44 h-44 flex flex-col items-center justify-center space-y-2 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:scale-105 animate-breathing-glow interactive-scale"
              style={{ 
                  animation: 'subtle-bounce-in 0.8s ease-out',
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  borderWidth: '1px'
              }}
              aria-label="Start AI Health Scan"
            >
              <AiScanIcon />
              <span className="font-poppins font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>AI Health Scan</span>
            </button>
            
            <p className="text-sm animate-slide-in h-5" style={{ color: 'var(--color-text-secondary)' }}>
              {isPetFeatureDisabled ? 'Add a pet to get started!' : 'Tap the orb for a quick scan'}
            </p>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('vet')}
                className="backdrop-blur-md rounded-xl px-6 py-2 font-semibold transition-colors shadow-lg interactive-scale"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderWidth: '1px', color: 'var(--color-text-primary)' }}
              >
                Book a Vet
              </button>
              <button
                onClick={() => onNavigate('book')}
                disabled={isPetFeatureDisabled}
                className="backdrop-blur-md rounded-xl px-6 py-2 font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed interactive-scale"
                 style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderWidth: '1px', color: 'var(--color-text-primary)' }}
              >
                Pet Book
              </button>
            </div>
          </section>

          {/* Our Services */}
          <section className="space-y-4 pt-6">
            <h2 className="font-poppins text-2xl font-bold text-glow" style={{ color: 'var(--color-text-primary)'}}>Our Services</h2>
            <div ref={carouselRef} className="service-carousel -mx-4 px-4 flex gap-2">
              {services.map((service, index) => (
                <div key={index} className="service-carousel-slide">
                  <ServiceCard {...service} />
                </div>
              ))}
            </div>
             <div className="carousel-dots">
              {services.map((_, index) => (
                <div key={index} className={`carousel-dot ${index === activeServiceIndex ? 'active' : ''}`}></div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default HomeScreen;