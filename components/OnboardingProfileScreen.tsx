
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import type { UserProfile } from '../types';
import { OnboardingProgress } from './OnboardingProgress';
import { dogBreeds, catBreeds } from '../lib/petBreeds';
import Tooltip from './Tooltip';

// --- PROPS & TYPES ---
interface OnboardingFlowProps {
  user: User;
  profile: UserProfile | null;
  initialStep?: 1 | 2;
  onComplete: () => void;
  onSkip: () => void;
  onDataUpdate: () => Promise<void>;
}

type OnboardingPetData = {
  name: string;
  species: 'Dog' | 'Cat' | '';
  photoFile: File | null;
  photoPreview: string | null;
  breed: string;
  birthDate: string;
  gender: 'Male' | 'Female' | 'Unknown';
};


// --- HELPER FUNCTIONS & COMPONENTS ---
const calculateAge = (dob: string): string => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }
    if (years === 0 && months === 0) return 'Less than a month old';
    const yearStr = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
    const monthStr = months > 0 ? `${months} month${months > 1 ? 's' : ''}` : '';
    return [yearStr, monthStr].filter(Boolean).join(', ');
};

const PetTypeButton: React.FC<{ type: 'Dog' | 'Cat'; selected: boolean; onClick: () => void; children: React.ReactNode; }> = ({ type, selected, onClick, children }) => (
    <button type="button" onClick={onClick} className={`p-4 rounded-xl border-2 transition-all w-full flex flex-col items-center space-y-2 ${selected ? 'bg-teal-50 border-teal-500 shadow-md' : 'bg-gray-50 border-gray-200 hover:border-gray-400'}`}>
        {children}
        <span className={`font-semibold ${selected ? 'text-teal-600' : 'text-gray-700'}`}>{type}</span>
    </button>
);

const DogIllustration = () => <svg viewBox="0 0 100 100" className="h-20 w-20 text-orange-400 fill-current"><path d="M72.2,60.8c-1-0.6-2.1-0.9-3.3-0.9c-2.9,0-5.3,2.2-5.6,5.1c-0.1,1.4,0.3,2.7,1.2,3.7c-0.8,0.1-1.6,0.2-2.4,0.2 c-6,0-10.9-4.9-10.9-10.9V47.1c0-1.4,1.1-2.5,2.5-2.5h6.9c1.4,0,2.5,1.1,2.5,2.5v2.5c0,1.4-1.1,2.5-2.5,2.5h-0.6 c-0.7,0-1.3-0.6-1.3-1.3v-1.3c0-0.7,0.6-1.3,1.3-1.3h5.7c0.7,0,1.3,0.6,1.3,1.3v5.2c0,3.3,2.7,6,6,6c1,0,2-0.2,2.9-0.7 C73.5,62.8,73.5,61.7,72.2,60.8z M61.4,40.5c-2.8,0-5.1-2.3-5.1-5.1s2.3-5.1,5.1-5.1s5.1,2.3,5.1,5.1S64.2,40.5,61.4,40.5z" /></svg>;
const CatIllustration = () => <svg viewBox="0 0 100 100" className="h-20 w-20 text-gray-600 fill-current"><path d="M69.8,47.7c-0.8,0-1.6,0.2-2.4,0.5c-0.7,0.2-1.4,0-1.8-0.4c-0.5-0.5-0.6-1.2-0.3-1.9c0.8-1.8,1.3-3.7,1.3-5.7 c0-6.8-5.5-12.3-12.3-12.3S41.3,33.5,41.3,40.3c0,2,0.5,3.9,1.3,5.7c0.3,0.7,0.2,1.4-0.3,1.9c-0.5,0.5-1.2,0.7-1.8,0.4 c-0.8-0.3-1.6-0.5-2.4-0.5c-3.4,0-6.4,1.4-8.5,3.5c-0.5,0.5-0.5,1.3,0,1.8c0.5,0.5,1.3,0.5,1.8,0c1.8-1.8,4-2.8,6.8-2.8 c0.7,0,1.4,0.1,2.1,0.3L48,51.8c-0.8,0.8-0.8,2.1,0,2.9c0.8,0.8,2.1,0.8,2.9,0l1.9-1.9c0.6,0.7,1.3,1.2,2.1,1.6v3.2 c0,1.1,0.9,2.1,2.1,2.1s2.1-0.9,2.1-2.1v-3.2c0.8-0.4,1.5-0.9,2.1-1.6l1.9,1.9c0.8,0.8,2.1,0.8,2.9,0c0.8-0.8,0.8-2.1,0-2.9 l-1.9-1.9c0.7-0.2,1.4-0.3,2.1-0.3c2.8,0,5,1.1,6.8,2.8c0.5,0.5,1.3,0.5,1.8,0c0.5-0.5,0.5-1.3,0-1.8 C76.1,49,73.2,47.7,69.8,47.7z"/></svg>;


const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, profile, initialStep = 1, onComplete, onSkip, onDataUpdate }) => {
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- User Profile State ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
    }
  }, [profile]);
  
  // --- Pet Profile State ---
  const [petStep, setPetStep] = useState(1); // 1: Name/Species, 2: Photo, 3: Details
  const [petData, setPetData] = useState<OnboardingPetData>({
      name: '', species: '', photoFile: null, photoPreview: null, breed: '', birthDate: '', gender: 'Unknown',
  });
  const photoInputRef = useRef<HTMLInputElement>(null);

  // --- Breed Autocomplete Logic ---
  const [breedQuery, setBreedQuery] = useState('');
  const [isBreedFocused, setIsBreedFocused] = useState(false);
    
  const breedSuggestions = useMemo(() => {
      if (!breedQuery || !isBreedFocused) return [];
      const source = petData.species === 'Dog' ? dogBreeds : catBreeds;
      return source.filter(b => b.toLowerCase().includes(breedQuery.toLowerCase()));
  }, [breedQuery, petData.species, isBreedFocused]);

  const handleBreedSelect = (breed: string) => {
      setPetData(p => ({ ...p, breed }));
      setBreedQuery(breed);
      setIsBreedFocused(false);
  };

  // --- Handlers ---
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      setError("Please fill in your name and city.");
      return;
    }
    setLoading(true);
    setError('');

    const { error: upsertError } = await supabase.from('user_profiles').upsert({
      auth_user_id: user.id, email: user.email!, name, phone: phone || null, city,
    });

    if (upsertError) {
      setError(`Failed to save profile: ${upsertError.message}`);
      setLoading(false);
    } else {
      await onDataUpdate();
      setLoading(false);
      setStep(2);
    }
  };
  
  const handlePetSave = async () => {
    if (!petData.breed || !petData.birthDate) {
        setError("Please fill in all details to finish.");
        return;
    }
    setLoading(true);
    setError('');

    try {
        let photo_url = 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png';
        if (petData.photoFile) {
            const filePath = `${user.id}/pets/${Date.now()}_${petData.photoFile.name}`;
            const { error: uploadError } = await supabase.storage.from('pet_images').upload(filePath, petData.photoFile);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('pet_images').getPublicUrl(filePath);
            photo_url = urlData.publicUrl;
        }

        const finalPetData = { auth_user_id: user.id, name: petData.name, species: petData.species as 'Dog' | 'Cat', breed: petData.breed, birth_date: petData.birthDate, gender: petData.gender, photo_url, size: 'Medium' as const, energy_level: 'Medium' as const, temperament: [], };
        const { error: upsertError } = await supabase.from('pets').insert(finalPetData);
        if (upsertError) throw upsertError;

        onComplete();
    } catch (err: any) {
        setError(`Failed to save pet: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  // Pet form navigation
  const handlePetNext = () => {
    if (petStep === 1 && (!petData.name.trim() || !petData.species)) {
        setError('Please enter a name and select a pet type.');
        return;
    }
    setError('');
    setPetStep(s => s + 1);
  };
  const handlePetBack = () => {
    setError('');
    if (petStep > 1) { 
        setPetStep(s => s - 1); 
    } else if (initialStep === 1) { // Only go back to profile step if user started there
        setStep(1); 
    }
  };
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setPetData(p => ({ ...p, photoFile: file }));
        const reader = new FileReader();
        reader.onloadend = () => { setPetData(p => ({...p, photoPreview: reader.result as string })); };
        reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
        <OnboardingProgress currentStep={step} totalSteps={2} />
        {error && <p className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-md -mb-2">{error}</p>}
        
        {/* --- STEP 1: User Profile --- */}
        {step === 1 && (
            <>
              <div className="text-center">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome!</h1>
                  <p className="text-gray-600">Let's set up your profile.</p>
              </div>
              <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                    <label className="block text-gray-600 font-semibold mb-2" htmlFor="name">Full Name</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-2" htmlFor="phone">Phone (Optional)</label>
                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-gray-600 font-semibold mb-2" htmlFor="city">City</label>
                    <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50">
                    {loading ? 'Saving...' : 'Continue to Add Pet'}
                  </button>
              </form>
            </>
        )}

        {/* --- STEP 2: Pet Profile --- */}
        {step === 2 && (
            <div className="flex flex-col">
              <div className="flex justify-center items-center space-x-2 mb-4">
                  {[1, 2, 3].map(s => <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === petStep ? 'w-6 bg-teal-500' : 'w-2 bg-gray-300'}`}></div>)}
              </div>
              
              {petStep === 1 && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Tell us about your pet</h2><p className="text-gray-600 mt-2 mb-8">Let's start with the basics.</p>
                    <div className="flex gap-4 mb-6"><PetTypeButton type="Dog" selected={petData.species === 'Dog'} onClick={() => setPetData(p => ({ ...p, species: 'Dog' }))}><DogIllustration /></PetTypeButton><PetTypeButton type="Cat" selected={petData.species === 'Cat'} onClick={() => setPetData(p => ({ ...p, species: 'Cat' }))}><CatIllustration /></PetTypeButton></div>
                    <input type="text" value={petData.name} onChange={e => setPetData(p => ({ ...p, name: e.target.value }))} placeholder="What's their name?" className="w-full text-center text-lg px-4 py-3 border-b-2 border-gray-300 focus:outline-none focus:border-teal-500" />
                    <div className="mt-6 space-y-2"><button onClick={handlePetNext} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600">Continue</button><button onClick={onSkip} className="text-sm font-semibold text-gray-500 hover:text-gray-800 py-2">Skip for now</button></div>
                </div>
              )}
              {petStep === 2 && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Add a photo</h2><p className="text-gray-600 mt-2 mb-8">A picture helps personalize the experience.</p>
                    <div className="flex flex-col items-center space-y-4"><img src={petData.photoPreview || 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png'} alt="Pet preview" className="w-40 h-40 rounded-full object-cover border-4 border-gray-200" /><input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoSelect} className="hidden" /><button onClick={() => photoInputRef.current?.click()} className="text-lg font-semibold text-teal-600 hover:text-teal-800">{petData.photoPreview ? 'Change Photo' : 'Upload Photo'}</button></div>
                    <div className="mt-6 flex gap-4"><button onClick={handlePetBack} className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300">Back</button><button onClick={handlePetNext} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600">Looks Great!</button></div>
                </div>
              )}
              {petStep === 3 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 text-center">Just a few more details</h2><p className="text-gray-600 text-center mt-2 mb-6">This helps us tailor advice for {petData.name}.</p>
                    <div className="space-y-4">
                        <div className="relative"><label className="text-sm font-medium text-gray-500 flex items-center">Breed <Tooltip text="Knowing the breed helps in providing specific care tips and health information." /></label><input type="text" value={breedQuery} onChange={e => setBreedQuery(e.target.value)} onFocus={() => setIsBreedFocused(true)} onBlur={() => setTimeout(() => setIsBreedFocused(false), 200)} placeholder={`e.g., ${petData.species === 'Dog' ? 'Golden Retriever' : 'Siamese'}`} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />{breedSuggestions.length > 0 && (<ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">{breedSuggestions.map(breed => <li key={breed} onMouseDown={() => handleBreedSelect(breed)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">{breed}</li>)}</ul>)}</div>
                        <div><label className="text-sm font-medium text-gray-500 flex items-center">Birth Date <Tooltip text="Your pet's age is important for health and nutrition recommendations." /></label><input type="date" value={petData.birthDate} onChange={e => setPetData(p => ({ ...p, birthDate: e.target.value }))} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />{petData.birthDate && <p className="text-xs text-gray-500 mt-1 text-right">About {calculateAge(petData.birthDate)}</p>}</div>
                        <div><label className="text-sm font-medium text-gray-500">Gender</label><select value={petData.gender} onChange={e => setPetData(p => ({...p, gender: e.target.value as any}))} className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-teal-500 focus:border-teal-500"><option value="Unknown">Unknown</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    </div>
                    <div className="mt-6 flex gap-4"><button onClick={handlePetBack} className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300">Back</button><button onClick={handlePetSave} disabled={loading} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 disabled:opacity-50">{loading ? 'Saving...' : "Finish Setup"}</button></div>
                </div>
              )}
            </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
