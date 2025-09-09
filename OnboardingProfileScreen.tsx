

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import type { UserProfile } from '../types';
import { OnboardingProgress } from './OnboardingProgress';

interface OnboardingProfileScreenProps {
  user: User;
  profile: UserProfile | null;
  onProfileCreated: () => void;
}

const OnboardingProfileScreen: React.FC<OnboardingProfileScreenProps> = ({ user, profile, onProfileCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
    }
  }, [profile]);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      setError("Please fill in your name and city.");
      return;
    }

    setLoading(true);
    setError('');

    const { error: upsertError } = await supabase.from('user_profiles').upsert({
      auth_user_id: user.id,
      email: user.email!,
      name,
      phone: phone || null,
      city,
    });

    if (upsertError) {
      console.error("Error upserting profile:", upsertError); // Debugging log
      if (upsertError.message.includes('security policy')) {
          setError("Permission denied. You might not have the rights to update this profile.");
      } else {
          setError(`Failed to save profile: ${upsertError.message}`);
      }
      setLoading(false);
    } else {
      console.log('User profile upserted successfully for user ID:', user.id); // Debugging log
      onProfileCreated();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <OnboardingProgress currentStep={1} totalSteps={2} />
        <div className="text-center">
            <div className="flex justify-center items-center h-24 mb-4">
                {/* Person with Pet Illustration */}
                 <svg viewBox="0 0 200 120" className="h-24" fill="currentColor">
                    <path className="text-teal-400" d="M123.6,50.9c-12.1,0-21.9,9.8-21.9,21.9c0,12.1,9.8,21.9,21.9,21.9s21.9-9.8,21.9-21.9 C145.5,60.7,135.7,50.9,123.6,50.9z"/>
                    <path className="text-gray-700" d="M123.6,48.8c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S126.4,48.8,123.6,48.8z"/>
                    <path className="text-gray-700" d="M123.6,97.7c-9.9,0-17.9-8-17.9-17.9c0-9.9,8-17.9,17.9-17.9s17.9,8,17.9,17.9C141.5,89.7,133.5,97.7,123.6,97.7z M123.6,65.9c-7.7,0-13.9,6.2-13.9,13.9s6.2,13.9,13.9,13.9s13.9-6.2,13.9-13.9S131.3,65.9,123.6,65.9z"/>
                    <path className="text-orange-400" d="M74.9,71.2c-0.6-0.3-1.2-0.5-1.9-0.5c-1.6,0-3,1.3-3.1,2.9c-0.1,0.8,0.2,1.5,0.7,2.1c-0.4,0.1-0.9,0.1-1.3,0.1 c-3.4,0-6.1-2.8-6.1-6.1V66c0-0.8,0.6-1.4,1.4-1.4h3.9c0.8,0,1.4,0.6,1.4,1.4v1.4c0,0.8-0.6,1.4-1.4,1.4h-0.4 c-0.4,0-0.7-0.3-0.7-0.7v-0.7c0-0.4,0.3-0.7,0.7-0.7H72c0.4,0,0.7,0.3,0.7,0.7v3c0,1.9,1.5,3.4,3.4,3.4c0.6,0,1.1-0.1,1.6-0.4 C77.2,74.5,77.2,72.4,74.9,71.2z M69,60.9c-1.6,0-2.9-1.3-2.9-2.9s1.3-2.9,2.9-2.9s2.9,1.3,2.9,2.9S70.6,60.9,69,60.9z"/>
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome!</h1>
            <p className="text-gray-600">Let's set up your profile.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-md">{error}</p>}
          <div>
            <label className="block text-gray-600 font-semibold mb-2" htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-600 font-semibold mb-2" htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 font-semibold mb-2" htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue to Add Pet'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingProfileScreen;