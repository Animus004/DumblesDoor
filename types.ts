

export interface UserProfile {
  auth_user_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
}

export interface Pet {
  id: string;
  auth_user_id: string;
  name: string;
  photo_url: string;
  species: string;
  breed: string;
  birth_date: string; // ISO Date string
  gender: 'Male' | 'Female' | 'Unknown';
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


export type ActiveModal = 'chat' | null;
export type ActiveScreen = 'home' | 'book' | 'essentials' | 'vet' | 'profile' | 'health';

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
    size: 'small' | 'medium' | 'large';
    familyFriendly: boolean;
    hypoallergenic: boolean;
    trainability: 'easy' | 'moderate' | 'hard';
    goodWith: string[]; // e.g., ["Children", "Other Dogs", "Cats"]
    countryOfOrigin: string;
}