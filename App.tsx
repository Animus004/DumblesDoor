// Trigger Vercel deployment
// FIX: Imported useState, useEffect, and useRef from React to resolve hook-related errors.
import React, { useState, useEffect, useRef } from 'react';
import { HealthCheckResult, GeminiChatMessage, DBChatMessage, Appointment, AIFeedback, TimelineEntry, ActiveModal, Vet, Product, PetbookPost, EncyclopediaTopic, Pet, UserProfile, ActiveScreen, AdoptionListing, AdoptablePet } from './types';
import { ICONS } from './constants';
import * as geminiService from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Session, User, Provider } from '@supabase/supabase-js';

import EnvironmentVariablePrompt from './components/ApiKeyPrompt';
import HealthCheckScreen from './components/HealthCheckScreen';
import PetBookScreen from './components/PetBookScreen';
import ShopScreen from './components/ShopScreen';
import ProfileScreen from './components/ProfileScreen';
import HomeScreen from './components/HomeScreen';
import BottomNav from './components/BottomNav';
import OnboardingProfileScreen from './components/OnboardingProfileScreen';
import OnboardingPetScreen from './components/OnboardingPetScreen';
import WelcomeScreen from './components/WelcomeScreen';
import OnboardingCompletionScreen from './components/OnboardingCompletionScreen';
import { marked } from 'marked';

// --- ADOPTION SCREEN IMPLEMENTATION ---

// This entire section defines the new Adoption feature. It's placed here to avoid creating new files.

const MOCK_ADOPTION_LISTINGS: AdoptionListing[] = [
  { id: '1', name: 'Buddy', species: 'Dog', breed: 'Indie', age: 'Young', size: 'Medium', gender: 'Male', photos: ['https://i.ibb.co/6rC6hJq/indie-dog-1.jpg'], description: 'A friendly and energetic indie dog looking for a loving home. Loves to play fetch!', good_with: ['Children', 'Dogs'], shelter_id: '1', status: 'Available', created_at: new Date().toISOString(), shelter: { id: '1', name: 'Hope for Paws', city: 'Mumbai', address: '', phone: '', email: '', verified: true, location: {} } },
  { id: '2', name: 'Luna', species: 'Cat', breed: 'Bombay Cat', age: 'Adult', size: 'Small', gender: 'Female', photos: ['https://i.ibb.co/zntgK4B/bombay-cat-1.jpg'], description: 'A calm and affectionate cat who loves to cuddle. She is litter trained and very clean.', good_with: ['Cats'], shelter_id: '2', status: 'Available', created_at: new Date().toISOString(), shelter: { id: '2', name: 'Cat Haven', city: 'Delhi', address: '', phone: '', email: '', verified: true, location: {} } },
  { id: '3', name: 'Rocky', species: 'Dog', breed: 'Labrador Retriever', age: 'Baby', size: 'Medium', gender: 'Male', photos: ['https://i.ibb.co/mH4SMN3/lab-puppy-1.jpg'], description: 'An adorable Labrador puppy full of curiosity and playfulness. Needs a family that can keep up with his energy.', good_with: ['Children', 'Dogs', 'Cats'], shelter_id: '1', status: 'Available', created_at: new Date().toISOString(), shelter: { id: '1', name: 'Hope for Paws', city: 'Mumbai', address: '', phone: '', email: '', verified: true, location: {} } },
  { id: '4', name: 'Misty', species: 'Cat', breed: 'Indian Billie', age: 'Young', size: 'Medium', gender: 'Female', photos: ['https://i.ibb.co/Dtd5zWf/indian-cat-1.jpg'], description: 'A beautiful street cat who was rescued. She is a bit shy at first but very sweet once she trusts you.', good_with: [], shelter_id: '3', status: 'Available', created_at: new Date().toISOString(), shelter: { id: '3', name: 'Second Chance Animals', city: 'Bangalore', address: '', phone: '', email: '', verified: true, location: {} } },
];

const PetAdoptionCard: React.FC<{ pet: AdoptablePet }> = ({ pet }) => {
    const [isFavorited, setIsFavorited] = useState(false);
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group">
            <div className="relative aspect-[4/3]">
                <img src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <button 
                    onClick={() => setIsFavorited(!isFavorited)}
                    className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:text-red-500 transition-colors"
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    aria-pressed={isFavorited}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                </button>
            </div>
            <div className="p-4 flex-grow">
                <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
                <p className="text-sm text-gray-500">{pet.breed}</p>
                <div className="flex items-center text-xs text-gray-600 mt-2 space-x-2">
                    <span>{pet.age}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span>{pet.gender}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span>{pet.size}</span>
                </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-700">{pet.shelter_name}</p>
                {pet.distance_km && <p className="text-teal-600 font-bold">{pet.distance_km.toFixed(1)} km away</p>}
            </div>
        </div>
    );
};

const AdoptionScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [listings, setListings] = useState<AdoptablePet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showFilters, setShowFilters] = useState(false);
    
    // Filter states
    const [species, setSpecies] = useState('All');
    const [age, setAge] = useState('All');
    const [size, setSize] = useState('All');
    const [distance, setDistance] = useState(50);

    // Fetch user location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (geoError) => {
                console.warn("Geolocation error:", geoError.message);
                setError("Could not get your location. Please enable location services to find nearby pets. Showing sample data for now.");
                // Fallback to mock data with a structure that matches AdoptablePet
                const mockAdoptablePets: AdoptablePet[] = MOCK_ADOPTION_LISTINGS.map(p => ({
                    ...p,
                    distance_km: Math.random() * 50,
                    shelter_name: p.shelter?.name || 'A Loving Shelter'
                }));
                setListings(mockAdoptablePets);
                setLoading(false);
            }
        );
    }, []);

    // Fetch data from Supabase
    useEffect(() => {
        const fetchListings = async () => {
            if (!userLocation) return;
            if (!supabase) {
                 setError("Database connection is not available.");
                 setLoading(false);
                 return;
            }

            setLoading(true);
            setError(null);
            
            const { data, error: rpcError } = await supabase.rpc('nearby_pets', {
                lat: userLocation.lat,
                long: userLocation.lon,
                radius_km: distance
            });

            if (rpcError) {
                console.error("Error calling nearby_pets RPC:", rpcError);
                setError("Could not fetch nearby pets. Please try again later.");
                setListings([]);
            } else {
                // Apply client-side filters for species, age, and size
                const filtered = (data || []).filter((p: AdoptablePet) => {
                    const speciesMatch = species === 'All' || p.species === species;
                    const ageMatch = age === 'All' || p.age === age;
                    const sizeMatch = size === 'All' || p.size === size;
                    return speciesMatch && ageMatch && sizeMatch;
                });
                setListings(filtered);
            }
            setLoading(false);
        };
        
        // Only fetch if we have a user location
        if (userLocation) {
            fetchListings();
        }
    }, [userLocation, species, age, size, distance]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Find a Friend</h1>
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1.447.894l-2-1A1 1 0 018 16v-3.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                    </button>
                    {/* View Toggle */}
                </div>
            </header>

            {/* Filter Panel */}
            {showFilters && (
                <div className="p-4 bg-white border-b sticky top-[65px] z-10">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500">Species</label>
                            <select value={species} onChange={e => setSpecies(e.target.value)} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Dog</option><option>Cat</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Age</label>
                            <select value={age} onChange={e => setAge(e.target.value)} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Baby</option><option>Young</option><option>Adult</option><option>Senior</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Size</label>
                            <select value={size} onChange={e => setSize(e.target.value)} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Small</option><option>Medium</option><option>Large</option>
                            </select>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-gray-500">Distance ({distance} km)</label>
                            <input type="range" min="5" max="200" step="5" value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow p-4">
                {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Finding pets near you...</p></div>}
                {error && <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg text-center">{error}</div>}
                
                {!loading && !error && listings.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        <p className="font-semibold">No pets found</p>
                        <p>Try adjusting your filters or expanding the distance.</p>
                    </div>
                )}
                
                {!loading && listings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listings.map(pet => <PetAdoptionCard key={pet.id} pet={pet} />)}
                    </div>
                )}
            </main>
        </div>
    );
};


// --- UTILITY & PLACEHOLDER COMPONENTS ---

const PlaceholderScreen: React.FC<{ title: string; icon: React.ReactNode; message: string; onBack: () => void; }> = ({ title, icon, message, onBack }) => (
    <div className="h-screen flex flex-col">
        <header className="p-4 flex items-center border-b">
            <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0- 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-xl font-bold">{title}</h1>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50">
            <div className="text-gray-400 mb-4">{icon}</div>
            <h2 className="text-2xl font-bold text-gray-700">{title} Coming Soon!</h2>
            <p className="text-gray-500 mt-2 max-w-sm">{message}</p>
        </main>
    </div>
);

