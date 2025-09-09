import React, { useState, useEffect, useMemo } from 'react';
import type { Pet, UserProfile, ActiveScreen, HealthCheckResult } from '../types';
import ServiceCard from './ServiceCard';
import { ICONS } from '../constants';
import Confetti from './Confetti';
import { supabase } from '../services/supabaseClient';


// --- DYNAMIC COMPONENTS ---

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const AnimatedGreeting: React.FC<{ name: string | undefined }> = ({ name }) => {
  const greeting = getGreeting();
  const text = name ? `${greeting}, ${name.split(' ')[0]}!` : greeting;
  
  return (
    <h1 className="font-poppins text-3xl md:text-4xl font-extrabold text-center pt-4" style={{ color: 'var(--color-text-primary)' }}>
      {text.split('').map((char, index) => (
        <span key={index} className="greeting-char" style={{ animationDelay: `${index * 0.03}s` }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h1>
  );
};

const WellnessActionButton: React.FC<{
  score: number | null;
  isLoading: boolean;
  disabled: boolean;
  onNavigate: (screen: ActiveScreen) => void;
}> = ({ score, isLoading, disabled, onNavigate }) => {
  const displayScore = isLoading ? '...' : (score ?? '--');
  const circumference = 2 * Math.PI * 65;
  const offset = score ? circumference - (score / 100) * circumference : circumference;
  
  const scoreColor = useMemo(() => {
    if (score === null) return 'var(--color-text-secondary)';
    if (score > 89) return '#22c55e'; // green-500
    if (score > 69) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  }, [score]);

  return (
    <button
      onClick={() => !disabled && onNavigate('health')}
      disabled={disabled}
      className="relative rounded-full shadow-xl w-36 h-36 flex flex-col items-center justify-center space-y-1 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:scale-105 interactive-scale"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        borderWidth: '1px'
      }}
      aria-label={`Current Wellness Score is ${displayScore}. Tap for an AI Health Scan.`}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 144 144">
        <circle className="wellness-circle-bg" cx="72" cy="72" r="65"></circle>
        {!isLoading && <circle className="wellness-circle-progress" cx="72" cy="72" r="65" style={{strokeDasharray: circumference, strokeDashoffset: offset, stroke: scoreColor}}></circle>}
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <span className="font-poppins font-bold text-3xl" style={{ color: isLoading ? 'var(--color-text-primary)' : scoreColor }}>
          {displayScore}
        </span>
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{score === null && !isLoading ? 'No Scans Yet' : 'Wellness Score'}</span>
      </div>
    </button>
  );
};

const TipOfTheDay: React.FC = () => {
  const tips = [
    "Ensure your pet has fresh water at all times, especially in hot weather.",
    "Regular walks are key to a dog's physical and mental health.",
    "A balanced diet is crucial. Avoid feeding your pet table scraps.",
    "Cats love vertical spaces. Consider getting a cat tree for them to climb.",
    "Check your pet's paws for cracks or foreign objects after walks on rough terrain."
  ];
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  return (
    <div className="text-center animate-tip-in px-4">
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)'}}>💡 Tip of the Day</p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)'}}>{tip}</p>
    </div>
  );
};

// --- HOOKS ---

const calculatePetAgeInMonths = (birthDate: string): number => {
    if (!birthDate) return 999;
    const dob = new Date(birthDate);
    const now = new Date();
    let months = (now.getFullYear() - dob.getFullYear()) * 12;
    months -= dob.getMonth();
    months += now.getMonth();
    return months <= 0 ? 0 : months;
};

const useSmartServiceOrdering = (services: any[], pet: Pet | null) => {
    return useMemo(() => {
        if (!pet) return services;
        const ageInMonths = calculatePetAgeInMonths(pet.birth_date);
        const sortedServices = [...services];
        
        // Rule: Prioritize Vet Booking for young pets (under 12 months)
        if (ageInMonths < 12) {
            sortedServices.sort((a, b) => {
                if (a.title === "Book a Vet") return -1;
                if (b.title === "Book a Vet") return 1;
                if (b.title === "AI Health Check") return 1;
                return 0;
            });
        }
        
        return sortedServices;
    }, [services, pet]);
};

