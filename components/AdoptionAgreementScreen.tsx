import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import type { AdoptionApplication } from '../types';

const AdoptionAgreementScreen: React.FC = () => {
    const { applicationId } = useParams<{ applicationId: string }>();
    const navigate = useNavigate();
    const { state } = useLocation();
    const initialApplication: AdoptionApplication | undefined = state?.application;

    const [application, setApplication] = useState<AdoptionApplication | null>(initialApplication || null);
    const [isAgreeing, setIsAgreeing] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(!initialApplication);

    useEffect(() => {
        if (!initialApplication && applicationId) {
            const fetchApplication = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('adoption_applications')
                    .select('*, listing:adoption_listings(name)')
                    .eq('id', applicationId)
                    .single();
                
                if (error) {
                    setError('Failed to load application details.');
                } else {
                    setApplication(data as any);
                }
                setLoading(false);
            };
            fetchApplication();
        }
    }, [initialApplication, applicationId]);

    const handleAgree = async () => {
        if (!application) return;

        setIsAgreeing(true);
        setError('');
        
        const currentData = application.application_data || {};
        const updatedData = { ...currentData, workflow_status: 'AWAITING_FINAL_CONFIRMATION' };

        const { error: updateError } = await supabase
            .from('adoption_applications')
            .update({ application_data: updatedData })
            .eq('id', application.id);
        
        if (updateError) {
            setError(`Failed to update application: ${updateError.message}`);
            setIsAgreeing(false);
        } else {
            alert('Agreement confirmed! The shelter has been notified for final approval.');
            navigate('/my-applications');
        }
    };

    if (loading) return <div>Loading agreement...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!application) return <div>Application not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="mr-4 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Adoption Agreement</h1>
            </header>
            <main className="flex-grow p-4 overflow-y-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-center mb-4">Adoption Agreement for {application.listing?.name}</h2>
                    <div className="prose prose-sm max-w-none text-gray-600 space-y-4">
                        <p>This agreement marks the next step in your journey to adopt <strong>{application.listing?.name}</strong>. By clicking "I Agree," you acknowledge and consent to the following terms:</p>
                        <ol>
                            <li><strong>Standard of Care:</strong> You agree to provide the adopted pet with humane care, including proper food, water, shelter, regular veterinary care, and companionship.</li>
                            <li><strong>Home Environment:</strong> You confirm that your living situation is suitable for the pet and that you have any necessary permissions from landlords or housing associations.</li>
                            <li><strong>No Transfer of Ownership:</strong> You agree not to sell, trade, or give away the pet. If you can no longer care for the pet, you must contact the original shelter or an approved rescue organization.</li>
                            <li><strong>Final Confirmation:</strong> You understand that this agreement is a formal declaration of your intent. The final adoption is contingent upon one last confirmation from the shelter, after which ownership will be transferred.</li>
                        </ol>
                        <p>This is a significant commitment. Please ensure you are prepared for the responsibility of pet ownership. Thank you for choosing to adopt!</p>
                    </div>
                </div>
            </main>
            <footer className="p-4 bg-white/80 backdrop-blur-sm border-t">
                {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
                <button 
                    onClick={handleAgree}
                    disabled={isAgreeing}
                    className="w-full bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                >
                    {isAgreeing ? 'Processing...' : 'I Agree and Wish to Proceed'}
                </button>
            </footer>
        </div>
    );
};

export default AdoptionAgreementScreen;
