
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Pet, UserProfile } from '../types';

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

    // State for pet profile form (used for both adding and editing)
    const [isPetEditing, setIsPetEditing] = useState(false);
    const [isAddingPet, setIsAddingPet] = useState(false);
    const [petName, setPetName] = useState(pet?.name || '');
    const [petSpecies, setPetSpecies] = useState(pet?.species || '');
    const [petBreed, setPetBreed] = useState(pet?.breed || '');
    const [petBirthDate, setPetBirthDate] = useState(pet?.birth_date || '');
    const [petGender, setPetGender] = useState<'Male' | 'Female' | 'Unknown'>(pet?.gender || 'Unknown');
    const [petPhotoFile, setPetPhotoFile] = useState<File | null>(null);
    const [petPhotoPreview, setPetPhotoPreview] = useState<string | null>(pet?.photo_url || null);
    const [petLoading, setPetLoading] = useState(false);
    const [petError, setPetError] = useState('');
    const petPhotoInputRef = useRef<HTMLInputElement>(null);


     useEffect(() => {
        if (profile) {
            setUserName(profile.name || '');
            setUserPhone(profile.phone || '');
            setUserCity(profile.city || '');
        }
    }, [profile]);

    useEffect(() => {
        if (pet) {
            setPetName(pet.name || '');
            setPetSpecies(pet.species || '');
            setPetBreed(pet.breed || '');
            setPetBirthDate(pet.birth_date || '');
            setPetGender(pet.gender || 'Unknown');
            setPetPhotoPreview(pet.photo_url || null);
        }
    }, [pet]);
    
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPetPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPetPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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
    
    const handlePetSave = async () => {
        if (!user || !pet) return;
        setPetLoading(true);
        setPetError('');
        const { error } = await supabase
            .from('pets')
            .update({
                name: petName,
                species: petSpecies,
                breed: petBreed,
                birth_date: petBirthDate,
                gender: petGender,
            })
            .eq('id', pet.id);

        if (error) {
            setPetError(error.message);
        } else {
            setIsPetEditing(false);
            onDataUpdate();
        }
        setPetLoading(false);
    };
    
    const handleAddPet = async () => {
        if (!user || !petName.trim()) {
            setPetError("Pet name is required.");
            return;
        }
        setPetLoading(true);
        setPetError('');

        try {
            let photo_url = 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png'; // Default avatar

            if (petPhotoFile) {
                const filePath = `${user.id}/pets/${Date.now()}_${petPhotoFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('pet_images')
                    .upload(filePath, petPhotoFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('pet_images').getPublicUrl(filePath);
                photo_url = urlData.publicUrl;
            }

            const { error: insertError } = await supabase.from('pets').insert({
                auth_user_id: user.id,
                name: petName,
                species: petSpecies,
                breed: petBreed,
                birth_date: petBirthDate,
                gender: petGender,
                photo_url,
            });

            if (insertError) throw insertError;

            onDataUpdate();
            setIsAddingPet(false);

        } catch (err: any) {
            setPetError(`Failed to add pet: ${err.message}`);
        } finally {
            setPetLoading(false);
        }
    };
    
    const resetPetForm = () => {
        setPetName('');
        setPetSpecies('');
        setPetBreed('');
        setPetBirthDate('');
        setPetGender('Unknown');
        setPetPhotoFile(null);
        setPetPhotoPreview(null);
        setPetError('');
    }

    const PetProfileForm = ({ onSave, onCancel, isAdding }: { onSave: () => void, onCancel: () => void, isAdding: boolean }) => (
        <div className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
                 <img
                    src={petPhotoPreview || 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png'}
                    alt="Pet preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
                <input type="file" accept="image/*" ref={petPhotoInputRef} onChange={handleImageSelect} className="hidden" />
                <button onClick={() => petPhotoInputRef.current?.click()} className="text-sm font-semibold text-teal-600 hover:text-teal-800">
                   {isAdding ? 'Add Photo' : 'Change Photo'}
                </button>
            </div>
            <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <input type="text" value={petName} onChange={e => setPetName(e.target.value)} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-500">Species</label>
                <input type="text" value={petSpecies} onChange={e => setPetSpecies(e.target.value)} placeholder="e.g., Dog, Cat" className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-500">Breed</label>
                <input type="text" value={petBreed} onChange={e => setPetBreed(e.target.value)} placeholder="e.g., Golden Retriever" className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-500">Birth Date</label>
                <input type="date" value={petBirthDate} onChange={e => setPetBirthDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-500">Gender</label>
                <select value={petGender} onChange={e => setPetGender(e.target.value as any)} className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-teal-500 focus:border-teal-500">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                </select>
            </div>
            <div className="flex gap-4 pt-2">
                 <button onClick={onCancel} className="w-full bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">
                    Cancel
                </button>
                <button onClick={onSave} disabled={petLoading} className="w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 disabled:opacity-50">
                    {petLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
             <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
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
                        <h2 className="text-2xl font-bold text-gray-800">
                            {isAddingPet ? "Add Your Pet" : (pet ? `${pet.name}'s Profile` : "Pet Profile")}
                        </h2>
                        {(pet && !isPetEditing && !isAddingPet) && <button onClick={() => setIsPetEditing(true)} className="text-sm font-semibold text-teal-600 hover:text-teal-800">
                            Edit
                        </button>}
                    </div>

                    {petError && <p className="text-red-500 text-sm mb-4 text-center p-2 bg-red-50 rounded-md">{petError}</p>}
                    
                    {!pet && !isAddingPet && (
                        <div className="text-center py-4">
                            <p className="text-gray-600 mb-4">You haven't added a pet yet.</p>
                            <button onClick={() => { resetPetForm(); setIsAddingPet(true); }} className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600">Add Pet</button>
                        </div>
                    )}
                    
                    {isAddingPet && (
                        <PetProfileForm onSave={handleAddPet} onCancel={() => setIsAddingPet(false)} isAdding={true} />
                    )}

                    {pet && !isAddingPet && (
                        isPetEditing ? (
                             <PetProfileForm onSave={handlePetSave} onCancel={() => setIsPetEditing(false)} isAdding={false} />
                        ) : (
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
                        )
                    )}
                </section>
                
                 {/* Logout Section */}
                 <section className="text-center">
                    <button onClick={onLogout} className="text-red-600 font-semibold hover:underline">
                        Log Out
                    </button>
                 </section>
            </main>
        </div>
    );
};

export default ProfileScreen;
