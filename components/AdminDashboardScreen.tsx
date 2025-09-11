
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { Shelter, AdoptionListing } from '../types';

// FIX: Complete the component definition and add a default export.
const AdminDashboardScreen: React.FC = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState<AdoptionListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPendingListings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('adoption_listings')
                .select('*, shelter:shelters(name)')
                .eq('status', 'Pending Approval');
            
            if (error) {
                console.error('Error fetching pending listings:', error);
            } else {
                setListings(data as any);
            }
            setLoading(false);
        };

        fetchPendingListings();
    }, []);

    const handleApproval = async (listingId: string, newStatus: 'Available' | 'Rejected') => {
        const { error } = await supabase
            .from('adoption_listings')
            .update({ status: newStatus })
            .eq('id', listingId);
        
        if (error) {
            alert(`Error updating status: ${error.message}`);
        } else {
            setListings(listings.filter(l => l.id !== listingId));
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </header>
            <main className="p-4">
                <h2 className="text-lg font-semibold mb-4">Pending Adoption Listings</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="space-y-4">
                        {listings.length > 0 ? listings.map(listing => (
                            <div key={listing.id} className="bg-white p-4 rounded-lg shadow-sm">
                                <h3 className="font-bold">{listing.name} - {listing.breed}</h3>
                                <p className="text-sm text-gray-500">From: {(listing.shelter as Shelter)?.name || 'Unknown Shelter'}</p>
                                <p className="text-sm text-gray-700 mt-2">{listing.description}</p>
                                <div className="mt-2 flex gap-2">
                                    <button onClick={() => handleApproval(listing.id, 'Available')} className="bg-green-500 text-white px-3 py-1 rounded-md text-sm">Approve</button>
                                    <button onClick={() => handleApproval(listing.id, 'Rejected')} className="bg-red-500 text-white px-3 py-1 rounded-md text-sm">Reject</button>
                                </div>
                            </div>
                        )) : <p>No pending approvals.</p>}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboardScreen;
