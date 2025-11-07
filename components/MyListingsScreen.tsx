import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import type { UserProfile, AdoptionListing, Shelter } from '../types';
import { dogBreeds, catBreeds } from '../lib/petBreeds';

// --- HELPER: Get or Create a 'Personal Shelter' for a user ---
async function getOrCreatePersonalShelter(user: User, profile: UserProfile): Promise<Shelter> {
    if (!supabase) throw new Error("Supabase client not initialized");
    
    // 1. Check if a shelter exists with this user's email
    let { data: existingShelter, error: selectError } = await supabase
        .from('shelters')
        .select('*')
        .eq('email', user.email!)
        .limit(1)
        .single();

    if (existingShelter) {
        return existingShelter as Shelter;
    }

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw selectError;
    }

    // 2. If not, create one.
    const { data: newShelter, error: insertError } = await supabase
        .from('shelters')
        .insert({
            name: `${profile.name}'s Rehoming`,
            address: profile.city || 'Not specified',
            city: profile.city || 'Not specified',
            phone: profile.phone || '0000000000',
            email: user.email!,
            verified: false, // Individual listings are not verified by default
        })
        .select()
        .single();
    
    if (insertError) throw insertError;
    return newShelter as Shelter;
}


// --- FORM COMPONENT for creating/editing a listing ---
const CreateAdoptionListingForm: React.FC<{
    user: User;
    profile: UserProfile;
    onSave: () => void;
    onCancel: () => void;
}> = ({ user, profile, onSave, onCancel }) => {
    
    const [formData, setFormData] = useState<Partial<AdoptionListing>>({
        name: '', species: 'Dog', breed: '', age: 'Young', size: 'Medium', gender: 'Male', good_with: [], special_needs: [], photos: [], description: '', story: ''
    });
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotoFiles(Array.from(e.target.files).slice(0, 5)); // Limit to 5 photos
        }
    };
    
    const handleSubmit = async () => {
        if (!formData.name || !formData.description) {
            setError("Name and description are required.");
            return;
        }
        setIsSaving(true);
        setError('');

        try {
            const personalShelter = await getOrCreatePersonalShelter(user, profile);
            
            // Upload photos
            const uploadedPhotoUrls: string[] = [];
            for (const file of photoFiles) {
                const filePath = `${user.id}/adoption_listings/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage.from('pet_images').upload(filePath, file);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('pet_images').getPublicUrl(filePath);
                uploadedPhotoUrls.push(urlData.publicUrl);
            }
            if (uploadedPhotoUrls.length === 0) {
                 uploadedPhotoUrls.push('https://i.ibb.co/2vX5vVd/default-pet-avatar.png');
            }

            // FIX: Construct the listing data object explicitly to match the database insert type.
            // The spread operator `...formData` was causing a type mismatch because formData is a Partial<AdoptionListing>
            // and may contain properties not expected by the 'insert' method, while also making required properties seem optional.
            const listingData = {
                shelter_id: personalShelter.id,
                name: formData.name!,
                species: formData.species!,
                breed: formData.breed!,
                age: formData.age!,
                size: formData.size!,
                gender: formData.gender!,
                photos: uploadedPhotoUrls,
                description: formData.description!,
                story: formData.story || null,
                good_with: formData.good_with || [],
                special_needs: formData.special_needs || [],
                status: 'Pending Approval' as const,
            };

            const { error: insertError } = await supabase.from('adoption_listings').insert(listingData);
            if (insertError) throw insertError;

            onSave();
        } catch (err: any) {
            setError(`Failed to create listing: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">List Your Pet for Adoption</h2>
                <div className="overflow-y-auto space-y-4 pr-2">
                    {error && <p className="text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
                    
                    {/* Basic Info */}
                    <input type="text" placeholder="Pet's Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-md" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={formData.species} onChange={e => setFormData({...formData, species: e.target.value as 'Dog' | 'Cat'})} className="w-full p-2 border rounded-md bg-white">
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                        </select>
                        <input type="text" placeholder="Breed" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} className="w-full p-2 border rounded-md" />
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <select value={formData.age} onChange={e => setFormData({...formData, age: e.target.value as any})} className="w-full p-2 border rounded-md bg-white"><option>Baby</option><option>Young</option><option>Adult</option><option>Senior</option></select>
                        <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full p-2 border rounded-md bg-white"><option>Male</option><option>Female</option></select>
                        <select value={formData.size} onChange={e => setFormData({...formData, size: e.target.value as any})} className="w-full p-2 border rounded-md bg-white"><option>Small</option><option>Medium</option><option>Large</option><option>Extra Large</option></select>
                    </div>
                    {/* Photos */}
                    <div>
                        <label className="text-sm font-medium">Photos (up to 5)</label>
                        <input type="file" multiple accept="image/*" onChange={handlePhotoChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                    </div>
                    {/* Details */}
                    <textarea placeholder="Description (e.g., personality, habits)" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-md" />
                    <textarea placeholder="Their Story (optional)" rows={2} value={formData.story} onChange={e => setFormData({...formData, story: e.target.value})} className="w-full p-2 border rounded-md" />
                </div>

                <div className="flex gap-4 mt-6 flex-shrink-0">
                    <button onClick={onCancel} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="w-full bg-teal-500 text-white font-bold py-2 rounded-lg disabled:opacity-50">{isSaving ? 'Submitting...' : 'Submit for Review'}</button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN SCREEN COMPONENT ---
interface MyListingsScreenProps {
  user: User;
  profile: UserProfile;
}

const MyListingsScreen: React.FC<MyListingsScreenProps> = ({ user, profile }) => {
    const navigate = useNavigate();
    const [myListings, setMyListings] = useState<AdoptionListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    const fetchMyListings = async () => {
        setLoading(true);
        setError('');
        try {
            // Find the user's personal shelter by email
            const { data: shelter, error: shelterError } = await supabase.from('shelters').select('id').eq('email', user.email!).limit(1).single();
            
            if (shelterError && shelterError.code !== 'PGRST116') throw shelterError;

            if (shelter) {
                // Fetch listings associated with that shelter
                const { data, error: listingsError } = await supabase.from('adoption_listings').select('*').eq('shelter_id', shelter.id);
                if (listingsError) throw listingsError;
                setMyListings(data || []);
            } else {
                setMyListings([]); // No shelter means no listings
            }
        } catch (err: any) {
            setError(`Failed to load listings: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyListings();
    }, [user]);

    const activeListingsCount = useMemo(() => {
        return myListings.filter(l => l.status === 'Available' || l.status === 'Pending Approval').length;
    }, [myListings]);
    
    const canListMorePets = activeListingsCount < 3;

    const getStatusChip = (status: AdoptionListing['status']) => {
        const styles = {
            'Available': 'bg-green-100 text-green-800',
            'Pending Approval': 'bg-yellow-100 text-yellow-800',
            'Adopted': 'bg-blue-100 text-blue-800',
            'Rejected': 'bg-red-100 text-red-800',
            'Pending': 'bg-gray-100 text-gray-800',
        };
        return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {showForm && <CreateAdoptionListingForm user={user} profile={profile} onSave={() => { setShowForm(false); fetchMyListings(); }} onCancel={() => setShowForm(false)} />}
            
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">My Adoption Listings</h1>
            </header>
            
            <main className="p-4 space-y-6">
                 <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <h3 className="font-bold text-blue-800">Rehoming a Pet</h3>
                    <p className="text-sm text-blue-700 mt-1">List up to 3 pets for adoption. All submissions are reviewed by our team to ensure safety and quality before going live. This process may take 24-48 hours.</p>
                </div>

                <button onClick={() => setShowForm(true)} disabled={!canListMorePets} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    <span>List a Pet for Adoption ({activeListingsCount}/3)</span>
                </button>
                {!canListMorePets && <p className="text-xs text-center text-gray-500 -mt-4">You have reached the maximum number of active listings.</p>}

                <section>
                    <h2 className="text-lg font-semibold mb-3">Your Listings</h2>
                     {loading && <p>Loading your listings...</p>}
                     {error && <p className="text-red-500">{error}</p>}
                     {!loading && myListings.length === 0 && (
                        <div className="text-center text-gray-500 py-10 bg-white rounded-lg">
                            <p className="font-semibold">No pets listed yet</p>
                            <p className="text-sm">Click the button above to find a new home for your pet.</p>
                        </div>
                     )}
                     {!loading && myListings.length > 0 && (
                         <div className="space-y-3">
                            {myListings.map(listing => (
                                <div key={listing.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-4">
                                    <img src={listing.photos[0]} alt={listing.name} className="w-16 h-16 rounded-md object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-bold text-gray-800">{listing.name}</p>
                                        <p className="text-sm text-gray-500">{listing.breed}</p>
                                        {getStatusChip(listing.status)}
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg></button>
                                </div>
                            ))}
                        </div>
                     )}
                </section>
            </main>
        </div>
    );
};

export default MyListingsScreen;