const AppErrorScreen: React.FC<{ message: string; onRetry: () => void; }> = ({ message, onRetry }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-5xl mb-4">😢</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Something Went Wrong</h2>
        <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
        <button
            onClick={onRetry}
            className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors"
        >
            Try Again
        </button>
    </div>
);

const getFriendlyAuthErrorMessage = (message: string): string => {
  if (!message) return 'An unexpected error occurred. Please try again.';

  const lowerCaseMessage = message.toLowerCase();

  if (lowerCaseMessage.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lowerCaseMessage.includes('email not confirmed')) {
    // This specific message is used to show the "Resend" button, so it needs to be exact.
    return 'Email not confirmed. Check your inbox for the verification link.';
  }
  if (lowerCaseMessage.includes('user already registered')) {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (lowerCaseMessage.includes('rate limit exceeded') || lowerCaseMessage.includes('too many requests')) {
    return 'You have made too many attempts. Please wait a moment and try again.';
  }
  if (lowerCaseMessage.includes('networkerror') || lowerCaseMessage.includes('failed to fetch')) {
    return 'A network error occurred. Please check your internet connection and try again.';
  }
   if (lowerCaseMessage.includes('to signup, please provide a password')) {
      return 'It looks like you signed up with a social provider. Please use the social login button to continue.';
  }

  // Log any unhandled errors to the console for debugging
  console.warn('Unhandled Supabase auth error:', message);
  
  return 'An unexpected authentication error occurred. Please try again.';
};


// --- AUTH & ONBOARDING COMPONENTS ---

const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading Dumble's Door..." }) => (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-teal-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
        <p className="text-gray-600 mt-4 text-lg">{message}</p>
    </div>
);

