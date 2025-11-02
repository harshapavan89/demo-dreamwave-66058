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
      daily_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          plan_id: string
          quiz_attempts: number | null
          quiz_questions: Json | null
          quiz_score: number | null
          task_type: string
          title: string
          user_id: string
          verification_status: string | null
          verification_url: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          quiz_attempts?: number | null
          quiz_questions?: Json | null
          quiz_score?: number | null
          task_type?: string
          title: string
          user_id: string
          verification_status?: string | null
          verification_url?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          quiz_attempts?: number | null
          quiz_questions?: Json | null
          quiz_score?: number | null
          task_type?: string
          title?: string
          user_id?: string
          verification_status?: string | null
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_leaderboard: {
        Row: {
          current_streak: number | null
          id: string
          last_updated: string | null
          longest_streak: number | null
          total_tasks_completed: number | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_updated?: string | null
          longest_streak?: number | null
          total_tasks_completed?: number | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_updated?: string | null
          longest_streak?: number | null
          total_tasks_completed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message_content: string | null
          notification_type: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message_content?: string | null
          notification_type: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message_content?: string | null
          notification_type?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          ai_tone: string
          created_at: string
          enabled: boolean
          id: string
          notification_types: string[]
          reminder_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_tone?: string
          created_at?: string
          enabled?: boolean
          id?: string
          notification_types?: string[]
          reminder_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_tone?: string
          created_at?: string
          enabled?: boolean
          id?: string
          notification_types?: string[]
          reminder_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          available_days: string[] | null
          available_time_slots: Json | null
          created_at: string | null
          daily_hours_commitment: number | null
          description: string | null
          id: string
          pdf_notes_url: string | null
          progress_percentage: number | null
          start_date: string | null
          target_date: string | null
          target_duration_months: number | null
          title: string
          user_id: string
        }
        Insert: {
          available_days?: string[] | null
          available_time_slots?: Json | null
          created_at?: string | null
          daily_hours_commitment?: number | null
          description?: string | null
          id?: string
          pdf_notes_url?: string | null
          progress_percentage?: number | null
          start_date?: string | null
          target_date?: string | null
          target_duration_months?: number | null
          title: string
          user_id: string
        }
        Update: {
          available_days?: string[] | null
          available_time_slots?: Json | null
          created_at?: string | null
          daily_hours_commitment?: number | null
          description?: string | null
          id?: string
          pdf_notes_url?: string | null
          progress_percentage?: number | null
          start_date?: string | null
          target_date?: string | null
          target_duration_months?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coaching_mode: string | null
          created_at: string | null
          email: string | null
          email_notifications_enabled: boolean | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          coaching_mode?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          coaching_mode?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string | null
          id: string
          plan_id: string
          resource_type: string | null
          thumbnail: string | null
          title: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_id: string
          resource_type?: string | null
          thumbnail?: string | null
          title: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_id?: string
          resource_type?: string | null
          thumbnail?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_completed_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_completed_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
    Enums: {},
  },
} as const
