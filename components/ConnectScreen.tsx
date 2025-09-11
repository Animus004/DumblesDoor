
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { UserProfile, ConnectProfile } from '../types';

interface ConnectScreenProps {
    currentUserProfile: UserProfile | null;
    currentUser: User | null;
}

const ConnectScreen: React.FC<ConnectScreenProps> = ({ currentUserProfile, currentUser }) => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<ConnectProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
    
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
                const { data: blockedData, error: blockedError } = await supabase.from('blocked_users').select('blocked_user_id').eq('blocker_user_id', currentUser.id);
                if (blockedError) throw blockedError;
                const blockedIds = (blockedData || []).map(b => b.blocked_user_id);
                setBlockedUserIds(blockedIds);

                const { data, error: fetchError } = await supabase.from('user_profiles').select(`*, pets(*)`).eq('city', currentUserProfile.city).neq('auth_user_id', currentUserProfile.auth_user_id).not('auth_user_id', 'in', `(${blockedIds.length > 0 ? blockedIds.map(id => `'${id}'`).join(',') : `''`})`).limit(50);
                if (fetchError) throw fetchError;
                setProfiles((data as any as ConnectProfile[]).filter(p => Array.isArray(p.pets) && p.pets.length > 0));
            } catch (err: any) {
                setError("Failed to load profiles. Please try again later.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (currentUserProfile && currentUser) fetchBlockedUsersAndProfiles();
    }, [currentUserProfile, currentUser]);

    const handleBlockUser = async (profileToBlock: ConnectProfile) => {
        if (!currentUser || !window.confirm(`Are you sure you want to block ${profileToBlock.name}? You will no longer see each other's profiles.`)) return;
        setMenuOpenFor(null);
        setProfiles(profiles.filter(p => p.auth_user_id !== profileToBlock.auth_user_id));
        const { error: blockError } = await supabase.from('blocked_users').insert({ blocker_user_id: currentUser.id, blocked_user_id: profileToBlock.auth_user_id });
        if (blockError) {
            setError(`Failed to block user: ${blockError.message}`);
            setProfiles(currentProfiles => [...currentProfiles, profileToBlock].sort((a, b) => a.name.localeCompare(b.name)));
        }
    };
    
    const handleReportUser = (profileToReport: ConnectProfile) => { setReportingUser(profileToReport); setMenuOpenFor(null); };

    const ReportUserModal: React.FC<{user: ConnectProfile, onCancel: () => void, currentUser: User | null}> = ({ user, onCancel, currentUser }) => {
        const [reason, setReason] = useState('');
        const [details, setDetails] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitted, setSubmitted] = useState(false);
        const handleSubmit = async () => {
            if (!reason || !currentUser) return;
            setIsSubmitting(true);
            const { error } = await supabase.from('reports').insert({ reporter_user_id: currentUser.id, reported_user_id: user.auth_user_id, reason, details });
            setIsSubmitting(false);
            if (error) alert(`Failed to submit report: ${error.message}`);
            else setSubmitted(true);
        };
        if (submitted) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-lg p-6 w-full max-w-sm text-center"><h3 className="text-lg font-bold">Report Submitted</h3><p className="text-sm text-gray-600 mt-2">Thank you for helping keep our community safe. Our team will review your report shortly.</p><button onClick={onCancel} className="mt-4 w-full bg-teal-500 text-white font-bold py-2 rounded-lg">Close</button></div></div>;
        return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-lg p-6 w-full max-w-sm"><h3 className="text-lg font-bold">Report {user.name}</h3><select value={reason} onChange={e => setReason(e.target.value)} className="w-full mt-4 p-2 border rounded-md bg-white"><option value="">Select a reason...</option><option value="inappropriate_profile">Inappropriate Profile/Photos</option><option value="spam">Spam or Scam</option><option value="harassment">Harassment or Hate Speech</option><option value="other">Other</option></select><textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Provide additional details (optional)" rows={3} className="w-full mt-2 p-2 border rounded-md"></textarea><div className="flex gap-4 mt-4"><button onClick={onCancel} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-lg">Cancel</button><button onClick={handleSubmit} disabled={!reason || isSubmitting} className="w-full bg-red-500 text-white font-bold py-2 rounded-lg disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit Report'}</button></div></div></div>;
    };

    const SafeMeetupModal: React.FC<{user: ConnectProfile, onCancel: () => void}> = ({ user, onCancel }) => (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                 <h3 className="text-lg font-bold text-center">Plan a Safe Playdate!</h3><p className="text-sm text-gray-600 mt-2 text-center">For everyone's safety, we recommend meeting at a public, pet-friendly location.</p>
                 <div className="mt-4 space-y-2"><p className="font-semibold text-sm">Suggested locations near you:</p><ul className="list-disc list-inside bg-gray-50 p-3 rounded-md">{["Cubbon Park Dog Park", "The Pet People Cafe", "Lalbagh Botanical Garden (Designated Areas)"].map(spot => <li key={spot}>{spot}</li>)}</ul></div>
                 <button onClick={() => { navigate(`/chat/${user.auth_user_id}`); onCancel(); }} className="mt-4 w-full bg-teal-500 text-white font-bold py-2 rounded-lg">Message {user.name.split(' ')[0]}</button>
                 <button onClick={onCancel} className="mt-2 w-full text-sm text-gray-500 font-semibold">Cancel</button>
            </div>
        </div>
    );

    const VerifiedBadge = () => <div className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-xs font-semibold"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Verified</div>;
    const UserCard: React.FC<{ profile: ConnectProfile }> = ({ profile }) => (
        <div className="bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="p-4"><div className="flex items-start gap-4"><div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-2xl flex-shrink-0">{profile.name.charAt(0).toUpperCase()}</div><div className="flex-grow"><div className="flex justify-between items-start"><div><h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">{profile.name} {profile.verified && <VerifiedBadge />}</h3><p className="text-sm text-gray-500">{profile.city}</p></div><div className="relative"><button onClick={() => setMenuOpenFor(menuOpenFor === profile.auth_user_id ? null : profile.auth_user_id)} className="text-gray-400 hover:text-gray-600 p-1" aria-label="More options"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg></button>{menuOpenFor === profile.auth_user_id && <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20" onMouseLeave={() => setMenuOpenFor(null)}><button onClick={() => handleReportUser(profile)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Report User</button><button onClick={() => handleBlockUser(profile)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Block User</button></div>}</div></div><div className="flex flex-wrap gap-1 mt-2">{(profile.interests || []).slice(0, 3).map(interest => <span key={interest} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{interest}</span>)}</div></div></div></div>
            {profile.pets.length > 0 && <div className="flex gap-2 px-4 pb-4 overflow-x-auto">{profile.pets.map(pet => <div key={pet.id} className="flex-shrink-0 text-center w-20"><img src={pet.photo_url} alt={pet.name} className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-white shadow-sm" /><p className="text-xs font-semibold text-gray-700 mt-1 truncate">{pet.name}</p><p className="text-xs text-gray-500">{pet.breed}</p></div>)}</div>}
            <div className="p-3 bg-gray-50 border-t"><button onClick={() => setShowMeetupModal(profile)} className="w-full bg-teal-500 text-white font-bold text-sm py-2 rounded-lg hover:bg-teal-600 transition-colors">Request Playdate</button></div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 border-b bg-white sticky top-0 z-10"><h1 className="text-xl font-bold text-center">Connect with Pet Parents</h1></header>
            <main className="flex-grow p-4">
                {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Finding friends...</p></div>}
                {error && <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-center">{error}</div>}
                {!loading && !error && profiles.length === 0 && <div className="text-center text-gray-500 pt-16"><p className="font-semibold">No one's here yet!</p><p>No other pet parents found in your city. Be the first to start the community!</p></div>}
                {!loading && profiles.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{profiles.map(p => <UserCard key={p.auth_user_id} profile={p} />)}</div>}
            </main>
            {reportingUser && <ReportUserModal user={reportingUser} onCancel={() => setReportingUser(null)} currentUser={currentUser}/>}
            {showMeetupModal && <SafeMeetupModal user={showMeetupModal} onCancel={() => setShowMeetupModal(null)} />}
        </div>
    );
};

export default ConnectScreen;