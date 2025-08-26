import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Pet } from '../types';

interface PetFormProps {
    user: User;
    petToEdit?: Pet | null;
    onSave: () => void;
    onCancel: () => void;
    isSaving: boolean;
    setIsSaving: (isSaving: boolean) => void;
    isOnboarding?: boolean;
    onBack?: () => void;
    onSkip?: () => void;
}

const PetForm: React.FC<PetFormProps> = ({ user, petToEdit, onSave, onCancel, isSaving, setIsSaving, isOnboarding = false, onBack, onSkip }) => {
    const [name, setName] = useState(petToEdit?.name || '');
    const [species, setSpecies] = useState(petToEdit?.species || '');
    const [breed, setBreed] = useState(petToEdit?.breed || '');
    const [birthDate, setBirthDate] = useState(petToEdit?.birth_date || '');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Unknown'>(petToEdit?.gender || 'Unknown');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(petToEdit?.photo_url || null);
    const [error, setError] = useState('');
    const photoInputRef = useRef<HTMLInputElement>(null);
    
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = async () => {
        if (!name.trim() || !species.trim() || !breed.trim() || !birthDate) {
            setError("Please fill in all required fields.");
            return;
        }
        setIsSaving(true);
        setError('');

        try {
            let photo_url = petToEdit?.photo_url || 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png';

            if (photoFile) {
                const filePath = `${user.id}/pets/${Date.now()}_${photoFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('pet_images')
                    .upload(filePath, photoFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('pet_images').getPublicUrl(filePath);
                photo_url = urlData.publicUrl;
            }

            const petData = {
                auth_user_id: user.id,
                name,
                species,
                breed,
                birth_date: birthDate,
                gender,
                photo_url,
            };

            const { error: upsertError } = await supabase.from('pets').upsert(
                petToEdit ? { ...petData, id: petToEdit.id } : petData
            );
            
            if (upsertError) throw upsertError;

            onSave();

        } catch (err: any) {
            setError(`Failed to save pet: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <header className="flex items-center justify-between flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-800">
                    {isOnboarding ? "Add Your Pet" : (petToEdit ? "Edit Pet Profile" : "Add a New Pet")}
                </h1>
                {isOnboarding && (
                    <button onClick={onSkip} className="text-sm font-semibold text-gray-500 hover:text-gray-800">
                        Skip for now
                    </button>
                )}
                {!isOnboarding && (
                     <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </header>
            
            {isOnboarding && <p className="text-gray-600 mt-2 mb-6">Let's create a profile for your best friend.</p>}
            
            <main className="flex-grow space-y-4 pt-6 overflow-y-auto">
                {error && <p className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-md">{error}</p>}
                <div className="flex flex-col items-center space-y-2">
                    <img
                        src={photoPreview || 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png'}
                        alt="Pet preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <input type="file" accept="image/*" ref={photoInputRef} onChange={handleImageSelect} className="hidden" />
                    <button onClick={() => photoInputRef.current?.click()} className="text-sm font-semibold text-teal-600 hover:text-teal-800">
                        {photoPreview ? 'Change Photo' : 'Add Photo'}
                    </button>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Species</label>
                    <input type="text" value={species} onChange={e => setSpecies(e.target.value)} placeholder="e.g., Dog, Cat" className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Breed</label>
                    <input type="text" value={breed} onChange={e => setBreed(e.target.value)} placeholder="e.g., Golden Retriever" className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Birth Date</label>
                    <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-teal-500 focus:border-teal-500">
                        <option value="Unknown">Unknown</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
            </main>

            <footer className="flex gap-4 pt-4 flex-shrink-0">
                {isOnboarding ? (
                    <>
                        <button onClick={onBack} className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300">
                            Back
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 disabled:opacity-50">
                            {isSaving ? 'Saving...' : "Finish Setup"}
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={onCancel} className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-300">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 disabled:opacity-50">
                            {isSaving ? 'Saving...' : "Save Changes"}
                        </button>
                    </>
                )}
            </footer>
        </div>
    );
};

export default PetForm;