
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { UserProfile, AdoptionListing, AdoptablePet, AdoptionApplication, Shelter } from '../types';

// --- AdoptionScreen ---
export const AdoptionScreen: React.FC = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<AdoptionListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('adoption_listings')
                .select('*, shelter:shelters(name, city)')
                .eq('status', 'Available')
                .order('created_at', { ascending: false });

            if (error) {
                setError('Could not fetch pets for adoption. Please try again later.');
                console.error(error);
            } else {
                setListings(data as any);
            }
            setLoading(false);
        };
        fetchListings();
    }, []);

    const PetCard: React.FC<{ listing: AdoptionListing }> = ({ listing }) => (
        <Link to={`/adoption/${listing.id}`} className="bg-white rounded-lg shadow-sm overflow-hidden group">
            <img src={listing.photos[0]} alt={listing.name} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="p-4">
                <h3 className="font-bold text-lg">{listing.name}</h3>
                <p className="text-sm text-gray-600">{listing.breed}</p>
                <p className="text-xs text-gray-500 mt-1">{listing.age} • {(listing.shelter as Shelter)?.city}</p>
            </div>
        </Link>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="p-4 border-b bg-white sticky top-0 z-10">
                <h1 className="text-xl font-bold text-center">Find a Pet to Adopt</h1>
            </header>
            <main className="p-4">
                {loading && <p>Loading pets...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {listings.map(listing => <PetCard key={listing.id} listing={listing} />)}
                    </div>
                )}
            </main>
        </div>
    );
};

// --- PetDetailScreen ---
export const PetDetailScreen: React.FC = () => {
    const { petId } = useParams<{ petId: string }>();
    const navigate = useNavigate();
    const [listing, setListing] = useState<AdoptionListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchListing = async () => {
            if (!petId) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('adoption_listings')
                .select('*, shelter:shelters(name, city, phone)')
                .eq('id', petId)
                .single();
            
            if (error || !data) {
                setError('Could not find the pet you are looking for.');
                console.error(error);
            } else {
                setListing(data as any);
            }
            setLoading(false);
        };
        fetchListing();
    }, [petId]);

    if (loading) return <div>Loading pet details...</div>;
    if (error) return <div>{error}</div>;
    if (!listing) return <div>Pet not found.</div>;

    return (
        <div className="min-h-screen bg-white">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl font-bold">{listing.name}</h1>
            </header>
            <img src={listing.photos[0]} alt={listing.name} className="w-full h-64 object-cover" />
            <div className="p-4 space-y-4">
                <h2 className="text-2xl font-bold">{listing.name}</h2>
                <p>{listing.description}</p>
                <p><strong>Breed:</strong> {listing.breed}</p>
                <p><strong>Age:</strong> {listing.age}</p>
                <p><strong>Gender:</strong> {listing.gender}</p>
                <p><strong>Shelter:</strong> {(listing.shelter as Shelter)?.name}</p>
                <button onClick={() => navigate(`/adoption/${listing.id}/apply`)} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg">Apply to Adopt</button>
            </div>
        </div>
    );
};


// --- AdoptionApplicationScreen ---
export const AdoptionApplicationScreen: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
    const { petId } = useParams<{ petId: string }>();
    const navigate = useNavigate();
    const [listing, setListing] = useState<AdoptionListing | null>(null);
    const [motivation, setMotivation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchListing = async () => {
            if (!petId) return;
            // FIX: Select all columns to ensure the data matches the AdoptionListing type.
            const { data, error } = await supabase.from('adoption_listings').select('*').eq('id', petId).single();
            if (data) setListing(data);
        };
        fetchListing();
    }, [petId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile || !listing) return;
        setSubmitting(true);
        const { error } = await supabase.from('adoption_applications').insert({
            auth_user_id: userProfile.auth_user_id,
            listing_id: listing.id,
            shelter_id: listing.shelter_id,
            application_data: { motivation, experience: 'Experienced' /* mock data */, residenceType: 'Own', homeType: 'House', hasYard: true, timeAlone: '2-4 hours' },
            status: 'Submitted',
        });
        setSubmitting(false);
        if (error) {
            setError('Failed to submit application: ' + error.message);
        } else {
            navigate('/my-applications');
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
             <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl font-bold">Apply for {listing?.name}</h1>
            </header>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <p>Applying as: {userProfile?.name}</p>
                <div>
                    <label htmlFor="motivation">Why do you want to adopt {listing?.name}?</label>
                    <textarea id="motivation" rows={5} value={motivation} onChange={e => setMotivation(e.target.value)} className="w-full p-2 border rounded-md" required />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" disabled={submitting} className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
            </form>
        </div>
    );
};

// --- MyApplicationsScreen ---
export const MyApplicationsScreen: React.FC = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<AdoptionApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data, error } = await supabase
                .from('adoption_applications')
                .select('*, listing:adoption_listings(name, photos)')
                .eq('auth_user_id', user.id);
            
            if (data) {
                setApplications(data as any);
            }
            setLoading(false);
        };
        fetchApplications();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Submitted': return 'bg-blue-100 text-blue-800';
            case 'In Review': return 'bg-yellow-100 text-yellow-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <h1 className="text-xl font-bold">My Adoption Applications</h1>
            </header>
            <main className="p-4 space-y-4">
                {loading && <p>Loading applications...</p>}
                {!loading && applications.map(app => (
                    <div key={app.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
                        <img src={app.listing?.photos[0]} alt={app.listing?.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                            <p className="font-bold">{app.listing?.name}</p>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(app.status)}`}>{app.status}</span>
                        </div>
                    </div>
                ))}
                {!loading && applications.length === 0 && <p>You have not submitted any applications yet.</p>}
            </main>
        </div>
    );
};
