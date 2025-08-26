
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Pet, EnrichedPetbookPost } from '../types';

// --- HELPER FUNCTIONS & COMPONENTS ---

const formatDistanceToNow = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;

    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    
    return "now";
};

// --- POST CARD COMPONENT ---

const PostCard: React.FC<{ post: EnrichedPetbookPost }> = ({ post }) => {
    const [isLiked, setIsLiked] = useState(false);
    // For demonstration purposes, we'll use a random number for likes and comments.
    // In a real app, this would come from your database.
    const [likeCount, setLikeCount] = useState(() => Math.floor(Math.random() * 250));
    const [showComments, setShowComments] = useState(false);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    };

    const authorName = post.author?.name || 'A pet parent';
    const petName = post.pet?.name || 'their lovely pet';
    const petPhoto = post.pet?.photo_url || 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png';

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center p-4">
                <img src={petPhoto} alt={petName} className="h-10 w-10 rounded-full object-cover" />
                <div className="ml-3">
                    <p className="text-sm font-semibold text-gray-800">{petName}</p>
                    <p className="text-xs text-gray-500">
                        Posted by {authorName} &middot; {formatDistanceToNow(post.created_at)}
                    </p>
                </div>
            </div>

            {/* Content */}
            <p className="px-4 pb-3 text-gray-700 whitespace-pre-wrap">{post.content}</p>
            {post.image_url && <img src={post.image_url} alt="Pet post" className="w-full h-auto object-cover bg-gray-100" />}

            {/* Social Actions */}
            <div className="px-4 py-2 flex justify-between items-center border-t border-gray-100">
                 <div className="flex items-center space-x-4">
                    <button 
                        onClick={handleLike} 
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors focus:outline-none"
                        aria-pressed={isLiked}
                        aria-label={isLiked ? 'Unlike post' : 'Like post'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isLiked ? 'text-red-500 fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                        </svg>
                        <span className="text-sm font-medium">{likeCount}</span>
                    </button>
                    <button 
                        onClick={() => setShowComments(!showComments)} 
                        className="flex items-center space-x-1 text-gray-500 hover:text-teal-500 transition-colors focus:outline-none"
                        aria-expanded={showComments}
                        aria-label="Toggle comments"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                         </svg>
                         <span className="text-sm font-medium">Comment</span>
                    </button>
                </div>
                 <button 
                    onClick={() => alert('Share functionality is coming soon!')}
                    className="text-gray-500 hover:text-teal-500 transition-colors focus:outline-none"
                    aria-label="Share post"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                 </button>
            </div>

            {/* Comment Section */}
            {showComments && (
                 <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-start space-x-3">
                        <img src={post.pet?.photo_url} alt="your pet" className="h-8 w-8 rounded-full object-cover" />
                        <div className="w-full">
                           <textarea placeholder="Add a comment..." rows={2} className="w-full p-2 border rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"></textarea>
                           <button className="mt-2 bg-teal-500 text-white text-sm font-bold py-1 px-4 rounded-full hover:bg-teal-600">Post</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- MAIN COMPONENT ---

const PetBookScreen: React.FC<{ onBack: () => void; pet: Pet | null; }> = ({ onBack, pet }) => {
    const [feedPosts, setFeedPosts] = useState<EnrichedPetbookPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFeed = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all posts and join related pet and user profile data
            const { data, error: postsError } = await supabase
                .from('petbook_posts')
                .select('*, pet:pets(name, photo_url), author:user_profiles(name)')
                .order('created_at', { ascending: false });
                
            if (postsError) throw postsError;
            
            setFeedPosts(data as EnrichedPetbookPost[]);

        } catch (err) {
            console.error("Error fetching feed:", err);
            setError("Failed to load the community feed. Please try again later.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchFeed();
    }, []);

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
            await fetchFeed();

        } catch (err: any) {
             console.error("Error submitting post:", err);
             setError(`Failed to submit post: ${err.message || 'Please try again.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900" aria-label="Go back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">PetBook Community</h1>
            </header>
            
            <main className="flex-grow p-4 space-y-4">
                {/* New Post Form */}
                {pet ? (
                    <form onSubmit={handlePostSubmit} className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="flex items-start space-x-3">
                            <img src={pet.photo_url} alt="pet avatar" className="h-10 w-10 rounded-full object-cover"/>
                            <textarea
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                                placeholder={`What's new with ${pet.name}?`}
                                className="w-full p-2 border-none focus:ring-0 resize-none text-gray-800"
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
                            <button
                                type="submit"
                                disabled={isSubmitting || !newPostContent.trim()}
                                className="bg-teal-500 text-white font-bold py-2 px-6 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
                        <p className="text-gray-600">Please add a pet to your profile to start posting!</p>
                    </div>
                )}

                {/* Feed */}
                {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Loading feed...</p></div>}
                {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{error}</div>}
                {!loading && !error && feedPosts.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        <p className="font-semibold">It's quiet here...</p>
                        <p>Be the first to share a moment!</p>
                    </div>
                )}
                {!loading && feedPosts.map(post => <PostCard key={post.id} post={post} />)}
            </main>
        </div>
    );
};

export default PetBookScreen;
