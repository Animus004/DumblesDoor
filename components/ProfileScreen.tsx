





import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
// FIX: Import the `Json` type to handle Supabase JSONB column data.
import type { Pet, UserProfile, ActiveScreen, LogoutAnalytics, EmergencyContact, Json } from '../types';
import PetForm from './PetForm';

// --- HELPER COMPONENTS ---

const SettingsRow: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; }> = ({ icon, title, subtitle, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center p-3 text-left hover:bg-gray-100 rounded-lg transition-colors">
        <div className="bg-gray-100 text-gray-600 rounded-lg p-2 mr-4">{icon}</div>
        <div className="flex-grow">
            <p className="font-semibold text-gray-800">{title}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </button>
);

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};


// --- MODAL & LOGOUT COMPONENTS ---

const ProfileEditModal: React.FC<{ profile: UserProfile; onSave: (name: string, phone: string, city: string) => Promise<void>; onCancel: () => void; isLoading: boolean; }> = ({ profile, onSave, onCancel, isLoading }) => {
    const [name, setName] = useState(profile.name || '');
    const [phone, setPhone] = useState(profile.phone || '');
    const [city, setCity] = useState(profile.city || '');

    const handleSaveClick = () => {
        onSave(name, phone, city);
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Edit Your Details</h2>
                <div className="space-y-4">
                     <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-500">City</label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                </div>
                <div className="flex gap-4 mt-6">
                    <button onClick={onCancel} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg">Cancel</button>
                    <button onClick={handleSaveClick} disabled={isLoading} className="w-full bg-teal-500 text-white font-bold py-2 rounded-lg disabled:opacity-50">{isLoading ? 'Saving...' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
};

// --- A/B Tested Logout Confirmation Components ---
const SwipeToConfirm: React.FC<{ onConfirm: () => void; isLoggingOut: boolean }> = ({ onConfirm, isLoggingOut }) => {
    const [thumbPosition, setThumbPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (isLoggingOut || !isDragging || !trackRef.current) return;
        const trackRect = trackRef.current.getBoundingClientRect();
        const maxPos = trackRect.width - trackRect.height; // height is used for thumb width
        const newPos = Math.min(maxPos, Math.max(0, clientX - trackRect.left - trackRect.height / 2));
        setThumbPosition(newPos);
    };

    const handleEnd = () => {
        if (isLoggingOut || !trackRef.current) return;
        const trackRect = trackRef.current.getBoundingClientRect();
        const maxPos = trackRect.width - trackRect.height;
        if (thumbPosition > maxPos * 0.8) {
            setThumbPosition(maxPos);
            onConfirm();
        } else {
            setThumbPosition(0);
        }
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => { if (!isLoggingOut) setIsDragging(true); };
    const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
    const handleMouseDown = (e: React.MouseEvent) => { if (!isLoggingOut) { setIsDragging(true); e.preventDefault(); }};
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div ref={trackRef} className={`relative w-full h-14 rounded-full flex items-center p-1.5 swipe-track overflow-hidden ${isLoggingOut ? 'bg-gray-200' : 'bg-red-100'}`}>
            <span className={`absolute left-1/2 -translate-x-1/2 font-semibold ${isLoggingOut ? 'text-gray-500' : 'text-red-500 swipe-label-text'}`}>
                {isLoggingOut ? 'Processing...' : 'Swipe to Log Out'}
            </span>
            <div
                className={`relative h-full aspect-square text-white rounded-full flex items-center justify-center shadow-md ${isLoggingOut ? 'bg-gray-400' : 'bg-red-500 swipe-thumb'}`}
                style={{ transform: `translateX(${thumbPosition}px)`, transition: isDragging ? 'none' : 'transform 0.2s ease' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleEnd}
                onMouseDown={handleMouseDown}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" /></svg>
            </div>
        </div>
    );
};

const ButtonToConfirm: React.FC<{ onConfirm: () => void, isLoggingOut: boolean }> = ({ onConfirm, isLoggingOut }) => (
    <button 
        onClick={onConfirm}
        disabled={isLoggingOut}
        className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
    >
        {isLoggingOut ? 'Logging Out...' : 'Confirm Log Out'}
    </button>
);

const StarRating: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => (
    <div className="flex justify-center items-center gap-2">
        {[1, 2, 3, 4, 5].map(star => (
            <button key={star} onClick={() => onRate(star)} className="text-4xl transition-transform transform hover:scale-110 focus:outline-none" aria-label={`Rate ${star} out of 5 stars`}>
                <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
            </button>
        ))}
    </div>
);

// --- Enhanced Logout Bottom Sheet ---
interface LogoutFeedback {
    satisfaction_rating?: number;
    reason?: string;
    details?: string;
}

const LogoutBottomSheet: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onLogout: (analyticsData: LogoutAnalytics) => void;
    user: User;
}> = ({ isOpen, onClose, onLogout, user }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [signOutEverywhere, setSignOutEverywhere] = useState(false);
    const [step, setStep] = useState(1);
    const [feedback, setFeedback] = useState<LogoutFeedback>({});
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const uxVariant = useMemo(() => 
        (parseInt(user.id.slice(-1), 16) % 2 === 0) ? 'swipe' : 'button' as 'swipe' | 'button',
        [user.id]
    );

    const logoutReasons = ["Taking a break", "App is not useful", "Technical issues", "Privacy concerns", "Other"];

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
            setStep(1);
            setFeedback({});
        }, 300);
    };

    const handleConfirmLogout = () => {
        setIsLoggingOut(true);
        onLogout({
            user_id: user.id,
            ...feedback,
            scope: signOutEverywhere ? 'global' : 'local',
            ux_variant: uxVariant,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={handleClose}>
            <div
                className={`w-full bg-white rounded-t-2xl p-4 pt-2 ${isExiting ? 'exiting' : ''} bottom-sheet-content`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto my-2"></div>
                {step === 1 && (
                    <>
                        <h2 className="text-xl font-bold text-center text-gray-800 my-4">We're sad to see you go</h2>
                        <p className="text-center text-sm text-gray-500 -mt-2 mb-4">Your feedback is optional but helps us improve.</p>
                        
                        <div className="space-y-4 my-6">
                            <p className="font-semibold text-center text-sm text-gray-600">How was your experience today?</p>
                            <StarRating rating={feedback.satisfaction_rating || 0} onRate={(r) => setFeedback(f => ({...f, satisfaction_rating: r}))} />
                        </div>

                         <div className="space-y-2">
                             <p className="font-semibold text-sm text-gray-600">What's the main reason for leaving?</p>
                             <div className="flex flex-wrap gap-2">
                                {logoutReasons.map(reason => (
                                    <button key={reason} onClick={() => setFeedback(f => ({...f, reason, details: reason !== 'Other' ? '' : f.details}))} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${feedback.reason === reason ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                        {reason}
                                    </button>
                                ))}
                             </div>
                             {feedback.reason === 'Other' && (
                                <textarea value={feedback.details || ''} onChange={e => setFeedback(f => ({...f, details: e.target.value}))} placeholder="Please tell us more..." rows={2} className="w-full mt-2 p-2 border rounded-md"></textarea>
                             )}
                         </div>

                        <button onClick={() => setStep(2)} className="mt-6 w-full bg-teal-500 text-white font-bold py-3 rounded-lg">Continue to Log Out</button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 className="text-xl font-bold text-center text-gray-800 my-4">Final Confirmation</h2>
                        <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg my-6">
                            <label htmlFor="signOutEverywhere" className="text-sm font-medium text-gray-700">Sign out of all devices</label>
                            <button onClick={() => setSignOutEverywhere(!signOutEverywhere)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${signOutEverywhere ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${signOutEverywhere ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        
                        {uxVariant === 'swipe' ? (
                            <SwipeToConfirm onConfirm={handleConfirmLogout} isLoggingOut={isLoggingOut} />
                        ) : (
                            <ButtonToConfirm onConfirm={handleConfirmLogout} isLoggingOut={isLoggingOut} />
                        )}

                        <button onClick={() => setStep(1)} className="w-full text-center text-sm font-semibold text-gray-500 mt-4">Back to feedback</button>
                    </>
                )}
            </div>
        </div>
    );
};


// --- MAIN PROFILE SCREEN COMPONENT ---

interface ProfileScreenProps {
  user: User | null;
  profile: UserProfile | null;
  pets: Pet[];
  onBack: () => void;
  onLogout: (analyticsData: LogoutAnalytics) => void;
  onDataUpdate: () => void;
  onNavigate: (screen: ActiveScreen) => void;
  sessionStartTime: number;
  draftPostContent: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, profile, pets, onBack, onLogout, onDataUpdate, onNavigate, sessionStartTime, draftPostContent }) => {
    // Modal states
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [showEmergencyContact, setShowEmergencyContact] = useState(false);
    const [showLogoutSheet, setShowLogoutSheet] = useState(false);
    const [petFormMode, setPetFormMode] = useState<'add' | 'edit' | null>(null);
    const [petToEdit, setPetToEdit] = useState<Pet | null>(null);
    const [showShortSessionModal, setShowShortSessionModal] = useState(false);

    // Form/action states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const parseEmergencyContact = (contact: EmergencyContact | null): EmergencyContact => {
        if (
            contact &&
            typeof contact.name === 'string' &&
            typeof contact.phone === 'string'
        ) {
            return { name: contact.name, phone: contact.phone };
        }
        return { name: '', phone: '' };
    };
    
    const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(() => parseEmergencyContact(profile?.emergency_contact || null));

    useEffect(() => {
        if (profile) {
            setEmergencyContact(parseEmergencyContact(profile.emergency_contact));
        }
    }, [profile]);

    const handleLogoutClick = () => {
        if (draftPostContent) {
            const discard = window.confirm("You have an unsaved draft post. Are you sure you want to log out? Your draft will be lost.");
            if (!discard) return;
        }

        const sessionDurationMs = Date.now() - sessionStartTime;
        if (sessionDurationMs < 30000) { // less than 30 seconds
            setShowShortSessionModal(true);
        } else {
            setShowLogoutSheet(true);
        }
    };
    
    const handleProfileSave = async (name: string, phone: string, city: string) => {
        if (!user) return;
        setIsLoading(true);
        setError('');
        const { error: updateError } = await supabase.from('user_profiles').update({ name, phone, city }).eq('auth_user_id', user.id);
        if (updateError) {
            setError(updateError.message);
        } else {
            setShowProfileEdit(false);
            onDataUpdate();
        }
        setIsLoading(false);
    };
    
    const handleEmergencyContactSave = async () => {
        if (!user) return;
        setIsLoading(true);
        setError('');
        // FIX: Cast `emergencyContact` to `Json` to satisfy the Supabase client's type expectation for JSONB columns.
        const { error: updateError } = await supabase.from('user_profiles').update({ emergency_contact: emergencyContact as Json }).eq('auth_user_id', user.id);
        if (updateError) {
            setError(`Failed to save contact: ${updateError.message}`);
        } else {
            setShowEmergencyContact(false);
            onDataUpdate();
        }
        setIsLoading(false);
    };

    const handlePetSaved = () => {
        setPetFormMode(null);
        setPetToEdit(null);
        onDataUpdate();
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
             <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Profile & Settings</h1>
            </header>
            
            <main className="p-4 md:p-6 space-y-6 pb-20">
                {/* User Info Card */}
                <section className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-start">
                        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-3xl">
                            {profile?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4 flex-grow">
                            <h2 className="text-xl font-bold text-gray-800">{profile?.name}</h2>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Last login: {formatDate(user?.last_sign_in_at)}</p>
                        </div>
                        <button onClick={() => setShowProfileEdit(true)} className="text-sm font-semibold text-teal-600 hover:text-teal-800">Edit</button>
                    </div>
                </section>

                {/* My Pets Section */}
                <section className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">My Pets</h3>
                    {pets.length > 0 ? (
                        <div className="space-y-3">
                            {pets.map(pet => (
                                <div key={pet.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                                    <img src={pet.photo_url} alt={pet.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div className="ml-3 flex-grow">
                                        <p className="font-semibold text-gray-800">{pet.name}</p>
                                        <p className="text-sm text-gray-500">{pet.breed}</p>
                                    </div>
                                    <button onClick={() => { setPetToEdit(pet); setPetFormMode('edit'); }} className="text-sm font-semibold text-teal-600">Edit</button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-500 text-center py-2">No pets added yet.</p>}
                    <button onClick={() => setPetFormMode('add')} className="mt-4 w-full bg-teal-100 text-teal-700 font-bold py-2 rounded-lg hover:bg-teal-200">
                        + Add Pet
                    </button>
                </section>

                {/* Settings & More Section */}
                <section className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Settings & More</h3>
                    <div className="space-y-1">
                        <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>}
                            title="My Vet Appointments" subtitle="Manage your upcoming visits" onClick={() => onNavigate('myVetAppointments')} />
                        <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>}
                            title="My Adoption Applications" subtitle="Track your adoption status" onClick={() => onNavigate('myApplications')} />
                        
                        <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" /></svg>}
                            title="Safety Center" subtitle="Safe meetup tips and resources" onClick={() => onNavigate('safetyCenter')} />

                         <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>}
                            title="Emergency Contact" subtitle="Add a contact for safety" onClick={() => setShowEmergencyContact(true)} />

                         <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>}
                            title="Help & Support" subtitle="Find answers and get help" onClick={() => alert('Our comprehensive Help Center is coming soon!')} />
                        
                        <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H7V7a3 3 0 013-3z" /></svg>}
                            title="Data & Privacy" subtitle="Export data or delete account" onClick={() => onNavigate('dataPrivacy')} />

                         {profile?.role === 'admin' && (
                             <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
                                title="Admin Dashboard" subtitle="Manage app content" onClick={() => onNavigate('admin')} />
                         )}
                    </div>
                     <button onClick={handleLogoutClick} className="w-full text-left font-semibold text-gray-700 hover:bg-gray-100 p-3 rounded-lg mt-4">
                        Log Out
                    </button>
                </section>
            </main>

            {/* --- MODALS --- */}
            {error && <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg">{error}</div>}

            {showProfileEdit && profile && <ProfileEditModal profile={profile} onSave={handleProfileSave} onCancel={() => setShowProfileEdit(false)} isLoading={isLoading} />}
            
            {user && <LogoutBottomSheet 
                isOpen={showLogoutSheet}
                onClose={() => setShowLogoutSheet(false)}
                onLogout={onLogout}
                user={user}
            />}
            
            {showShortSessionModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold">Just checking in!</h3>
                        <p className="text-sm text-gray-600 mt-2">Your session has just started. Did you find what you were looking for?</p>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => { onNavigate('home'); setShowShortSessionModal(false); }} className="w-full bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg">Explore Features</button>
                            <button onClick={() => { setShowShortSessionModal(false); setShowLogoutSheet(true); }} className="w-full bg-red-100 text-red-700 font-bold py-2.5 rounded-lg">Log Out Anyway</button>
                        </div>
                    </div>
                </div>
            )}

            {showEmergencyContact && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowEmergencyContact(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Emergency Contact</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Name</label>
                                <input type="text" value={emergencyContact.name} onChange={e => setEmergencyContact(c => ({...c, name: e.target.value}))} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Phone</label>
                                <input type="tel" value={emergencyContact.phone} onChange={e => setEmergencyContact(c => ({...c, phone: e.target.value}))} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowEmergencyContact(false)} className="w-full bg-gray-200 font-bold py-2 rounded-lg">Cancel</button>
                            <button onClick={handleEmergencyContactSave} disabled={isLoading} className="w-full bg-teal-500 text-white font-bold py-2 rounded-lg disabled:opacity-50">{isLoading ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {petFormMode && user && (
                <div className="fixed inset-0 bg-black/75 z-40 flex flex-col" role="dialog" aria-modal="true">
                    <div className="bg-white flex-grow overflow-y-auto">
                        {/* FIX: Pass `setIsLoading` to the `PetForm` component for the `setIsSaving` prop, as `setIsSaving` was not defined in the scope of `ProfileScreen`. */}
                        <PetForm user={user} petToEdit={petToEdit} onSave={handlePetSaved} onCancel={() => setPetFormMode(null)} isSaving={isLoading} setIsSaving={setIsLoading} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileScreen;