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
          branch_id: string | null
          client_name: string
          completed_at: string | null
          created_at: string | null
          duration: string
          id: string
          pause_reason: string | null
          paused_at: string | null
          price: string
          service: string
          staff_id: string
          started_at: string
          status: string
          total_paused_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          branch_id?: string | null
          client_name: string
          completed_at?: string | null
          created_at?: string | null
          duration: string
          id?: string
          pause_reason?: string | null
          paused_at?: string | null
          price: string
          service: string
          staff_id: string
          started_at?: string
          status?: string
          total_paused_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          branch_id?: string | null
          client_name?: string
          completed_at?: string | null
          created_at?: string | null
          duration?: string
          id?: string
          pause_reason?: string | null
          paused_at?: string | null
          price?: string
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
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_time: string
          branch_id: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          duration: string
          id: string
          notes: string | null
          price: string
          service: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_time: string
          branch_id?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          duration: string
          id?: string
          notes?: string | null
          price: string
          service: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_time?: string
          branch_id?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          duration?: string
          id?: string
          notes?: string | null
          price?: string
          service?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
      branches: {
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
      profiles: {
        Row: {
          availability_status: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          default_branch_id: string | null
          email: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          phone: string | null
          rating: number | null
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
          default_branch_id?: string | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          phone?: string | null
          rating?: number | null
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
          default_branch_id?: string | null
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          rating?: number | null
          specialties?: string[] | null
          theme_preference?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_branch_id_fkey"
            columns: ["default_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_branches: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          is_default: boolean | null
          staff_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          staff_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
      app_role: "admin" | "staff"
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
      app_role: ["admin", "staff"],
      handoff_status: ["pending", "accepted", "rejected", "cancelled"],
    },
  },
} as const
