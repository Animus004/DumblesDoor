import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { HealthCheckResult, Pet, UserProfile, LogoutAnalytics } from './types';
import { supabase, bootstrapUserProfile } from './services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { analyzePetHealth } from './services/geminiService';

import EnvironmentVariablePrompt from './components/ApiKeyPrompt';
import BottomNav from './components/BottomNav';
import OnboardingFlow from './components/OnboardingProfileScreen';
import WelcomeScreen from './components/WelcomeScreen';
import OnboardingCompletionScreen from './components/OnboardingCompletionScreen';
import AppRouter from './src/Router';
import { LoadingScreen, EmailVerificationScreen, AuthScreen, AppErrorScreen, getFriendlyAuthErrorMessage } from './components/AuthScreens';

declare global {
  interface Window {
    google: any;
  }
}

const App: React.FC = () => {
    const missingKeys = [!import.meta.env.VITE_SUPABASE_URL && "VITE_SUPABASE_URL", !import.meta.env.VITE_SUPABASE_ANON_KEY && "VITE_SUPABASE_ANON_KEY", !import.meta.env.VITE_GEMINI_API_KEY && "VITE_GEMINI_API_KEY"].filter(Boolean) as string[];
    const location = useLocation();
    const navigate = useNavigate();

    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [postLogoutMessage, setPostLogoutMessage] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [activePet, setActivePet] = useState<Pet | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);
    
    const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'onboarding' | 'complete' | null>(null);
    const [onboardingInitialStep, setOnboardingInitialStep] = useState<1 | 2>(1);
    const [showCelebration, setShowCelebration] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());
    const [draftPostContent, setDraftPostContent] = useState('');

    // --- Health Check State ---
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<HealthCheckResult | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const fetchData = useCallback(async (currentUser: User) => {
        setDataLoading(true);
        setDataError(null);
        try {
            const { data: profileData, error: profileError } = await supabase.from('user_profiles').select('*').eq('auth_user_id', currentUser.id).single();
            if (profileError) throw profileError;
            if (!profileData) throw new Error("Could not fetch user profile.");
            
            setProfile(profileData as unknown as UserProfile);

            const { data: petsData, error: petsError } = await supabase.from('pets').select('*').eq('auth_user_id', currentUser.id);
            if (petsError) throw petsError;

            const petsList = petsData || [];
            setPets(petsList);
            setActivePet(petsList.length > 0 ? petsList[0] : null);
            
            const needsProfile = !profileData.city || !profileData.name.trim();
            const needsPet = petsList.length === 0;

            if (needsProfile || needsPet) {
                setOnboardingInitialStep(needsProfile ? 1 : 2);
                setOnboardingStep('onboarding');
            } else {
                setOnboardingStep(null);
            }
        } catch (err: any) {
            console.error("Data fetching error:", err);
            if (err.message?.includes('security policy')) {
                setDataError("Permissions error: Could not load your data due to security policies. Please try logging in again.");
            } else {
                setDataError("Failed to load data. Something went wrong.");
            }
        } finally {
            setDataLoading(false);
        }
    }, []);
    
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setSession(session);
            setUser(currentUser);
            
            if (_event === 'SIGNED_IN' && currentUser && !currentUser.email_confirmed_at) {
                const { data: { user: refreshedUser } } = await supabase.auth.refreshSession();
                if (refreshedUser && !refreshedUser.email_confirmed_at) setNeedsVerification(true);
                else setNeedsVerification(false);
            } else {
                setNeedsVerification(false);
            }

            if ((_event === 'SIGNED_IN' || (_event === 'INITIAL_SESSION' && session)) && currentUser) {
                setSessionStartTime(Date.now());
                await bootstrapUserProfile(currentUser);
                await fetchData(currentUser);
            } else if (!currentUser) {
                setProfile(null);
                setPets([]);
                setActivePet(null);
                setDataLoading(false);
            }
            setAuthLoading(false);
        });
        return () => subscription.unsubscribe();
    }, [fetchData]);

    const handleLogout = async (analyticsData: LogoutAnalytics) => {
        await supabase.auth.signOut({ scope: analyticsData.scope });
        setPostLogoutMessage('You have been successfully logged out.');
        setProfile(null);
        setPets([]);
        setActivePet(null);
        navigate('/');
    };

    const handleAnalyze = async (imageFile: File, notes: string) => {
        if (!activePet || !user) {
            setAnalysisError("You must have an active pet selected to perform a health check.");
            return;
        }
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setAnalysisError(null);

        const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });

        try {
            const base64data = await toBase64(imageFile);
            const petContext = {
                name: activePet.name,
                breed: activePet.breed,
                age: `${new Date().getFullYear() - new Date(activePet.birth_date).getFullYear()} years`,
            };
            const result = await analyzePetHealth(base64data, imageFile.type, notes, petContext);
            setAnalysisResult(result);

            await supabase.from('ai_feedback').insert({
                pet_id: activePet.id,
                auth_user_id: user.id,
                input_data: { notes },
                ai_response: JSON.stringify(result),
                status: 'completed',
            });
            await fetchData(user);
        } catch (err: any) {
            console.error("Analysis failed:", err);
            setAnalysisError(err.message || "An unknown error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearAnalysisState = () => {
        setAnalysisResult(null);
        setAnalysisError(null);
    };

    if (missingKeys.length > 0) return <EnvironmentVariablePrompt missingKeys={missingKeys} />;
    if (authLoading || (user && dataLoading)) return <LoadingScreen />;
    if (dataError) return <AppErrorScreen message={dataError} onRetry={() => user && bootstrapUserProfile(user).then(() => fetchData(user))} />;
    if (!session) return <AuthScreen postLogoutMessage={postLogoutMessage} />;
    if (needsVerification && user) return <EmailVerificationScreen email={user.email!} />;

    if (onboardingStep) {
        switch (onboardingStep) {
            case 'welcome': return <WelcomeScreen onGetStarted={() => setOnboardingStep('onboarding')} />;
            case 'onboarding': return <OnboardingFlow 
                user={user!}
                profile={profile}
                initialStep={onboardingInitialStep}
                onComplete={() => {
                    setOnboardingStep('complete');
                    fetchData(user!);
                }}
                onSkip={() => setOnboardingStep(null)}
                onDataUpdate={async () => { await fetchData(user!); }}
            />;
            case 'complete': return <OnboardingCompletionScreen pet={activePet} onComplete={() => { setOnboardingStep(null); setShowCelebration(true); }} />;
            default: return <AppErrorScreen message="Invalid onboarding state." onRetry={() => user && fetchData(user)} />;
        }
    }

    const showBottomNav = ['/home', '/book', '/connect', '/adoption', '/profile'].includes(location.pathname);

    return (
        <div 
            className="app-container" 
            style={{
                paddingBottom: showBottomNav ? 'calc(4rem + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)',
                paddingTop: 'env(safe-area-inset-top)'
            }}
        >
            <AppRouter
                user={user}
                profile={profile}
                pets={pets}
                activePet={activePet}
                dataLoading={dataLoading}
                showCelebration={showCelebration}
                onLogout={handleLogout}
                onDataUpdate={() => fetchData(user!)}
                sessionStartTime={sessionStartTime}
                draftPostContent={draftPostContent}
                setDraftPostContent={setDraftPostContent}
                isAnalyzing={isAnalyzing}
                analysisResult={analysisResult}
                analysisError={analysisError}
                handleAnalyze={handleAnalyze}
                clearAnalysisState={clearAnalysisState}
            />
            {showBottomNav && <BottomNav />}
        </div>
    );
};

export default App;