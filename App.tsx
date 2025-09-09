


// Trigger Vercel deployment
// FIX: Imported useState, useEffect, and useRef from React to resolve hook-related errors.
import React, { useState, useEffect, useRef } from 'react';
import { HealthCheckResult, GeminiChatMessage, DBChatMessage, Appointment, AIFeedback, TimelineEntry, ActiveModal, Product, PetbookPost, EncyclopediaTopic, Pet, UserProfile, ActiveScreen, AdoptionListing, AdoptablePet, Shelter, ConnectProfile, AdoptionApplication, LogoutAnalytics, EmergencyContact } from './types';
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

// --- UTILITY FUNCTIONS ---
const calculatePetAge = (birthDate: string): string => {
    if (!birthDate) return 'Unknown';
    const dob = new Date(birthDate);
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < dob.getDate())) {
        years--;
        months += 12;
    }
    if (years === 0 && months === 0) return 'Less than a month old';
    const yearStr = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : '';
    const monthStr = months > 0 ? `${months} month${months > 1 ? 's' : ''}` : '';
    return [yearStr, monthStr].filter(Boolean).join(' and ');
};


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
                {pet.distance_km > 0 && <p className="text-teal-600 font-bold">{pet.distance_km.toFixed(1)} km away</p>}
            </div>
        </div>
    );
};

const AdoptionScreen: React.FC<{ onBack: () => void; onSelectPet: (petId: string | null) => void; }> = ({ onBack, onSelectPet }) => {
    const [listings, setListings] = useState<AdoptablePet[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Finding your location...");
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [locationResolved, setLocationResolved] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    const [species, setSpecies] = useState<'All' | 'Dog' | 'Cat'>('All');
    const [age, setAge] = useState<'All' | 'Baby' | 'Young' | 'Adult' | 'Senior'>('All');
    const [size, setSize] = useState<'All' | 'Small' | 'Medium' | 'Large' | 'Extra Large'>('All');
    const [distance, setDistance] = useState(50);

    useEffect(() => {
        if (locationResolved) return;
        setLoading(true);
        setLoadingMessage("Finding your location...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
                setLocationResolved(true);
            },
            (geoError) => {
                console.warn("Geolocation error:", geoError.message);
                setError("Location access denied. Showing pets from all over India. Enable location for local results.");
                setUserLocation(null);
                setLocationResolved(true);
            },
            { timeout: 10000 }
        );
    }, [locationResolved]);

    useEffect(() => {
        if (!locationResolved) return;

        const fetchListings = async () => {
            if (!supabase) {
                setError("Database connection is not available.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setLoadingMessage("Fetching pets...");
            if (!error?.includes("Location access denied")) {
                setError(null);
            }
            
            let fetchedPets: AdoptablePet[] = [];

            try {
                if (userLocation) {
                    // FIX: Use @ts-ignore to bypass a TypeScript error for the 'nearby_pets' RPC function, which is not included in the auto-generated Supabase types. This allows the function to be called without type-checking errors.
                    // @ts-ignore
                    const { data, error: rpcError } = await supabase.rpc('nearby_pets', {
                        lat: userLocation.lat,
                        long: userLocation.lon,
                        radius_km: distance
                    });
                    if (rpcError) throw rpcError;
                    fetchedPets = (data as AdoptablePet[]) || [];
                } else {
                    const { data, error } = await supabase
                        .from('adoption_listings')
                        .select('*, shelter:shelters(name, city)')
                        .eq('status', 'Available')
                        .limit(50);
                    if (error) throw error;
                    fetchedPets = (data as AdoptionListing[]).map(p => ({
                        ...(p as Omit<AdoptionListing, 'shelter'>),
                        distance_km: 0,
                        shelter_name: (p.shelter as any)?.name || 'A Loving Shelter',
                    }));
                }

                const filtered = fetchedPets.filter((p) => {
                    const speciesMatch = species === 'All' || p.species === species;
                    const ageMatch = age === 'All' || p.age === age;
                    const sizeMatch = size === 'All' || p.size === size;
                    return speciesMatch && ageMatch && sizeMatch;
                });
                setListings(filtered);

            } catch (err: any) {
                console.error("Error fetching pets:", err.message);
                setError("Could not fetch pets. Please try again later.");
                setListings([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchListings();
    }, [locationResolved, userLocation, species, age, size, distance]);

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
                            <select value={species} onChange={e => setSpecies(e.target.value as 'All' | 'Dog' | 'Cat')} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Dog</option><option>Cat</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Age</label>
                            <select value={age} onChange={e => setAge(e.target.value as 'All' | 'Baby' | 'Young' | 'Adult' | 'Senior')} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Baby</option><option>Young</option><option>Adult</option><option>Senior</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Size</label>
                            <select value={size} onChange={e => setSize(e.target.value as 'All' | 'Small' | 'Medium' | 'Large' | 'Extra Large')} className="w-full mt-1 p-2 border bg-white rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm">
                                <option>All</option><option>Small</option><option>Medium</option><option>Large</option><option>Extra Large</option>
                            </select>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-gray-500">Distance ({distance} km)</label>
                            <input type="range" min="5" max="200" step="5" value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500" disabled={!userLocation} />
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow p-4">
                {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">{loadingMessage}</p></div>}
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

// FIX: Replaced the truncated and broken AuthScreen component with a fully functional placeholder.
// This new component correctly returns JSX, resolving the 'is not assignable to type FC' error.
const AuthScreen: React.FC<{ postLogoutMessage: string }> = ({ postLogoutMessage }) => {
    const [isLoginView, setIsLoginView] = useState(true);
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
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-6">{isLoginView ? 'Log In' : 'Sign Up'}</h2>
                {postLogoutMessage && <p className="text-green-600 text-center mb-4">{postLogoutMessage}</p>}
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleAuth} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        required
                    />
                    <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">
                        {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}
                    </button>
                </form>
                <button onClick={() => setIsLoginView(!isLoginView)} className="w-full mt-4 text-sm text-center text-teal-600">
                    {isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
                </button>
            </div>
        </div>
    );
};


// FIX: Added a main App component to serve as the application's root.
// This component was missing, which caused the import error in `index.tsx`.
// It handles basic state management for the user session and renders other screens.
const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    if (!session) {
        return <AuthScreen postLogoutMessage="" />;
    }

    // NOTE: This is a simplified version. A complete implementation would require
    // routing and state management to render the various screens like HomeScreen,
    // ProfileScreen, etc., based on user interaction.
    return <HomeScreen onNavigate={() => {}} pet={null} profile={null} isLoading={false} showCelebration={false} />;
};

export default App;
