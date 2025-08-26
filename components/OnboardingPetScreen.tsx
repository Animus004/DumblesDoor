import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import PetForm from './PetForm';

interface OnboardingPetScreenProps {
  user: User;
  onPetAdded: () => void;
}

const OnboardingPetScreen: React.FC<OnboardingPetScreenProps> = ({ user, onPetAdded }) => {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <PetForm
        user={user}
        onSave={onPetAdded}
        onCancel={() => {}} // No cancel in onboarding
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        isOnboarding={true}
      />
    </div>
  );
};

export default OnboardingPetScreen;
