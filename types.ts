

export interface UserProfile {
  auth_user_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role?: 'user' | 'admin';
  interests?: string[]; // e.g., ["Dog parks", "Hiking", "Puppy training"]
  verified?: boolean;
  emergency_contact?: { name: string; phone: string; };
}

export interface Pet {
  id: string;
  auth_user_id: string;
  name: string;
  photo_url: string;
  species: 'Dog' | 'Cat';
  breed: string;
  birth_date: string; // ISO Date string
  gender: 'Male' | 'Female' | 'Unknown';
  size: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  energy_level: 'Low' | 'Medium' | 'High';
  temperament: string[]; // e.g., ["Friendly with kids", "Good with other dogs"]
  notes?: string;
}

export interface Vet {
  id: string;
  name: string;
  photo_url: string;
  specialization: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  available_time: string;
}

export interface Product {
  id: string;
  name: string;
  image_url: string;
  category: 'Food' | 'Toys' | 'Grooming' | 'Medicine' | 'Accessories';
  description: string;
  price: number;
  stock: number;
}

// Represents a row in the 'appointments' table
export interface Appointment {
  id: string;
  pet_id: string;
  vet_id: string;
  auth_user_id: string;
  status: 'booked' | 'completed' | 'cancelled';
  notes: string; // Will store JSON with { dateTime, consultationType }
  created_at: string;
  vet?: Vet; // For UI display
}

// Represents a row in the 'ai_feedback' table
export interface AIFeedback {
  id: string;
  pet_id: string;
  auth_user_id: string;
  input_data: {
    photo_url?: string;
    notes: string;
  };
  ai_response: string; // JSON string of HealthCheckResult
  user_feedback?: string;
  status: 'pending' | 'completed' | 'error';
  submitted_at: string;
}

// Represents a row in the 'petbook_posts' table
export interface PetbookPost {
  id: string;
  pet_id: string;
  auth_user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  post_type: 'general' | 'adoption_story' | 'tip' | 'tribute';
}

// The result from the Gemini health check analysis
export interface HealthCheckResult {
  breed: string;
  healthAnalysis: string;
  careTips: string[];
  vetRecommendation: boolean;
  groomingRecommendation: boolean;
  productRecommendations: string[];
}

export type TimelineEntryData = PetbookPost | Appointment | AIFeedback;

// A unified object for displaying items in the Pet Book timeline
export interface TimelineEntry {
  id: string;
  timestamp: string;
  type: 'post' | 'appointment' | 'health_check';
  pet_id: string;
  data: TimelineEntryData;
}

// A new type for displaying posts in the social feed, including author and pet details.
export interface EnrichedPetbookPost extends PetbookPost {
  pet: {
    name: string;
    photo_url: string;
  } | null;
  author: {
    name: string;
  } | null;
}


// --- ADOPTION PLATFORM TYPES ---

export interface Shelter {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  verified: boolean;
  // For PostGIS geography(Point, 4326) type
  location: any; // Supabase client might not have a perfect type for this
}

export interface AdoptionListing {
  id: string;
  shelter_id: string;
  name: string;
  species: 'Dog' | 'Cat';
  breed: string;
  age: 'Baby' | 'Young' | 'Adult' | 'Senior';
  size: 'Small' | 'Medium' | 'Large' | 'Extra Large';
  gender: 'Male' | 'Female';
  photos: string[]; // array of URLs
  description: string;
  story?: string;
  good_with: ('Children' | 'Dogs' | 'Cats')[];
  special_needs?: string[];
  status: 'Pending Approval' | 'Available' | 'Pending' | 'Adopted' | 'Rejected';
  created_at: string;
  // Joined data for UI display
  shelter?: Shelter | { name: string; city: string; };
}

// This type represents the data returned by the 'nearby_pets' RPC
export interface AdoptablePet extends Omit<AdoptionListing, 'shelter'> {
  distance_km: number;
  shelter_name: string;
}

export interface AdoptionApplication {
  id: string;
  auth_user_id: string;
  listing_id: string;
  shelter_id: string;
  status: 'Submitted' | 'In Review' | 'Interview Scheduled' | 'Approved' | 'Rejected' | 'Withdrawn';
  submitted_at: string;
  application_data: {
    residenceType: 'Own' | 'Rent';
    homeType: 'House' | 'Apartment' | 'Other';
    hasYard: boolean;
    timeAlone: string;
    experience: 'First-time' | 'Experienced';
    motivation: string;
  };
  document_url?: string;
  // For UI display
  listing?: Pick<AdoptionListing, 'name' | 'photos' | 'breed'>;
}


// --- SOCIAL & CONNECT ---
export interface ConnectProfile extends UserProfile {
    pets: Pet[];
}


export type ActiveModal = 'chat' | null;
export type ActiveScreen = 'home' | 'book' | 'connect' | 'vet' | 'profile' | 'health' | 'adoption' | 'admin' | 'essentials' | 'petDetail' | 'adoptionApplication' | 'myApplications' | 'safetyCenter';

// This type matches the Gemini SDK's expectation for chat history
export interface GeminiChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// This type matches the 'chat_messages' table schema
export interface DBChatMessage {
    id?: string;
    auth_user_id: string;
    sender: 'user' | 'model';
    message: string;
    sent_at?: string;
    session_id?: string;
}

export interface EncyclopediaTopic {
    type: 'dog' | 'cat' | 'bird' | 'fish';
    breed: string;
    image: string;
    overview: string;
    personality: string[]; // e.g., ["Friendly", "Playful", "Intelligent"]
    lifespan: string; // e.g., "10-12 years"
    commonIssues: string[];
    dietaryNeeds: string[];
    exerciseNeeds: string; // e.g., "High - requires 60+ mins/day"
    groomingTips: string;
    climateSuitability: string; // e.g., "Tolerates heat well, but needs shade."
    funFactsIndia: string[];
    adoptionInfoIndia: string;
    adoptionStatus: 'Available' | 'Pending' | 'Adopted';
    size: 'small' | 'medium' | 'large';
    familyFriendly: boolean;
    hypoallergenic: boolean;
    trainability: 'easy' | 'moderate' | 'hard';
    goodWith: string[]; // e.g., ["Children", "Other Dogs", "Cats"]
    countryOfOrigin: string;
}