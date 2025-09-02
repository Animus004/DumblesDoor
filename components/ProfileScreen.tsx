import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Pet, UserProfile, ActiveScreen } from '../types';
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


// --- MODAL COMPONENTS ---

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


// --- MAIN PROFILE SCREEN COMPONENT ---

interface ProfileScreenProps {
  user: User | null;
  profile: UserProfile | null;
  pets: Pet[];
  onBack: () => void;
  onLogout: (scope?: 'local' | 'global') => void;
  onDataUpdate: () => void;
  onNavigate: (screen: ActiveScreen) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, profile, pets, onBack, onLogout, onDataUpdate, onNavigate }) => {
    // Modal states
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [showEmergencyContact, setShowEmergencyContact] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [petFormMode, setPetFormMode] = useState<'add' | 'edit' | null>(null);
    const [petToEdit, setPetToEdit] = useState<Pet | null>(null);

    // Form/action states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [signOutEverywhere, setSignOutEverywhere] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [emergencyContact, setEmergencyContact] = useState(profile?.emergency_contact || { name: '', phone: '' });

    useEffect(() => {
        if (profile) {
            setEmergencyContact(profile.emergency_contact || { name: '', phone: '' });
        }
    }, [profile]);

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
        const { error: updateError } = await supabase.from('user_profiles').update({ emergency_contact: emergencyContact }).eq('auth_user_id', user.id);
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

    const handleLogoutClick = () => {
        const scope = signOutEverywhere ? 'global' : 'local';
        onLogout(scope);
        setShowLogoutConfirm(false);
    };
    
    const handleDeleteAccount = () => {
        // In a real app, this would trigger a Supabase Edge Function to delete all user data.
        // For now, we'll just log them out and show a confirmation.
        alert("Your account has been deleted. We're sorry to see you go!");
        onLogout('global');
        setShowDeleteConfirm(false);
    };

    const isDeleteButtonDisabled = deleteConfirmText.toLowerCase() !== 'delete';

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
                        <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>}
                            title="My Applications" subtitle="Track your adoption status" onClick={() => onNavigate('myApplications')} />
                        
                        <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" /></svg>}
                            title="Safety Center" subtitle="Safe meetup tips and resources" onClick={() => onNavigate('safetyCenter')} />

                         <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>}
                            title="Emergency Contact" subtitle="Add a contact for safety" onClick={() => setShowEmergencyContact(true)} />

                         <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>}
                            title="Help & Support" subtitle="Find answers and get help" onClick={() => alert('Our comprehensive Help Center is coming soon!')} />

                         {profile?.role === 'admin' && (
                             <SettingsRow icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
                                title="Admin Dashboard" subtitle="Manage app content" onClick={() => onNavigate('admin')} />
                         )}
                    </div>
                </section>
                
                {/* Danger Zone */}
                <section className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-lg font-bold text-red-800 mb-3">Danger Zone</h3>
                    <div className="space-y-3">
                         <button onClick={() => setShowLogoutConfirm(true)} className="w-full text-left font-semibold text-gray-700 hover:bg-gray-100 p-2 rounded-lg">Log Out</button>
                         <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-left font-semibold text-red-600 hover:bg-red-100 p-2 rounded-lg">Delete Account</button>
                    </div>
                </section>
            </main>

            {/* --- MODALS --- */}
            {error && <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg">{error}</div>}

            {showProfileEdit && profile && <ProfileEditModal profile={profile} onSave={handleProfileSave} onCancel={() => setShowProfileEdit(false)} isLoading={isLoading} />}
            
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)} role="dialog" aria-modal="true">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-gray-800">Log Out?</h2>
                        <p className="text-gray-500 mt-2">Are you sure you want to log out?</p>
                        <div className="flex items-center space-x-2 mt-4 text-left p-2">
                            <input type="checkbox" id="signOutEverywhere" checked={signOutEverywhere} onChange={(e) => setSignOutEverywhere(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal-600" />
                            <label htmlFor="signOutEverywhere" className="text-sm text-gray-700">Sign out of all other devices</label>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-gray-200 font-bold py-2.5 rounded-lg">Cancel</button>
                            <button onClick={handleLogoutClick} className="w-full bg-red-500 text-white font-bold py-2.5 rounded-lg">Log Out</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)} role="dialog" aria-modal="true">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-center text-red-700">Delete Account</h2>
                        <p className="text-gray-600 mt-2 text-sm text-center">This action is permanent and cannot be undone. All your profile data, pets, and posts will be lost.</p>
                        <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700">To confirm, type "delete" below:</label>
                            <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="w-full mt-1 p-2 border rounded-md border-red-300 focus:ring-red-500" />
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-gray-200 font-bold py-2.5 rounded-lg">Cancel</button>
                            <button onClick={handleDeleteAccount} disabled={isDeleteButtonDisabled} className="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Delete My Account</button>
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
                        <PetForm user={user} petToEdit={petToEdit} onSave={handlePetSaved} onCancel={() => setPetFormMode(null)} isSaving={isLoading} setIsSaving={setIsLoading} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileScreen;