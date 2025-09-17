import React from 'react';
import type { Vet, VetReview } from '../types';

interface VetProfileScreenProps {
  vet: Vet;
  onBookNow: (vet: Vet) => void;
}

// Mock data for reviews since it might not be passed
const MOCK_REVIEWS: VetReview[] = [
    { id: '1', vet_id: '1', author_user_id: '1', author_name: 'Priya S.', rating: 5, comment: 'Dr. Sharma was amazing with our anxious dog, Leo. Very patient and explained everything clearly.', created_at: '2024-07-20T10:00:00Z', verified_appointment: true },
    { id: '2', vet_id: '1', author_user_id: '2', author_name: 'Rohan K.', rating: 4, comment: 'Good clinic, clean and professional. The wait time was a bit long, but the care was excellent.', created_at: '2024-07-18T14:30:00Z', verified_appointment: true },
    { id: '3', vet_id: '1', author_user_id: '3', author_name: 'Anjali M.', rating: 5, comment: 'The best vet in town! They handled our emergency with such competence and compassion. Highly recommend.', created_at: '2024-06-25T09:00:00Z', verified_appointment: false },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        ))}
    </div>
);


const VetProfileScreen: React.FC<VetProfileScreenProps> = ({ vet, onBookNow }) => {
    
    const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
        <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="bg-gray-100 text-gray-600 rounded-lg p-2">{icon}</div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            {children}
        </div>
    );
    
    const galleryImages = (Array.isArray(vet.photo_gallery) && vet.photo_gallery.length > 0)
        ? vet.photo_gallery
        : [vet.photo_url || 'https://i.ibb.co/1M2g1CH/clinic-1.jpg', 'https://i.ibb.co/hZJc3Bw/vet-1.jpg']; // Fallback gallery

    const reviews = vet.reviews && vet.reviews.length > 0 ? vet.reviews : MOCK_REVIEWS;

    return (
         <div className="bg-gray-50">
            <main className="pb-24">
                {/* Photo Gallery */}
                <div className="w-full h-48 bg-gray-200 overflow-x-auto flex snap-x snap-mandatory">
                    {galleryImages.map((url, i) => (
                        <img key={i} src={url!} alt={`Clinic photo ${i + 1}`} className="w-full h-full object-cover flex-shrink-0 snap-center" />
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="p-4 space-y-4">
                    {/* Header Card */}
                    <div className="bg-white p-4 rounded-xl shadow-lg relative -mt-16">
                        <div className="flex items-end gap-4">
                            <img src={vet.photo_url || 'https://i.ibb.co/hZJc3Bw/vet-1.jpg'} alt={vet.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"/>
                            <div className="pb-2">
                                <h2 className="text-2xl font-bold">{vet.name}</h2>
                                <p className="text-gray-500 text-sm font-semibold">{vet.specialization?.join(', ')}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {vet.verified && <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Verified</div>}
                            {vet.is_24_7 && <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">24/7 Emergency</div>}
                            <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">10+ Yrs Exp</div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <a href={`tel:${vet.phone}`} className="w-full text-center bg-teal-500 text-white font-bold py-2.5 rounded-lg text-sm interactive-scale">Call Clinic</a>
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(vet.address)}`} target="_blank" rel="noopener noreferrer" className="w-full text-center bg-gray-200 text-gray-800 font-bold py-2.5 rounded-lg text-sm interactive-scale">Get Directions</a>
                        </div>
                    </div>

                    {/* About Section */}
                    <InfoCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>} title="About">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{vet.bio || "No biography provided."}</p>
                    </InfoCard>
                    
                    {/* Services Section */}
                    <InfoCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>} title="Services & Pricing">
                       <div className="divide-y divide-gray-100">
                            {/* FIX: Ensure `vet.services` is an array before calling .length or .map. Supabase may return a single object instead of an array for one-to-many relationships. */}
                            {vet.services && Array.isArray(vet.services) && vet.services.length > 0 ? vet.services.map(service => (
                                <div key={service.id} className="py-2 flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800">{service.name}</p>
                                        <p className="text-gray-500">{service.duration_minutes} min</p>
                                    </div>
                                    <p className="font-bold text-teal-600">₹{service.price}</p>
                                </div>
                            )) : <p className="text-sm text-gray-500">This vet has not listed any services yet. Please call for details.</p>}
                       </div>
                    </InfoCard>

                     {/* Reviews Section */}
                    <InfoCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a2 2 0 01-2 2h-2v-2h2a2 2 0 012-2z" /></svg>} title="What Pet Parents Are Saying">
                       <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-gray-800">{vet.rating || 'N/A'}</span>
                            <div className="flex flex-col">
                                <StarRating rating={Math.round(vet.rating || 0)} />
                                <p className="text-xs text-gray-500">Based on {vet.review_count || reviews.length} reviews</p>
                            </div>
                       </div>
                       <div className="space-y-3">
                            {reviews.slice(0, 3).map(review => (
                                <div key={review.id} className="border-t border-gray-100 pt-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-sm">{review.author_name}</p>
                                        <StarRating rating={review.rating} />
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">"{review.comment}"</p>
                                </div>
                            ))}
                       </div>
                    </InfoCard>
                </div>
            </main>
            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t z-20">
                <button onClick={() => onBookNow(vet)} className="w-full bg-teal-500 text-white font-bold py-4 rounded-xl text-lg interactive-scale">
                    Book an Appointment
                </button>
            </footer>
        </div>
    );
};

export default VetProfileScreen;