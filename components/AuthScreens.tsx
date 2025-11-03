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
    type AuthView = 'login' | 'signup' | 'forgot_password';
    const [authView, setAuthView] = useState<AuthView>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            if (authView === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else { // signup
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: window.location.origin }
                });
                if (error) throw error;
                if (!data.session) {
                    setMessage('Check your email for the confirmation link!');
                    setEmail('');
                    setPassword('');
                }
            }
        } catch (error: any) {
            setError(getFriendlyAuthErrorMessage(error.message));
        } finally {
            setLoading(false);
        }
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            setMessage('If an account exists, a password reset link has been sent to your email.');
            setAuthView('login');
        } catch (error: any) {
            setError(getFriendlyAuthErrorMessage(error.message));
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

    const AuthForm = () => {
        if (authView === 'forgot_password') {
            return (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">Enter your email and we'll send you a link to reset your password.</p>
                    <div className="relative">
                        <input id="email-reset" type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input block px-3 py-3 w-full text-sm text-gray-900 bg-transparent rounded-lg border-2 appearance-none focus:outline-none focus:ring-0 peer" required />
                        <label htmlFor="email-reset" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-teal-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Email address</label>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg flex justify-center items-center disabled:opacity-50 h-12">
                        {loading ? <div className="btn-loader"></div> : 'Send Reset Link'}
                    </button>
                    <button type="button" onClick={() => setAuthView('login')} className="w-full text-sm text-center text-teal-600 font-semibold">Back to Log In</button>
                </form>
            );
        }

        return (
            <form onSubmit={handleAuth} className="space-y-4">
                <div className="relative">
                    <input id="email" type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input block px-3 py-3 w-full text-sm text-gray-900 bg-transparent rounded-lg border-2 appearance-none focus:outline-none focus:ring-0 peer" required />
                    <label htmlFor="email" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-teal-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Email address</label>
                </div>
                <div className="relative">
                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input block px-3 py-3 w-full text-sm text-gray-900 bg-transparent rounded-lg border-2 appearance-none focus:outline-none focus:ring-0 peer" required />
                    <label htmlFor="password" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-50 px-2 peer-focus:px-2 peer-focus:text-teal-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 start-1">Password</label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500">
                        {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074L3.707 2.293zM10 12a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" /><path d="M2 10s3.923-5.5 8-5.5a9.967 9.967 0 014.288 1.115l-3.214 3.214A4.004 4.004 0 0010 9a4 4 0 00-4 4 3.963 3.963 0 001.115 2.712l-3.214 3.214A9.967 9.967 0 012 10z" /></svg>}
                    </button>
                </div>
                {authView === 'login' && <button type="button" onClick={() => setAuthView('forgot_password')} className="text-sm font-semibold text-teal-600 hover:underline text-right block w-full">Forgot Password?</button>}
                <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg flex justify-center items-center disabled:opacity-50 h-12">
                    {loading ? <div className="btn-loader"></div> : (authView === 'login' ? 'Log In' : 'Create Account')}
                </button>
            </form>
        );
    };

    return (
        <div className="auth-container flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <span className="text-5xl">🐾</span>
                    <h1 className="font-poppins text-3xl font-bold text-gray-800 mt-2">Dumble's Door</h1>
                    <p className="text-gray-500 mt-1">Your pet's best friend is just a login away.</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-xl auth-card">
                    {authView !== 'forgot_password' && (
                        <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
                            <button onClick={() => setAuthView('signup')} className={`w-full p-2 text-sm font-semibold rounded-md transition-colors ${authView === 'signup' ? 'bg-white text-teal-600 shadow' : 'text-gray-600'}`}>Sign Up</button>
                            <button onClick={() => setAuthView('login')} className={`w-full p-2 text-sm font-semibold rounded-md transition-colors ${authView === 'login' ? 'bg-white text-teal-600 shadow' : 'text-gray-600'}`}>Log In</button>
                        </div>
                    )}
                    
                    {postLogoutMessage && <p className="text-green-600 text-center mb-4 text-sm font-semibold">{postLogoutMessage}</p>}
                    {message && <p className="text-blue-600 bg-blue-50 text-center mb-4 p-3 rounded-md text-sm">{message}</p>}
                    {error && <p className="text-red-600 bg-red-50 text-center mb-4 p-3 rounded-md text-sm">{error}</p>}
                    
                    <AuthForm />
                    
                    {authView !== 'forgot_password' && (
                        <>
                            <div className="relative flex py-5 items-center"><div className="flex-grow border-t border-gray-200"></div><span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase">Or</span><div className="flex-grow border-t border-gray-200"></div></div>
                            <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.373-11.127-7.962l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,35.61,44,30.45,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                                <span>Continue with Google</span>
                            </button>
                        </>
                    )}
                </div>
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