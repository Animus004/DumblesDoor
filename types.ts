

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


// --- VET BOOKING SYSTEM TYPES ---

export interface Vet {
  id: string;
  name: string;
  photo_url: string;
  specialization: string[];
  address: string;
  city: string;
  phone: string;
  email: string;
  bio: string;
  rating: number; // e.g., 4.8
  review_count: number;
  verified: boolean;
  services?: VetService[];
  reviews?: VetReview[];
  // For PostGIS geography(Point, 4326) type
  location?: any;
  // New fields for advanced search
  is_24_7: boolean;
  accepted_insurance: string[];
  photo_gallery: string[];
}

export interface NearbyVet extends Vet {
    distance_km: number;
}

export interface VetService {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_minutes: number;
}

export interface VetReview {
    id: string;
    vet_id: string;
    author_user_id: string;
    author_name: string;
    rating: number; // 1-5
    comment: string;
    created_at: string;
    verified_appointment: boolean;
}

// Represents a row in the 'appointments' table
export interface Appointment {
  id: string;
  pet_id: string;
  vet_id: string;
  auth_user_id: string;
  service_id: string;
  appointment_time: string; // ISO string for the appointment start time
  duration_minutes: number;
  status: 'confirmed' | 'completed' | 'cancelled_by_user' | 'cancelled_by_vet';
  notes: string; // User notes during booking
  created_at: string;
  // For UI display
  vet?: Pick<Vet, 'name' | 'address' | 'photo_url'>;
  pet?: Pick<Pet, 'name' | 'photo_url'>;
  service?: Pick<VetService, 'name' | 'price'>;
  // New fields for appointment management
  pre_visit_data?: {
      reason_for_visit: string;
      symptoms: string;
      changes_in_behavior: string;
  };
  documents?: { name: string; url: string; }[];
  vet_notes?: string; // Markdown string from the vet
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

// Represents a row in the 'ai_feedback' table
export interface AIFeedback {
  id:string;
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

export interface HealthCategoryAnalysis {
    category: 'Coat & Skin' | 'Eyes & Ears' | 'Dental Health' | 'Body Condition';
    score: number; // 0-100
    status: 'Excellent' | 'Good' | 'Concern';
    observation: string;
    interpretation: string; // Plain-language explanation of the observation
    confidence: number; // 0-100 confidence in this specific assessment
    reliability: 'High' | 'Medium' | 'Low'; // Based on image quality/clarity
}

export interface CareRecommendation {
    priority: 'Immediate' | 'Routine' | 'Preventive';
    title: string;
    guidance: string; // Detailed step-by-step instructions
    timeline: string; // e.g., "Daily", "Within the next week", "At the next check-up"
    icon_name?: string; // e.g., "grooming_brush", "vet_visit"
    difficulty?: 'Easy DIY' | 'Moderate' | 'Professional Help Required';
    estimatedCost?: string; // e.g., "₹200 - ₹500"
}

export interface ActionItem {
    priority: 'High' | 'Medium' | 'Low';
    title: string;
    details: string;
    icon_name?: string; // e.g., "vet_appointment", "medication"
    estimatedCost?: string;
}

// New interfaces for actionable insights
export interface ProductRecommendation {
    name: string;
    reason: string; // Why this product is recommended
    estimatedCost: string; // e.g., "₹800"
}

export interface LocalService {
    type: 'Veterinary Clinic' | 'Emergency Vet' | 'Groomer' | 'Pet Store';
    name: string;
    address: string;
}


// The result from the Gemini health check analysis
export interface HealthCheckResult {
  reportId: string; // e.g., "RPT-DUMBLES-20240715-1A2B"
  analysisDate: string; // ISO Date string
  executiveSummary: string;
  breedAnalysis: {
    breedName: string;
    confidence: number; // 0-100
    characteristics: string[];
  };
  overallHealthScore: number;
  healthAssessment: HealthCategoryAnalysis[];
  careRecommendations: CareRecommendation[];
  actionItems: ActionItem[];
  localServices: LocalService[];
  productRecommendations?: ProductRecommendation[];
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
export type ActiveScreen = 'home' | 'book' | 'connect' | 'vet' | 'profile' | 'health' | 'adoption' | 'admin' | 'essentials' | 'petDetail' | 'adoptionApplication' | 'myApplications' | 'safetyCenter' | 'dataPrivacy' | 'myVetAppointments';

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

// --- ANALYTICS ---

export interface LogoutAnalytics {
    user_id: string;
    scope: 'local' | 'global';
    ux_variant: 'swipe' | 'button'; // For A/B testing
    satisfaction_rating?: number;
    reason?: string;
    details?: string;
}