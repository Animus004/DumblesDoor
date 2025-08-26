
// Trigger Vercel deployment
import React, { useState, useEffect, useRef } from 'react';
import { HealthCheckResult, GeminiChatMessage, DBChatMessage, Appointment, AIFeedback, TimelineEntry, ActiveModal, Vet, Product, PetbookPost, EncyclopediaTopic, Pet, UserProfile } from './types';
import { ICONS } from './constants';
import * as geminiService from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

import FeatureCard from './components/FeatureCard';
import EnvironmentVariablePrompt from './components/ApiKeyPrompt';
import Header from './components/Header';
import HealthCheckScreen from './components/HealthCheckScreen';
import PetBookScreen from './components/PetBookScreen';
import ShopScreen from './components/ShopScreen';
import ProfileScreen from './components/ProfileScreen';
import { marked } from 'marked';

type ActiveScreen = 'home' | 'book' | 'essentials' | 'vet' | 'profile' | 'health' | 'environmentVariables';


// --- UTILITY & PLACEHOLDER COMPONENTS ---

const PlaceholderScreen: React.FC<{ title: string; icon: React.ReactNode; message: string; onBack: () => void; }> = ({ title, icon, message, onBack }) => (
    <div className="h-screen flex flex-col">
        <header className="p-4 flex items-center border-b">
            <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
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
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const authMethod = isLoginView ? supabase.auth.signInWithPassword : supabase.auth.signUp;

        const { error } = await authMethod({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-100 to-cyan-200 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-teal-600 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                    </svg>
                    <h1 className="text-4xl font-bold text-gray-800 mt-2">Welcome to Dumble's Door</h1>
                    <p className="text-gray-600">Your pet's best friend is just a click away.</p>
                </div>

                <form onSubmit={handleAuth} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-center text-gray-700">{isLoginView ? 'Log In' : 'Create Account'}</h2>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</p>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-600 font-semibold mb-2" htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold mb-2" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? (isLoginView ? 'Logging In...' : 'Creating Account...') : (isLoginView ? 'Log In' : 'Sign Up')}
                    </button>
                    <p className="text-center text-sm text-gray-500">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-teal-600 hover:underline ml-1">
                            {isLoginView ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

// --- HOME SCREEN COMPONENT ---

interface HomeScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  pet: Pet | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, pet }) => {
  const greeting = pet ? `What's on your mind for ${pet.name}?` : "How can we help your pet today?";
  
  return (
    <div className="flex-grow p-4 md:p-6 space-y-6 bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Hello!</h2>
        <p className="text-gray-600">{greeting}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <FeatureCard
          title="AI Health Check"
          description="Scan a photo for a quick wellness overview."
          icon={ICONS.HEALTH_CHECK}
          color="bg-rose-100"
          textColor="text-rose-800"
          onClick={() => onNavigate('health')}
        />
        <FeatureCard
          title="Vet Booking"
          description="Find and book verified vets near you."
          icon={ICONS.VET_BOOKING}
          color="bg-sky-100"
          textColor="text-sky-800"
          onClick={() => onNavigate('vet')}
          disabled={true}
        />
        <FeatureCard
          title="Pet Essentials"
          description="Shop for curated food, toys, and supplies."
          icon={ICONS.PET_ESSENTIALS}
          color="bg-amber-100"
          textColor="text-amber-800"
          onClick={() => onNavigate('essentials')}
        />
        <FeatureCard
          title="Pet Book"
          description="A digital diary of your pet's life and milestones."
          icon={ICONS.PET_BOOK}
          color="bg-indigo-100"
          textColor="text-indigo-800"
          onClick={() => onNavigate('book')}
        />
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    const [missingKeys, setMissingKeys] = useState<string[]>([]);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [pet, setPet] = useState<Pet | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEmailUnverified, setIsEmailUnverified] = useState(false);
    const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
    
    const [isChecking, setIsChecking] = useState(false);
    const [healthCheckResult, setHealthCheckResult] = useState<HealthCheckResult | null>(null);
    const [healthCheckError, setHealthCheckError] = useState<string | null>(null);

    const fetchDataForCurrentUser = async () => {
        const currentUser = session?.user;
        if (!currentUser) return;

        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', currentUser.id)
            .single();
            
        if (profileData) setProfile(profileData);
        if (profileError) console.error("Profile fetch error:", profileError.message);

        const { data: petData, error: petError } = await supabase
            .from('pets')
            .select('*')
            .eq('auth_user_id', currentUser.id)
            .limit(1)
            .single();

        if (petData) {
            setPet(petData);
        } else {
            setPet(null); // Explicitly set to null if no pet found
        }
        if (petError && petError.code !== 'PGRST116') console.error("Pet fetch error:", petError.message);
    };


    useEffect(() => {
        const requiredKeys = ['VITE_API_KEY', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
        const missing = requiredKeys.filter(key => !import.meta.env[key]);
        if (missing.length > 0) {
            setMissingKeys(missing);
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user && session.user.email && !session.user.email_confirmed_at) {
                setIsEmailUnverified(true);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user && session.user.email && !session.user.email_confirmed_at) {
                setIsEmailUnverified(true);
            } else {
                setIsEmailUnverified(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await fetchDataForCurrentUser();
            setLoading(false);
        };

        if (user && !isEmailUnverified) {
            fetchData();
        } else {
            setProfile(null);
            setPet(null);
        }
    }, [user, isEmailUnverified]);
    
    const handleNavigation = (screen: ActiveScreen) => {
        if (screen === 'health') {
            setHealthCheckResult(null);
            setHealthCheckError(null);
        }
        setActiveScreen(screen);
    };

     const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setPet(null);
        setActiveScreen('home'); // Listener will redirect to AuthScreen
        setLoading(false);
    };
    
    const handleAnalyzePet = async (imageFile: File, notes: string) => {
        if (!pet) {
            setHealthCheckError("No pet profile found to perform analysis.");
            return;
        }
        setIsChecking(true);
        setHealthCheckError(null);
        setHealthCheckResult(null);
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const petContext = {
                    name: pet.name,
                    breed: pet.breed,
                    age: `${new Date().getFullYear() - new Date(pet.birth_date).getFullYear()} years`,
                };
                const result = await geminiService.analyzePetHealth(base64String, imageFile.type, notes, petContext);
                setHealthCheckResult(result);
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setHealthCheckError(errorMessage);
        } finally {
            setIsChecking(false);
        }
    };

    if (missingKeys.length > 0) {
        return <EnvironmentVariablePrompt missingKeys={missingKeys} />;
    }

    if (loading) {
        return <LoadingScreen />;
    }

    if (!session) {
        return <AuthScreen />;
    }
    
    if (isEmailUnverified && user?.email) {
        return <EmailVerificationScreen email={user.email} />;
    }

    return (
        <div className="h-screen flex flex-col">
            <Header onProfileClick={() => handleNavigation('profile')} />
            <div className="flex-grow overflow-y-auto">
                {activeScreen === 'home' && <HomeScreen onNavigate={handleNavigation} pet={pet} />}
                {activeScreen === 'health' && (
                    <HealthCheckScreen
                        pet={pet}
                        onBack={() => handleNavigation('home')}
                        onAnalyze={handleAnalyzePet}
                        isChecking={isChecking}
                        result={healthCheckResult}
                        error={healthCheckError}
                    />
                )}
                {activeScreen === 'book' && <PetBookScreen onBack={() => handleNavigation('home')} pet={pet} />}
                {activeScreen === 'essentials' && <ShopScreen onBack={() => handleNavigation('home')} />}
                
                {activeScreen === 'vet' && <PlaceholderScreen title="Vet Booking" icon={ICONS.VET_BOOKING} message="This feature is under development. You'll soon be able to find and book appointments with top-rated veterinarians in your city." onBack={() => handleNavigation('home')} />}
                {activeScreen === 'profile' && 
                    <ProfileScreen 
                        user={user}
                        profile={profile}
                        pet={pet}
                        onBack={() => handleNavigation('home')}
                        onLogout={handleLogout}
                        onDataUpdate={fetchDataForCurrentUser}
                    />
                }
            </div>
        </div>
    );
};

export default App;