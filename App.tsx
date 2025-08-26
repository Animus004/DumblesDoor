// Trigger Vercel deployment
import React, { useState, useEffect, useRef } from 'react';
import { HealthCheckResult, GeminiChatMessage, DBChatMessage, Appointment, AIFeedback, TimelineEntry, ActiveModal, Vet, Product, PetbookPost, EncyclopediaTopic, Pet, UserProfile } from './types';
import { ICONS } from './constants';
import * as geminiService from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

import FeatureCard from './components/FeatureCard';
import EnvironmentVariablePrompt from './components/ApiKeyPrompt';
import { marked } from 'marked';

type ActiveScreen = 'home' | 'book' | 'essentials' | 'vet' | 'profile' | 'petDataAI' | 'environmentVariables';

// --- AUTH & ONBOARDING COMPONENTS ---

const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading Dumble's Door..." }) => (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-teal-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
        <p className="text-gray-600 mt-4 text-lg">{message}</p>
    </div>
);

const EmailVerificationScreen: React.FC<{ email: string }> = ({ email }) => (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4 text-center">
            <div className="text-5xl">📧</div>
            <h1 className="text-3xl font-bold text-gray-800">Verify Your Email</h1>
            <p className="text-gray-600">
                We've sent a verification link to <strong className="text-gray-900">{email}</strong>. Please click the link to secure your account and continue.
            </p>
            <p className="text-sm text-gray-500 mt-4">
                Didn't get an email? Check your spam folder or try signing up again.
            </p>
        </div>
    </div>
);

const AuthScreen: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            let result;
            if (isLoginView) {
                result = await supabase.auth.signInWithPassword({ email, password });
            } else {
                result = await supabase.auth.signUp({ email, password });
                if (!result.error) {
                    setMessage("Success! Please check your email for a verification link.");
                }
            }
            if (result.error) throw result.error;
            // The onAuthStateChange listener in App.tsx will handle redirecting
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Dumble's Door</h1>
                    <p className="text-gray-600 mt-2">{isLoginView ? "Welcome back!" : "Create your account"}</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
                        <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" placeholder="••••••••" />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {message && <p className="text-green-600 text-sm text-center">{message}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl text-lg hover:opacity-90 transition-opacity transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-wait">
                        {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600">
                    {isLoginView ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-semibold text-teal-600 hover:underline ml-1">
                        {isLoginView ? "Sign Up" : "Log In"}
                    </button>
                </p>
            </div>
        </div>
    );
};

const PET_AVATARS = [
    'https://i.postimg.cc/Qd2P5YVs/dog-avatar.png',
    'https://i.postimg.cc/k4mJk9gq/cat-avatar.png',
    'https://i.postimg.cc/PqYg4bW8/puppy-avatar.png',
    'https://i.postimg.cc/X7YxKk2W/kitten-avatar.png',
    'https://i.postimg.cc/t4xW8gTq/paw-avatar.png',
    'https://i.postimg.cc/MHWxLzF5/bird-avatar.png'
];

const ALL_BREEDS = [
  "Beagle", "Bengal Cat", "Bombay Cat", "Boxer", "British Shorthair", "Chippiparai", "Cocker Spaniel",
  "Dachshund", "Dalmatian", "Doberman", "Exotic Shorthair", "German Shepherd", "Golden Retriever", "Great Dane",
  "Himalayan Cat", "Indian Billi (Indian Street Cat)", "Indian Spitz", "Labrador Retriever", "Lhasa Apso",
  "Maine Coon", "Mudhol Hound", "Persian Cat", "Pomeranian", "Pug", "Rajapalayam", "Rottweiler", "Shih Tzu",
  "Siamese Cat", "Siberian Husky"
].sort();


