export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_jobs: {
        Row: {
          booking_id: string
          client_name: string
          completed_at: string | null
          created_at: string | null
          duration: string
          id: string
          pause_reason: string | null
          paused_at: string | null
          price: number
          salon_id: string
          service: string
          staff_id: string
          started_at: string
          status: string
          total_paused_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          client_name: string
          completed_at?: string | null
          created_at?: string | null
          duration: string
          id?: string
          pause_reason?: string | null
          paused_at?: string | null
          price: number
          salon_id: string
          service: string
          staff_id: string
          started_at?: string
          status?: string
          total_paused_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          client_name?: string
          completed_at?: string | null
          created_at?: string | null
          duration?: string
          id?: string
          pause_reason?: string | null
          paused_at?: string | null
          price?: number
          salon_id?: string
          service?: string
          staff_id?: string
          started_at?: string
          status?: string
          total_paused_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_jobs_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_time: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          duration: string
          id: string
          notes: string | null
          price: number
          salon_id: string
          service: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_time: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          duration: string
          id?: string
          notes?: string | null
          price: number
          salon_id: string
          service: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_time?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          duration?: string
          id?: string
          notes?: string | null
          price?: number
          salon_id?: string
          service?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings_audit_log: {
        Row: {
          accessed_at: string
          accessed_by: string
          booking_id: string
          client_email: string | null
          client_phone: string | null
          id: string
          operation: string
        }
        Insert: {
          accessed_at?: string
          accessed_by: string
          booking_id: string
          client_email?: string | null
          client_phone?: string | null
          id?: string
          operation: string
        }
        Update: {
          accessed_at?: string
          accessed_by?: string
          booking_id?: string
          client_email?: string | null
          client_phone?: string | null
          id?: string
          operation?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_audit_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      break_requests: {
        Row: {
          break_duration_minutes: number
          created_at: string | null
          id: string
          reason: string | null
          requested_at: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          staff_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          break_duration_minutes: number
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          break_duration_minutes?: number
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      break_sessions: {
        Row: {
          break_duration_minutes: number
          created_at: string | null
          ends_at: string
          id: string
          staff_id: string
          started_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          break_duration_minutes: number
          created_at?: string | null
          ends_at: string
          id?: string
          staff_id: string
          started_at?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          break_duration_minutes?: number
          created_at?: string | null
          ends_at?: string
          id?: string
          staff_id?: string
          started_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          id: string
          is_featured: boolean | null
          metadata: Json | null
          rating: number
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          review_text: string | null
          salon_id: string | null
          sentiment: string | null
          sentiment_score: number | null
          service: string
          staff_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          id?: string
          is_featured?: boolean | null
          metadata?: Json | null
          rating: number
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          review_text?: string | null
          salon_id?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          service: string
          staff_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          id?: string
          is_featured?: boolean | null
          metadata?: Json | null
          rating?: number
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          review_text?: string | null
          salon_id?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          service?: string
          staff_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_staff: {
        Row: {
          created_at: string
          favorite_staff_id: string
          id: string
          staff_id: string
        }
        Insert: {
          created_at?: string
          favorite_staff_id: string
          id?: string
          staff_id: string
        }
        Update: {
          created_at?: string
          favorite_staff_id?: string
          id?: string
          staff_id?: string
        }
        Relationships: []
      }
      feedback_surveys: {
        Row: {
          booking_id: string | null
          cleanliness_rating: number | null
          completed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          id: string
          improvements_text: string | null
          overall_rating: number
          positive_aspects: string | null
          salon_id: string | null
          service: string
          service_quality_rating: number | null
          staff_friendliness_rating: number | null
          staff_id: string | null
          value_rating: number | null
          would_recommend: boolean | null
        }
        Insert: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          completed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          id?: string
          improvements_text?: string | null
          overall_rating: number
          positive_aspects?: string | null
          salon_id?: string | null
          service: string
          service_quality_rating?: number | null
          staff_friendliness_rating?: number | null
          staff_id?: string | null
          value_rating?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          completed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          id?: string
          improvements_text?: string | null
          overall_rating?: number
          positive_aspects?: string | null
          salon_id?: string | null
          service?: string
          service_quality_rating?: number | null
          staff_friendliness_rating?: number | null
          staff_id?: string | null
          value_rating?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_surveys_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_surveys_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_surveys_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_messages: {
        Row: {
          booking_id: string | null
          created_at: string | null
          customer_email: string
          id: string
          message_body: string
          message_type: string
          metadata: Json | null
          review_id: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          customer_email: string
          id?: string
          message_body: string
          message_type: string
          metadata?: Json | null
          review_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          customer_email?: string
          id?: string
          message_body?: string
          message_type?: string
          metadata?: Json | null
          review_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_messages_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "customer_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      handoff_notifications: {
        Row: {
          client_name: string
          created_at: string
          from_staff_id: string
          id: string
          job_id: string
          message: string | null
          service: string
          status: Database["public"]["Enums"]["handoff_status"]
          to_staff_id: string
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          from_staff_id: string
          id?: string
          job_id: string
          message?: string | null
          service: string
          status?: Database["public"]["Enums"]["handoff_status"]
          to_staff_id: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          from_staff_id?: string
          id?: string
          job_id?: string
          message?: string | null
          service?: string
          status?: Database["public"]["Enums"]["handoff_status"]
          to_staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "active_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_config: {
        Row: {
          birthday_bonus_points: number | null
          created_at: string | null
          id: string
          minimum_redeem_points: number
          points_expiry_days: number | null
          points_per_dollar: number
          redeem_rate: number
          referral_bonus_points: number | null
          salon_id: string
          updated_at: string | null
          welcome_bonus_points: number | null
        }
        Insert: {
          birthday_bonus_points?: number | null
          created_at?: string | null
          id?: string
          minimum_redeem_points?: number
          points_expiry_days?: number | null
          points_per_dollar?: number
          redeem_rate?: number
          referral_bonus_points?: number | null
          salon_id: string
          updated_at?: string | null
          welcome_bonus_points?: number | null
        }
        Update: {
          birthday_bonus_points?: number | null
          created_at?: string | null
          id?: string
          minimum_redeem_points?: number
          points_expiry_days?: number | null
          points_per_dollar?: number
          redeem_rate?: number
          referral_bonus_points?: number | null
          salon_id?: string
          updated_at?: string | null
          welcome_bonus_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_config_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_promotions: {
        Row: {
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          promotion_type: string
          salon_id: string | null
          start_date: string
          updated_at: string | null
          value: number
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          promotion_type: string
          salon_id?: string | null
          start_date: string
          updated_at?: string | null
          value: number
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          promotion_type?: string
          salon_id?: string | null
          start_date?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_promotions_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          benefits: Json | null
          color: string | null
          created_at: string | null
          discount_percentage: number | null
          id: string
          max_points: number | null
          min_points: number
          name: string
          points_multiplier: number
          salon_id: string | null
          tier_order: number
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          color?: string | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          max_points?: number | null
          min_points: number
          name: string
          points_multiplier?: number
          salon_id?: string | null
          tier_order: number
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          color?: string | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          max_points?: number | null
          min_points?: number
          name?: string
          points_multiplier?: number
          salon_id?: string | null
          tier_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tiers_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          metadata: Json | null
          points_amount: number
          reference_id: string | null
          salon_id: string | null
          staff_id: string | null
          transaction_type: string
        }
        Insert: {
          balance_after: number
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points_amount: number
          reference_id?: string | null
          salon_id?: string | null
          staff_id?: string | null
          transaction_type: string
        }
        Update: {
          balance_after?: number
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          points_amount?: number
          reference_id?: string | null
          salon_id?: string | null
          staff_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability_status: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          default_salon_id: string | null
          email: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          is_suspended: boolean | null
          phone: string | null
          rating: number | null
          salon_id: string | null
          specialties: string[] | null
          theme_preference: string | null
          total_reviews: number | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          default_salon_id?: string | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          is_suspended?: boolean | null
          phone?: string | null
          rating?: number | null
          salon_id?: string | null
          specialties?: string[] | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          availability_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          default_salon_id?: string | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_suspended?: boolean | null
          phone?: string | null
          rating?: number | null
          salon_id?: string | null
          specialties?: string[] | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_branch_id_fkey"
            columns: ["default_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          acsu_bonus_multiplier: number | null
          acsu_points_per_dollar: number | null
          address: string | null
          color_theme: string | null
          created_at: string | null
          email: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          gps_radius_meters: number | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          manager_id: string | null
          name: string
          opening_hours: Json | null
          owner_user_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          acsu_bonus_multiplier?: number | null
          acsu_points_per_dollar?: number | null
          address?: string | null
          color_theme?: string | null
          created_at?: string | null
          email?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_radius_meters?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          manager_id?: string | null
          name: string
          opening_hours?: Json | null
          owner_user_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          acsu_bonus_multiplier?: number | null
          acsu_points_per_dollar?: number | null
          address?: string | null
          color_theme?: string | null
          created_at?: string | null
          email?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_radius_meters?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          manager_id?: string | null
          name?: string
          opening_hours?: Json | null
          owner_user_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          accepted_at: string | null
          assigned_role: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string | null
          metadata: Json | null
          salon_id: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_role?: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          invited_by?: string | null
          metadata?: Json | null
          salon_id?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_role?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string | null
          metadata?: Json | null
          salon_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_onboarding: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          availability_preferences: Json | null
          certifications: Json | null
          completed_at: string | null
          created_at: string | null
          documents: Json | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          id: string
          invitation_id: string | null
          onboarding_status: string
          rejection_reason: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          availability_preferences?: Json | null
          certifications?: Json | null
          completed_at?: string | null
          created_at?: string | null
          documents?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          invitation_id?: string | null
          onboarding_status?: string
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          availability_preferences?: Json | null
          certifications?: Json | null
          completed_at?: string | null
          created_at?: string | null
          documents?: Json | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          id?: string
          invitation_id?: string | null
          onboarding_status?: string
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_onboarding_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_onboarding_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "staff_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_salons: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          salon_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          salon_id: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          salon_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_branches_branch_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branches_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_price: number
          created_at: string
          custom_price: number | null
          id: string
          is_active: boolean
          requires_admin_approval: boolean
          service_name: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_price?: number
          created_at?: string
          custom_price?: number | null
          id?: string
          is_active?: boolean
          requires_admin_approval?: boolean
          service_name: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_price?: number
          created_at?: string
          custom_price?: number | null
          id?: string
          is_active?: boolean
          requires_admin_approval?: boolean
          service_name?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          staff_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          staff_id: string
          started_at?: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          staff_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "super_admin" | "salon_owner"
      handoff_status: "pending" | "accepted" | "rejected" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "super_admin", "salon_owner"],
      handoff_status: ["pending", "accepted", "rejected", "cancelled"],
    },
  },
} as const
