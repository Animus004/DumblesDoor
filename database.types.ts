export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_feedback: {
        Row: {
          id: string
          pet_id: string
          auth_user_id: string
          input_data: Json
          ai_response: string
          user_feedback: string | null
          status: "pending" | "completed" | "error"
          submitted_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          auth_user_id: string
          input_data: Json
          ai_response: string
          user_feedback?: string | null
          status: "pending" | "completed" | "error"
          submitted_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          auth_user_id?: string
          input_data?: Json
          ai_response?: string
          user_feedback?: string | null
          status?: "pending" | "completed" | "error"
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_pet_id_fkey"
            columns: ["pet_id"]
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      adoption_applications: {
        Row: {
          id: string
          auth_user_id: string
          listing_id: string
          shelter_id: string
          status: "Submitted" | "In Review" | "Interview Scheduled" | "Approved" | "Rejected" | "Withdrawn"
          submitted_at: string
          application_data: Json
          document_url: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          listing_id: string
          shelter_id: string
          status: "Submitted" | "In Review" | "Interview Scheduled" | "Approved" | "Rejected" | "Withdrawn"
          submitted_at?: string
          application_data: Json
          document_url?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          listing_id?: string
          shelter_id?: string
          status?: "Submitted" | "In Review" | "Interview Scheduled" | "Approved" | "Rejected" | "Withdrawn"
          submitted_at?: string
          application_data?: Json
          document_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adoption_applications_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_applications_listing_id_fkey"
            columns: ["listing_id"]
            referencedRelation: "adoption_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_applications_shelter_id_fkey"
            columns: ["shelter_id"]
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          }
        ]
      }
      adoption_listings: {
        Row: {
          id: string
          shelter_id: string
          name: string
          species: "Dog" | "Cat"
          breed: string
          age: "Baby" | "Young" | "Adult" | "Senior"
          size: "Small" | "Medium" | "Large" | "Extra Large"
          gender: "Male" | "Female"
          photos: string[]
          description: string
          story: string | null
          good_with: ("Children" | "Dogs" | "Cats")[]
          special_needs: string[] | null
          status: "Pending Approval" | "Available" | "Pending" | "Adopted" | "Rejected"
          created_at: string
        }
        Insert: {
          id?: string
          shelter_id: string
          name: string
          species: "Dog" | "Cat"
          breed: string
          age: "Baby" | "Young" | "Adult" | "Senior"
          size: "Small" | "Medium" | "Large" | "Extra Large"
          gender: "Male" | "Female"
          photos: string[]
          description: string
          story?: string | null
          good_with: ("Children" | "Dogs" | "Cats")[]
          special_needs?: string[] | null
          status?: "Pending Approval" | "Available" | "Pending" | "Adopted" | "Rejected"
          created_at?: string
        }
        Update: {
          id?: string
          shelter_id?: string
          name?: string
          species?: "Dog" | "Cat"
          breed?: string
          age?: "Baby" | "Young" | "Adult" | "Senior"
          size?: "Small" | "Medium" | "Large" | "Extra Large"
          gender?: "Male" | "Female"
          photos?: string[]
          description?: string
          story?: string | null
          good_with?: ("Children" | "Dogs" | "Cats")[]
          special_needs?: string[] | null
          status?: "Pending Approval" | "Available" | "Pending" | "Adopted" | "Rejected"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoption_listings_shelter_id_fkey"
            columns: ["shelter_id"]
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          pet_id: string
          vet_id: string
          auth_user_id: string
          service_id: string
          appointment_time: string
          duration_minutes: number
          status: "confirmed" | "completed" | "cancelled_by_user" | "cancelled_by_vet"
          notes: string
          created_at: string
          pre_visit_data: Json | null
          documents: Json | null
          vet_notes: string | null
        }
        Insert: {
          id?: string
          pet_id: string
          vet_id: string
          auth_user_id: string
          service_id: string
          appointment_time: string
          duration_minutes: number
          status: "confirmed" | "completed" | "cancelled_by_user" | "cancelled_by_vet"
          notes: string
          created_at?: string
          pre_visit_data?: Json | null
          documents?: Json | null
          vet_notes?: string | null
        }
        Update: {
          id?: string
          pet_id?: string
          vet_id?: string
          auth_user_id?: string
          service_id?: string
          appointment_time?: string
          duration_minutes?: number
          status?: "confirmed" | "completed" | "cancelled_by_user" | "cancelled_by_vet"
          notes?: string
          created_at?: string
          pre_visit_data?: Json | null
          documents?: Json | null
          vet_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "vet_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vet_id_fkey"
            columns: ["vet_id"]
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      blocked_users: {
        Row: {
          blocker_user_id: string
          blocked_user_id: string
          created_at: string
        }
        Insert: {
          blocker_user_id: string
          blocked_user_id: string
          created_at?: string
        }
        Update: {
          blocker_user_id?: string
          blocked_user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_user_id_fkey"
            columns: ["blocker_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          auth_user_id: string
          sender: "user" | "model"
          message: string
          sent_at: string
          session_id: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          sender: "user" | "model"
          message: string
          sent_at?: string
          session_id?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          sender?: "user" | "model"
          message?: string
          sent_at?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      logout_analytics: {
        Row: {
          id: number
          created_at: string
          user_id: string
          session_duration_seconds: number | null
          logout_scope: "local" | "global"
          ux_variant: "swipe" | "button"
          satisfaction_rating: number | null
          logout_reason: string | null
          logout_reason_details: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          session_duration_seconds?: number | null
          logout_scope: "local" | "global"
          ux_variant: "swipe" | "button"
          satisfaction_rating?: number | null
          logout_reason?: string | null
          logout_reason_details?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          session_duration_seconds?: number | null
          logout_scope?: "local" | "global"
          ux_variant?: "swipe" | "button"
          satisfaction_rating?: number | null
          logout_reason?: string | null
          logout_reason_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logout_analytics_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      petbook_posts: {
        Row: {
          id: string
          pet_id: string
          auth_user_id: string
          content: string
          image_url: string | null
          created_at: string
          post_type: "general" | "adoption_story" | "tip" | "tribute"
        }
        Insert: {
          id?: string
          pet_id: string
          auth_user_id: string
          content: string
          image_url?: string | null
          created_at?: string
          post_type: "general" | "adoption_story" | "tip" | "tribute"
        }
        Update: {
          id?: string
          pet_id?: string
          auth_user_id?: string
          content?: string
          image_url?: string | null
          created_at?: string
          post_type?: "general" | "adoption_story" | "tip" | "tribute"
        }
        Relationships: [
          {
            foreignKeyName: "petbook_posts_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petbook_posts_pet_id_fkey"
            columns: ["pet_id"]
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      pets: {
        Row: {
          id: string
          auth_user_id: string
          name: string
          photo_url: string
          species: "Dog" | "Cat"
          breed: string
          birth_date: string
          gender: "Male" | "Female" | "Unknown"
          size: "Small" | "Medium" | "Large" | "Extra Large"
          energy_level: "Low" | "Medium" | "High"
          temperament: string[]
          notes: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          name: string
          photo_url: string
          species: "Dog" | "Cat"
          breed: string
          birth_date: string
          gender: "Male" | "Female" | "Unknown"
          size: "Small" | "Medium" | "Large" | "Extra Large"
          energy_level: "Low" | "Medium" | "High"
          temperament: string[]
          notes?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          name?: string
          photo_url?: string
          species?: "Dog" | "Cat"
          breed?: string
          birth_date?: string
          gender?: "Male" | "Female" | "Unknown"
          size?: "Small" | "Medium" | "Large" | "Extra Large"
          energy_level?: "Low" | "Medium" | "High"
          temperament?: string[]
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      professional_profiles: {
        Row: {
          id: string
          created_at: string
          name: string
          profile_type: "veterinarian" | "vendor" | "groomer"
          email: string
          phone: string
          address: string
          city: string
          bio: string | null
          photo_url: string | null
          photo_gallery: string[] | null
          specialization: string[] | null
          is_24_7: boolean
          verified: boolean
          accepted_insurance: string[] | null
          status: "pending" | "approved" | "rejected"
          rating: number | null
          review_count: number | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          profile_type: "veterinarian" | "vendor" | "groomer"
          email: string
          phone: string
          address: string
          city: string
          bio?: string | null
          photo_url?: string | null
          photo_gallery?: string[] | null
          specialization?: string[] | null
          is_24_7?: boolean
          verified?: boolean
          accepted_insurance?: string[] | null
          status?: "pending" | "approved" | "rejected"
          rating?: number | null
          review_count?: number | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          profile_type?: "veterinarian" | "vendor" | "groomer"
          email?: string
          phone?: string
          address?: string
          city?: string
          bio?: string | null
          photo_url?: string | null
          photo_gallery?: string[] | null
          specialization?: string[] | null
          is_24_7?: boolean
          verified?: boolean
          accepted_insurance?: string[] | null
          status?: "pending" | "approved" | "rejected"
          rating?: number | null
          review_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: number
          created_at: string
          reporter_user_id: string
          reported_user_id: string
          reason: string
          details: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          reporter_user_id: string
          reported_user_id: string
          reason: string
          details?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          reporter_user_id?: string
          reported_user_id?: string
          reason?: string
          details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      shelters: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          phone: string
          email: string
          website: string | null
          verified: boolean
          location: any | null // postgis
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          phone: string
          email: string
          website?: string | null
          verified?: boolean
          location?: any | null // postgis
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          phone?: string
          email?: string
          website?: string | null
          verified?: boolean
          location?: any | null // postgis
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          auth_user_id: string
          name: string
          email: string
          phone: string | null
          city: string
          role: "user" | "admin"
          interests: string[] | null
          verified: boolean
          emergency_contact: Json | null
        }
        Insert: {
          auth_user_id: string
          name: string
          email: string
          phone: string | null
          city: string
          role?: "user" | "admin"
          interests?: string[] | null
          verified?: boolean
          emergency_contact?: Json | null
        }
        Update: {
          auth_user_id?: string
          name?: string
          email?: string
          phone?: string | null
          city?: string
          role?: "user" | "admin"
          interests?: string[] | null
          verified?: boolean
          emergency_contact?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_auth_user_id_fkey"
            columns: ["auth_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      vendor_products: {
        Row: {
          id: string
          created_at: string
          vendor_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          category: "Food" | "Toys" | "Grooming" | "Medicine" | "Accessories"
          stock: number
          status: "pending" | "approved" | "rejected"
        }
        Insert: {
          id?: string
          created_at?: string
          vendor_id: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category: "Food" | "Toys" | "Grooming" | "Medicine" | "Accessories"
          stock?: number
          status?: "pending" | "approved" | "rejected"
        }
        Update: {
          id?: string
          created_at?: string
          vendor_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category?: "Food" | "Toys" | "Grooming" | "Medicine" | "Accessories"
          stock?: number
          status?: "pending" | "approved" | "rejected"
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      vet_services: {
        Row: {
          id: string
          vet_id: string
          name: string
          description: string
          price: number
          duration_minutes: number
        }
        Insert: {
          id?: string
          vet_id: string
          name: string
          description: string
          price: number
          duration_minutes: number
        }
        Update: {
          id?: string
          vet_id?: string
          name?: string
          description?: string
          price?: number
          duration_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "vet_services_vet_id_fkey"
            columns: ["vet_id"]
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}