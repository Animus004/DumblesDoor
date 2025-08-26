import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Pet, UserProfile, ActiveScreen } from '../types';
import PetForm from './PetForm';

interface ProfileScreenProps {
  user: User | null;
  profile: UserProfile | null;
  pets: Pet[];
  onBack: () => void;
  onLogout: () => void;
  onDataUpdate: () => void;
  onNavigate: (screen: ActiveScreen) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, profile, pets, onBack, onLogout, onDataUpdate, onNavigate }) => {
    // State for user profile form
    const [isUserEditing, setIsUserEditing] = useState(false);
    const [userName, setUserName] = useState(profile?.name || '');
    const [userPhone, setUserPhone] = useState(profile?.phone || '');
    const [userCity, setUserCity] = useState(profile?.city || '');
    const [userLoading, setUserLoading] = useState(false);
    const [userError, setUserError] = useState('');
    
    // State for pet form modal
    const [petFormMode, setPetFormMode] = useState<'add' | 'edit' | null>(null);
    const [petToEdit, setPetToEdit] = useState<Pet | null>(null);
    const [isSavingPet, setIsSavingPet] = useState(false);
    
    // New state for safety features
    const [showEmergencyContactModal, setShowEmergencyContactModal] = useState(false);
    const [emergencyContact, setEmergencyContact] = useState(profile?.emergency_contact || { name: '', phone: '' });

     useEffect(() => {
        if (profile) {
            setUserName(profile.name || '');
            setUserPhone(profile.phone || '');
            setUserCity(profile.city || '');
            setEmergencyContact(profile.emergency_contact || { name: '', phone: '' });
        }
    }, [profile]);
    
    const handleUserSave = async () => {
        if (!user || !profile) return;
        setUserLoading(true);
        setUserError('');
        const { error } = await supabase
            .from('user_profiles')
            .update({ name: userName, phone: userPhone, city: userCity })
            .eq('auth_user_id', user.id);
        
        if (error) {
            setUserError(error.message);
        } else {
            setIsUserEditing(false);
            onDataUpdate();
        }
        setUserLoading(false);
    };
    
    const handleEmergencyContactSave = async () => {
        if (!user || !profile) return;
        setUserLoading(true);
        setUserError('');
        const { error } = await supabase
            .from('user_profiles')
            .update({ emergency_contact: emergencyContact })
            .eq('auth_user_id', user.id);
        
        if (error) {
            setUserError(`Failed to save contact: ${error.message}`);
        } else {
            setShowEmergencyContactModal(false);
            onDataUpdate();
        }
        setUserLoading(false);
    };

    const handlePetSaved = () => {
        setIsSavingPet(false);
        setPetFormMode(null);
        setPetToEdit(null);
        onDataUpdate();
    };
    
    const handleEditPet = (pet: Pet) => {
        setPetToEdit(pet);
        setPetFormMode('edit');
    };
    
    const handleAddPet = () => {
        setPetToEdit(null);
        setPetFormMode('add');
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
             <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Profile & Settings</h1>
            </header>
            <main className="p-4 md:p-6 space-y-8 pb-20">
                {/* Admin Tools Section */}
                {profile?.role === 'admin' && (
                  <section className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-teal-500">
                      <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Admin Tools</h2>
                            <p className="text-sm text-gray-500">Manage shelters and listings.</p>
                        </div>
                        <button onClick={() => onNavigate('admin')} className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                            Dashboard
                        </button>
                      </div>
                  </section>
                )}

                {/* User Profile Section */}
                <section className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">My Details</h2>
                        <button onClick={() => setIsUserEditing(!isUserEditing)} className="text-sm font-semibold text-teal-600 hover:text-teal-800">
                            {isUserEditing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    {userError && <p className="text-red-500 text-sm mb-4">{userError}</p>}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Name</label>
                            {isUserEditing ? (
                                <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                            ) : (
                                <p className="text-lg text-gray-900">{profile?.name || 'Not set'}</p>
                            )}
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-lg text-gray-500">{user?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Phone</label>
                            {isUserEditing ? (
                                <input type="tel" value={userPhone} onChange={e => setUserPhone(e.target.value)} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                            ) : (
                                <p className="text-lg text-gray-900">{profile?.phone || 'Not set'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            {isUserEditing ? (
                                <input type="text" value={userCity} onChange={e => setUserCity(e.target.value)} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                            ) : (
                                <p className="text-lg text-gray-900">{profile?.city || 'Not set'}</p>
                            )}
                        </div>
                    </div>
                     {isUserEditing && (
                        <button onClick={handleUserSave} disabled={userLoading} className="mt-6 w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 disabled:opacity-50">
                            {userLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </section>

                {/* My Pets Section */}
                <section className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">My Pets</h2>
                    </div>

                    {pets.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-gray-600 mb-4">You haven't added any pets yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pets.map(pet => (
                                <div key={pet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <img src={pet.photo_url} alt={pet.name} className="w-16 h-16 rounded-full object-cover" />
                                        <div>
                                            <p className="font-semibold text-gray-800">{pet.name}</p>
                                            <p className="text-sm text-gray-500">{pet.breed}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleEditPet(pet)} className="text-sm font-semibold text-teal-600 hover:text-teal-800">
                                        Edit
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={handleAddPet} className="mt-6 w-full bg-teal-100 text-teal-700 font-bold py-2 px-4 rounded-lg hover:bg-teal-200">
                        Add New Pet
                    </button>
                </section>
                
                {/* Adoption Journey Section */}
                <section className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Adoption Journey</h2>
                            <p className="text-sm text-gray-500">Track your adoption applications.</p>
                        </div>
                        <button onClick={() => onNavigate('myApplications')} className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">
                            View My Applications
                        </button>
                    </div>
                </section>

                {/* Account Safety Section */}
                <section className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Safety</h2>
                    <div className="space-y-3">
                        {/* Verification Status */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-700">Verification Status</p>
                                <p className={`text-sm font-bold ${profile?.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {profile?.verified ? 'Verified' : 'Not Verified'}
                                </p>
                            </div>
                            {!profile?.verified && (
                                <button onClick={() => alert('Verification coming soon! This will involve an ID check to ensure community safety.')} className="bg-blue-100 text-blue-700 font-bold text-sm py-1.5 px-3 rounded-md hover:bg-blue-200">
                                    Get Verified
                                </button>
                            )}
                        </div>
                        {/* Emergency Contact */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-700">Emergency Contact</p>
                                <p className="text-sm text-gray-500">
                                    {profile?.emergency_contact?.name ? `${profile.emergency_contact.name} - ${profile.emergency_contact.phone}` : 'Not set'}
                                </p>
                            </div>
                            <button onClick={() => { setEmergencyContact(profile?.emergency_contact || { name: '', phone: '' }); setShowEmergencyContactModal(true); }} className="text-teal-600 font-semibold text-sm">
                                {profile?.emergency_contact ? 'Edit' : 'Add'}
                            </button>
                        </div>
                        {/* Safety Center */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-700">Safety Center</p>
                                <p className="text-sm text-gray-500">Resources and tips for safe meetups.</p>
                            </div>
                            <button onClick={() => onNavigate('safetyCenter')} className="text-teal-600 font-semibold text-sm">
                                View
                            </button>
                        </div>
                    </div>
                </section>
                
                 {/* Logout Section */}
                 <section className="text-center">
                    <button onClick={onLogout} className="text-red-600 font-semibold hover:underline">
                        Log Out
                    </button>
                 </section>
            </main>

            {/* Emergency Contact Modal */}
            {showEmergencyContactModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowEmergencyContactModal(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Emergency Contact</h2>
                        <p className="text-sm text-center text-gray-500 mb-4">This info is kept private and only shared in case of an emergency during a verified meetup.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                                <input type="text" value={emergencyContact.name} onChange={e => setEmergencyContact(c => ({...c, name: e.target.value}))} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                                <input type="tel" value={emergencyContact.phone} onChange={e => setEmergencyContact(c => ({...c, phone: e.target.value}))} className="w-full mt-1 p-2 border rounded-md" />
                            </div>
                        </div>
                        {userError && <p className="text-red-500 text-sm mt-4">{userError}</p>}
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowEmergencyContactModal(false)} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg">Cancel</button>
                            <button onClick={handleEmergencyContactSave} disabled={userLoading} className="w-full bg-teal-500 text-white font-bold py-2 rounded-lg disabled:opacity-50">{userLoading ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pet Form Modal */}
            {petFormMode && user && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-40 flex flex-col" role="dialog" aria-modal="true">
                    <div className="bg-white flex-grow overflow-y-auto">
                        <PetForm
                            user={user}
                            petToEdit={petToEdit}
                            onSave={handlePetSaved}
                            onCancel={() => setPetFormMode(null)}
                            isSaving={isSavingPet}
                            setIsSaving={setIsSavingPet}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileScreen;