const ProfileSetupScreen: React.FC<{ 
    user: User;
    onSetupComplete: (
        profileData: Omit<UserProfile, 'auth_user_id' | 'email'>, 
        petData: Omit<Pet, 'id' | 'auth_user_id' | 'notes'>
    ) => void; 
}> = ({ user, onSetupComplete }) => {
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        city: ''
    });

    const [petData, setPetData] = useState({
        name: '',
        photo_url: PET_AVATARS[0],
        species: 'Dog',
        breed: '',
        birth_date: '',
        gender: 'Male' as Pet['gender'],
    });
    
    const [breedSuggestions, setBreedSuggestions] = useState<string[]>([]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handlePetChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPetData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'breed' && value.length > 1) {
            const suggestions = ALL_BREEDS.filter(breed => 
                breed.toLowerCase().includes(value.toLowerCase())
            );
            setBreedSuggestions(suggestions.slice(0, 5)); // show top 5
        } else {
            setBreedSuggestions([]);
        }
    };

    const handleBreedSelect = (breed: string) => {
        setPetData(prev => ({ ...prev, breed: breed }));
        setBreedSuggestions([]);
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isProcessing) return;
        setIsProcessing(true);
        await onSetupComplete(profileData, petData);
        // isProcessing will be set to false by the parent component's logic
    };

    if (isProcessing) {
        return <LoadingScreen message="Creating your pet-friendly world..." />;
    }

    const renderStep1 = () => (
        <form onSubmit={handleNextStep} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
                <input id="name" name="name" type="text" value={profileData.name} onChange={handleProfileChange} placeholder="e.g., Priya Sharma" required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" />
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input id="email" name="email" type="email" value={user.email} disabled className="mt-1 w-full border-gray-300 rounded-lg p-3 bg-gray-100" />
            </div>
             <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input id="phone" name="phone" type="tel" value={profileData.phone} onChange={handleProfileChange} placeholder="9876543210" required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">Your City</label>
                <input id="city" name="city" type="text" value={profileData.city} onChange={handleProfileChange} placeholder="e.g., Bangalore" required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl text-lg hover:opacity-90 transition-opacity transform hover:scale-105 shadow-lg">Next: Add Your Pet</button>
        </form>
    );

    const renderStep2 = () => (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Choose an Avatar</label>
                 <div className="flex flex-wrap gap-3 justify-center">
                    {PET_AVATARS.map(url => (
                        <button key={url} type="button" onClick={() => setPetData(prev => ({...prev, photo_url: url}))} className={`h-16 w-16 rounded-full overflow-hidden transition-all duration-200 ${petData.photo_url === url ? 'ring-4 ring-offset-2 ring-teal-500 scale-110' : 'ring-2 ring-gray-200 hover:ring-teal-400'}`}>
                            <img src={url} alt="Pet Avatar" className="w-full h-full object-cover" />
                        </button>
                    ))}
                 </div>
            </div>
            <div>
                <label htmlFor="petName" className="block text-sm font-medium text-gray-700">Pet's Name</label>
                <input id="petName" name="name" type="text" value={petData.name} onChange={handlePetChange} placeholder="e.g., Buddy" required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="species" className="block text-sm font-medium text-gray-700">Species</label>
                    <select id="species" name="species" value={petData.species} onChange={handlePetChange} required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500">
                        <option>Dog</option><option>Cat</option><option>Bird</option><option>Fish</option><option>Other</option>
                    </select>
                </div>
                 <div className="relative">
                    <label htmlFor="breed" className="block text-sm font-medium text-gray-700">Breed</label>
                    <input id="breed" name="breed" type="text" value={petData.breed} onChange={handlePetChange} placeholder="e.g., Golden Retriever" required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" autoComplete="off" />
                    {breedSuggestions.length > 0 && (
                        <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {breedSuggestions.map(breed => (
                                <li key={breed} onClick={() => handleBreedSelect(breed)} className="px-4 py-2 cursor-pointer hover:bg-gray-100">
                                    {breed}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">Birth Date (Approx.)</label>
                    <input id="birth_date" name="birth_date" type="date" value={petData.birth_date} onChange={handlePetChange} required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                    <select id="gender" name="gender" value={petData.gender} onChange={handlePetChange} required className="mt-1 w-full border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Unknown</option>
                    </select>
                </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#FF6464] to-red-400 text-white font-bold py-3 px-6 rounded-xl text-lg hover:opacity-90 transition-opacity transform hover:scale-105 shadow-lg">Finish Setup</button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-center text-gray-600 mt-2 hover:underline text-sm">Go Back</button>
        </form>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{step === 1 ? "Welcome to Dumble's Door!" : "Add Your Furry Friend"}</h1>
                    <p className="text-gray-600">{step === 1 ? "Let's set up your profile to get started." : "Create a profile for your companion."}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                        <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                    </div>
                </div>
                {step === 1 ? renderStep1() : renderStep2()}
            </div>
        </div>
    );
};


// --- MODAL COMPONENTS ---

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }> = ({ title, onClose, children, size = 'lg' }) => {
  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-6xl'
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b flex justify-between items-center flex-shrink-0 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none" aria-label="Close modal">&times;</button>
        </header>
        <div className="p-6 overflow-y-auto bg-white rounded-b-2xl">{children}</div>
      </div>
    </div>
  );
};

// --- LAYOUT COMPONENTS ---
const ScreenHeader: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
    <div className="p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <div>{children}</div>
    </div>
);

const BottomNav: React.FC<{ onNavigate: (screen: ActiveScreen) => void; activeScreen: ActiveScreen }> = ({ onNavigate, activeScreen }) => {
    const navItems = [
        { screen: 'home', label: 'Home', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
        { screen: 'book', label: 'Pet Book', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
        { screen: 'essentials', label: 'Shop', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
        { screen: 'vet', label: 'Book Vet', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { screen: 'profile', label: 'Profile', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    ];
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-30 flex justify-around border-t">
            {navItems.map(item => (
                <button key={item.label} onClick={() => onNavigate(item.screen as ActiveScreen)} className={`flex flex-col items-center justify-center p-2 w-full transition-colors duration-200 ${activeScreen === item.screen ? 'text-[#FF6464]' : 'text-gray-500 hover:text-gray-800'}`}>
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                </button>
            ))}
        </nav>
    )
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [vets, setVets] = useState<Vet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [encyclopedia, setEncyclopedia] = useState<EncyclopediaTopic[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const [healthCheckResult, setHealthCheckResult] = useState<HealthCheckResult | null>(null);
  const [healthCheckError, setHealthCheckError] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<DBChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const imageCaptureRef = useRef<HTMLInputElement>(null);
  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;

  // Check for all required environment variables.
  const requiredKeys = ['VITE_API_KEY', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingKeys = requiredKeys.filter(key => !import.meta.env[key]);

  useEffect(() => {
    // If keys are missing, don't proceed with auth setup.
    if (missingKeys.length > 0) {
        setIsLoading(false);
        return;
    }

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) {
            // User logged out
            setUserProfile(null);
            setPets([]);
            setTimeline([]);
            setIsLoading(false);
        } else if (session.user) {
            // User is logged in.
            // Check ref to see if profile was just created client-side.
            // If so, don't re-fetch and risk a race condition with the DB.
            const profileExistsInState = userProfileRef.current?.auth_user_id === session.user.id;
            if (!profileExistsInState) {
                fetchInitialData(session.user.id);
            }
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchInitialData = async (userId: string) => {
    setIsLoading(true);
    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore 'exact one row' error if profile doesn't exist
            throw profileError;
        }

        if (profile) {
            setUserProfile(profile);
            
            const petsPromise = supabase.from('pets').select('*').eq('auth_user_id', userId);
            // In a real app, you'd fetch timeline, vets, products etc. here too
            // For now, we'll keep it simple
            const [{ data: petsData, error: petsError }] = await Promise.all([petsPromise]);

            if (petsError) throw petsError;
            
            setPets(petsData || []);
        } else {
            // New user, profile doesn't exist yet. The ProfileSetupScreen will be shown.
            setUserProfile(null);
        }

    } catch (error) {
        console.error("Error fetching initial data:", error);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleProfileSetupComplete = async (
      profileData: Omit<UserProfile, 'auth_user_id' | 'email'>, 
      petData: Omit<Pet, 'id' | 'auth_user_id' | 'notes'>
  ) => {
      if (!session) return;
      
      const newProfile = {
          auth_user_id: session.user.id,
          email: session.user.email!,
          ...profileData
      };
      const { error: profileError } = await supabase.from('profiles').insert(newProfile);
      if (profileError) {
          console.error("Error creating profile:", profileError);
          // Handle error (e.g., show a message to the user)
          return;
      }
      setUserProfile(newProfile);

      const newPet = {
          auth_user_id: session.user.id,
          ...petData
      };
      const { error: petError } = await supabase.from('pets').insert(newPet);
      if (petError) {
          console.error("Error creating pet:", petError);
          // Handle error
          return;
      }

      // Refetch pets to get the one with the new ID
      const { data: petsData } = await supabase.from('pets').select('*').eq('auth_user_id', session.user.id);
      setPets(petsData || []);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle resetting state
  };


  const handleHealthCheck = async (imageFile: File, notes: string) => {
    if (!pets.length) {
      setHealthCheckError("Please add a pet to your profile first.");
      return;
    }
    setIsCheckingHealth(true);
    setHealthCheckResult(null);
    setHealthCheckError(null);

    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const pet = pets[0]; // Assuming first pet for simplicity
      const age = new Date().getFullYear() - new Date(pet.birth_date).getFullYear();

      try {
        const result = await geminiService.analyzePetHealth(
          base64String,
          imageFile.type,
          notes,
          { name: pet.name, breed: pet.breed, age: `${age} years` }
        );
        setHealthCheckResult(result);
      } catch (error: any) {
        setHealthCheckError(error.message);
      } finally {
        setIsCheckingHealth(false);
      }
    };
  };
  
  const handleImageCapture = () => {
    imageCaptureRef.current?.click();
  };
  
  const onImageFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, let's just log it. This would trigger the health check modal.
      console.log("Image selected:", file.name);
      setActiveModal('health');
    }
  };
  
  const handleChatSubmit = async (message: string) => {
    if (!session) return;
    const userMessage: DBChatMessage = {
        auth_user_id: session.user.id,
        sender: 'user',
        message: message,
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsAiTyping(true);

    const geminiHistory: GeminiChatMessage[] = chatMessages.map(msg => ({
        role: msg.sender,
        parts: [{ text: msg.message }]
    }));

    try {
        let fullResponse = "";
        const stream = geminiService.getChatStream(geminiHistory, message);

        for await (const chunk of stream) {
            fullResponse += chunk;
            setChatMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage.sender === 'model') {
                    // Update the last message from the model
                    const newMessages = [...prev.slice(0, -1)];
                    newMessages.push({ ...lastMessage, message: fullResponse });
                    return newMessages;
                } else {
                    // Add a new message from the model
                    return [...prev, { auth_user_id: session.user.id, sender: 'model', message: fullResponse }];
                }
            });
        }
        
        // Save both messages to DB after stream is complete
        await supabase.from('chat_messages').insert([
            { auth_user_id: session.user.id, sender: 'user', message: message },
            { auth_user_id: session.user.id, sender: 'model', message: fullResponse }
        ]);

    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: DBChatMessage = {
            auth_user_id: session.user.id,
            sender: 'model',
            message: "Sorry, I'm having trouble connecting right now. Please try again later.",
        };
        setChatMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsAiTyping(false);
    }
  };

  // --- RENDER LOGIC ---

  if (missingKeys.length > 0) {
    return <EnvironmentVariablePrompt missingKeys={missingKeys} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!session) {
      return <AuthScreen />;
  }
  
  // Check if the user's email is verified after signup
  if (session.user && !session.user.email_confirmed_at) {
    // This logic might need adjustment based on when `email_confirmed_at` gets populated.
    // Supabase might require a page refresh or re-login after email verification.
    const isNewUser = (new Date().getTime() - new Date(session.user.created_at).getTime()) < 5 * 60 * 1000; // 5 minutes threshold
    if (isNewUser) {
       return <EmailVerificationScreen email={session.user.email!} />;
    }
  }

  if (!userProfile) {
    return <ProfileSetupScreen user={session.user} onSetupComplete={handleProfileSetupComplete} />;
  }
  
  const currentPet = pets.length > 0 ? pets[0] : null;

  const renderActiveScreen = () => {
    switch (activeScreen) {
      // Define other screens here later
      // case 'book': return <PetBookScreen ... />;
      // case 'essentials': return <EssentialsScreen ... />;
      // case 'vet': return <VetBookingScreen ... />;
      // case 'profile': return <ProfileScreen ... />;
      default:
        return (
          <main className="container mx-auto p-4 pb-24">
            <div className="text-center mb-8">
                <img src={currentPet?.photo_url} alt={currentPet?.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg" />
                <h2 className="text-3xl font-bold text-gray-800">Hi, {userProfile.name}!</h2>
                <p className="text-gray-600 text-lg">How can Dumble help {currentPet?.name || 'your pet'} today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureCard
                title="AI Health Check"
                description="Snap a photo for a quick wellness scan."
                icon={ICONS.HEALTH_CHECK}
                color="bg-teal-100"
                textColor="text-teal-800"
                onClick={() => setActiveModal('health')}
                disabled={!currentPet}
              />
              <FeatureCard
                title="Book a Vet"
                description="Find and schedule appointments nearby."
                icon={ICONS.VET_BOOKING}
                color="bg-cyan-100"
                textColor="text-cyan-800"
                onClick={() => setActiveScreen('vet')}
              />
              <FeatureCard
                title="Pet Essentials"
                description="Shop for curated food, toys, and more."
                icon={ICONS.PET_ESSENTIALS}
                color="bg-rose-100"
                textColor="text-rose-800"
                onClick={() => setActiveScreen('essentials')}
              />
              <FeatureCard
                title="Pet Book"
                description="A digital diary of your pet's life."
                icon={ICONS.PET_BOOK}
                color="bg-amber-100"
                textColor="text-amber-800"
                onClick={() => setActiveScreen('book')}
              />
            </div>
          </main>
        );
    }
  };
  
   const renderModal = () => {
    if (!activeModal) return null;
    
    switch (activeModal) {
      case 'health':
        const HealthCheckContent: React.FC = () => {
          const [photo, setPhoto] = useState<File | null>(null);
          const [notes, setNotes] = useState('');
          const fileInputRef = useRef<HTMLInputElement>(null);

          const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.[0]) {
                  setPhoto(e.target.files[0]);
              }
          };
          
          const handleSubmit = (e: React.FormEvent) => {
              e.preventDefault();
              if (photo) {
                  handleHealthCheck(photo, notes);
              }
          }

          if (isCheckingHealth) {
              return (
                <div className="text-center p-8">
                  <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div>
                  <h3 className="text-xl font-semibold mt-4">Dumble is analyzing...</h3>
                  <p className="text-gray-600">This might take a moment. We're checking for any signs we should pay attention to.</p>
                </div>
              );
          }
          
          if (healthCheckError) {
              return (
                <div className="text-center p-8">
                    <div className="text-5xl mb-4">😢</div>
                    <h3 className="text-xl font-bold text-red-600">Analysis Failed</h3>
                    <p className="text-gray-600 mb-4">{healthCheckError}</p>
                    <button onClick={() => { setHealthCheckError(null); setPhoto(null); }} className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg">Try Again</button>
                </div>
              );
          }
          
          if (healthCheckResult) {
            return (
                <div>
                    <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">Wellness Card for {currentPet?.name}</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <p><strong>Breed Match:</strong> {healthCheckResult.breed}</p>
                        <p><strong>Health Analysis:</strong> {healthCheckResult.healthAnalysis}</p>
                        <div>
                            <strong>Care Tips:</strong>
                            <ul className="list-disc list-inside ml-4">
                                {healthCheckResult.careTips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                        {healthCheckResult.vetRecommendation && <div className="p-3 bg-red-100 text-red-800 rounded-lg font-semibold">⚠️ We recommend a quick visit to the vet.</div>}
                        {healthCheckResult.groomingRecommendation && <div className="p-3 bg-blue-100 text-blue-800 rounded-lg font-semibold">🛁 A grooming session might be a good idea!</div>}
                        {healthCheckResult.productRecommendations.length > 0 && <div>
                            <strong>Suggested Products:</strong>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {healthCheckResult.productRecommendations.map((prod, i) => <span key={i} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">{prod}</span>)}
                            </div>
                        </div>}
                    </div>
                     <button onClick={() => { setHealthCheckResult(null); setPhoto(null); }} className="w-full mt-4 bg-teal-500 text-white font-bold py-2 px-4 rounded-lg">Check Another Photo</button>
                </div>
            );
          }

          return (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Upload or Take a Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    {photo ? (
                        <div>
                            <img src={URL.createObjectURL(photo)} alt="Pet preview" className="max-h-40 mx-auto rounded-lg" />
                            <p className="mt-2 text-sm text-gray-600">{photo.name}</p>
                        </div>
                    ) : (
                        <div>
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="mt-2">Click to upload an image</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                        </div>
                    )}
                </div>
              </div>
               <div className="mb-4">
                  <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Any specific concerns?</label>
                  <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500" placeholder="e.g., 'He's been scratching his ear a lot.'"></textarea>
               </div>
              <button type="submit" disabled={!photo} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                Analyze Pet Health
              </button>
            </form>
          );
        };
        return <Modal title="AI Health Check" onClose={() => setActiveModal(null)}><HealthCheckContent /></Modal>;
      
      case 'chat':
        const ChatContent: React.FC = () => {
            const [newMessage, setNewMessage] = useState('');
            const chatContainerRef = useRef<HTMLDivElement>(null);
            
            useEffect(() => {
                chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
            }, [chatMessages, isAiTyping]);

            const handleFormSubmit = (e: React.FormEvent) => {
                e.preventDefault();
                if (newMessage.trim()) {
                    handleChatSubmit(newMessage.trim());
                    setNewMessage('');
                }
            };
            
            return (
                <div className="h-[70vh] flex flex-col">
                    <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2 space-y-4">
                       {chatMessages.map((msg, index) => (
                           <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                               {msg.sender === 'model' && <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-lg flex-shrink-0">D</div>}
                               <div
                                   className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
                                   dangerouslySetInnerHTML={{ __html: marked(msg.message) }}
                               />
                           </div>
                       ))}
                       {isAiTyping && (
                           <div className="flex items-end gap-2">
                               <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-lg flex-shrink-0">D</div>
                               <div className="p-3 bg-gray-200 rounded-2xl rounded-bl-none">
                                   <div className="flex items-center gap-1">
                                       <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-0"></span>
                                       <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                       <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
                                   </div>
                               </div>
                           </div>
                       )}
                    </div>
                    <form onSubmit={handleFormSubmit} className="mt-4 flex gap-2 pt-2 border-t">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ask Dumble anything..."
                            className="flex-grow border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500"
                            disabled={isAiTyping}
                        />
                        <button type="submit" className="bg-teal-500 text-white p-3 rounded-lg disabled:opacity-50" disabled={isAiTyping || !newMessage.trim()}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                    </form>
                </div>
            );
        };
        return <Modal title="Chat with Dumble" onClose={() => setActiveModal(null)} size="md"><ChatContent /></Modal>;
        
      default:
        return null;
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 shadow-md w-full sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
              <h1 className="text-3xl font-bold tracking-tight">Dumble's Door</h1>
          </div>
          <button onClick={() => setActiveScreen('profile')} className="rounded-full h-10 w-10 bg-white/30 hover:bg-white/50 flex items-center justify-center" aria-label="Open Profile">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
          </button>
        </div>
      </header>

      {renderActiveScreen()}
      {renderModal()}
      
      {/* Floating Chat Button */}
      <button 
        onClick={() => setActiveModal('chat')}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-[#FF6464] to-red-500 text-white rounded-full p-4 shadow-lg transform transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-300"
        aria-label="Open Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
        </svg>
      </button>

      <BottomNav onNavigate={setActiveScreen} activeScreen={activeScreen} />
      
      {/* Hidden file input for camera access */}
      <input type="file" accept="image/*" capture="environment" ref={imageCaptureRef} onChange={onImageFileSelected} style={{ display: 'none' }} />
    </div>
  );
};

export default App;