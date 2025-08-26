

// FIX: Corrected import statement for React hooks.
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
// FIX: Corrected typo from AIFebedback to AIFeedback.
import type { Pet, TimelineEntry, PetbookPost, Appointment, AIFeedback, HealthCheckResult } from '../types';

// --- HELPER FUNCTIONS & COMPONENTS ---

// A simple utility to format time since a date
const formatDistanceToNow = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;

    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    
    return "Just now";
};

// SVG Icons for different post types
const PostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const HealthCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const AppointmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;

// --- TIMELINE CARD SUB-COMPONENTS ---

const TimelineCardHeader: React.FC<{ pet: Pet; timestamp: string; children: React.ReactNode; }> = ({ pet, timestamp, children }) => (
    <div className="flex items-center p-4">
        <img src={pet.photo_url} alt={pet.name} className="h-10 w-10 rounded-full object-cover" />
        <div className="ml-3">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                {children}
            </p>
            <p className="text-xs text-gray-500">{formatDistanceToNow(timestamp)}</p>
        </div>
    </div>
);

const PostEntry: React.FC<{ post: PetbookPost; pet: Pet }> = ({ post, pet }) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <TimelineCardHeader pet={pet} timestamp={post.created_at}>
            {pet.name} <span className="font-normal text-gray-600">shared a memory</span>
        </TimelineCardHeader>
        <p className="px-4 pb-3 text-gray-700 whitespace-pre-wrap">{post.content}</p>
        {post.image_url && <img src={post.image_url} alt="Pet post" className="w-full h-auto object-cover" />}
         <div className="p-2 flex items-center space-x-4 border-t border-gray-100">
            <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                <span className="text-sm font-medium">Like</span>
            </button>
            <button className="flex items-center space-x-1 text-gray-500 hover:text-teal-500">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                 <span className="text-sm font-medium">Comment</span>
            </button>
        </div>
    </div>
);

