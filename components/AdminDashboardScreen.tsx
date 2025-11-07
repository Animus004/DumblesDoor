import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Shelter, AdoptionListing, AdoptionApplication } from '../types';

const AdminDashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<AdoptionListing[]>([]);
    const [applications, setApplications] = useState<AdoptionApplication[]>([]);
    const [finalConfirmationApps, setFinalConfirmationApps] = useState<AdoptionApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [listingsRes, applicationsRes, finalConfirmationRes] = await Promise.all([
                supabase.from('adoption_listings').select('*, shelter:shelters(name)').eq('status', 'Pending Approval'),
                supabase.from('adoption_applications').select('*, listing:adoption_listings(name), user:user_profiles(name)').eq('status', 'Submitted'),
                supabase.from('adoption_applications').select('*, listing:adoption_listings!inner(*), user:user_profiles(name), shelter:shelters(name)').filter('application_data->>workflow_status', 'eq', 'AWAITING_FINAL_CONFIRMATION')
            ]);

            if (listingsRes.error) throw listingsRes.error;
            setListings(listingsRes.data as any);
            
            if (applicationsRes.error) throw applicationsRes.error;
            setApplications(applicationsRes.data as any);

            if (finalConfirmationRes.error) throw finalConfirmationRes.error;
            setFinalConfirmationApps(finalConfirmationRes.data as any);

        } catch (err: any) {
            console.error('Error fetching admin data:', err);
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleListingApproval = async (listingId: string, newStatus: 'Available' | 'Rejected') => {
        const { error } = await supabase.from('adoption_listings').update({ status: newStatus }).eq('id', listingId);
        if (error) alert(`Error updating status: ${error.message}`);
        else setListings(listings.filter(l => l.id !== listingId));
    };

    const handleApplicationAccept = async (app: AdoptionApplication) => {
        const { error } = await supabase.from('adoption_applications').update({ 
            status: 'In Review',
            application_data: { ...app.application_data, workflow_status: 'AWAITING_ADOPTER_AGREEMENT' }
        }).eq('id', app.id);
        if (error) alert(`Error accepting application: ${error.message}`);
        else setApplications(applications.filter(a => a.id !== app.id));
    };
    
    const handleApplicationReject = async (appId: string) => {
        const { error } = await supabase.from('adoption_applications').update({ status: 'Rejected' }).eq('id', appId);
        if (error) alert(`Error rejecting application: ${error.message}`);
        else setApplications(applications.filter(a => a.id !== appId));
    };

    const handleConfirmHandover = async (app: AdoptionApplication) => {
        if (!app.listing) return;
        // 1. Update application to ADOPTED
        const { error: appUpdateError } = await supabase.from('adoption_applications').update({ status: 'Approved', application_data: { ...app.application_data, workflow_status: 'ADOPTED' } }).eq('id', app.id);
        if (appUpdateError) return alert(`Error (1/3): ${appUpdateError.message}`);

        // 2. Update listing to ADOPTED
        const { error: listingUpdateError } = await supabase.from('adoption_listings').update({ status: 'Adopted' }).eq('id', app.listing_id);
        if (listingUpdateError) return alert(`Error (2/3): ${listingUpdateError.message}`);

        // 3. Create new pet for the user
        const listing = app.listing as AdoptionListing;
        let birth_date = new Date();
        if(listing.age === 'Baby') birth_date.setMonth(birth_date.getMonth() - 3);
        if(listing.age === 'Young') birth_date.setFullYear(birth_date.getFullYear() - 1);
        if(listing.age === 'Adult') birth_date.setFullYear(birth_date.getFullYear() - 4);
        if(listing.age === 'Senior') birth_date.setFullYear(birth_date.getFullYear() - 8);

        const { error: petInsertError } = await supabase.from('pets').insert({
            auth_user_id: app.auth_user_id,
            name: listing.name,
            photo_url: listing.photos[0] || 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png',
            species: listing.species,
            breed: listing.breed,
            birth_date: birth_date.toISOString(),
            gender: listing.gender,
            size: listing.size,
            energy_level: 'Medium',
            temperament: [],
        });
        if (petInsertError) return alert(`Error (3/3): ${petInsertError.message}`);
        
        alert(`${listing.name} has been successfully adopted by ${app.user?.name}!`);
        setFinalConfirmationApps(finalConfirmationApps.filter(a => a.id !== app.id));
    };
    
    const AdminSection: React.FC<{ title: string, count: number, children: React.ReactNode }> = ({ title, count, children }) => (
        <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-3">{title} <span className="text-sm font-normal bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">{count}</span></h2>
            {children}
        </section>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </header>
            <main className="p-4 space-y-6">
                {loading ? <p>Loading dashboard...</p> : error ? <p className="text-red-500">{error}</p> : (
                    <>
                        <AdminSection title="Final Adoption Confirmation" count={finalConfirmationApps.length}>
                            <div className="space-y-4">
                                {finalConfirmationApps.length > 0 ? finalConfirmationApps.map(app => (
                                    <div key={app.id} className="border-t pt-3">
                                        <p><span className="font-bold">{app.user?.name}</span> wants to finalize adoption of <span className="font-bold">{app.listing?.name}</span>.</p>
                                        <div className="mt-2 flex gap-2">
                                            <button onClick={() => handleConfirmHandover(app)} className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">Confirm Handover</button>
                                            <button onClick={() => handleApplicationReject(app.id)} className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm">Cancel</button>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No applications awaiting final confirmation.</p>}
                            </div>
                        </AdminSection>
                        
                        <AdminSection title="Pending Adoption Applications" count={applications.length}>
                            <div className="space-y-4">
                                {applications.length > 0 ? applications.map(app => (
                                    <div key={app.id} className="border-t pt-3">
                                        <h3 className="font-bold">{app.listing?.name}</h3>
                                        <p className="text-sm text-gray-500">Applicant: {app.user?.name}</p>
                                        <p className="text-sm text-gray-700 mt-1">"{app.application_data.motivation}"</p>
                                        <div className="mt-2 flex gap-2">
                                            <button onClick={() => handleApplicationAccept(app)} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm">Accept</button>
                                            <button onClick={() => handleApplicationReject(app.id)} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">Reject</button>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No new applications.</p>}
                            </div>
                        </AdminSection>

                        <AdminSection title="Pending Pet Listings" count={listings.length}>
                            <div className="space-y-4">
                                {listings.length > 0 ? listings.map(listing => (
                                    <div key={listing.id} className="border-t pt-3">
                                        <h3 className="font-bold">{listing.name} - {listing.breed}</h3>
                                        <p className="text-sm text-gray-500">From: {(listing.shelter as Shelter)?.name || 'Unknown Shelter'}</p>
                                        <p className="text-sm text-gray-700 mt-1">{listing.description}</p>
                                        <div className="mt-2 flex gap-2">
                                            <button onClick={() => handleListingApproval(listing.id, 'Available')} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm">Approve</button>
                                            <button onClick={() => handleListingApproval(listing.id, 'Rejected')} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">Reject</button>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No pending listings.</p>}
                            </div>
                        </AdminSection>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboardScreen;