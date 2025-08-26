// Trigger Vercel deployment
import React, { useState, useEffect, useRef } from 'react';
import { HealthCheckResult, GeminiChatMessage, DBChatMessage, Appointment, AIFeedback, TimelineEntry, ActiveModal, Vet, Product, PetbookPost, EncyclopediaTopic, Pet, UserProfile, ActiveScreen } from './types';
import { ICONS } from './constants';
import * as geminiService from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

import EnvironmentVariablePrompt from './components/ApiKeyPrompt';
import HealthCheckScreen from './components/HealthCheckScreen';
import PetBookScreen from './components/PetBookScreen';
import ShopScreen from './components/ShopScreen';
import ProfileScreen from './components/ProfileScreen';
import HomeScreen from './components/HomeScreen';
import BottomNav from './components/BottomNav';
import OnboardingProfileScreen from './components/OnboardingProfileScreen';
import OnboardingPetScreen from './components/OnboardingPetScreen';
import { marked } from 'marked';


// --- UTILITY & PLACEHOLDER COMPONENTS ---

const PlaceholderScreen: React.FC<{ title: string; icon: React.ReactNode; message: string; onBack: () => void; }> = ({ title, icon, message, onBack }) => (
    <div className="h-screen flex flex-col">
        <header className="p-4 flex items-center border-b">
            <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
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
        try {
            if (!supabase) {
                throw new Error("Database connection failed. Please ensure environment variables are set correctly.");
            }
            
            let response;
            const credentials = { email, password };
    
            if (isLoginView) {
                response = await supabase.auth.signInWithPassword(credentials);
            } else {
                response = await supabase.auth.signUp(credentials);
            }
    
            if (response.error) {
                setError(response.error.message);
            }
            // On success, the onAuthStateChange listener will handle the session update
        } catch (err: any) {
            console.error("Authentication error:", err);
            setError(err.message || "An unexpected authentication error occurred.");
        } finally {
            setLoading(false);
        }
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
                    {error && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-lg flex items-center gap-2" role="alert">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-left">{error}</span>
                        </div>
                    )}
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


// --- MAIN APP COMPONENT ---

type OnboardingStep = 'profile' | 'pet' | 'complete';

const App: React.FC = () => {
    const [missingKeys, setMissingKeys] = useState<string[]>([]);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [pet, setPet] = useState<Pet | null>(null);
    const [appLoading, setAppLoading] = useState(true);
    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep | null>(null);
    const [isEmailUnverified, setIsEmailUnverified] = useState(false);
    const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
    
    const [isChecking, setIsChecking] = useState(false);
    const [healthCheckResult, setHealthCheckResult] = useState<HealthCheckResult | null>(null);
    const [healthCheckError, setHealthCheckError] = useState<string | null>(null);

    const fetchDataForCurrentUser = async (currentSession: Session | null) => {
        if (!currentSession?.user) {
            setProfile(null);
            setPet(null);
            setOnboardingStep(null);
            return;
        }

        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', currentSession.user.id)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') console.error("Profile fetch error:", profileError.message);
        setProfile(profileData);

        if (!profileData) {
            setOnboardingStep('profile');
            setAppLoading(false);
            return;
        }

        const { data: petData, error: petError } = await supabase
            .from('pets')
            .select('*')
            .eq('auth_user_id', currentSession.user.id)
            .limit(1)
            .single();

        if (petError && petError.code !== 'PGRST116') console.error("Pet fetch error:", petError.message);
        setPet(petData);
        
        if (!petData) {
            setOnboardingStep('pet');
        } else {
            setOnboardingStep('complete');
        }
        setAppLoading(false);
    };


    useEffect(() => {
        const requiredKeys = ['VITE_API_KEY', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
        const missing = requiredKeys.filter(key => !import.meta.env[key]);
        if (missing.length > 0) {
            setMissingKeys(missing);
            setAppLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.email && !session.user.email_confirmed_at) {
                setIsEmailUnverified(true);
                setAppLoading(false);
            } else if (session) {
                fetchDataForCurrentUser(session);
            } else {
                setAppLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user?.email && !session.user.email_confirmed_at) {
                setIsEmailUnverified(true);
                setAppLoading(false);
            } else {
                setIsEmailUnverified(false);
                if (session) {
                    fetchDataForCurrentUser(session);
                } else {
                    setProfile(null);
                    setPet(null);
                    setOnboardingStep(null);
                    setAppLoading(false);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);
    
    const handleNavigation = (screen: ActiveScreen) => {
        if (screen === 'health') {
            setHealthCheckResult(null);
            setHealthCheckError(null);
        }
        setActiveScreen(screen);
    };

     const handleLogout = async () => {
        setAppLoading(true);
        await supabase.auth.signOut();
        // The onAuthStateChange listener will handle resetting state
        setActiveScreen('home');
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
            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = (error) => reject(error);
            });
    
            const petContext = {
                name: pet.name,
                breed: pet.breed,
                age: `${new Date().getFullYear() - new Date(pet.birth_date).getFullYear()} years`,
            };
            const result = await geminiService.analyzePetHealth(base64String, imageFile.type, notes, petContext);
            setHealthCheckResult(result);
    
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
            setHealthCheckError(errorMessage);
        } finally {
            setIsChecking(false);
        }
    };
    
    const handleDataUpdate = () => {
        fetchDataForCurrentUser(session);
    }

    if (missingKeys.length > 0) {
        return <EnvironmentVariablePrompt missingKeys={missingKeys} />;
    }

    if (appLoading) {
        return <LoadingScreen />;
    }

    if (!session) {
        return <AuthScreen />;
    }
    
    if (isEmailUnverified && user?.email) {
        return <EmailVerificationScreen email={user.email} />;
    }
    
    if (onboardingStep === 'profile' && user) {
        return <OnboardingProfileScreen user={user} onProfileCreated={handleDataUpdate} />;
    }

    if (onboardingStep === 'pet' && user && profile) {
        return <OnboardingPetScreen user={user} onPetAdded={handleDataUpdate} />;
    }


    const renderActiveScreen = () => {
        switch (activeScreen) {
            case 'home':
                return <HomeScreen onNavigate={handleNavigation} pet={pet} profile={profile} />;
            case 'health':
                return <HealthCheckScreen pet={pet} onBack={() => handleNavigation('home')} onAnalyze={handleAnalyzePet} isChecking={isChecking} result={healthCheckResult} error={healthCheckError} />;
            case 'book':
                return <PetBookScreen onBack={() => handleNavigation('home')} pet={pet} />;
            case 'essentials':
                return <ShopScreen onBack={() => handleNavigation('home')} />;
            case 'vet':
                 return <PlaceholderScreen title="Vet Booking" icon={ICONS.VET_BOOKING} message="This feature is under development. You'll soon be able to find and book appointments with top-rated veterinarians in your city." onBack={() => handleNavigation('home')} />;
            case 'profile':
                return <ProfileScreen user={user} profile={profile} pet={pet} onBack={() => handleNavigation('home')} onLogout={handleLogout} onDataUpdate={handleDataUpdate} />;
            default:
                return <HomeScreen onNavigate={handleNavigation} pet={pet} profile={profile} />;
        }
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <main className="flex-grow overflow-y-auto pb-16">
                {onboardingStep === 'complete' ? renderActiveScreen() : <LoadingScreen message="Finalizing setup..." />}
            </main>
            {onboardingStep === 'complete' && <BottomNav activeScreen={activeScreen} onNavigate={handleNavigation} />}
        </div>
    );
};

export default App;
