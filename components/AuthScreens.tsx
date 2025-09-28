import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const getFriendlyAuthErrorMessage = (message: string): string => {
    if (!message) return 'An unexpected error occurred. Please try again.';
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes('redirect uri mismatch') || lowerCaseMessage.includes('invalid redirect uri') || (lowerCaseMessage.includes('oauth') && (lowerCaseMessage.includes('origin') || lowerCaseMessage.includes('redirect')))) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'YOUR_APP_URL';
        return `[DEVELOPER] A crucial OAuth setting is incorrect. Your authentication provider (e.g., Google) is blocking the login request because your app's URL is not on its list of allowed redirect URIs.\n\nACTION REQUIRED: Add the following URL to your Supabase project's "Redirect URLs" list under "Authentication > URL Configuration":\n\n${origin}`;
    }
    if (lowerCaseMessage.includes('invalid login credentials')) return 'Incorrect email or password. If you signed up using a social provider like Google, please use that login method instead.';
    if (lowerCaseMessage.includes('email not confirmed')) return 'Email not confirmed. Check your inbox for the verification link.';
    if (lowerCaseMessage.includes('user already registered')) return 'An account with this email already exists. Try logging in or use the password reset option if you forgot your password.';
    if (lowerCaseMessage.includes('rate limit exceeded') || lowerCaseMessage.includes('too many requests')) return 'You have made too many attempts. Please wait a moment and try again.';
    if (lowerCaseMessage.includes('networkerror') || lowerCaseMessage.includes('failed to fetch')) return 'A network error occurred. Please check your internet connection and try again.';
    if (lowerCaseMessage.includes('oauth')) return `[DEVELOPER] An OAuth error occurred. This could be due to an incorrect Client ID/Secret in your Supabase settings, the provider application being in 'test mode', or other provider-side configuration issues. Raw message: ${message}`;
    console.warn('Unhandled Supabase auth error:', message);
    return 'An unexpected authentication error occurred. Please try again.';
};

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading Dumble's Door..." }) => (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-teal-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
        <p className="text-gray-600 mt-4 text-lg">{message}</p>
    </div>
);

export const EmailVerificationScreen: React.FC<{ email: string }> = ({ email }) => {
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
        const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email });
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
                <p className="text-gray-600">We've sent a verification link to <strong className="text-gray-900">{email}</strong>. Please click the link to secure your account and continue.</p>
                {message && <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm">{message}</p>}
                {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
                <div className="pt-2">
                    <button onClick={handleResend} disabled={loading} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50">
                        {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </div>
                <p className="text-sm text-gray-500 pt-2">Didn't get an email? Check your spam folder or click the button above.</p>
            </div>
        </div>
    );
};

export const AuthScreen: React.FC<{ postLogoutMessage: string }> = ({ postLogoutMessage }) => {
    const [isLoginView, setIsLoginView] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLoginView) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.auth.signUp({ 
                    email, 
                    password,
                    options: { emailRedirectTo: window.location.origin }
                });
                if (error) throw error;
                if (!data.session) alert('Check your email for the confirmation link!');
            }
        } catch (error: any) {
            if (error.message && error.message.toLowerCase().includes('user already registered')) {
                setIsLoginView(true);
                setError('An account with this email already exists. Please log in.');
            } else {
                setError(getFriendlyAuthErrorMessage(error.message));
            }
        } finally {
            setLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) {
            setError(getFriendlyAuthErrorMessage(error.message));
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-6">{isLoginView ? 'Log In' : 'Sign Up'}</h2>
                {postLogoutMessage && <p className="text-green-600 text-center mb-4">{postLogoutMessage}</p>}
                {error && <p className="text-red-500 text-center mb-4 p-3 bg-red-50 rounded-md">{error}</p>}
                <form onSubmit={handleAuth} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" required />
                    <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">{loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}</button>
                </form>
                <div className="relative flex py-5 items-center"><div className="flex-grow border-t border-gray-200"></div><span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase">Or</span><div className="flex-grow border-t border-gray-200"></div></div>
                <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.373-11.127-7.962l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.61,44,30.45,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                    <span>{isLoginView ? 'Log In' : 'Sign Up'} with Google</span>
                </button>
                <button onClick={() => setIsLoginView(!isLoginView)} className="w-full mt-4 text-sm text-center text-teal-600">{isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Log In'}</button>
            </div>
        </div>
    );
};

export const AppErrorScreen: React.FC<{ message: string; onRetry: () => void; }> = ({ message, onRetry }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-5xl mb-4">😢</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Something Went Wrong</h2>
        <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
        <button onClick={onRetry} className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors">Try Again</button>
    </div>
);
