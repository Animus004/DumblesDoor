





import React, { useState, useEffect, useRef } from 'react';
import { HealthCheckResult, GeminiChatMessage, DBChatMessage, Appointment, AIFeedback, TimelineEntry, ActiveModal, Vet, Product, PetbookPost, EncyclopediaTopic, Pet, UserProfile } from './types';
import { ICONS } from './constants';
import * as geminiService from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

import FeatureCard from './components/FeatureCard';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import { marked } from 'marked';

type ActiveScreen = 'home' | 'book' | 'essentials' | 'vet' | 'profile' | 'petDataAI';

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
  const [apiKeyExists, setApiKeyExists] = useState(false);
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
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);
  const [productContext, setProductContext] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

    // Effect for checking API Key and handling auth state changes
    useEffect(() => {
        if (process.env.API_KEY) setApiKeyExists(true);

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            // Initial load can be slow, so let's set loading to false after the first check
            // The next useEffect will handle loading for actual app data
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Effect for loading all app data when a session is active
    useEffect(() => {
        const loadAppData = async () => {
            if (!session) {
                setUserProfile(null);
                setPets([]);
                setTimeline([]);
                // No need to set loading, handled by the session check
                return;
            }

            setIsLoading(true);
            try {
                // Fetch user-specific profile first
                const { data: profileData, error: profileError } = await supabase.from('Dumblesdoor_User').select('*').eq('auth_user_id', session.user.id).single();

                if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
                    throw profileError;
                }

                // If profile exists, load everything else
                if (profileData) {
                    setUserProfile(profileData);
                    const [vetsRes, productsRes, encyclopediaRes, petsRes, postsRes, appointmentsRes, healthChecksRes] = await Promise.all([
                        supabase.from('vet').select('*'),
                        supabase.from('product').select('*'),
                        supabase.from('encyclopedia').select('*'),
                        supabase.from('pet').select('*').eq('auth_user_id', session.user.id),
                        supabase.from('petbook_post').select('*').eq('auth_user_id', session.user.id),
                        supabase.from('appointment').select('*, vet:vet_id(*)').eq('auth_user_id', session.user.id),
                        supabase.from('ai_feedback').select('*').eq('auth_user_id', session.user.id)
                    ]);

                    if (vetsRes.data) setVets(vetsRes.data as any);
                    if (productsRes.data) setProducts(productsRes.data as any);
                    if (encyclopediaRes.data) setEncyclopedia(encyclopediaRes.data as any);
                    if (petsRes.data) setPets(petsRes.data as any);
                    
                    const timelineData: TimelineEntry[] = [];
                    postsRes.data?.forEach(p => timelineData.push({ id: p.id, timestamp: p.created_at, type: 'post', pet_id: p.pet_id, data: p as PetbookPost }));
                    appointmentsRes.data?.forEach(a => timelineData.push({ id: a.id, timestamp: a.created_at, type: 'appointment', pet_id: a.pet_id, data: a as Appointment }));
                    healthChecksRes.data?.forEach(h => timelineData.push({ id: h.id, timestamp: h.submitted_at, type: 'health_check', pet_id: h.pet_id, data: h as AIFeedback }));

                    setTimeline(timelineData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                } else {
                    // User is authenticated but has no profile, so we don't need to load user data
                    setUserProfile(null);
                }
            } catch (error) {
                console.error("Error loading app data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadAppData();
    }, [session]);

    const handleProfileAndPetSetup = async (
        profileData: Omit<UserProfile, 'auth_user_id' | 'email'>,
        petData: Omit<Pet, 'id' | 'auth_user_id' | 'notes'>
    ) => {
        setIsLoading(true);
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000; // 1 second

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // Get the MOST current session right before the attempt
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    throw new Error("Authentication session not found. Please log in again.");
                }

                const user = session.user;
                const fullProfileData = {
                    ...profileData,
                    email: user.email!,
                    auth_user_id: user.id
                };

                const { data: newProfileData, error: profileError } = await supabase
                    .from('Dumblesdoor_User')
                    .insert(fullProfileData)
                    .select()
                    .single();

                if (profileError) {
                    // Re-throw to be caught by the outer catch block of this attempt
                    throw profileError;
                }

                // --- SUCCESS ---
                if (!newProfileData) {
                    throw new Error("An unknown error occurred while creating your profile.");
                }
                setUserProfile(newProfileData as UserProfile);

                const petPayload = { ...petData, auth_user_id: user.id };
                const { data: newPetData, error: petError } = await supabase
                    .from('pet')
                    .insert(petPayload)
                    .select()
                    .single();

                if (petError) {
                    console.error("Failed to create pet during setup:", petError);
                    alert("Your profile was created, but we couldn't add your pet. You can add it from your profile page.");
                }
                if (newPetData) setPets([newPetData as Pet]);
                
                setTimeline([]);
                setIsLoading(false);
                return; // Exit the function successfully

            } catch (error: any) {
                // Check if it's the specific RLS error (code for postgres RLS violation)
                if (error.code === '42501' && attempt < MAX_RETRIES) {
                    console.warn(`Attempt ${attempt} failed with RLS error. Retrying in ${RETRY_DELAY}ms...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    // Also force a session refresh before the next attempt, just in case
                    await supabase.auth.refreshSession(); 
                } else {
                    // This is a different error, or the last attempt failed.
                    console.error("Error during setup process:", error);
                    const errorMessage = error.message || "An unknown error occurred.";
                    alert(`There was an error setting up your profile: ${errorMessage}\nPlease try again.`);
                    setIsLoading(false);
                    return; // Exit function on failure
                }
            }
        }
    };


  const addTimelineEntry = (entry: TimelineEntry) => {
    setTimeline(prev => [entry, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleAddPost = async (post: Omit<PetbookPost, 'id' | 'auth_user_id' | 'created_at'>) => {
    if (!session) return;
    const payload = { ...post, auth_user_id: session.user.id };
    const { data: newPost, error } = await supabase.from('petbook_post').insert(payload).select().single();
    if (!error && newPost) {
      addTimelineEntry({ id: newPost.id, timestamp: newPost.created_at, type: 'post', pet_id: newPost.pet_id, data: newPost as PetbookPost });
    }
  };

  const handleVetBooking = async (bookingInfo: { pet_id: string; vet: Vet; dateTime: string; consultationType: 'in-clinic' | 'video' }) => {
    if (!session) return;
    const payload: Omit<Appointment, 'id' | 'created_at' | 'vet'> = {
      pet_id: bookingInfo.pet_id,
      vet_id: bookingInfo.vet.id,
      auth_user_id: session.user.id,
      status: 'booked',
      notes: JSON.stringify({ dateTime: bookingInfo.dateTime, consultationType: bookingInfo.consultationType })
    };
    const { data: newAppointment, error } = await supabase.from('appointment').insert(payload).select().single();
    if (!error && newAppointment) {
      const entryData = { ...newAppointment, vet: bookingInfo.vet } as Appointment;
      addTimelineEntry({ id: newAppointment.id, timestamp: newAppointment.created_at, type: 'appointment', pet_id: newAppointment.pet_id, data: entryData });
      setActiveScreen('home');
    }
  };

  const handleHealthCheckResult = async (result: { petId: string; photo: string; notes: string; result: HealthCheckResult; }) => {
    if (!session) return;
    const payload: Omit<AIFeedback, 'id' | 'submitted_at'> = {
      pet_id: result.petId,
      auth_user_id: session.user.id,
      input_data: { photo_url: result.photo, notes: result.notes },
      ai_response: JSON.stringify(result.result),
      status: 'completed',
    };
    const { data: newFeedback, error } = await supabase.from('ai_feedback').insert(payload).select().single();
    if (!error && newFeedback) {
      addTimelineEntry({ id: newFeedback.id, timestamp: newFeedback.submitted_at, type: 'health_check', pet_id: newFeedback.pet_id, data: newFeedback as AIFeedback });
    }
  };
  
  const handleModalClose = () => {
    setActiveModal(null);
    stopCamera();
    setProductContext(null);
    setChatContext(undefined);
  };
  
  const handleNavigation = (screen: ActiveScreen) => setActiveScreen(screen);
  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && videoRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoRef.current.srcObject = stream;
      } catch (err) { console.error("Error accessing camera:", err); }
    }
  };
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  const takePicture = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current, c = canvasRef.current;
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg');
    }
    return null;
  };
  const handleChatOpen = (context?: string) => { setChatContext(context); setActiveModal('chat'); };
  const handleOpenEssentials = (productName?: string) => { if (productName) setProductContext(productName); setActiveScreen('essentials'); };

  const renderScreen = () => {
    if (!userProfile) return <LoadingScreen />; // Should be handled by top-level render logic, but as a safeguard
    switch(activeScreen) {
        case 'home': return <HomeScreen userProfile={userProfile} onNavigate={setActiveScreen} onOpenModal={setActiveModal} onAskExpert={handleChatOpen} timeline={timeline} pets={pets} encyclopedia={encyclopedia} />;
        case 'book': return <PetBookScreen timeline={timeline} pets={pets} onAddPost={handleAddPost} />;
        case 'essentials': return <MarketplaceScreen initialSearch={productContext} products={products} />;
        case 'vet': return <VetBookingScreen vets={vets} onBook={handleVetBooking} pets={pets} />;
        case 'profile': return <ProfileScreen userProfile={userProfile} pets={pets} setUserProfile={setUserProfile} setPets={setPets} session={session!} />;
        case 'petDataAI': return <PetDataAIModal encyclopedia={encyclopedia} onClose={() => setActiveScreen('home')} onAskExpert={handleChatOpen} />;
        default: return <HomeScreen userProfile={userProfile} onNavigate={setActiveScreen} onOpenModal={setActiveModal} onAskExpert={handleChatOpen} timeline={timeline} pets={pets} encyclopedia={encyclopedia} />;
    }
  }

  if (!apiKeyExists) return <ApiKeyPrompt />;
  if (isLoading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;

  if (!userProfile) {
    // User is authenticated but has no app profile.
    // Check if their email is confirmed before allowing profile creation.
    const isEmailUser = session.user.app_metadata.provider === 'email';
    const isConfirmed = !!session.user.email_confirmed_at || !!session.user.confirmed_at;

    if (isEmailUser && !isConfirmed) {
      return <EmailVerificationScreen email={session.user.email!} />;
    }
    
    // If confirmed (or using OAuth), let them create a profile.
    return <ProfileSetupScreen user={session.user} onSetupComplete={handleProfileAndPetSetup} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white pb-20">
      <main className="flex-grow w-full max-w-4xl mx-auto">
        {renderScreen()}
      </main>
      <button onClick={() => handleChatOpen()} className="fixed bottom-24 right-6 md:bottom-6 bg-[#D9D2EF] text-purple-800 p-4 rounded-full shadow-lg hover:bg-purple-200 transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300 z-30" aria-label="Chat with Dumble AI">
        {ICONS.CHAT}
      </button>
      <BottomNav onNavigate={handleNavigation} activeScreen={activeScreen} />
      {activeModal === 'health' && <HealthCheckModal onClose={handleModalClose} onResult={handleHealthCheckResult} startCamera={startCamera} stopCamera={stopCamera} takePicture={takePicture} videoRef={videoRef} canvasRef={canvasRef} onOpenChat={handleChatOpen} onBookVet={() => setActiveScreen('vet')} onOpenEssentials={handleOpenEssentials} pets={pets} />}
      {activeModal === 'chat' && <ChatModal onClose={handleModalClose} context={chatContext} userProfile={userProfile} />}
    </div>
  );
};

// --- SCREEN IMPLEMENTATIONS ---

const HomeScreen: React.FC<{ userProfile: UserProfile; onNavigate: (s: ActiveScreen) => void; onOpenModal: (m: ActiveModal) => void; onAskExpert: (context: string) => void; timeline: TimelineEntry[]; pets: Pet[]; encyclopedia: EncyclopediaTopic[] }> = ({ userProfile, onNavigate, onOpenModal, onAskExpert, timeline, pets, encyclopedia }) => {
    const getPetById = (id: string) => pets.find(p => p.id === id);
    const [petOfTheDay, setPetOfTheDay] = useState<EncyclopediaTopic | null>(null);

    useEffect(() => {
        if (encyclopedia.length > 0) {
            const randomIndex = Math.floor(Math.random() * encyclopedia.length);
            setPetOfTheDay(encyclopedia[randomIndex]);
        }
    }, [encyclopedia]);

    return (
        <div className="p-6 space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <p className="text-gray-500">Welcome back,</p>
                    <h1 className="text-3xl font-bold text-gray-800">{userProfile.name}!</h1>
                </div>
                 <button onClick={() => onNavigate('profile')} className="rounded-full h-14 w-14 bg-gray-200 ring-2 ring-offset-2 ring-[#FF6464]/50 flex items-center justify-center" aria-label="Open Profile">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </button>
            </header>
             <section className="text-center">
                 <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Pet's Wellness Hub</h2>
                <div className="flex flex-col items-center gap-6">
                    <button onClick={() => onOpenModal('health')} className="group relative w-44 h-44 bg-gradient-to-br from-[#FF6464] to-red-400 rounded-3xl shadow-lg flex items-center justify-center text-white transition-all transform hover:scale-105 hover:shadow-2xl duration-300" aria-label="AI Health Check">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:scale-110 duration-300"><path d="M4 8V6C4 4.89543 4.89543 4 6 4H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16V18C4 19.1046 4.89543 20 6 20H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 4H18C19.1046 4 20 4.89543 20 6V8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 20H18C19.1046 20 20 19.1046 20 18V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/></svg>
                        <span className="absolute bottom-5 text-lg font-bold tracking-wide">AI Health Scan</span>
                    </button>
                    <div className="flex gap-4">
                        <button onClick={() => onNavigate('vet')} className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-2xl text-md hover:bg-gray-100 transition-all transform hover:scale-105 shadow-sm">Book a Vet</button>
                        <button onClick={() => onNavigate('book')} className="bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-2xl text-md hover:bg-gray-100 transition-all transform hover:scale-105 shadow-sm">Pet Book</button>
                    </div>
                </div>
            </section>
            
            {petOfTheDay && (
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">🌟 Pet of the Day</h2>
                    <button 
                        onClick={() => onAskExpert(`Tell me more about the ${petOfTheDay.breed}.`)}
                        className="w-full text-left bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4 hover:-translate-y-1 transition-transform duration-300"
                    >
                        <img src={petOfTheDay.image} alt={petOfTheDay.breed} className="w-full md:w-32 h-32 rounded-lg object-cover" />
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">{petOfTheDay.breed}</h3>
                            <p className="text-gray-600 mt-1">
                                <span className="font-semibold">Did you know?</span> {petOfTheDay.funFactsIndia[0] || 'This pet is amazing!'}
                            </p>
                            <p className="text-sm text-yellow-700 font-semibold mt-2">Tap to learn more!</p>
                        </div>
                    </button>
                </section>
            )}

            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Services</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <FeatureCard title="Book a Vet" description="Find local experts" icon={<div className="text-teal-500">{ICONS.VET_BOOKING}</div>} color="bg-teal-50" textColor="text-teal-800" onClick={() => onNavigate('vet')} />
                    <FeatureCard title="Marketplace" description="Pet essentials" icon={<div className="text-rose-500">{ICONS.PET_ESSENTIALS}</div>} color="bg-rose-50" textColor="text-rose-800" onClick={() => onNavigate('essentials')} />
                    <FeatureCard title="Pet Encyclopedia" description="Breed guides" icon={<div className="text-sky-500">{ICONS.DATA_AI}</div>} color="bg-sky-50" textColor="text-sky-800" onClick={() => onNavigate('petDataAI')} />
                    <FeatureCard title="Pet Book" description="Digital log" icon={<div className="text-purple-500">{ICONS.PET_BOOK}</div>} color="bg-purple-50" textColor="text-purple-800" onClick={() => onNavigate('book')} />
                </div>
            </section>
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                    {timeline.length > 0 ? timeline.slice(0, 3).map(entry => {
                         const pet = getPetById(entry.pet_id);
                         return (
                            <div key={entry.id} className="bg-slate-50 p-4 rounded-xl flex items-center gap-4">
                                {pet && <img src={pet.photo_url} alt={pet.name} className="h-12 w-12 rounded-full object-cover" />}
                                <div>
                                    <p className="font-semibold text-gray-700">
                                        {entry.type === 'post' && `You posted about ${pet?.name || 'your pet'}.`}
                                        {entry.type === 'health_check' && `AI Health Check for ${pet?.name} completed.`}
                                        {entry.type === 'appointment' && `Vet appointment booked for ${pet?.name}.`}
                                    </p>
                                    <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                         )
                    }) : (
                        <p className="text-center text-gray-500 bg-slate-50 p-6 rounded-lg">No recent activity. Try an AI Health Scan to get started!</p>
                    )}
                </div>
            </section>
        </div>
    )
}

const HealthCheckModal: React.FC<{
    onClose: () => void;
    onResult: (result: { petId: string; photo: string; notes: string; result: HealthCheckResult; }) => void;
    startCamera: () => void; stopCamera: () => void; takePicture: () => string | null;
    videoRef: React.RefObject<HTMLVideoElement>; canvasRef: React.RefObject<HTMLCanvasElement>;
    onOpenChat: (context: string) => void; onBookVet: () => void; onOpenEssentials: (productName: string) => void;
    pets: Pet[];
}> = ({ onClose, onResult, startCamera, stopCamera, takePicture, videoRef, canvasRef, onOpenChat, onBookVet, onOpenEssentials, pets }) => {
    const [selectedPetId, setSelectedPetId] = useState<string>('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [result, setResult] = useState<HealthCheckResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setPhoto(event.target?.result as string); setIsCameraOn(false); stopCamera(); };
            reader.readAsDataURL(file);
        }
    };
    const handleCameraToggle = () => {
        if (isCameraOn) { stopCamera(); setIsCameraOn(false); }
        else { setPhoto(null); startCamera(); setIsCameraOn(true); }
    };
    const handleTakePicture = () => {
        const pic = takePicture();
        if (pic) { setPhoto(pic); stopCamera(); setIsCameraOn(false); }
    };
    useEffect(() => { return () => stopCamera(); }, [stopCamera]);

    const handleSubmit = async () => {
        if (!photo) { setError('Please upload or take a photo.'); return; }
        const selectedPet = pets.find(p => p.id === selectedPetId); // Can be undefined

        setIsLoading(true); setError(null); setResult(null);
        try {
            const base64Data = photo.split(',')[1];
            const mimeType = photo.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
            const petContext = selectedPet 
                ? { name: selectedPet.name, breed: selectedPet.breed, age: '' } 
                : { name: 'your pet', breed: 'Unknown', age: 'Unknown' };
            
            const analysisResult = await geminiService.analyzePetHealth(base64Data, mimeType, notes, petContext);
            setResult(analysisResult);

            // Only save the result if a pet was selected
            if (selectedPetId) {
                onResult({ petId: selectedPetId, photo, notes, result: analysisResult });
            }
        } catch (err: any) { setError(err.message || "An unknown error occurred."); }
        finally { setIsLoading(false); }
    };

    return (
        <Modal title="AI Health Check" onClose={onClose}>
            {!result ? (
                <div className="space-y-4">
                     <div>
                        <label htmlFor="pet" className="block text-sm font-medium text-gray-700 mb-1">For which pet? (Optional)</label>
                        {pets.length > 0 ? (
                            <select id="pet" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} className="w-full border-gray-300 rounded-lg">
                                <option value="">General Analysis (don't link to a pet)</option>
                                {pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name} ({pet.breed})</option>)}
                            </select>
                        ) : (
                            <p className="text-center text-gray-500 bg-gray-100 p-3 rounded-lg">Add a pet in your profile for personalized analysis and history.</p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center overflow-hidden">
                            {photo ? <img src={photo} alt="Pet preview" className="object-cover w-full h-full" /> : 
                             isCameraOn ? <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted /> :
                            <p className="text-gray-500">Photo Preview</p>}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="flex flex-col gap-3">
                           <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">Upload Photo</button>
                           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                           <button onClick={handleCameraToggle} className={`w-full font-semibold py-2 px-4 rounded-lg ${isCameraOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'} text-white`}>{isCameraOn ? 'Stop Camera' : 'Start Camera'}</button>
                           {isCameraOn && <button onClick={handleTakePicture} className="w-full bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600">Take Picture</button>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Optional Notes</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full border-gray-300 rounded-lg" placeholder="e.g., My dog is scratching its ear a lot."></textarea>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button onClick={handleSubmit} disabled={isLoading || !photo} className="w-full bg-[#FF6464] text-white font-bold py-3 px-4 rounded-lg hover:bg-red-500 disabled:bg-gray-400 flex items-center justify-center">
                        {isLoading ? 'Analyzing...' : 'Get AI Analysis'}
                    </button>
                </div>
            ) : (
                 <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-800 text-center">Analysis for {pets.find(p=>p.id === selectedPetId)?.name || 'your pet'} Complete!</h3>
                    <div className="p-4 bg-teal-50 rounded-lg border-l-4 border-teal-400">
                        <h4 className="font-bold text-lg text-teal-800">Breed</h4>
                        <p className="text-gray-700">{result.breed}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400 space-y-3">
                        <h4 className="font-bold text-lg text-amber-800">Health Analysis 🩺</h4>
                        <p className="text-gray-800">{result.healthAnalysis}</p>
                        {result.careTips.length > 0 && (
                            <div>
                                <p className="font-semibold text-gray-800">Key Recommendations:</p>
                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-gray-700">
                                    {result.careTips.map((tip, index) => <li key={index}>{tip}</li>)}
                                </ul>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 pt-3 border-t border-amber-200 mt-3 italic">
                            Disclaimer: This AI analysis is not a substitute for a professional veterinary diagnosis. Always consult a vet for health concerns.
                        </p>
                    </div>
                    <div className="space-y-3 pt-4">
                        {result.vetRecommendation && <button onClick={() => { onClose(); onBookVet(); }} className="w-full text-lg bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors">Book a Vet Appointment</button>}
                        {result.groomingRecommendation && <button onClick={() => alert("Grooming booking feature coming soon!")} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors">Book a Grooming Session</button>}
                        {result.productRecommendations.length > 0 && (
                            <div className="p-4 bg-rose-50 rounded-lg">
                                <h4 className="font-bold text-rose-800">Recommended Products:</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                {result.productRecommendations.map(prod => (
                                    <button key={prod} onClick={() => { onClose(); onOpenEssentials(prod); }} className="bg-rose-200 text-rose-800 text-sm font-semibold px-3 py-1 rounded-full hover:bg-rose-300">{prod}</button>
                                ))}
                                </div>
                           </div>
                        )}
                    </div>
                    <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-400 text-purple-800 rounded-r-lg text-center">
                        <p className="font-semibold">Have more questions?</p>
                        <button onClick={() => {
                             const context = `AI analysis:\nBreed: ${result.breed}\nAnalysis: ${result.healthAnalysis}\nCare Tips:\n- ${result.careTips.join('\n- ')}\n\nI have a follow-up question.`;
                             onOpenChat(context);
                             onClose();
                        }} className="mt-1 text-purple-600 font-bold hover:underline">Chat with Dumble AI</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const VetBookingScreen: React.FC<{ vets: Vet[], onBook: (bookingInfo: { pet_id: string; vet: Vet; dateTime: string; consultationType: 'in-clinic' | 'video' }) => void; pets: Pet[]; }> = ({ vets, onBook, pets }) => {
    const [step, setStep] = useState(1);
    const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
    const [bookingDetails, setBookingDetails] = useState({ petId: pets.length > 0 ? pets[0].id : '', date: '', time: '', type: 'in-clinic' });
    
    const handleSelectVet = (vet: Vet) => { setSelectedVet(vet); setStep(2); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedPet = pets.find(p => p.id === bookingDetails.petId);
        if (!selectedVet || !selectedPet) return;
        
        onBook({
            pet_id: selectedPet.id,
            vet: selectedVet,
            dateTime: `${bookingDetails.date}T${bookingDetails.time}`,
            consultationType: bookingDetails.type as 'in-clinic' | 'video',
        });
        setStep(3);
    };

    return (
        <div className="p-6">
            <ScreenHeader title={step === 1 ? "Book a Vet" : step === 2 ? `Book with ${selectedVet?.name}` : "Booking Confirmed!"} />
             {step === 1 && (
                <div className="space-y-4">
                    <input type="search" placeholder="Search vets or clinics..." className="w-full border-gray-300 rounded-xl p-3" />
                    {vets.map(vet => (
                        <div key={vet.id} className="flex items-center gap-4 p-4 border rounded-xl bg-white shadow-sm">
                            <img src={vet.photo_url} alt={vet.name} className="w-20 h-20 rounded-full object-cover"/>
                            <div className="flex-grow">
                                <h4 className="font-bold text-lg">{vet.name}</h4>
                                <p className="text-sm text-gray-600">{vet.specialization}</p>
                                <p className="text-sm text-gray-600">{vet.address}, {vet.city}</p>
                                <p className="text-sm font-semibold text-teal-600">Available: {vet.available_time}</p>
                            </div>
                            <button onClick={() => handleSelectVet(vet)} className="bg-[#FF6464] text-white font-bold py-2 px-4 rounded-full hover:bg-red-500">Book</button>
                        </div>
                    ))}
                </div>
            )}
            {step === 2 && selectedVet && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4 p-2 bg-slate-100 rounded-lg">
                        <img src={selectedVet.photo_url} alt={selectedVet.name} className="w-16 h-16 rounded-full object-cover"/>
                        <div><h4 className="font-bold">{selectedVet.name}</h4><p className="text-sm text-gray-600">{selectedVet.address}</p></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Which pet is this for?</label>
                        {pets.length > 0 ? (
                            <select value={bookingDetails.petId} onChange={e => setBookingDetails({...bookingDetails, petId: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md" required>
                                {pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name} ({pet.breed})</option>)}
                            </select>
                        ) : (<p className="text-center text-red-500 bg-red-50 p-3 rounded-lg mt-1">You need to add a pet in your profile first!</p>)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Date</label><input type="date" value={bookingDetails.date} onChange={e => setBookingDetails({...bookingDetails, date: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md" required /></div>
                        <div><label className="block text-sm font-medium">Time</label><input type="time" value={bookingDetails.time} onChange={e => setBookingDetails({...bookingDetails, time: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md" required /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Consultation Type</label>
                        <select value={bookingDetails.type} onChange={e => setBookingDetails({...bookingDetails, type: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md" required>
                            <option value='in-clinic'>In-Clinic</option><option value='video'>Video Call</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-[#FF6464] text-white font-bold py-3 rounded-lg hover:bg-red-500 disabled:bg-gray-400" disabled={pets.length === 0}>Confirm Booking</button>
                </form>
            )}
            {step === 3 && (
                <div className="text-center p-6">
                    <h3 className="text-2xl font-bold text-gray-800">Your Appointment is Set!</h3>
                    <p className="text-gray-600 mt-2">Details have been added to your Pet Book.</p>
                </div>
            )}
        </div>
    );
};

const MarketplaceScreen: React.FC<{ initialSearch: string | null; products: Product[] }> = ({ initialSearch, products }) => {
    const [selectedCategory, setSelectedCategory] = useState<Product['category'] | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');

    const categories: Product['category'][] = ['Food', 'Toys', 'Grooming', 'Medicine', 'Accessories'];
    const filteredProducts = products.filter(p => (selectedCategory === 'All' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6">
             <ScreenHeader title="Marketplace" />
             <div className="space-y-4">
                <input type="search" placeholder="Search for products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border-gray-300 rounded-xl p-3 text-lg" />
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${selectedCategory === 'All' ? 'bg-[#28CBC9] text-white' : 'bg-teal-100 text-teal-800'}`}>All</button>
                    {categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${selectedCategory === cat ? 'bg-[#28CBC9] text-white' : 'bg-teal-100 text-teal-800'}`}>{cat}</button>))}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="border rounded-xl p-4 space-y-3 flex flex-col bg-white shadow-sm">
                            <div className="bg-gray-100 rounded-lg p-2"><img src={product.image_url} alt={product.name} className="h-32 w-full object-contain rounded-md "/></div>
                            <h4 className="font-bold text-gray-800 flex-grow">{product.name}</h4>
                            <p className="font-bold text-lg">₹{product.price.toFixed(2)}</p>
                            <button className="w-full bg-[#FF6464] text-white font-bold py-2 rounded-lg text-sm">Add to Cart</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PetBookScreen: React.FC<{ timeline: TimelineEntry[]; pets: Pet[]; onAddPost: (post: Omit<PetbookPost, 'id' | 'auth_user_id' | 'created_at'>) => void; }> = ({ timeline, pets, onAddPost }) => {
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [newPostPetId, setNewPostPetId] = useState<string>(pets.length > 0 ? pets[0].id : '');
    
    const getPetById = (id: string) => pets.find(p => p.id === id);

    const handlePostSubmit = () => {
        if (!newPostText.trim() || !newPostPetId) return;
        onAddPost({ pet_id: newPostPetId, content: newPostText, image_url: undefined }); // Image upload not implemented for Supabase storage yet
        setNewPostText(''); setShowNewPost(false);
    };

    const renderTimelineEntry = (entry: TimelineEntry) => {
        const pet = getPetById(entry.pet_id);
        if (!pet) return null;

        let content;
        switch (entry.type) {
            case 'post':
                const postData = entry.data as PetbookPost;
                content = (
                    <div className="space-y-3">
                        <p className="text-gray-800 whitespace-pre-wrap">{postData.content}</p>
                        {postData.image_url && <img src={postData.image_url} alt="Post" className="rounded-lg max-h-96 w-full object-cover mt-2"/>}
                    </div>
                );
                break;
            case 'appointment':
                const apptData = entry.data as Appointment;
                const notes = JSON.parse(apptData.notes || '{}');
                content = <p><strong>Milestone:</strong> Vet Appointment booked with {apptData.vet?.name} on {new Date(notes.dateTime).toLocaleDateString()}!</p>;
                break;
            case 'health_check':
                content = <p><strong>Milestone:</strong> AI Health Check Completed!</p>;
                break;
            default: return null;
        }

        return (
            <div key={entry.id} className="bg-white p-5 rounded-xl shadow-md border">
                <div className="flex items-center gap-3 mb-3">
                    <img src={pet.photo_url} alt={pet.name} className="h-12 w-12 rounded-full object-cover" />
                    <div><span className="font-bold text-gray-800">{pet.name}</span><p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p></div>
                </div>
                {content}
            </div>
        )
    };
    
    return (
        <div className="p-6 relative">
            <ScreenHeader title="Pet Book" />
            <div className="space-y-6">
                {showNewPost && (
                     <div className="p-4 bg-white rounded-lg shadow-sm border">
                        <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} rows={3} className="w-full border-gray-300 rounded-lg text-lg" placeholder="Share a moment..."></textarea>
                        <div className="flex items-center justify-between mt-2">
                             <select value={newPostPetId} onChange={e => setNewPostPetId(e.target.value)} className="border-gray-300 rounded-full text-sm px-3 py-1">
                                {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </select>
                            <button onClick={handlePostSubmit} disabled={!newPostPetId} className="bg-[#28CBC9] text-white font-bold py-2 px-6 rounded-full hover:bg-teal-500 transition-colors disabled:bg-gray-400">Post</button>
                        </div>
                    </div>
                )}
                <div className="space-y-4">
                    {timeline.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <div className="text-6xl mb-4">🐾</div><h3 className="text-2xl font-bold text-gray-800">Your Pet's Story Starts Here</h3>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">This is your pet's personal timeline. Add a post to capture a memory, log a vet visit, or see an AI health check result.</p>
                            <button onClick={() => setShowNewPost(true)} className="mt-6 bg-[#FF6464] text-white font-bold py-3 px-6 rounded-full hover:bg-red-500 transition-colors shadow-md">Add Your First Post</button>
                        </div>
                    ) : timeline.map(renderTimelineEntry)}
                </div>
            </div>
            <button onClick={() => setShowNewPost(!showNewPost)} className="absolute top-6 right-6 h-14 w-14 bg-[#FF6464] text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-red-500 transition-all transform hover:scale-110">+</button>
        </div>
    );
};

const ChatModal: React.FC<{ onClose: () => void; context?: string; userProfile: UserProfile; }> = ({ onClose, context, userProfile }) => {
    const [history, setHistory] = useState<GeminiChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadHistory = async () => {
            const { data } = await supabase.from('chat_message').select('*').eq('auth_user_id', userProfile.auth_user_id).order('sent_at');
            const geminiHistory: GeminiChatMessage[] = data?.map(m => ({ role: m.sender, parts: [{ text: m.message }] })) || [];

            if(context && geminiHistory.length === 0) { // Only add context if it's a new chat
                geminiHistory.push({ role: 'user', parts: [{ text: context }] });
                geminiHistory.push({ role: 'model', parts: [{ text: "Hello! I've reviewed the information. How can I help?" }] });
            }
            setHistory(geminiHistory);
            setIsLoadingHistory(false);
        };
        loadHistory();
    }, [context, userProfile.auth_user_id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isStreaming) return;
        
        const newUserMessage: GeminiChatMessage = { role: 'user', parts: [{ text: message }] };
        const updatedHistory = [...history, newUserMessage];
        setHistory(updatedHistory);
        await supabase.from('chat_message').insert({ auth_user_id: userProfile.auth_user_id, sender: 'user', message });

        setMessage('');
        setIsStreaming(true);

        try {
            const stream = geminiService.getChatStream(updatedHistory, message);
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: ''}] }]);
            let modelResponse = '';
            for await (const chunk of stream) {
                modelResponse += chunk;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].parts[0].text = modelResponse;
                    return newHistory;
                });
            }
            await supabase.from('chat_message').insert({ auth_user_id: userProfile.auth_user_id, sender: 'model', message: modelResponse });
        } catch (err) {
            console.error(err);
        } finally {
             setIsStreaming(false);
        }
    };

    return (
        <Modal title="Chat with Dumble AI" onClose={onClose} size="md">
            <div className="flex flex-col h-[70vh]">
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 rounded-t-lg">
                    {isLoadingHistory ? <p>Loading chat...</p> : history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-2xl max-w-sm md:max-w-md ${msg.role === 'user' ? 'bg-[#FF6464] text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(msg.parts[0].text) }}></div>
                            </div>
                        </div>
                    ))}
                    {isStreaming && history.length > 0 && history[history.length-1].role === 'user' && <div className="flex justify-start"><div className="p-3">...</div></div>}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-lg flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask about your pet..." className="flex-grow border-gray-300 rounded-lg" disabled={isStreaming} />
                        <button type="submit" disabled={isStreaming || !message.trim()} className="bg-[#28CBC9] text-white p-2 rounded-full hover:bg-teal-500 disabled:bg-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

const PetDataAIModal: React.FC<{ encyclopedia: EncyclopediaTopic[], onClose: () => void; onAskExpert: (context: string) => void }> = ({ encyclopedia, onClose, onAskExpert }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ type: 'all' });
    
    const filteredBreeds = encyclopedia.filter(pet => 
        pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filters.type === 'all' || pet.type === filters.type)
    );

    return (
        <div className="p-6">
            <ScreenHeader title="Pet Encyclopedia" />
            <div className="space-y-4">
                 <input type="search" placeholder="Search pets (e.g., 'Labrador', 'Persian Cat')" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 border-slate-300 rounded-xl text-lg shadow-sm mb-4" />
                <div className="flex flex-wrap gap-2 items-center mb-4">
                    <button onClick={() => setFilters({ type: 'all' })} className={`px-4 py-1.5 rounded-full font-semibold whitespace-nowrap text-sm transition-colors ${filters.type === 'all' ? 'bg-[#FF6464] text-white' : 'bg-red-100 text-red-800'}`}>All Breeds</button>
                    <button onClick={() => setFilters({ type: 'dog' })} className={`px-4 py-1.5 rounded-full font-semibold whitespace-nowrap text-sm transition-colors ${filters.type === 'dog' ? 'bg-yellow-400 text-yellow-900' : 'bg-yellow-100 text-yellow-800'}`}>Dogs</button>
                    <button onClick={() => setFilters({ type: 'cat' })} className={`px-4 py-1.5 rounded-full font-semibold whitespace-nowrap text-sm transition-colors ${filters.type === 'cat' ? 'bg-[#D9D2EF] text-purple-800' : 'bg-purple-100 text-purple-800'}`}>Cats</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {filteredBreeds.map(topic => (
                        <button key={topic.breed} onClick={() => onAskExpert(`Tell me about the ${topic.breed}`)} className="group text-left space-y-2 bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border">
                            <img src={topic.image} alt={topic.breed} className="w-full h-40 object-cover" />
                            <div className="p-3"><h4 className="font-bold text-lg">{topic.breed}</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {topic.personality.slice(0,2).map(p => <span key={p} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{p}</span>)}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ProfileScreen: React.FC<{ userProfile: UserProfile; pets: Pet[]; setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>; setPets: React.Dispatch<React.SetStateAction<Pet[]>>; session: Session; }> = ({ userProfile, pets, setUserProfile, setPets, session }) => {
    const [editingPet, setEditingPet] = useState<Pet | null | 'new'>(null);
    const [profileData, setProfileData] = useState(userProfile);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => { setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value })); }
    const handleSaveProfile = async () => { 
        const { data } = await supabase.from('Dumblesdoor_User').update({ name: profileData.name, email: profileData.email, phone: profileData.phone, city: profileData.city }).eq('auth_user_id', session.user.id).select().single();
        if (data) setUserProfile(data);
    }
    const handleSavePet = async (petData: Omit<Pet, 'id' | 'auth_user_id'>, id?: string) => {
        if (editingPet === 'new') {
             const { data, error } = await supabase.from('pet').insert({ ...petData, auth_user_id: userProfile.auth_user_id }).select().single();
             if (error) {
                 console.error("Error adding pet:", error);
                 alert(`Error adding pet: ${error.message}`);
                 return;
             }
             if (data) {
                setPets(prevPets => [...prevPets, data as Pet]);
                setEditingPet(null);
             }
        } else if (id) { 
            const { data, error } = await supabase.from('pet').update(petData).eq('id', id).select().single();
            if (error) {
                console.error("Error updating pet:", error);
                alert(`Error updating pet: ${error.message}`);
                return;
            }
            if (data) {
                setPets(prevPets => prevPets.map(p => p.id === data.id ? data as Pet : p));
                setEditingPet(null);
            }
        }
    }
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    
    const PetEditForm: React.FC<{ pet: Pet | null, onSave: (pet: Omit<Pet, 'id'|'auth_user_id'>, id?: string) => void, onCancel: () => void }> = ({ pet, onSave, onCancel }) => {
        const getInitialData = () => {
            if (pet) {
                const { id, auth_user_id, ...data } = pet;
                return { ...data, notes: data.notes || '' }; // Ensure notes is a string for the form
            }
            return { 
                name: '', 
                photo_url: PET_AVATARS[0],
                species: 'Dog', 
                breed: '', 
                birth_date: '', 
                gender: 'Male' as const, 
                notes: ''
            };
        };

        const [formData, setFormData] = useState(getInitialData());
        const [breedSuggestions, setBreedSuggestions] = useState<string[]>([]);
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { 
            const { name, value } = e.target;
            setFormData(prev => ({...prev, [name]: value})); 
            
            if (name === 'breed' && value.length > 1) {
                const suggestions = ALL_BREEDS.filter(b => b.toLowerCase().includes(value.toLowerCase()));
                setBreedSuggestions(suggestions.slice(0, 5));
            } else {
                setBreedSuggestions([]);
            }
        }
        
        const handleBreedSelect = (breed: string) => {
            setFormData(prev => ({...prev, breed: breed}));
            setBreedSuggestions([]);
        }

        const handleAvatarSelect = (url: string) => {
            setFormData(prev => ({...prev, photo_url: url}));
        }
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const dataToSave = { ...formData, notes: formData.notes || undefined };
            onSave(dataToSave, pet?.id);
        }

        return (
             <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-2xl bg-white space-y-4 shadow-sm">
                <h3 className="font-bold text-xl text-center text-gray-800">{pet ? `Edit ${pet.name}` : 'Add New Pet'}</h3>
                
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Choose an Avatar</label>
                     <div className="flex flex-wrap gap-3 justify-center">
                        {PET_AVATARS.map(url => (
                            <button key={url} type="button" onClick={() => handleAvatarSelect(url)} className={`h-14 w-14 rounded-full overflow-hidden transition-all duration-200 ${formData.photo_url === url ? 'ring-4 ring-offset-2 ring-teal-500 scale-110' : 'ring-2 ring-gray-200 hover:ring-teal-400'}`}>
                                <img src={url} alt="Pet Avatar" className="w-full h-full object-cover" />
                            </button>
                        ))}
                     </div>
                </div>
                
                <div>
                    <label htmlFor="pet-name" className="text-sm font-medium text-gray-700">Name</label>
                    <input id="pet-name" type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-lg p-2" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="pet-species" className="text-sm font-medium text-gray-700">Species</label>
                        <select id="pet-species" name="species" value={formData.species} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-lg p-2" required>
                            <option>Dog</option><option>Cat</option><option>Bird</option><option>Fish</option><option>Other</option>
                        </select>
                    </div>
                    <div className="relative">
                        <label htmlFor="pet-breed" className="text-sm font-medium text-gray-700">Breed</label>
                        <input id="pet-breed" type="text" name="breed" value={formData.breed} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-lg p-2" required autoComplete="off" />
                        {breedSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
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
                        <label htmlFor="pet-birthdate" className="text-sm font-medium text-gray-700">Birth Date</label>
                        <input id="pet-birthdate" type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-lg p-2" required />
                    </div>
                    <div>
                        <label htmlFor="pet-gender" className="text-sm font-medium text-gray-700">Gender</label>
                        <select id="pet-gender" name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-lg p-2" required>
                            <option>Male</option><option>Female</option><option>Unknown</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="pet-notes" className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea id="pet-notes" name="notes" value={formData.notes} onChange={handleChange} rows={2} className="mt-1 w-full border-gray-300 rounded-lg p-2" placeholder="e.g., Allergies, favorite toy..."></textarea>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" className="bg-[#28CBC9] text-white font-bold px-6 py-2 rounded-lg hover:bg-teal-600">Save Pet</button>
                </div>
            </form>
        )
    }

    return (
        <div className="p-6">
            <ScreenHeader title="My Profile"><button onClick={handleSaveProfile} className="bg-[#FF6464] text-white font-bold py-2 px-5 rounded-full hover:bg-red-500">Save</button></ScreenHeader>
            <div className="space-y-6">
                <div className="space-y-3">
                    <div><label className="text-sm font-medium">Full Name</label><input type="text" name="name" value={profileData.name} onChange={handleProfileChange} className="mt-1 w-full border-gray-300 rounded-lg p-3" /></div>
                    <div><label className="text-sm font-medium">Email</label><input type="email" name="email" value={profileData.email} onChange={handleProfileChange} className="mt-1 w-full border-gray-300 rounded-lg p-3" /></div>
                    <div><label className="text-sm font-medium">Phone</label><input type="tel" name="phone" value={profileData.phone} onChange={handleProfileChange} className="mt-1 w-full border-gray-300 rounded-lg p-3" /></div>
                    <div><label className="text-sm font-medium">Location</label><input type="text" name="city" value={profileData.city} onChange={handleProfileChange} className="mt-1 w-full border-gray-300 rounded-lg p-3" /></div>
                </div>

                <div className="p-4 bg-white rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-xl">Your Pets</h3>
                        <button onClick={() => setEditingPet('new')} className="bg-[#28CBC9] text-white font-bold py-2 px-4 rounded-full hover:bg-teal-500">+ Add Pet</button>
                    </div>
                    {editingPet === 'new' && <PetEditForm pet={null} onSave={handleSavePet} onCancel={() => setEditingPet(null)}/>}
                    <div className="space-y-3 mt-4">
                        {pets.map(pet => (
                            editingPet && typeof editingPet !== 'string' && editingPet.id === pet.id ?
                            <PetEditForm key={pet.id} pet={pet} onSave={handleSavePet} onCancel={() => setEditingPet(null)}/> :
                            <div key={pet.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                <img src={pet.photo_url} alt={pet.name} className="w-16 h-16 rounded-lg object-cover" />
                                <div className="flex-grow">
                                    <h4 className="font-bold text-lg">{pet.name}</h4><p className="text-sm text-gray-600">{pet.breed}</p>
                                </div>
                                <button onClick={() => setEditingPet(pet)} className="text-sm text-blue-600 hover:underline">Edit</button>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="pt-4 border-t">
                    <button onClick={handleLogout} className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300">Log Out</button>
                </div>
            </div>
        </div>
    )
}

export default App;