const HealthCheckEntry: React.FC<{ check: AIFeedback; pet: Pet }> = ({ check, pet }) => {
    const result: HealthCheckResult = JSON.parse(check.ai_response);
    return (
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-rose-400">
            <TimelineCardHeader pet={pet} timestamp={check.submitted_at}>
                <HealthCheckIcon /> {pet.name} <span className="font-normal text-gray-600">completed an AI Health Check</span>
            </TimelineCardHeader>
            <div className="px-4 pb-4 space-y-2">
                <p className="text-sm text-gray-700 italic">"{result.healthAnalysis}"</p>
                {result.vetRecommendation && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-md">Vet visit recommended.</p>}
            </div>
        </div>
    );
};

const AppointmentEntry: React.FC<{ appointment: Appointment; pet: Pet }> = ({ appointment, pet }) => {
    let details;
    try {
        details = JSON.parse(appointment.notes);
    } catch {
        details = { consultationType: appointment.notes, dateTime: appointment.created_at };
    }
    return (
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-sky-400">
            <TimelineCardHeader pet={pet} timestamp={appointment.created_at}>
                <AppointmentIcon /> {pet.name} <span className="font-normal text-gray-600">has a vet appointment</span>
            </TimelineCardHeader>
             <div className="px-4 pb-4">
                <p className="text-sm text-gray-700">A <span className="font-semibold">{details.consultationType}</span> is scheduled for {new Date(details.dateTime).toLocaleDateString()}.</p>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const PetBookScreen: React.FC<{ onBack: () => void; pet: Pet | null; }> = ({ onBack, pet }) => {
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchTimeline = async (petId: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data: posts, error: postsError } = await supabase.from('petbook_posts').select('*').eq('pet_id', petId).order('created_at', { ascending: false });
            if (postsError) throw postsError;

            const { data: checks, error: checksError } = await supabase.from('ai_feedback').select('*').eq('pet_id', petId).eq('status', 'completed').order('submitted_at', { ascending: false });
            if (checksError) throw checksError;
            
            const { data: appointments, error: appointmentsError } = await supabase.from('appointments').select('*').eq('pet_id', petId).order('created_at', { ascending: false });
            if (appointmentsError) throw appointmentsError;

            const mappedPosts: TimelineEntry[] = posts.map(p => ({ id: p.id, timestamp: p.created_at, type: 'post', pet_id: p.pet_id, data: p }));
            const mappedChecks: TimelineEntry[] = checks.map(c => ({ id: c.id, timestamp: c.submitted_at, type: 'health_check', pet_id: c.pet_id, data: c }));
            const mappedAppointments: TimelineEntry[] = appointments.map(a => ({ id: a.id, timestamp: a.created_at, type: 'appointment', pet_id: a.pet_id, data: a }));

            const combined = [...mappedPosts, ...mappedChecks, ...mappedAppointments];
            combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setTimeline(combined);
        } catch (err) {
            console.error("Error fetching timeline:", err);
            setError("Failed to load your pet's timeline. Please try again later.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (pet?.id) {
            fetchTimeline(pet.id);
        }
    }, [pet]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewPostImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim() || !pet) return;
        
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found.");

            let imageUrl: string | undefined = undefined;

            if (newPostImage) {
                const filePath = `${user.id}/${pet.id}/${Date.now()}_${newPostImage.name}`;
                const { error: uploadError } = await supabase.storage.from('pet_images').upload(filePath, newPostImage);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('pet_images').getPublicUrl(filePath);
                imageUrl = data.publicUrl;
            }

            const { error: insertError } = await supabase.from('petbook_posts').insert({
                pet_id: pet.id, auth_user_id: user.id, content: newPostContent, image_url: imageUrl,
            });
            if (insertError) throw insertError;

            setNewPostContent('');
            setNewPostImage(null);
            setImagePreview(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
            await fetchTimeline(pet.id);

        } catch (err: any) {
             console.error("Error submitting post:", err);
             setError(`Failed to submit post: ${err.message || 'Please try again.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!pet) {
        return (
             <div className="min-h-screen flex flex-col bg-gray-50">
                <header className="p-4 flex items-center border-b bg-white">
                    <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-bold">Pet Book</h1>
                </header>
                <main className="flex-grow flex items-center justify-center text-center p-4">
                    <div>
                        <p className="text-gray-600">Please add a pet to your profile to start using the Pet Book.</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <img src={pet.photo_url} alt={pet.name} className="h-8 w-8 rounded-full mr-3 object-cover" />
                <h1 className="text-xl font-bold">{pet.name}'s Book</h1>
            </header>
            
            <main className="flex-grow p-4 space-y-4">
                <form onSubmit={handlePostSubmit} className="bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex items-start space-x-3">
                        <img src={pet.photo_url} alt="pet avatar" className="h-10 w-10 rounded-full object-cover"/>
                        <textarea
                            value={newPostContent}
                            onChange={e => setNewPostContent(e.target.value)}
                            placeholder={`What's new with ${pet.name}?`}
                            className="w-full p-2 border-none focus:ring-0 resize-none"
                            rows={3}
                            required
                        />
                    </div>
                    {imagePreview && (
                        <div className="mt-3 pl-12 relative">
                            <img src={imagePreview} alt="Preview" className="max-h-48 w-auto rounded-lg" />
                            <button
                                type="button"
                                onClick={() => { setImagePreview(null); setNewPostImage(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                                aria-label="Remove image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pl-12">
                        <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" id="imageUpload" />
                        <label htmlFor="imageUpload" className="cursor-pointer text-gray-500 hover:text-teal-600" aria-label="Add image">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </label>
                        <button type="submit" disabled={isSubmitting || !newPostContent.trim()} className="bg-teal-500 text-white font-bold py-2 px-6 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>

                {error && <p className="text-red-500 text-center p-2 bg-red-100 rounded-md">{error}</p>}
                
                {loading ? (
                    <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading timeline...</p>
                    </div>
                ) : timeline.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">No entries yet. Add your first post!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {timeline.map(entry => (
                            <div key={`${entry.type}-${entry.id}`}>
                                {entry.type === 'post' && <PostEntry post={entry.data as PetbookPost} pet={pet} />}
                                {entry.type === 'health_check' && <HealthCheckEntry check={entry.data as AIFeedback} pet={pet} />}
                                {entry.type === 'appointment' && <AppointmentEntry appointment={entry.data as Appointment} pet={pet} />}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PetBookScreen;