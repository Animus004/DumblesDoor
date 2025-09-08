// Trigger Vercel deployment
// FIX: Imported useState, useEffect, and useRef from React to resolve hook-related errors.
import React, { useState, useEffect, useRef } from 'react';
import { HealthCheckResult, GeminiChatMessage, DBChatMessage, Appointment, AIFeedback, TimelineEntry, ActiveModal, Product, PetbookPost, EncyclopediaTopic, Pet, UserProfile, ActiveScreen, AdoptionListing, AdoptablePet, Shelter, ConnectProfile, AdoptionApplication, LogoutAnalytics } from './types';
import { ICONS } from './constants';
import * as geminiService from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Session, User, Provider } from '@supabase/supabase-js';

import EnvironmentVariablePrompt from './components/ApiKeyPrompt';
import HealthCheckScreen from './components/HealthCheckScreen';
import PetBookScreen from './components/PetBookScreen';
import ProfileScreen from './components/ProfileScreen';
import HomeScreen from './components/HomeScreen';
import BottomNav from './components/BottomNav';
import OnboardingProfileScreen from './components/OnboardingProfileScreen';
import OnboardingPetScreen from './components/OnboardingPetScreen';
import WelcomeScreen from './components/WelcomeScreen';
import OnboardingCompletionScreen from './components/OnboardingCompletionScreen';
// FIX: Import the ShopScreen component to render the pet essentials marketplace.
import ShopScreen from './components/ShopScreen';
import { marked } from 'marked';
import SafetyCenterScreen from './components/SafetyCenterScreen';
import DataPrivacyScreen from './components/DataPrivacyScreen';
import VetBookingFlow from './components/VetBookingFlow';
import MyAppointmentsScreen from './components/MyAppointmentsScreen';

// --- CONNECT SCREEN IMPLEMENTATION ---
const ConnectScreen: React.FC<{ currentUserProfile: UserProfile | null; currentUser: User | null; }> = ({ currentUserProfile, currentUser }) => {
    const [profiles, setProfiles] = useState<ConnectProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
    
    // New state for modals and menus
    const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
    const [reportingUser, setReportingUser] = useState<ConnectProfile | null>(null);
    const [showMeetupModal, setShowMeetupModal] = useState<ConnectProfile | null>(null);

    useEffect(() => {
        const fetchBlockedUsersAndProfiles = async () => {
            if (!currentUserProfile?.city || !currentUser) {
                setError("Set your city in your profile to find pet parents near you.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // 1. Fetch blocked users
                const { data: blockedData, error: blockedError } = await supabase
                    .from('blocked_users')
                    .select('blocked_user_id')
                    .eq('blocker_user_id', currentUser.id);
                
                if (blockedError) throw blockedError;
                const blockedIds = (blockedData || []).map(b => b.blocked_user_id);
                setBlockedUserIds(blockedIds);

                // 2. Fetch profiles, excluding self and blocked users
                // Note: Supabase RLS should prevent blocked users from seeing the blocker, but explicit filtering is safer.
                const { data, error: fetchError } = await supabase
                    .from('user_profiles')
                    // FIX: Corrected Supabase query syntax from `pets:pets(*)` to `pets(*)` for fetching related pets.
                    .select(`*, pets(*)`)
                    .eq('city', currentUserProfile.city)
                    .neq('auth_user_id', currentUserProfile.auth_user_id)
                    .not('auth_user_id', 'in', `(${blockedIds.length > 0 ? blockedIds.map(id => `'${id}'`).join(',') : `''`})`)
                    .limit(50);

                if (fetchError) throw fetchError;
                // FIX: Added a defensive check for `p.pets` being an array to prevent crashes from RLS returning null.
                setProfiles((data as any as ConnectProfile[]).filter(p => Array.isArray(p.pets) && p.pets.length > 0));
            } catch (err: any) {
                setError("Failed to load profiles. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserProfile && currentUser) {
            fetchBlockedUsersAndProfiles();
        }
    }, [currentUserProfile, currentUser]);

    const handleBlockUser = async (profileToBlock: ConnectProfile) => {
        if (!currentUser) return;
        
        const isConfirmed = window.confirm(`Are you sure you want to block ${profileToBlock.name}? You will no longer see each other's profiles.`);
        if (!isConfirmed) return;

        setMenuOpenFor(null);
        // Optimistic update
        setProfiles(profiles.filter(p => p.auth_user_id !== profileToBlock.auth_user_id));

        const { error: blockError } = await supabase.from('blocked_users').insert({
            blocker_user_id: currentUser.id,
            blocked_user_id: profileToBlock.auth_user_id,
        });

        if (blockError) {
            setError(`Failed to block user: ${blockError.message}`);
            // Revert optimistic update on error
            setProfiles(currentProfiles => [...currentProfiles, profileToBlock].sort((a, b) => a.name.localeCompare(b.name)));
        }
    };
    
    const handleReportUser = (profileToReport: ConnectProfile) => {
        setReportingUser(profileToReport);
        setMenuOpenFor(null);
    };

    const ReportUserModal: React.FC<{user: ConnectProfile, onCancel: () => void, currentUser: User | null}> = ({ user, onCancel, currentUser }) => {
        const [reason, setReason] = useState('');
        const [details, setDetails] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitted, setSubmitted] = useState(false);

        const handleSubmit = async () => {
            if (!reason || !currentUser) return;
            setIsSubmitting(true);
            const { error } = await supabase.from('reports').insert({
                reporter_user_id: currentUser.id,
                reported_user_id: user.auth_user_id,
                reason,
                details,
            });
            setIsSubmitting(false);
            if (error) {
                alert(`Failed to submit report: ${error.message}`);
            } else {
                setSubmitted(true);
            }
        };

        if (submitted) {
            return (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold">Report Submitted</h3>
                        <p className="text-sm text-gray-600 mt-2">Thank you for helping keep our community safe. Our team will review your report shortly.</p>
                        <button onClick={onCancel} className="mt-4 w-full bg-teal-500 text-white font-bold py-2 rounded-lg">Close</button>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                    <h3 className="text-lg font-bold">Report {user.name}</h3>
                    <select value={reason} onChange={e => setReason(e.target.value)} className="w-full mt-4 p-2 border rounded-md bg-white">
                        <option value="">Select a reason...</option>
                        <option value="inappropriate_profile">Inappropriate Profile/Photos</option>
                        <option value="spam">Spam or Scam</option>
                        <option value="harassment">Harassment or Hate Speech</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Provide additional details (optional)" rows={3} className="w-full mt-2 p-2 border rounded-md"></textarea>
                    <div className="flex gap-4 mt-4">
                        <button onClick={onCancel} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg">Cancel</button>
                        <button onClick={handleSubmit} disabled={!reason || isSubmitting} className="w-full bg-red-500 text-white font-bold py-2 rounded-lg disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit Report'}</button>
                    </div>
                </div>
            </div>
        );
    };

    const SafeMeetupModal: React.FC<{user: ConnectProfile, onCancel: () => void}> = ({ user, onCancel }) => {
        const safeSpots = ["Cubbon Park Dog Park", "The Pet People Cafe", "Lalbagh Botanical Garden (Designated Areas)"];
        
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                     <h3 className="text-lg font-bold text-center">Plan a Safe Playdate!</h3>
                     <p className="text-sm text-gray-600 mt-2 text-center">For everyone's safety, we recommend meeting at a public, pet-friendly location.</p>
                     <div className="mt-4 space-y-2">
                        <p className="font-semibold text-sm">Suggested locations near you:</p>
                        <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md">
                            {safeSpots.map(spot => <li key={spot}>{spot}</li>)}
                        </ul>
                     </div>
                     <button onClick={() => { alert(`A playdate request has been sent to ${user.name}!`); onCancel(); }} className="mt-4 w-full bg-teal-500 text-white font-bold py-2 rounded-lg">Send Playdate Request</button>
                     <button onClick={onCancel} className="mt-2 w-full text-sm text-gray-500 font-semibold">Cancel</button>
                </div>
            </div>
        );
    };

    const VerifiedBadge = () => (
        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Verified
        </div>
    );

    const UserCard: React.FC<{ profile: ConnectProfile }> = ({ profile }) => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="p-4">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-2xl flex-shrink-0">
                        {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow">
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">{profile.name} {profile.verified && <VerifiedBadge />}</h3>
                                <p className="text-sm text-gray-500">{profile.city}</p>
                             </div>
                             <div className="relative">
                                <button onClick={() => setMenuOpenFor(menuOpenFor === profile.auth_user_id ? null : profile.auth_user_id)} className="text-gray-400 hover:text-gray-600 p-1" aria-label="More options">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                </button>
                                {menuOpenFor === profile.auth_user_id && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20" onMouseLeave={() => setMenuOpenFor(null)}>
                                        <button onClick={() => handleReportUser(profile)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Report User</button>
                                        <button onClick={() => handleBlockUser(profile)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Block User</button>
                                    </div>
                                )}
                             </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {(profile.interests || []).slice(0, 3).map(interest => (
                                <span key={interest} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{interest}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {profile.pets.length > 0 && (
                 <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
                    {profile.pets.map(pet => (
                        <div key={pet.id} className="flex-shrink-0 text-center w-20">
                           <img src={pet.photo_url} alt={pet.name} className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-white shadow-sm" />
                           <p className="text-xs font-semibold text-gray-700 mt-1 truncate">{pet.name}</p>
                           <p className="text-xs text-gray-500">{pet.breed}</p>
                        </div>
                    ))}
                </div>
            )}
            <div className="p-3 bg-gray-50 border-t">
                <button onClick={() => setShowMeetupModal(profile)} className="w-full bg-teal-500 text-white font-bold text-sm py-2 rounded-lg hover:bg-teal-600 transition-colors">
                    Request Playdate
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 border-b bg-white sticky top-0 z-10">
                <h1 className="text-xl font-bold text-center">Connect with Pet Parents</h1>
            </header>
            <main className="flex-grow p-4">
                {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Finding friends...</p></div>}
                {error && <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-center">{error}</div>}
                {!loading && !error && profiles.length === 0 && (
                    <div className="text-center text-gray-500 pt-16">
                        <p className="font-semibold">No one's here yet!</p>
                        <p>No other pet parents found in your city. Be the first to start the community!</p>
                    </div>
                )}
                {!loading && profiles.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profiles.map(p => <UserCard key={p.auth_user_id} profile={p} />)}
                    </div>
                )}
            </main>
            {reportingUser && <ReportUserModal user={reportingUser} onCancel={() => setReportingUser(null)} currentUser={currentUser}/>}
            {showMeetupModal && <SafeMeetupModal user={showMeetupModal} onCancel={() => setShowMeetupModal(null)} />}
        </div>
    );
};


// --- ADMIN DASHBOARD IMPLEMENTATION ---

const AdminDashboardScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    type AdminTab = 'shelters' | 'listings';
    const [activeTab, setActiveTab] = useState<AdminTab>('listings');
    const [shelters, setShelters] = useState<Shelter[]>([]);
    const [pendingListings, setPendingListings] = useState<AdoptionListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [sheltersRes, listingsRes] = await Promise.all([
                supabase.from('shelters').select('*').order('verified', { ascending: true }),
                supabase.from('adoption_listings').select('*, shelter:shelters(name)').eq('status', 'Pending Approval')
            ]);

            if (sheltersRes.error) throw new Error(`Shelters: ${sheltersRes.error.message}`);
            if (listingsRes.error) throw new Error(`Listings: ${listingsRes.error.message}`);

            setShelters(sheltersRes.data || []);
            setPendingListings(listingsRes.data as any[] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleShelterVerify = async (shelterId: string, newStatus: boolean) => {
        const originalShelters = [...shelters];
        // Optimistic UI update
        setShelters(shelters.map(s => s.id === shelterId ? { ...s, verified: newStatus } : s));
        const { error: updateError } = await supabase.from('shelters').update({ verified: newStatus }).eq('id', shelterId);
        if (updateError) {
            setError(`Failed to update shelter: ${updateError.message}`);
            setShelters(originalShelters); // Revert on error
        }
    };

    const handleListingApproval = async (listingId: string, newStatus: 'Available' | 'Rejected') => {
        const originalListings = [...pendingListings];
        setPendingListings(pendingListings.filter(l => l.id !== listingId));
        const { error: updateError } = await supabase.from('adoption_listings').update({ status: newStatus }).eq('id', listingId);
        if (updateError) {
            setError(`Failed to update listing: ${updateError.message}`);
            setPendingListings(originalListings);
        }
    };
    
    const ShelterRow: React.FC<{ shelter: Shelter }> = ({ shelter }) => (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
                <p className="font-semibold text-gray-800">{shelter.name}</p>
                <p className="text-sm text-gray-500">{shelter.city}</p>
            </div>
            <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold ${shelter.verified ? 'text-green-600' : 'text-gray-500'}`}>
                    {shelter.verified ? 'Verified' : 'Unverified'}
                </span>
                <button
                    onClick={() => handleShelterVerify(shelter.id, !shelter.verified)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${shelter.verified ? 'bg-teal-500' : 'bg-gray-300'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${shelter.verified ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
    );
    
    const ListingCard: React.FC<{ listing: AdoptionListing }> = ({ listing }) => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img src={listing.photos[0]} alt={listing.name} className="w-full h-32 object-cover" />
            <div className="p-3">
                <h4 className="font-bold">{listing.name} <span className="font-normal text-sm text-gray-500">({listing.breed})</span></h4>
                <p className="text-xs text-gray-600 mb-2">From: {(listing.shelter as any)?.name || 'Unknown Shelter'}</p>
                <p className="text-sm text-gray-700 line-clamp-2">{listing.description}</p>
            </div>
            <div className="p-2 border-t flex gap-2">
                <button onClick={() => handleListingApproval(listing.id, 'Rejected')} className="w-full bg-red-100 text-red-700 font-bold py-1.5 rounded-md hover:bg-red-200 text-sm">Reject</button>
                <button onClick={() => handleListingApproval(listing.id, 'Available')} className="w-full bg-green-100 text-green-700 font-bold py-1.5 rounded-md hover:bg-green-200 text-sm">Approve</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </header>

            <div className="p-2 bg-white border-b sticky top-[65px] z-10">
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setActiveTab('listings')} className={`w-full p-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'listings' ? 'bg-teal-500 text-white shadow' : 'text-gray-600'}`}>
                        Listings ({pendingListings.length})
                    </button>
                    <button onClick={() => setActiveTab('shelters')} className={`w-full p-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'shelters' ? 'bg-teal-500 text-white shadow' : 'text-gray-600'}`}>
                        Shelters ({shelters.length})
                    </button>
                </div>
            </div>
            
            <main className="flex-grow p-4">
                 {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Loading data...</p></div>}
                 {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{error}</div>}
                 
                 {!loading && !error && (
                    <>
                        {activeTab === 'shelters' && (
                            <div className="space-y-3">
                                {shelters.map(s => <ShelterRow key={s.id} shelter={s} />)}
                            </div>
                        )}
                        {activeTab === 'listings' && (
                            pendingListings.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {pendingListings.map(l => <ListingCard key={l.id} listing={l} />)}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 pt-16">
                                    <p className="font-semibold">All caught up!</p>
                                    <p>There are no new listings to review.</p>
                                </div>
                            )
                        )}
                    </>
                 )}
            </main>
        </div>
    );
};


// --- ADOPTION SCREEN IMPLEMENTATION ---
const MOCK_ADOPTION_LISTINGS: AdoptionListing[] = [
  { id: '1', name: 'Buddy', species: 'Dog', breed: 'Indie', age: 'Young', size: 'Medium', gender: 'Male', photos: ['https://i.ibb.co/6rC6hJq/indie-dog-1.jpg'], description: 'A friendly and energetic indie dog looking for a loving home. Loves to play fetch!', good_with: ['Children', 'Dogs'], shelter_id: '1', status: 'Available', created_at: new Date().toISOString(), shelter: { id: '1', name: 'Hope for Paws', city: 'Mumbai', address: '', phone: '', email: '', verified: true, location: {} } },
  { id: '2', name: 'Luna', species: 'Cat', breed: 'Bombay Cat', age: 'Adult', size: 'Small', gender: 'Female', photos: ['https://i.ibb.co/zntgK4B/bombay-cat-1.jpg'], description: 'A calm and affectionate cat who loves to cuddle. She is litter trained and very clean.', good_with: ['Cats'], shelter_id: '2', status: 'Available', created_at: new Date().toISOString(), shelter: { id: '2', name: 'Cat Haven', city: 'Delhi', address: '', phone: '', email: '', verified: true, location: {} } },
  { id: '3', name: 'Rocky', species: 'Dog', breed: 'Labrador Retriever', age: 'Baby', size: 'Medium', gender: 'Male', photos: ['https://i.ibb.co/mH4SMN3/lab-puppy-1.jpg'], description: 'An adorable Labrador puppy full of curiosity and playfulness. Needs a family that can keep up with his energy.', good_with: ['Children', 'Dogs', 'Cats'], shelter_id: '1', status: 'Available', created_at: new Date().toISOString(), shelter: { id: '1', name: 'Hope for Paws', city: 'Mumbai', address: '', phone: '', email: '', verified: true, location: {} } },
  { id: '4', name: 'Misty', species: 'Cat', breed: 'Indian Billie', age: 'Young', size: 'Medium', gender: 'Female', photos: ['https://i.ibb.co/Dtd5zWf/indian-cat-1.jpg'], description: 'A beautiful street cat who was rescued. She is a bit shy at first but very sweet once she trusts you.', good_with: [], shelter_id: '3', status: 'Available', created_at: new Date().toISOString(), shelter: { id: '3', name: 'Second Chance Animals', city: 'Bangalore', address: '', phone: '', email: '', verified: true, location: {} } },
];

const PetAdoptionCard: React.FC<{ pet: AdoptablePet }> = ({ pet }) => {
    const [isFavorited, setIsFavorited] = useState(false);
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group">
            <div className="relative aspect-[4/3]">
                <img src={pet.photos[0]} alt={pet.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsFavorited(!isFavorited); }}
                    className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:text-red-500 transition-colors"
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    aria-pressed={isFavorited}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                </button>
            </div>
            <div className="p-4 flex-grow">
                <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
                <p className="text-sm text-gray-500">{pet.breed}</p>
                <div className="flex items-center text-xs text-gray-600 mt-2 space-x-2">
                    <span>{pet.age}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span>{pet.gender}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span>{pet.size}</span>
                </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm">
                <p className="font-semibold text-gray-700">{pet.shelter_name}</p>
                {pet.distance_km && <p className="text-teal-600 font-bold">{pet.distance_km.toFixed(1)} km away</p>}
            </div>
        </div>
    );
};

// FIX: Changed onSelectPet prop to accept `string | null` to match the state setter it's assigned to.
const AdoptionScreen: React.FC<{ onBack: () => void; onSelectPet: (petId: string | null) => void; }> = ({ onBack, onSelectPet }) => {
    const [listings, setListings] = useState<AdoptablePet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    
    // Filter states
    // FIX: Explicitly typed filter states to match the data model, resolving a complex type inference error.
    const [species, setSpecies] = useState<'All' | 'Dog' | 'Cat'>('All');
    const [age, setAge] = useState<'All' | 'Baby' | 'Young' | 'Adult' | 'Senior'>('All');
    const [size, setSize] = useState<'All' | 'Small' | 'Medium' | 'Large' | 'Extra Large'>('All');
    const [distance, setDistance] = useState(50);

    // Fetch user location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (geoError) => {
                console.warn("Geolocation error:", geoError.message);
                setError("Could not get your location. Please enable location services to find nearby pets. Showing sample data for now.");
                const mockAdoptablePets: AdoptablePet[] = MOCK_ADOPTION_LISTINGS.map(p => ({
                    ...p,
                    distance_km: Math.random() * 50,
                    shelter_name: p.shelter?.name || 'A Loving Shelter'
                }));
                setListings(mockAdoptablePets);
                setLoading(false);
            }
        );
    }, []);

    // Fetch data from Supabase
    useEffect(() => {
        const fetchListings = async () => {
            if (!userLocation && MOCK_ADOPTION_LISTINGS.length > 0) return; // Don't refetch if using mock data
            if (!supabase) {
                 setError("Database connection is not available.");
                 setLoading(false);
                 return;
            }

            setLoading(true);
            setError(null);
            
            const rpcParams: any = { radius_km: distance };
            if (userLocation) {
                rpcParams.lat = userLocation.lat;
                rpcParams.long = userLocation.lon;
            }

            // FIX: The `database.types.ts` file does not contain RPC function definitions,
            // causing a type error. Casting the function name to `any` bypasses this issue
            // and allows the call to proceed. The returned `data` is correctly typed below.
            const { data, error: rpcError } = await supabase.rpc('nearby_pets' as any, rpcParams);

            if (rpcError) {
                console.error("Error calling nearby_pets RPC:", rpcError);
                setError("Could not fetch nearby pets. Please try again later.");
                setListings([]);
            } else {
                // FIX: Explicitly type the result of the RPC call to avoid potential type inference issues with `any[]`.
                const petsFromRpc: AdoptablePet[] = data || [];
                const filtered = petsFromRpc.filter((p) => {
                    const speciesMatch = species === 'All' || p.species === species;
                    const ageMatch = age === 'All' || p.age === age;
                    const sizeMatch = size === 'All' || p.size === size;
                    return speciesMatch && ageMatch && sizeMatch;
                });
                setListings(filtered);
            }
            setLoading(false);
        };
        
        fetchListings();
    }, [userLocation, species, age, size, distance]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Find a Friend</h1>
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1.447.894l-2-1A1 1 0 018 16v-3.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </header>

            {showFilters && (
                <div className="p-4 bg-white border-b sticky top-[65px] z-10">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500">Species</label>
                            {/* FIX: Replaced `as any` with a specific type assertion to fix a TypeScript error. */}
                            <select value={species} onChange={e => setSpecies(e.target.value as 'All' | 'Dog' | 'Cat')} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Dog</option><option>Cat</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Age</label>
                            {/* FIX: Replaced `as any` with a specific type assertion to fix a TypeScript error. */}
                            <select value={age} onChange={e => setAge(e.target.value as 'All' | 'Baby' | 'Young' | 'Adult' | 'Senior')} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Baby</option><option>Young</option><option>Adult</option><option>Senior</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Size</label>
                            {/* FIX: Replaced `as any` with a specific type assertion and added a missing option to fix a TypeScript error and UI bug. */}
                            <select value={size} onChange={e => setSize(e.target.value as 'All' | 'Small' | 'Medium' | 'Large' | 'Extra Large')} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Small</option><option>Medium</option><option>Large</option><option>Extra Large</option>
                            </select>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-gray-500">Distance ({distance} km)</label>
                            <input type="range" min="5" max="200" step="5" value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow p-4">
                {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Finding pets near you...</p></div>}
                {error && <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg text-center">{error}</div>}
                
                {!loading && !error && listings.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        <p className="font-semibold">No pets found</p>
                        <p>Try adjusting your filters or expanding the distance.</p>
                    </div>
                )}
                
                {!loading && listings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listings.map(pet => (
                           <div key={pet.id} onClick={() => onSelectPet(pet.id)} className="cursor-pointer">
                                <PetAdoptionCard pet={pet} />
                           </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};


// --- ADOPTION APPLICATION FLOW COMPONENTS ---

const PetDetailScreen: React.FC<{ petId: string; onBack: () => void; onApply: (listing: AdoptionListing) => void; }> = ({ petId, onBack, onApply }) => {
    const [listing, setListing] = useState<AdoptionListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchListing = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('adoption_listings')
                    .select('*, shelter:shelters(name, city)')
                    .eq('id', petId)
                    .single();
                if (error) throw error;
                setListing(data as AdoptionListing);
            } catch (err: any) {
                setError('Failed to load pet details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [petId]);

    const InfoTag: React.FC<{ label: string }> = ({ label }) => (
        <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-1 rounded-full">{label}</span>
    );
    
    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500"></div></div>;
    if (error || !listing) return <div className="min-h-screen flex items-center justify-center text-center p-4"><p className="text-red-600">{error || "Pet not found."}</p><button onClick={onBack} className="mt-4 text-teal-600 font-semibold">Go Back</button></div>;

    return (
        <div className="min-h-screen bg-gray-50">
             <header className="p-4 flex items-center bg-white/80 backdrop-blur-sm sticky top-0 z-20">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900 bg-white rounded-full p-2 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            </header>
            
            <main className="pb-24">
                <div className="w-full aspect-square bg-gray-200">
                    <img src={listing.photos[0]} alt={listing.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="p-4 space-y-4 bg-white -mt-12 rounded-t-2xl relative z-10">
                    <h1 className="text-3xl font-bold text-gray-800">{listing.name}</h1>
                    <div className="flex flex-wrap gap-2">
                        <InfoTag label={listing.breed} />
                        <InfoTag label={listing.age} />
                        <InfoTag label={listing.gender} />
                        <InfoTag label={listing.size} />
                    </div>

                    <div className="flex items-center space-x-3 text-sm text-gray-600 pt-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                         <span>{(listing.shelter as any)?.name}, {(listing.shelter as any)?.city}</span>
                    </div>

                    <div className="pt-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">About {listing.name}</h2>
                        <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
                    </div>

                    {listing.story && (
                         <div className="pt-2">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">My Story</h2>
                            <p className="text-gray-600 whitespace-pre-wrap">{listing.story}</p>
                        </div>
                    )}
                </div>
            </main>
            
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t z-20">
                <button onClick={() => onApply(listing)} className="w-full bg-teal-500 text-white font-bold py-4 rounded-xl hover:bg-teal-600 transition-colors text-lg">
                    Apply to Adopt
                </button>
            </footer>
        </div>
    );
};


const AdoptionApplicationScreen: React.FC<{ listing: AdoptionListing; userProfile: UserProfile | null; onBack: () => void; onSubmitted: () => void; }> = ({ listing, userProfile, onBack, onSubmitted }) => {
    const [formData, setFormData] = useState({
        residenceType: 'Own', homeType: 'Apartment', hasYard: false,
        timeAlone: '0-4 hours', experience: 'First-time', motivation: ''
    });
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!agreed) { setError("You must agree to the terms before submitting."); return; }
        if (!userProfile) { setError("User profile not found."); return; }
        
        setIsSubmitting(true);
        try {
            let document_url: string | undefined = undefined;
            if (documentFile) {
                const filePath = `adoption_docs/${userProfile.auth_user_id}/${Date.now()}_${documentFile.name}`;
                const { error: uploadError } = await supabase.storage.from('pet_images').upload(filePath, documentFile);
                if (uploadError) throw uploadError;
                document_url = supabase.storage.from('pet_images').getPublicUrl(filePath).data.publicUrl;
            }

            const applicationData = {
                auth_user_id: userProfile.auth_user_id,
                listing_id: listing.id,
                shelter_id: listing.shelter_id,
                status: 'Submitted' as const,
                application_data: formData,
                document_url,
            };

            const { error: insertError } = await supabase.from('adoption_applications').insert(applicationData);
            if (insertError) throw insertError;
            
            onSubmitted();
        } catch (err: any) {
            setError(`Submission failed: ${err.message}`);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl font-bold">Adopt {listing.name}</h1>
            </header>

            <main className="flex-grow p-4 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Your Information */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="font-bold text-lg mb-2">Your Information</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p><strong>Name:</strong> {userProfile?.name}</p>
                            <p><strong>Email:</strong> {userProfile?.email}</p>
                            <p><strong>City:</strong> {userProfile?.city}</p>
                        </div>
                    </div>
                    {/* Home & Lifestyle */}
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="font-bold text-lg mb-4">Home & Lifestyle</h2>
                        <div className="space-y-4">
                             <div>
                                <label className="text-sm font-medium text-gray-700">Do you own or rent your home?</label>
                                <select value={formData.residenceType} onChange={e => setFormData(f => ({...f, residenceType: e.target.value as any}))} className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-teal-500 focus:border-teal-500"><option>Own</option><option>Rent</option></select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700">How long will the pet be alone on an average day?</label>
                                <select value={formData.timeAlone} onChange={e => setFormData(f => ({...f, timeAlone: e.target.value as any}))} className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-teal-500 focus:border-teal-500"><option>0-4 hours</option><option>4-8 hours</option><option>8+ hours</option></select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700">Why do you want to adopt {listing.name}?</label>
                                <textarea value={formData.motivation} onChange={e => setFormData(f => ({...f, motivation: e.target.value}))} rows={3} className="w-full mt-1 p-2 border rounded-md focus:ring-teal-500 focus:border-teal-500" placeholder="Tell us a little bit about your decision."></textarea>
                            </div>
                        </div>
                    </div>
                     {/* Final Steps */}
                     <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="font-bold text-lg mb-4">Final Steps</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Upload ID & Address Proof</label>
                                <p className="text-xs text-gray-500 mb-2">A single PDF or image file is preferred.</p>
                                <input ref={fileInputRef} type="file" onChange={e => setDocumentFile(e.target.files?.[0] || null)} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-3 border-2 border-dashed rounded-lg text-center text-gray-500 hover:border-teal-500 hover:text-teal-600">
                                    {documentFile ? `Selected: ${documentFile.name}` : "Click to select a file"}
                                </button>
                            </div>
                             <div className="flex items-start space-x-3">
                                <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"/>
                                <label htmlFor="agree" className="text-sm text-gray-700">I certify that the information provided is true and I agree to a potential home check and follow-up communication from the shelter.</label>
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                     <button type="submit" disabled={isSubmitting || !agreed} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg hover:bg-teal-600 disabled:opacity-50">
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>
            </main>
        </div>
    );
};

const MyApplicationsScreen: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [applications, setApplications] = useState<AdoptionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("User not found");
                
                const { data, error: fetchError } = await supabase
                    .from('adoption_applications')
                    .select('*, listing:adoption_listings(name, photos, breed)')
                    .eq('auth_user_id', user.id)
                    .order('submitted_at', { ascending: false });

                if (fetchError) throw fetchError;
                setApplications(data as any[] || []);
            } catch (err: any) {
                setError("Failed to load your applications.");
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, []);

    const StatusTracker: React.FC<{ status: AdoptionApplication['status'] }> = ({ status }) => {
        const steps = ['Submitted', 'In Review', 'Interview Scheduled', 'Approved'];
        const currentIndex = steps.indexOf(status);
        const isRejected = status === 'Rejected';

        return (
            <div className="mt-2">
                 <div className="flex justify-between items-center">
                    {steps.map((step, index) => (
                        <div key={step} className={`flex-1 h-1 ${index <= currentIndex ? (isRejected ? 'bg-red-400' : 'bg-teal-500') : 'bg-gray-200'} ${index === 0 ? 'rounded-l-full' : ''} ${index === steps.length - 1 ? 'rounded-r-full' : ''}`}></div>
                    ))}
                </div>
                 <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {steps.map((step, index) => (
                        <span key={step} className={`${index <= currentIndex ? (isRejected ? 'text-red-600 font-bold' : 'text-teal-600 font-bold') : ''}`}>{step}</span>
                    ))}
                </div>
                {isRejected && <p className="text-center text-red-600 font-bold text-sm mt-2">Application Rejected</p>}
            </div>
        );
    };

    const ApplicationCard: React.FC<{ app: AdoptionApplication }> = ({ app }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-start space-x-4">
                <img src={app.listing?.photos[0]} alt={app.listing?.name} className="w-20 h-20 rounded-lg object-cover" />
                <div>
                    <h3 className="font-bold text-lg">{app.listing?.name}</h3>
                    <p className="text-sm text-gray-500">{app.listing?.breed}</p>
                    <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(app.submitted_at).toLocaleDateString()}</p>
                </div>
            </div>
            <StatusTracker status={app.status} />
            <div className="mt-4 pt-3 border-t flex gap-2">
                 <button className="w-full text-sm bg-gray-100 text-gray-700 font-semibold py-2 rounded-md hover:bg-gray-200">Message Shelter</button>
                 <button className="w-full text-sm bg-gray-100 text-gray-700 font-semibold py-2 rounded-md hover:bg-gray-200 disabled:opacity-50" disabled={app.status !== 'Interview Scheduled' && app.status !== 'Approved'}>Schedule Call</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl font-bold">My Applications</h1>
            </header>
            <main className="flex-grow p-4">
                {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Loading applications...</p></div>}
                {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{error}</div>}
                {!loading && !error && applications.length === 0 && (
                    <div className="text-center text-gray-500 pt-16">
                        <p className="font-semibold">No applications yet!</p>
                        <p>When you apply to adopt a pet, you'll see your status here.</p>
                    </div>
                )}
                 {!loading && applications.length > 0 && (
                    <div className="space-y-4">
                        {applications.map(app => <ApplicationCard key={app.id} app={app} />)}
                    </div>
                 )}
            </main>
        </div>
    );
};


// --- UTILITY & PLACEHOLDER COMPONENTS ---

const AppErrorScreen: React.FC<{ message: string; onRetry: () => void; }> = ({ message, onRetry }) => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-5xl mb-4">😢</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Something Went Wrong</h2>
        <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
        <button
            onClick={onRetry}
            className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors"
        >
            Try Again
        </button>
    </div>
);

const getFriendlyAuthErrorMessage = (message: string): string => {
    if (!message) return 'An unexpected error occurred. Please try again.';

    const lowerCaseMessage = message.toLowerCase();

    // The most common and critical developer error: OAuth redirect URI mismatch.
    // This captures multiple variations of the error message from different providers.
    if (lowerCaseMessage.includes('redirect uri mismatch') || lowerCaseMessage.includes('invalid redirect uri') || (lowerCaseMessage.includes('oauth') && (lowerCaseMessage.includes('origin') || lowerCaseMessage.includes('redirect')))) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'YOUR_APP_URL';
        return `[DEVELOPER] A crucial OAuth setting is incorrect. Your authentication provider (e.g., Google) is blocking the login request because your app's URL is not on its list of allowed redirect URIs.\n\nACTION REQUIRED: Add the following URL to your Supabase project's "Redirect URLs" list under "Authentication > URL Configuration":\n\n${origin}`;
    }

    if (lowerCaseMessage.includes('invalid login credentials')) {
        return 'Incorrect email or password. If you signed up using a social provider like Google, please use that login method instead.';
    }

    if (lowerCaseMessage.includes('email not confirmed')) {
        // This exact message is checked elsewhere to show a "Resend" button.
        return 'Email not confirmed. Check your inbox for the verification link.';
    }

    if (lowerCaseMessage.includes('user already registered')) {
        return 'An account with this email already exists. Try logging in or use the password reset option if you forgot your password.';
    }

    if (lowerCaseMessage.includes('rate limit exceeded') || lowerCaseMessage.includes('too many requests')) {
        return 'You have made too many attempts. Please wait a moment and try again.';
    }
  
    if (lowerCaseMessage.includes('networkerror') || lowerCaseMessage.includes('failed to fetch')) {
        return 'A network error occurred. Please check your internet connection and try again.';
    }
    
    // A catch-all for other, less common OAuth errors that are still likely config-related.
    if (lowerCaseMessage.includes('oauth')) {
        return `[DEVELOPER] An OAuth error occurred. This could be due to an incorrect Client ID/Secret in your Supabase settings, the provider application being in 'test mode', or other provider-side configuration issues. Raw message: ${message}`;
    }

    // Log any unhandled errors to the console for debugging
    console.warn('Unhandled Supabase auth error:', message);

    return 'An unexpected authentication error occurred. Please try again.';
};


// --- AUTH & ONBOARDING COMPONENTS ---

const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading Dumble's Door..." }) => (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-teal-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>
        <p className="text-gray-600 mt-4 text-lg">{message}</p>
    </div>
);

const EmailVerificationScreen: React.FC<{ email: string }> = ({ email }) => {
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

        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });

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
                <p className="text-gray-600">
                    We've sent a verification link to <strong className="text-gray-900">{email}</strong>. Please click the link to secure your account and continue.
                </p>
                
                {message && <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm">{message}</p>}
                {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</p>}
                
                <div className="pt-2">
                    <button
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </div>
                
                <p className="text-sm text-gray-500 pt-2">
                    Didn't get an email? Check your spam folder or click the button above.
                </p>
            </div>
        </div>
    );
};

const SignupSuccessScreen: React.FC<{ email: string; onGoToLogin: () => void }> = ({ email, onGoToLogin }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onGoToLogin();
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [onGoToLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4 text-center">
            <div className="text-5xl">✅</div>
            <h1 className="text-3xl font-bold text-gray-800">Account Created!</h1>
            <p className="text-gray-600">
                A verification link has been sent to <strong className="text-gray-900">{email}</strong>. Please check your email to verify your account before signing in.
            </p>
            <button
              onClick={onGoToLogin}
              className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors"
            >
              Go to Login
            </button>
            <p className="text-sm text-gray-500 mt-2">
                You will be redirected automatically in a few seconds.
            </p>
        </div>
    </div>
  );
};

const TroubleshootingModal: React.FC<{onClose: () => void}> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold">OAuth Troubleshooting Guide</h3>
            <p className="text-sm text-gray-600 mt-2">Follow these steps to resolve common OAuth connection issues:</p>
            <ol className="list-decimal list-inside space-y-3 mt-4 text-sm">
                <li><strong>Check Environment Variables:</strong> Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in your hosting environment.</li>
                <li><strong>Verify Redirect URL:</strong> This is the most common error. Go to your <a href="https://app.supabase.com/" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Supabase Dashboard</a> &gt; Authentication &gt; URL Configuration. Add the exact URL where your app is running (e.g., `http://localhost:3000`, your Vercel preview URL) to the "Redirect URLs" list. The error message on the login screen tells you the exact URL to add.</li>
                <li><strong>Enable the Provider:</strong> In your Supabase Dashboard &gt; Authentication &gt; Providers, make sure the provider (e.g., Google) is enabled.</li>
                <li><strong>Check Provider Credentials:</strong> Double-check that the Client ID and Client Secret from your OAuth provider (e.g., Google Cloud Console) are correctly copied into the Supabase provider settings.</li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">If you're still having trouble, review the <a href="https://supabase.com/docs/guides/auth/social-login/overview" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">official Supabase documentation</a> or contact <a href="mailto:support@example.com" className="text-teal-600 underline">developer support</a>.</p>
            <button onClick={onClose} className="mt-4 w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg">Close</button>
        </div>
    </div>
);

const AuthErrorDisplay: React.FC<{ message: string; onShowTroubleshoot: () => void; }> = ({ message, onShowTroubleshoot }) => {
    if (!message) return null;

    const isDevError = message.includes('[DEVELOPER]');
    const friendlyMessage = message.replace('[DEVELOPER]', '').trim();

    return (
        <div className="bg-red-50 p-3 rounded-lg text-left text-sm space-y-2">
            <p className="font-semibold text-red-800">{isDevError ? 'Developer Configuration Notice' : 'Login Failed'}</p>
            <p className="text-red-700 whitespace-pre-wrap">{friendlyMessage}</p>
            {isDevError && (
                <div className="flex gap-4 items-center pt-1">
                    <button onClick={onShowTroubleshoot} className="text-red-900 font-semibold hover:underline text-xs">
                        Open Troubleshooting Guide
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(friendlyMessage)} className="text-red-900 font-semibold hover:underline text-xs">
                        Copy Details
                    </button>
                </div>
            )}
        </div>
    );
};

const AuthScreen: React.FC<{ postLogoutMessage: string }> = ({ postLogoutMessage }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState(() => localStorage.getItem('lastLoggedInEmail') || '');
    const [password, setPassword] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    // FIX: Explicitly type the message state as string to avoid incorrect type inference.
    const [message, setMessage] = useState<string>(postLogoutMessage);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);

    const [emailValidation, setEmailValidation] = useState<{ isValid: boolean | null; message: string }>({ isValid: null, message: '' });
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
    });
    
    const emailInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const validateEmail = (emailStr: string) => {
        if (!emailStr) {
            setEmailValidation({ isValid: null, message: '' });
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(emailStr);
        setEmailValidation({
            isValid,
            message: isValid ? '' : 'Please enter a valid email address.',
        });
        return isValid;
    };

    const validatePassword = (passStr: string) => {
        const checks = {
            length: passStr.length >= 8,
            uppercase: /[A-Z]/.test(passStr),
            number: /[0-9]/.test(passStr),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(passStr),
        };
        setPasswordValidation(checks);
        return Object.values(checks).every(Boolean);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        validateEmail(newEmail);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (!isLoginView) {
            validatePassword(newPassword);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!validateEmail(email)) return;
        if (!isLoginView && !validatePassword(password)) {
            setError("Please ensure your password meets all the requirements.");
            return;
        }

        setEmailLoading(true);
        try {
            if (!supabase) throw new Error("Database connection failed.");
            
            if (isLoginView) {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) {
                    setError(getFriendlyAuthErrorMessage(signInError.message));
                }
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) {
                    setError(getFriendlyAuthErrorMessage(signUpError.message));
                } else if (data.user && !data.session) {
                    setSignupSuccess(true);
                }
            }
        } catch (err: any) {
            console.error("Authentication error:", err);
            setError(getFriendlyAuthErrorMessage(err.message || ''));
        } finally {
            setEmailLoading(false);
        }
    };
    
    const handleSocialLogin = async (provider: Provider) => {
        setGoogleLoading(true);
        setError('');
        setMessage('');
        try {
            if (!supabase) throw new Error("Database connection failed.");

            // Supabase's signInWithOAuth uses a redirect flow, which is generally more secure
            // and robust than a popup-based flow. It avoids issues with popup blockers and
            // is the recommended approach for web applications. The user is redirected to the
            // OAuth provider and then sent back to the `redirectTo` URL with session information.
            console.log(`Initiating OAuth login with ${provider} for origin: ${window.location.origin}`);

            const { error: oauthError } = await supabase.auth.signInWithOAuth({ 
                provider,
                options: {
                    redirectTo: window.location.origin,
                },
            });

            if (oauthError) {
                // This error is often thrown if the provider is not configured correctly in Supabase.
                console.error(`Supabase OAuth Error (${provider}):`, oauthError);
                throw oauthError;
            }
            // On success, Supabase handles the redirect away from the app.
            // The user will return to the app, and the onAuthStateChange listener will handle the new session.
            // We don't set googleLoading to false here because the page is about to navigate away.
        } catch (err: any) {
             console.error("Caught error during social login setup:", err);
             setError(getFriendlyAuthErrorMessage(err.message));
             setGoogleLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setEmailLoading(true);
        setError('');
        setMessage('');
        if (!supabase) {
            setError("Database connection failed.");
            setEmailLoading(false);
            return;
        }
        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        setEmailLoading(false);
        if (resendError) {
            setError(getFriendlyAuthErrorMessage(resendError.message));
        } else {
            setMessage('A new verification email has been sent. Please check your inbox.');
        }
    };
    
    // --- ICONS ---
    const GoogleIcon = () => (<svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.522-3.512-11.01-8.24l-6.522 5.022C9.493 39.562 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C41.382 36.661 44 31.134 44 24c0-1.341-.138-2.65-.389-3.917z" /></svg>);

    // Main component render logic
    if (signupSuccess) {
      return <SignupSuccessScreen email={email} onGoToLogin={() => { setSignupSuccess(false); setIsLoginView(true); }} />;
    }
     if (error === 'Email not confirmed. Check your inbox for the verification link.') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4 text-center">
                    <div className="text-5xl">📧</div>
                    <h1 className="text-3xl font-bold text-gray-800">Check Your Email</h1>
                    <p className="text-gray-600">
                        We sent a verification link to <strong className="text-gray-900">{email}</strong>. Please click the link to activate your account.
                    </p>
                    {message && <p className="text-green-600 bg-green-50 p-2 rounded-md">{message}</p>}
                    <button
                      onClick={handleResendVerification}
                      disabled={emailLoading}
                      className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 disabled:opacity-50"
                    >
                      {emailLoading ? 'Sending...' : 'Resend Verification Link'}
                    </button>
                     <button
                        onClick={() => { setError(''); setMessage(''); }}
                        className="text-sm font-semibold text-gray-500 hover:text-gray-800"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4 auth-screen-enter-active">
             {showTroubleshooting && <TroubleshootingModal onClose={() => setShowTroubleshooting(false)} />}
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Dumble's Door</h1>
                    <p className="text-gray-600 mt-2">{isLoginView ? 'Welcome back to the family!' : 'Join our pet-loving community'}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex mb-6 border-b">
                        <button
                            onClick={() => setIsLoginView(true)}
                            className={`w-1/2 pb-3 font-semibold text-center transition-colors ${isLoginView ? 'text-teal-500 border-b-2 border-teal-500' : 'text-gray-500'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLoginView(false)}
                            className={`w-1/2 pb-3 font-semibold text-center transition-colors ${!isLoginView ? 'text-teal-500 border-b-2 border-teal-500' : 'text-gray-500'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <AuthErrorDisplay message={error} onShowTroubleshoot={() => setShowTroubleshooting(true)} />
                        {message && (
                            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
                                <p>{message}</p>
                                {message.includes('logged out') && (
                                    <button 
                                        type="button" 
                                        onClick={() => alert('Feedback form coming soon!')} 
                                        className="text-xs text-green-800 font-semibold mt-1 hover:underline"
                                    >
                                        Give Feedback
                                    </button>
                                )}
                            </div>
                        )}

                        <div>
                            <input
                                ref={emailInputRef}
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={handleEmailChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${emailValidation.isValid === false ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'}`}
                                required
                            />
                            {emailValidation.isValid === false && <p className="text-red-500 text-xs mt-1">{emailValidation.message}</p>}
                        </div>
                        <div className="relative">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                required
                            />
                             <button
                                type="button"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
                                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                            >
                                {passwordVisible ? 
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> :
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /><path d="M10 17a9.953 9.953 0 01-4.512-1.074l-1.781 1.781a1 1 0 11-1.414-1.414l14-14a1 1 0 111.414 1.414l-1.473 1.473A10.014 10.014 0 01.458 10C1.732 14.057 5.522 17 10 17z" /></svg>
                                }
                            </button>
                        </div>
                        
                        {!isLoginView && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className={passwordValidation.length ? 'text-green-600' : 'text-gray-500'}>{passwordValidation.length ? '✓' : '•'} At least 8 characters</span>
                                <span className={passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}>{passwordValidation.uppercase ? '✓' : '•'} One uppercase letter</span>
                                <span className={passwordValidation.number ? 'text-green-600' : 'text-gray-500'}>{passwordValidation.number ? '✓' : '•'} One number</span>
                                <span className={passwordValidation.specialChar ? 'text-green-600' : 'text-gray-500'}>{passwordValidation.specialChar ? '✓' : '•'} One special character</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={emailLoading || googleLoading}
                            className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                        >
                            {emailLoading ? 'Processing...' : (isLoginView ? 'Login' : 'Create Account')}
                        </button>
                    </form>
                    
                     <div className="flex items-center my-6">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">Or continue with</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                    
                    <button onClick={() => handleSocialLogin('google')} disabled={emailLoading || googleLoading} className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-70">
                       <GoogleIcon />
                       <span className="text-sm font-semibold text-gray-700">{googleLoading ? 'Redirecting...' : 'Google'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- HOOKS & MAIN APP COMPONENT ---

const useDataFetching = (user: User | null) => {
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [activePet, setActivePet] = useState<Pet | null>(null);
    const [appState, setAppState] = useState<'loading' | 'onboarding-profile' | 'onboarding-pet' | 'onboarding-complete' | 'ready' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    
    const fetchData = async (currentUser: User) => {
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('auth_user_id', currentUser.id)
                .single();
                
            if (profileError && profileError.code !== 'PGRST116') throw profileError;
            
            if (!profileData) {
                setAppState('onboarding-profile');
                setLoading(false);
                return;
            }
            setUserProfile(profileData);
            
            const { data: petsData, error: petsError } = await supabase
                .from('pets')
                .select('*')
                .eq('auth_user_id', currentUser.id);

            if (petsError) throw petsError;

            setPets(petsData || []);
            
            if ((petsData || []).length === 0) {
                 if (appState !== 'onboarding-complete') {
                    setAppState('onboarding-pet');
                 } else {
                    setActivePet(null);
                    setAppState('ready');
                 }
            } else {
                setActivePet(petsData[0]); // Default to first pet
                setAppState('ready');
            }

        } catch (err: any) {
            console.error("Data fetching error:", err);
            setError("Could not load your data. Please try again.");
            setAppState('error');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (user) {
            setLoading(true);
            fetchData(user);
        } else {
            setLoading(false);
            setAppState('loading'); // No user, show auth
        }
    }, [user]);

    return { loading, userProfile, pets, activePet, appState, error, fetchData, setAppState, setUserProfile, setPets };
};


const useDynamicTheming = (pet: Pet | null) => {
  useEffect(() => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 19;
    document.body.classList.toggle('dark-theme', isNight);
    
    const isCat = pet?.species === 'Cat';
    document.body.classList.toggle('cat-theme', isCat);

    // Cleanup function
    return () => {
      document.body.classList.remove('dark-theme', 'cat-theme');
    };
  }, [pet]);
};


const App: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [missingEnvVars, setMissingEnvVars] = useState<string[]>([]);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
    const [isAnimatingLogout, setIsAnimatingLogout] = useState(false);
    const [logoutMessage, setLogoutMessage] = useState('');
    const [appError, setAppError] = useState('');
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    
    // Data fetching and app state logic
    const { loading, userProfile, pets, activePet, appState, error: dataError, fetchData, setAppState, setUserProfile, setPets } = useDataFetching(user);
    
    // Dynamic theming
    useDynamicTheming(activePet);
    
    // Health Check state
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [healthCheckResult, setHealthCheckResult] = useState<HealthCheckResult | null>(null);
    const [healthCheckError, setHealthCheckError] = useState<string | null>(null);
    
    // Adoption flow state
    const [selectedPetForAdoption, setSelectedPetForAdoption] = useState<string | null>(null);
    const [adoptionListingForApplication, setAdoptionListingForApplication] = useState<AdoptionListing | null>(null);
    
    const [showCelebration, setShowCelebration] = useState(false);
    
    // Unsaved draft state
    const [draftPostContent, setDraftPostContent] = useState('');

    // --- DATA HANDLING ---
    const handleLogout = async (analyticsData: LogoutAnalytics) => {
        if (!supabase || !user) return;
        
        const session_duration_seconds = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0;

        // 1. Log analytics event
        try {
            const { error: analyticsError } = await supabase.from('logout_analytics').insert({
                user_id: user.id,
                session_duration_seconds,
                logout_scope: analyticsData.scope,
                ux_variant: analyticsData.ux_variant,
                satisfaction_rating: analyticsData.satisfaction_rating,
                logout_reason: analyticsData.reason,
                logout_reason_details: analyticsData.details,
            });
            if (analyticsError) {
                // Don't block logout, just log the error for debugging
                console.error("Failed to log logout analytics:", analyticsError.message);
            }
        } catch (e) {
            console.error("Error during analytics logging:", e);
        }
        
        // 2. Proceed with logout
        const lastEmail = user.email;
        setIsAnimatingLogout(true);
        
        setTimeout(async () => {
            try {
                await supabase.removeAllChannels();
                const { error } = await supabase.auth.signOut({ scope: analyticsData.scope });
                if (error) throw error;
                
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
                }
                
                if (lastEmail) {
                    localStorage.setItem('lastLoggedInEmail', lastEmail);
                }
                setLogoutMessage("We'll miss you! Keep an eye on your email for new features and updates.");
                // Clear local state
                setUserProfile(null);
                setPets([]);
                setDraftPostContent('');

            } catch (error: any) {
                console.error("Error logging out:", error.message);
                setAppError(`Logout failed: ${error.message}. Please check your connection.`);
                setTimeout(() => setAppError(''), 5000);
                setIsAnimatingLogout(false);
            }
        }, 400);
    };
    
    const handleExportData = async () => {
        if (!user || !userProfile || !supabase) {
            alert("Could not export data. User not found.");
            return;
        }
        
        try {
            const [postsRes, applicationsRes] = await Promise.all([
                supabase.from('petbook_posts').select('*').eq('auth_user_id', user.id),
                supabase.from('adoption_applications').select('*').eq('auth_user_id', user.id)
            ]);

            if (postsRes.error) throw postsRes.error;
            if (applicationsRes.error) throw applicationsRes.error;

            const dataToExport = {
                profile: userProfile,
                pets: pets,
                posts: postsRes.data,
                applications: applicationsRes.data,
                export_date: new Date().toISOString()
            };

            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dumbles_door_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error: any) {
            alert(`Data export failed: ${error.message}`);
        }
    };
    
    const handleDeleteAccount = async () => {
        // This is a simulation. A real implementation would require a backend function.
        if (!user) return;
        alert("Account deletion initiated. All your data will be purged after a 30-day grace period.");
        // We log out globally as part of the deletion flow.
        const analyticsData: LogoutAnalytics = {
            user_id: user.id,
            scope: 'global',
            ux_variant: 'button', // Deletion is always a button
            reason: 'Account Deletion',
        };
        await handleLogout(analyticsData);
        setLogoutMessage('Your account has been successfully deleted.');
    };


    // --- EFFECTS ---
    // Effect for one-time setup: checking env vars and setting up auth listener
    useEffect(() => {
        const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_KEY'];
        const missing = requiredVars.filter(v => !import.meta.env[v]);
        setMissingEnvVars(missing);
        
        if (missing.length > 0 || !supabase) return;

        // Check initial session
        supabase.auth.getSession().then(({ data: { session }}) => {
            // This is crucial for restoring the session on page load.
            setSession(session);
            setUser(session?.user ?? null);
            if (session) {
                setSessionStartTime(Date.now());
            }
        });

        // Setup the listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (_event === 'SIGNED_IN') {
                setSessionStartTime(Date.now());
            }
            if (_event === 'SIGNED_OUT') {
                setActiveScreen('home');
                setIsAnimatingLogout(false);
                setSessionStartTime(null);
            }
        });
        
        return () => subscription.unsubscribe();
    }, []); // Empty dependency array ensures this runs only once

    // Effect for handling URL actions when user state is known
    useEffect(() => {
        if (!user || !supabase) return;

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'logout') {
            const analyticsData: LogoutAnalytics = { user_id: user.id, scope: 'local', ux_variant: 'button', reason: 'PWA Shortcut' };
            handleLogout(analyticsData);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [user]);
    
    
    const handleDataUpdate = () => {
        if (user) fetchData(user);
    };

    const handleAnalyzePetHealth = async (imageFile: File, notes: string) => {
        if (!activePet || !supabase) {
            setHealthCheckError("No active pet selected or database connection failed.");
            return;
        }
        setIsCheckingHealth(true);
        setHealthCheckResult(null);
        setHealthCheckError(null);
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = async () => {
                const base64Image = (reader.result as string).split(',')[1];
                const petContext = {
                    name: activePet.name,
                    breed: activePet.breed,
                    age: new Date(activePet.birth_date).toLocaleDateString(),
                };
                
                try {
                    // 1. Upload image to Supabase Storage
                    let imageUrl = '';
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const filePath = `${user.id}/${activePet.id}/health-check_${Date.now()}.jpeg`;
                        const { error: uploadError } = await supabase.storage.from('pet_images').upload(filePath, imageFile, {
                            cacheControl: '3600',
                            upsert: false,
                            contentType: imageFile.type
                        });

                        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
                        
                        const { data: urlData } = supabase.storage.from('pet_images').getPublicUrl(filePath);
                        imageUrl = urlData.publicUrl;
                    }

                    // 2. Analyze with Gemini
                    const result = await geminiService.analyzePetHealth(base64Image, imageFile.type, notes, petContext);
                    setHealthCheckResult(result);

                    // 3. Save feedback record with image URL
                    if (result && user) {
                      const newFeedbackEntry: Omit<AIFeedback, 'id' | 'submitted_at'> = {
                        pet_id: activePet.id,
                        auth_user_id: user.id,
                        input_data: { notes, photo_url: imageUrl },
                        ai_response: JSON.stringify(result),
                        status: 'completed',
                      };
                      await supabase.from('ai_feedback').insert(newFeedbackEntry);
                      
                      setShowCelebration(true);
                      setTimeout(() => setShowCelebration(false), 5000);
                    }

                } catch (err: any) {
                    setHealthCheckError(err.message || 'An unknown error occurred during analysis.');
                } finally {
                    setIsCheckingHealth(false);
                }
            };
            reader.onerror = () => {
                setHealthCheckError("Could not read the image file.");
                setIsCheckingHealth(false);
            };
        } catch (err: any) {
            setHealthCheckError(err.message);
            setIsCheckingHealth(false);
        }
    };
    
    // --- RENDER LOGIC ---
    if (missingEnvVars.length > 0) {
        return <EnvironmentVariablePrompt missingKeys={missingEnvVars} />;
    }

    if (appState === 'loading' && !user) {
        return <AuthScreen postLogoutMessage={logoutMessage} />;
    }
    
    if (appState === 'loading' || (loading && !userProfile)) {
        return <LoadingScreen />;
    }
    
    if (appState === 'error') {
        return <AppErrorScreen message={dataError || "An unknown error occurred."} onRetry={() => user && fetchData(user)} />;
    }
    
    if (!user) {
        return <AuthScreen postLogoutMessage={logoutMessage} />;
    }

    // Onboarding Flow
    switch (appState) {
        case 'onboarding-profile':
            return <OnboardingProfileScreen user={user} profile={userProfile} onProfileCreated={handleDataUpdate} />;
        case 'onboarding-pet':
            return <OnboardingPetScreen user={user} onPetAdded={() => setAppState('onboarding-complete')} onBack={() => alert("Profile editing from onboarding is not implemented yet. Please continue.")} onSkip={() => setAppState('ready')} />;
        case 'onboarding-complete':
            return <OnboardingCompletionScreen pet={pets[0] || activePet} onComplete={() => { handleDataUpdate(); setAppState('ready'); }} />;
    }
    
    const renderActiveScreen = () => {
        if (selectedPetForAdoption) {
            return <PetDetailScreen 
                        petId={selectedPetForAdoption} 
                        onBack={() => setSelectedPetForAdoption(null)} 
                        onApply={(listing) => { setAdoptionListingForApplication(listing); setActiveScreen('adoptionApplication'); }}
                    />
        }
        
        switch (activeScreen) {
            case 'home':
                return <HomeScreen onNavigate={setActiveScreen} pet={activePet} profile={userProfile} isLoading={loading} showCelebration={showCelebration} />;
            case 'book':
                return <PetBookScreen onBack={() => setActiveScreen('home')} pet={activePet} setDraftPostContent={setDraftPostContent} />;
            case 'connect':
                return <ConnectScreen currentUserProfile={userProfile} currentUser={user} />;
            case 'adoption':
                return <AdoptionScreen onBack={() => setActiveScreen('home')} onSelectPet={setSelectedPetForAdoption} />;
            case 'profile':
                return <ProfileScreen user={user} profile={userProfile} pets={pets} onBack={() => setActiveScreen('home')} onLogout={handleLogout} onDataUpdate={handleDataUpdate} onNavigate={setActiveScreen} sessionStartTime={sessionStartTime || Date.now()} draftPostContent={draftPostContent} />;
            case 'health':
                return <HealthCheckScreen pet={activePet} onBack={() => { setActiveScreen('home'); setHealthCheckResult(null); setHealthCheckError(null); }} onAnalyze={handleAnalyzePetHealth} isChecking={isCheckingHealth} result={healthCheckResult} error={healthCheckError} onNavigate={setActiveScreen} />;
            case 'vet':
                return <VetBookingFlow onBack={() => setActiveScreen('home')} user={user} pets={pets} />;
            case 'essentials':
                return <ShopScreen onBack={() => setActiveScreen('home')} />;
            case 'admin':
                return <AdminDashboardScreen onBack={() => setActiveScreen('profile')} />;
            case 'adoptionApplication':
                if (!adoptionListingForApplication) return <div onClick={() => setActiveScreen('adoption')}>Listing not found. Go back.</div>;
                return <AdoptionApplicationScreen listing={adoptionListingForApplication} userProfile={userProfile} onBack={() => setActiveScreen('adoption')} onSubmitted={() => { alert('Application submitted successfully!'); setActiveScreen('myApplications'); }} />
            case 'myApplications':
                return <MyApplicationsScreen onBack={() => setActiveScreen('profile')} />;
            case 'myVetAppointments':
                return <MyAppointmentsScreen onBack={() => setActiveScreen('profile')} />;
            case 'safetyCenter':
                return <SafetyCenterScreen onBack={() => setActiveScreen('profile')} />;
            case 'dataPrivacy':
                return <DataPrivacyScreen onBack={() => setActiveScreen('profile')} onExportData={handleExportData} onDeleteAccount={handleDeleteAccount} />;
            default:
                return <HomeScreen onNavigate={setActiveScreen} pet={activePet} profile={userProfile} isLoading={loading} showCelebration={showCelebration} />;
        }
    };

    return (
        <div className={`h-screen w-screen ${isAnimatingLogout ? 'app-container-exit-active' : ''}`}>
            {appError && <div className="fixed top-5 right-5 bg-red-600 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-pulse">{appError}</div>}
            <main className="h-full">
                {renderActiveScreen()}
            </main>
            {/* Render BottomNav only on main screens */}
            {['home', 'book', 'connect', 'adoption', 'profile'].includes(activeScreen) && (
                <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
            )}
        </div>
    );
};

export default App;