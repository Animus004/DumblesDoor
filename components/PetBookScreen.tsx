import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Pet, TimelineEntry, PetbookPost, Appointment, AIFeedback, HealthCheckResult } from '../types';

// Props definition
interface PetBookScreenProps {
  onBack: () => void;
  pet: Pet | null;
}

// Sub-components for rendering different timeline entry types
const PostEntry: React.FC<{ post: PetbookPost }> = ({ post }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm">
        {post.image_url && <img src={post.image_url} alt="Pet post" className="w-full h-auto object-cover rounded-md mb-3" />}
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        <p className="text-xs text-gray-400 mt-2">{new Date(post.created_at).toLocaleString()}</p>
    </div>
);

const HealthCheckEntry: React.FC<{ check: AIFeedback }> = ({ check }) => {
    const result: HealthCheckResult = JSON.parse(check.ai_response);
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-rose-400">
            <h4 className="font-bold text-rose-800">AI Health Check Completed</h4>
            <p className="text-sm text-gray-600 my-2">"{result.healthAnalysis}"</p>
            {result.vetRecommendation && <p className="text-xs font-semibold text-red-600">Vet visit recommended.</p>}
            <p className="text-xs text-gray-400 mt-2">{new Date(check.submitted_at).toLocaleString()}</p>
        </div>
    );
};

const AppointmentEntry: React.FC<{ appointment: Appointment }> = ({ appointment }) => (
     <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-sky-400">
        <h4 className="font-bold text-sky-800">Vet Appointment</h4>
        {(() => {
            try {
                const details = JSON.parse(appointment.notes);
                return <p className="text-sm text-gray-600">Appointment for {details.consultationType} on {new Date(details.dateTime).toLocaleDateString()}.</p>;
            } catch {
                return <p className="text-sm text-gray-600">{appointment.notes}</p>;
            }
        })()}
        <p className="text-xs text-gray-400 mt-2">{new Date(appointment.created_at).toLocaleString()}</p>
    </div>
);


const PetBookScreen: React.FC<PetBookScreenProps> = ({ onBack, pet }) => {
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
                const { error: uploadError } = await supabase.storage
                    .from('pet_images')
                    .upload(filePath, newPostImage);
                
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('pet_images').getPublicUrl(filePath);
                imageUrl = data.publicUrl;
            }

            const { error: insertError } = await supabase.from('petbook_posts').insert({
                pet_id: pet.id,
                auth_user_id: user.id,
                content: newPostContent,
                image_url: imageUrl,
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
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <img src={pet.photo_url} alt={pet.name} className="h-8 w-8 rounded-full mr-3 object-cover" />
                <h1 className="text-xl font-bold">{pet.name}'s Book</h1>
            </header>
            
            <main className="flex-grow p-4 space-y-4">
                <form onSubmit={handlePostSubmit} className="bg-white p-4 rounded-lg shadow-sm">
                    <textarea
                        value={newPostContent}
                        onChange={e => setNewPostContent(e.target.value)}
                        placeholder={`What's on your mind, ${pet.name}?`}
                        className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        rows={3}
                        required
                        aria-label="New post content"
                    />
                    {imagePreview && (
                        <div className="mt-2 relative">
                            <img src={imagePreview} alt="Preview" className="max-h-40 rounded-md" />
                            <button
                                type="button"
                                onClick={() => { setImagePreview(null); setNewPostImage(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                                aria-label="Remove image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}
                    <div className="flex justify-between items-center mt-3">
                        <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" id="imageUpload" />
                        <label htmlFor="imageUpload" className="cursor-pointer text-gray-500 hover:text-teal-600" aria-label="Add image">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </label>
                        <button type="submit" disabled={isSubmitting} className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50">
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
                            <div key={entry.id}>
                                {entry.type === 'post' && <PostEntry post={entry.data as PetbookPost} />}
                                {entry.type === 'health_check' && <HealthCheckEntry check={entry.data as AIFeedback} />}
                                {entry.type === 'appointment' && <AppointmentEntry appointment={entry.data as Appointment} />}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PetBookScreen;
