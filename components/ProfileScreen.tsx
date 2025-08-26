import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Pet, UserProfile } from '../types';
import PetForm from './PetForm';

interface ProfileScreenProps {
  user: User | null;
  profile: UserProfile | null;
  pet: Pet | null;
  onBack: () => void;
  onLogout: () => void;
  onDataUpdate: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, profile, pet, onBack, onLogout, onDataUpdate }) => {
    // State for user profile form
    const [isUserEditing, setIsUserEditing] = useState(false);
    const [userName, setUserName] = useState(profile?.name || '');
    const [userPhone, setUserPhone] = useState(profile?.phone || '');
    const [userCity, setUserCity] = useState(profile?.city || '');
    const [userLoading, setUserLoading] = useState(false);
    const [userError, setUserError] = useState('');
    
    // State for pet form modal
    const [petFormMode, setPetFormMode] = useState<'add' | 'edit' | null>(null);
    const [isSavingPet, setIsSavingPet] = useState(false);

     useEffect(() => {
        if (profile) {
            setUserName(profile.name || '');
            setUserPhone(profile.phone || '');
            setUserCity(profile.city || '');
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
    
    const handlePetSaved = () => {
        setIsSavingPet(false);
        setPetFormMode(null);
        onDataUpdate();
    }
    
    return (
        <div className="min-h-screen bg-gray-50">
             <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Profile & Settings</h1>
            </header>
            <main className="p-4 md:p-6 space-y-8 pb-20">
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

                {/* Pet Profile Section */}
                <section className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">{pet ? `${pet.name}'s Profile` : "Pet Profile"}</h2>
                        {(pet) && <button onClick={() => setPetFormMode('edit')} className="text-sm font-semibold text-teal-600 hover:text-teal-800">
                            Edit
                        </button>}
                    </div>

                    {!pet && (
                        <div className="text-center py-4">
                            <p className="text-gray-600 mb-4">You haven't added a pet yet.</p>
                            <button onClick={() => setPetFormMode('add')} className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600">Add Pet</button>
                        </div>
                    )}
                    
                    {pet && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <img src={pet.photo_url} alt={pet.name} className="w-20 h-20 rounded-full object-cover"/>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Name</label>
                                    <p className="text-lg text-gray-900">{pet.name}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Species</label>
                                <p className="text-lg text-gray-900">{pet.species}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Breed</label>
                                <p className="text-lg text-gray-900">{pet.breed}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Birth Date</label>
                                <p className="text-lg text-gray-900">{new Date(pet.birth_date).toLocaleDateString()}</p>
                            </div>
                                <div>
                                <label className="text-sm font-medium text-gray-500">Gender</label>
                                <p className="text-lg text-gray-900">{pet.gender}</p>
                            </div>
                        </div>
                    )}
                </section>
                
                 {/* Logout Section */}
                 <section className="text-center">
                    <button onClick={onLogout} className="text-red-600 font-semibold hover:underline">
                        Log Out
                    </button>
                 </section>
            </main>

            {/* Pet Form Modal */}
            {petFormMode && user && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-40 flex flex-col" role="dialog" aria-modal="true">
                    <div className="bg-white flex-grow overflow-y-auto">
                        <PetForm
                            user={user}
                            petToEdit={petFormMode === 'edit' ? pet : null}
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
