import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface OnboardingProfileScreenProps {
  user: User;
  onProfileCreated: () => void;
}

const OnboardingProfileScreen: React.FC<OnboardingProfileScreenProps> = ({ user, onProfileCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      setError("Please fill in your name and city.");
      return;
    }

    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('user_profiles').insert({
      auth_user_id: user.id,
      email: user.email,
      name,
      phone,
      city,
    });

    if (insertError) {
      setError(`Failed to create profile: ${insertError.message}`);
      setLoading(false);
    } else {
      onProfileCreated();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
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
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingProfileScreen;
