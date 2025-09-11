import React, { useEffect } from 'react';
import type { Pet } from '../types';
import Confetti from './Confetti';

interface OnboardingCompletionScreenProps {
  pet: Pet | null;
  onComplete: () => void;
}

const OnboardingCompletionScreen: React.FC<OnboardingCompletionScreenProps> = ({ pet, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // Auto-redirect after 4 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
      <div className="min-h-screen bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center p-4 overflow-hidden relative">
        <Confetti />
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center z-10">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-50"></div>
            <img
              src={pet?.photo_url || 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png'}
              alt={pet?.name}
              className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">All Set!</h1>
          <p className="text-gray-600 text-lg">
            You and <strong className="text-gray-900">{pet?.name || 'your new friend'}</strong> are ready to explore Dumble's Door.
          </p>
          <div className="pt-4">
            <button
              onClick={onComplete}
              className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Let's Go!
            </button>
          </div>
        </div>
      </div>
  );
};

export default OnboardingCompletionScreen;