const EmailVerificationScreen: React.FC<{ email: string }> = ({ email }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResend = async () => {
        setLoading(true);
        setMessage('');
        setError('');
        
        if (!supabase) {
            setError("Database connection failed.");
            setLoading(false);
            return;
        }

        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });

        setLoading(false);
        if (resendError) {
            setError(`Failed to resend: ${resendError.message}`);
        } else {
            setMessage('A new verification link has been sent!');
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6 text-center">
                <div className="text-6xl animate-pulse">📧</div>
                <h1 className="text-3xl font-bold text-gray-800">Verify Your Email</h1>
                <p className="text-gray-600">
                    We've sent a verification link to <strong className="text-gray-900">{email}</strong>. Please click the link to secure your account and continue.
                </p>
                
                {message && <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm">{message}</p>}
                {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
                
                <div className="pt-2">
                    <button
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </div>
                
                <p className="text-sm text-gray-500 pt-2">
                    Didn't get an email? Check your spam folder or click the button above.
                </p>
            </div>
        </div>
    );
};

const SignupSuccessScreen: React.FC<{ email: string; onGoToLogin: () => void }> = ({ email, onGoToLogin }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onGoToLogin();
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [onGoToLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4 text-center">
            <div className="text-5xl">✅</div>
            <h1 className="text-3xl font-bold text-gray-800">Account Created!</h1>
            <p className="text-gray-600">
                A verification link has been sent to <strong className="text-gray-900">{email}</strong>. Please check your email to verify your account before signing in.
            </p>
            <button
              onClick={onGoToLogin}
              className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Go to Login
            </button>
            <p className="text-sm text-gray-500 mt-2">
                You will be redirected automatically in a few seconds.
            </p>
        </div>
    </div>
  );
};

const AuthScreen: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [emailValidation, setEmailValidation] = useState<{ isValid: boolean | null; message: string }>({ isValid: null, message: '' });
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
    });
    
    const emailInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    const validateEmail = (emailStr: string) => {
        if (!emailStr) {
            setEmailValidation({ isValid: null, message: '' });
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(emailStr);
        setEmailValidation({
            isValid,
            message: isValid ? '' : 'Please enter a valid email address.',
        });
        return isValid;
    };

    const validatePassword = (passStr: string) => {
        const checks = {
            length: passStr.length >= 8,
            uppercase: /[A-Z]/.test(passStr),
            number: /[0-9]/.test(passStr),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(passStr),
        };
        setPasswordValidation(checks);
        return Object.values(checks).every(Boolean);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        validateEmail(newEmail);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (!isLoginView) {
            validatePassword(newPassword);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!validateEmail(email)) return;
        if (!isLoginView && !validatePassword(password)) {
            setError("Please ensure your password meets all the requirements.");
            return;
        }

        setLoading(true);
        try {
            if (!supabase) throw new Error("Database connection failed.");
            
            if (isLoginView) {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) {
                    setError(getFriendlyAuthErrorMessage(signInError.message));
                }
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) {
                    setError(getFriendlyAuthErrorMessage(signUpError.message));
                } else if (data.user && !data.session) {
                    setSignupSuccess(true);
                }
            }
        } catch (err: any) {
            console.error("Authentication error:", err);
            setError(getFriendlyAuthErrorMessage(err.message || ''));
        } finally {
            setLoading(false);
        }
    };
    
    const handleSocialLogin = async (provider: Provider) => {
        setLoading(true);
        setError('');
        if (!supabase) {
            setError("Database connection failed.");
            setLoading(false);
            return;
        }
        const { error } = await supabase.auth.signInWithOAuth({ provider });
        if (error) {
            setError(getFriendlyAuthErrorMessage(error.message));
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        if (!supabase) {
            setError("Database connection failed.");
            setLoading(false);
            return;
        }
        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        setLoading(false);
        if (resendError) {
            setError(getFriendlyAuthErrorMessage(resendError.message));
        } else {
            setMessage('A new verification email has been sent. Please check your inbox.');
        }
    };
    
    // --- ICONS ---
    const GoogleIcon = () => (<svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.226-11.283-7.582l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /></svg>);
    const SpinnerIcon = () => (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
    const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>);
    const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.022-7 9.542-7 .847 0 1.668.125 2.454.354M7.5 7.5A4.5 4.5 0 0112 3a4.5 4.5 0 014.5 4.5m-9 9a4.5 4.5 0 004.5 4.5 4.5 4.5 0 004.5-4.5M3 3l18 18" /></svg>);
    const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
    const ExclamationCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;

    // --- SUB-COMPONENTS ---
    const PasswordRequirement: React.FC<{ valid: boolean; text: string }> = ({ valid, text }) => (
        <div className={`flex items-center text-xs ${valid ? 'text-green-600' : 'text-gray-500'}`}>
            {valid ? <CheckCircleIcon /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth="1.5" /></svg>}
            <span className="ml-1">{text}</span>
        </div>
    );
    
    const allPasswordReqsMet = Object.values(passwordValidation).every(Boolean);
    const isFormValid = isLoginView ? (email.length > 0 && password.length > 0) : (emailValidation.isValid === true && allPasswordReqsMet);


    if (signupSuccess) {
        return <SignupSuccessScreen email={email} onGoToLogin={() => { setSignupSuccess(false); setIsLoginView(true); setPassword(''); }} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-100 to-cyan-200 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-teal-600 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>
                    <h1 className="text-4xl font-bold text-gray-800 mt-2">Welcome to Dumble's Door</h1>
                    <p className="text-gray-600">Your pet's best friend is just a click away.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-center text-gray-700">{isLoginView ? 'Log In' : 'Create Account'}</h2>
                    <div className="space-y-3">
                        <button type="button" onClick={() => handleSocialLogin('google')} className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
                            <GoogleIcon />
                            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                        </button>
                    </div>
                    <div className="flex items-center">
                        <hr className="flex-grow border-gray-200" />
                        <span className="mx-4 text-sm font-medium text-gray-400">OR</span>
                        <hr className="flex-grow border-gray-200" />
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <div className="relative mt-1">
                                <input
                                    ref={emailInputRef}
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={handleEmailChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${emailValidation.isValid === false ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'}`}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    {emailValidation.isValid === true && <CheckCircleIcon />}
                                    {emailValidation.isValid === false && <ExclamationCircleIcon />}
                                </div>
                            </div>
                            {emailValidation.isValid === false && <p className="mt-1 text-xs text-red-600">{emailValidation.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="password"
                                className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="relative mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type={passwordVisible ? 'text' : 'password'}
                                    autoComplete={isLoginView ? "current-password" : "new-password"}
                                    required
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" aria-label="Toggle password visibility">
                                    {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        {!isLoginView && (
                            <div className="pt-2">
                                <p className="text-sm font-semibold text-gray-600 mb-2">Password must contain:</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <PasswordRequirement valid={passwordValidation.length} text="8+ characters" />
                                    <PasswordRequirement valid={passwordValidation.uppercase} text="One uppercase" />
                                    <PasswordRequirement valid={passwordValidation.number} text="One number" />
                                    <PasswordRequirement valid={passwordValidation.specialChar} text="One special char" />
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm text-center">
                                <p>{error}</p>
                                {error.includes('Email not confirmed') && (
                                    <button type="button" onClick={handleResendVerification} disabled={loading} className="mt-2 font-bold underline hover:text-red-700 disabled:opacity-50">
                                        {loading ? 'Sending...' : 'Resend Verification'}
                                    </button>
                                )}
                                {error.includes('Incorrect email or password') && (
                                    <button type="button" onClick={() => alert('Password reset functionality is coming soon!')} className="mt-2 font-bold underline hover:text-red-700">
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                        )}
                        {message && <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm text-center">{message}</p>}

                        <button type="submit" disabled={loading || !isFormValid} className="w-full flex justify-center items-center bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <SpinnerIcon /> : (isLoginView ? 'Log In' : 'Create Account')}
                        </button>
                    </form>
                    
                    <p className="text-center text-sm text-gray-500">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setMessage(''); setPassword(''); }} className="font-semibold text-teal-600 hover:underline ml-1">
                            {isLoginView ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    // Check for missing environment variables
    const missingKeys = [
        !import.meta.env.VITE_API_KEY && 'VITE_API_KEY',
        !import.meta.env.VITE_SUPABASE_URL && 'VITE_SUPABASE_URL',
        !import.meta.env.VITE_SUPABASE_ANON_KEY && 'VITE_SUPABASE_ANON_KEY'
    ].filter(Boolean) as string[];

    // --- STATE MANAGEMENT ---
    type OnboardingStage = 'welcome' | 'profile' | 'pet' | 'complete' | 'done';
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [pet, setPet] = useState<Pet | null>(null);
    const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>('done');
    const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
    const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [appError, setAppError] = useState<string>('');

    // --- DATA FETCHING & AUTH EFFECT ---
    const checkAndSetOnboardingStage = async (currentUser: User) => {
        if (!currentUser || !supabase) return;
        setLoading(true);
        setAppError(''); // Clear previous errors

        try {
            // 1. Check for profile
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles').select('*').eq('auth_user_id', currentUser.id).single();

            // A real error occurred (not just "profile not found")
            if (profileError && profileError.code !== 'PGRST116') {
                throw new Error("Could not load your profile. Please check your connection and try again later.");
            }

            if (!profileData) { // This is a new user
                setOnboardingStage('welcome');
                setProfile(null);
                setPet(null);
                return;
            }

            setProfile(profileData);
            // 2. Check for pet
            const { data: petData, error: petError } = await supabase
                .from('pets').select('*').eq('auth_user_id', currentUser.id).limit(1).single();
            
            // A real error occurred (not just "pet not found")
            if (petError && petError.code !== 'PGRST116') {
                throw new Error("Could not load your pet's details. Please try again later.");
            }

            if (!petData) {
                setOnboardingStage('pet');
                setPet(null);
            } else {
                setPet(petData);
                setOnboardingStage('done');
            }
        } catch (err: any) {
            console.error("Error during data fetch:", err);
            setAppError(err.message || 'An unexpected error occurred while loading your data.');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (!supabase) { setLoading(false); return; }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAndSetOnboardingStage(session.user);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            const currentUser = session?.user;
            setUser(currentUser ?? null);
            
            if (_event === 'SIGNED_IN') {
                 if (currentUser && !currentUser.email_confirmed_at) {
                    setNeedsEmailVerification(true);
                    setVerificationEmail(currentUser.email || '');
                } else if (currentUser) {
                    setNeedsEmailVerification(false);
                    await checkAndSetOnboardingStage(currentUser);
                }
            } else if (_event === 'SIGNED_OUT') {
                setProfile(null);
                setPet(null);
                setOnboardingStage('done');
                setNeedsEmailVerification(false);
            } else if (_event === 'USER_UPDATED' && currentUser?.email_confirmed_at) {
                setNeedsEmailVerification(false);
                await checkAndSetOnboardingStage(currentUser);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- HEALTH CHECK LOGIC ---
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
    const [healthError, setHealthError] = useState<string | null>(null);
    
    const base64FromFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });

    const handleAnalyzePet = async (imageFile: File, notes: string) => {
        if (!pet) {
            setHealthError("No active pet profile to analyze.");
            return;
        }
        setIsCheckingHealth(true);
        setHealthResult(null);
        setHealthError(null);

        try {
            const imageBase64 = await base64FromFile(imageFile);
            
            const petAge = new Date().getFullYear() - new Date(pet.birth_date).getFullYear();
            
            const result = await geminiService.analyzePetHealth(
                imageBase64,
                imageFile.type,
                notes,
                { name: pet.name, breed: pet.breed, age: `${petAge} years` }
            );

            setHealthResult(result);
            // Save to DB
            if (supabase && user) {
                 await supabase.from('ai_feedback').insert({
                    pet_id: pet.id,
                    auth_user_id: user.id,
                    input_data: { notes },
                    ai_response: JSON.stringify(result),
                    status: 'completed',
                });
            }

        } catch (error: any) {
            console.error(error);
            setHealthError(error.message || "An unknown error occurred during analysis.");
        } finally {
            setIsCheckingHealth(false);
        }
    };
    
    const handleLogout = async () => {
        if (supabase) {
            setLoading(true);
            await supabase.auth.signOut();
            setLoading(false);
        }
    };
    
    const resetHealthCheck = () => {
        setHealthResult(null);
        setHealthError(null);
        setActiveScreen('home');
    }
    
    // --- RENDER LOGIC ---
    if (missingKeys.length > 0) {
        return <EnvironmentVariablePrompt missingKeys={missingKeys} />;
    }

    if (appError) {
        return <AppErrorScreen message={appError} onRetry={() => {
            if (user) {
                checkAndSetOnboardingStage(user);
            } else {
                setAppError(''); // If no user, just dismiss and go back to auth
            }
        }} />;
    }

    if (loading) {
        return <LoadingScreen />;
    }
    
    if (!session || !user) {
        return <AuthScreen />;
    }
    
    if (needsEmailVerification) {
        return <EmailVerificationScreen email={verificationEmail} />;
    }
    
    // --- ONBOARDING FLOW ---
    if (onboardingStage !== 'done') {
        switch (onboardingStage) {
            case 'welcome':
                return <WelcomeScreen onGetStarted={() => setOnboardingStage('profile')} />;
            case 'profile':
                return <OnboardingProfileScreen 
                            user={user} 
                            profile={profile}
                            onProfileCreated={async () => {
                                // Re-check status which will fetch profile and move to pet stage
                                if(user) await checkAndSetOnboardingStage(user);
                            }} 
                        />;
            case 'pet':
                return <OnboardingPetScreen 
                            user={user} 
                            onPetAdded={() => setOnboardingStage('complete')}
                            onBack={() => setOnboardingStage('profile')}
                            onSkip={() => {
                                setPet(null); // No pet is set, so we can skip creating one
                                setOnboardingStage('complete');
                            }}
                         />;
            case 'complete':
                return <OnboardingCompletionScreen pet={pet} onComplete={async () => {
                     if(user) await checkAndSetOnboardingStage(user);
                }} />;
            default:
                // Fallback to done if stage is invalid
                setOnboardingStage('done');
                return <LoadingScreen />;
        }
    }
    

    const renderActiveScreen = () => {
        switch(activeScreen) {
            case 'home':
                return <HomeScreen onNavigate={setActiveScreen} pet={pet} profile={profile} />;
            case 'health':
                return <HealthCheckScreen pet={pet} onBack={resetHealthCheck} onAnalyze={handleAnalyzePet} isChecking={isCheckingHealth} result={healthResult} error={healthError} />;
            case 'book':
                return <PetBookScreen onBack={() => setActiveScreen('home')} pet={pet} />;
            case 'essentials':
                return <ShopScreen onBack={() => setActiveScreen('home')} />;
            case 'adoption':
                return <AdoptionScreen onBack={() => setActiveScreen('home')} />;
            case 'vet':
                 return <PlaceholderScreen title="Vet Booking" icon={ICONS.VET_BOOKING} message="Find and book appointments with trusted veterinarians in your city. This feature is coming soon!" onBack={() => setActiveScreen('home')} />;
            case 'profile':
                return <ProfileScreen user={user} profile={profile} pet={pet} onBack={() => setActiveScreen('home')} onLogout={handleLogout} onDataUpdate={() => user && checkAndSetOnboardingStage(user)} />;
            default:
                return <HomeScreen onNavigate={setActiveScreen} pet={pet} profile={profile} />;
        }
    };

    return (
        <div className="max-w-lg mx-auto bg-white min-h-screen relative pb-16">
           {activeScreen !== 'health' && (
             <main>
               {renderActiveScreen()}
             </main>
            )}
            
            {/* Health check screen is a full-screen modal so it's rendered outside the main flow */}
            {activeScreen === 'health' && renderActiveScreen()}
            
            {activeScreen !== 'health' && <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />}
        </div>
    );
};

export default App;