// --- SKELETON & MAIN COMPONENT ---

const HomeScreenSkeleton: React.FC = () => (
  <div className="min-h-screen w-full animated-gradient p-4 md:p-6">
    <div className="space-y-6 animate-pulse">
      {/* Title */}
      <div className="h-10 w-3/4 mx-auto bg-white/10 rounded-lg mt-4"></div>

      {/* Main Action */}
      <section className="flex flex-col items-center space-y-4 pt-8">
        <div className="w-44 h-44 bg-white/10 rounded-full"></div>
         <div className="h-5 w-1/2 bg-white/10 rounded-lg mt-2"></div>
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
  showCelebration: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, pet, profile, isLoading, showCelebration }) => {
  const isPetFeatureDisabled = !pet;
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  const [wellnessScore, setWellnessScore] = useState<number | null>(null);
  const [isFetchingScore, setIsFetchingScore] = useState(true);

  useEffect(() => {
    const fetchLatestScore = async () => {
        if (!pet || !supabase) {
            setIsFetchingScore(false);
            setWellnessScore(null);
            return;
        }
        setIsFetchingScore(true);
        try {
            const { data, error } = await supabase
                .from('ai_feedback')
                .select('ai_response')
                .eq('pet_id', pet.id)
                .order('submitted_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                setWellnessScore(null);
                return;
            }
            
            // The ai_response is a JSON string, so we need to parse it.
            const result: HealthCheckResult = JSON.parse(data.ai_response);
            if (result && typeof result.overallHealthScore === 'number') {
                setWellnessScore(result.overallHealthScore);
            } else {
                setWellnessScore(null);
            }
        } catch (e) {
            console.error("Failed to fetch or parse wellness score:", e);
            setWellnessScore(null);
        } finally {
            setIsFetchingScore(false);
        }
    };

    fetchLatestScore();
  }, [pet]);


  const services = [
    { title: "AI Health Check", subtitle: "Quick health analysis", icon: ICONS.HEALTH_CHECK, onClick: () => onNavigate('health'), disabled: isPetFeatureDisabled },
    { title: "Book a Vet", subtitle: "Find trusted vets", icon: ICONS.VET_BOOKING, onClick: () => onNavigate('vet'), disabled: isPetFeatureDisabled },
    { title: "Marketplace", subtitle: "Pet essentials store", icon: ICONS.PET_ESSENTIALS, onClick: () => onNavigate('essentials'), disabled: false },
    { title: "PetBook", subtitle: "Community feed", icon: ICONS.PET_BOOK, onClick: () => onNavigate('book'), disabled: isPetFeatureDisabled }
  ];
  
  const orderedServices = useSmartServiceOrdering(services, pet);
  
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
      {showCelebration && <Confetti />}
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
      >
        <div className="p-4 md:p-6 space-y-8 pb-24">
          <AnimatedGreeting name={profile?.name} />

          {/* Main Action */}
          <section className="flex flex-col items-center space-y-4 pt-6">
            <WellnessActionButton score={wellnessScore} isLoading={isFetchingScore} disabled={isPetFeatureDisabled} onNavigate={onNavigate} />
            <p className="text-sm animate-slide-in h-5" style={{ color: 'var(--color-text-secondary)' }}>
              {isPetFeatureDisabled ? 'Add a pet to get started!' : `How's ${pet?.name} feeling today?`}
            </p>
            <TipOfTheDay />
          </section>

          {/* Our Services */}
          <section className="space-y-4 pt-6">
            <h2 className="font-poppins text-2xl font-bold" style={{ color: 'var(--color-text-primary)'}}>Our Services</h2>
            <div ref={carouselRef} className="service-carousel -mx-4 px-4 flex gap-2">
              {orderedServices.map((service) => (
                <div key={service.title} className="service-carousel-slide">
                  <ServiceCard {...service} iconBgColor="" />
                </div>
              ))}
            </div>
             <div className="carousel-dots">
              {orderedServices.map((_, index) => (
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