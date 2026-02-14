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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_feedback: {
        Row: {
          conversation_messages: Json | null
          created_at: string | null
          id: string
          message_id: string
          rating: string
        }
        Insert: {
          conversation_messages?: Json | null
          created_at?: string | null
          id?: string
          message_id: string
          rating: string
        }
        Update: {
          conversation_messages?: Json | null
          created_at?: string | null
          id?: string
          message_id?: string
          rating?: string
        }
        Relationships: []
      }
      founder_metrics: {
        Row: {
          active_users: number
          burn_rate: number
          created_at: string
          id: string
          mrr: number
          runway_months: number
          strategic_hypothesis: string
          updated_at: string
        }
        Insert: {
          active_users?: number
          burn_rate?: number
          created_at?: string
          id?: string
          mrr?: number
          runway_months?: number
          strategic_hypothesis?: string
          updated_at?: string
        }
        Update: {
          active_users?: number
          burn_rate?: number
          created_at?: string
          id?: string
          mrr?: number
          runway_months?: number
          strategic_hypothesis?: string
          updated_at?: string
        }
        Relationships: []
      }
      industry_contexts: {
        Row: {
          constraints: string[]
          created_at: string
          id: string
          kpis: string[]
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          constraints?: string[]
          created_at?: string
          id?: string
          kpis?: string[]
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          constraints?: string[]
          created_at?: string
          id?: string
          kpis?: string[]
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      intel_queries: {
        Row: {
          citations: Json | null
          created_at: string
          domain_filter: string[] | null
          error_message: string | null
          id: string
          model_used: string | null
          processing_time_ms: number | null
          query_text: string
          query_type: string
          raw_response: Json | null
          recency_filter: string | null
          success: boolean
          summary: string | null
        }
        Insert: {
          citations?: Json | null
          created_at?: string
          domain_filter?: string[] | null
          error_message?: string | null
          id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          query_text: string
          query_type: string
          raw_response?: Json | null
          recency_filter?: string | null
          success?: boolean
          summary?: string | null
        }
        Update: {
          citations?: Json | null
          created_at?: string
          domain_filter?: string[] | null
          error_message?: string | null
          id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          query_text?: string
          query_type?: string
          raw_response?: Json | null
          recency_filter?: string | null
          success?: boolean
          summary?: string | null
        }
        Relationships: []
      }
      market_insights: {
        Row: {
          category_name: string
          category_slug: string
          citations: Json | null
          confidence_score: number
          content: string
          created_at: string
          id: string
          industry_name: string
          industry_slug: string
          is_active: boolean
          key_trends: string[] | null
          model_used: string | null
          opportunities: string[] | null
          processing_time_ms: number | null
          raw_response: Json | null
          risk_signals: string[] | null
        }
        Insert: {
          category_name: string
          category_slug: string
          citations?: Json | null
          confidence_score: number
          content: string
          created_at?: string
          id?: string
          industry_name: string
          industry_slug: string
          is_active?: boolean
          key_trends?: string[] | null
          model_used?: string | null
          opportunities?: string[] | null
          processing_time_ms?: number | null
          raw_response?: Json | null
          risk_signals?: string[] | null
        }
        Update: {
          category_name?: string
          category_slug?: string
          citations?: Json | null
          confidence_score?: number
          content?: string
          created_at?: string
          id?: string
          industry_name?: string
          industry_slug?: string
          is_active?: boolean
          key_trends?: string[] | null
          model_used?: string | null
          opportunities?: string[] | null
          processing_time_ms?: number | null
          raw_response?: Json | null
          risk_signals?: string[] | null
        }
        Relationships: []
      }
      procurement_categories: {
        Row: {
          characteristics: string
          created_at: string
          id: string
          kpis: string[]
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          characteristics: string
          created_at?: string
          id?: string
          kpis?: string[]
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          characteristics?: string
          created_at?: string
          id?: string
          kpis?: string[]
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_reports: {
        Row: {
          created_at: string
          expires_at: string
          payload: Json
          share_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          payload: Json
          share_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          payload?: Json
          share_id?: string
        }
        Relationships: []
      }
      test_prompts: {
        Row: {
          anonymization_metadata: Json | null
          category_slug: string | null
          created_at: string
          grounding_context: Json | null
          id: string
          industry_slug: string | null
          scenario_data: Json
          scenario_type: string
          system_prompt: string
          user_prompt: string
        }
        Insert: {
          anonymization_metadata?: Json | null
          category_slug?: string | null
          created_at?: string
          grounding_context?: Json | null
          id?: string
          industry_slug?: string | null
          scenario_data?: Json
          scenario_type: string
          system_prompt: string
          user_prompt: string
        }
        Update: {
          anonymization_metadata?: Json | null
          category_slug?: string | null
          created_at?: string
          grounding_context?: Json | null
          id?: string
          industry_slug?: string | null
          scenario_data?: Json
          scenario_type?: string
          system_prompt?: string
          user_prompt?: string
        }
        Relationships: []
      }
      test_reports: {
        Row: {
          created_at: string
          deanonymized_response: string | null
          error_message: string | null
          id: string
          model: string
          processing_time_ms: number | null
          prompt_id: string
          raw_response: string
          success: boolean
          token_usage: Json | null
          validation_result: Json | null
        }
        Insert: {
          created_at?: string
          deanonymized_response?: string | null
          error_message?: string | null
          id?: string
          model: string
          processing_time_ms?: number | null
          prompt_id: string
          raw_response: string
          success?: boolean
          token_usage?: Json | null
          validation_result?: Json | null
        }
        Update: {
          created_at?: string
          deanonymized_response?: string | null
          error_message?: string | null
          id?: string
          model?: string
          processing_time_ms?: number | null
          prompt_id?: string
          raw_response?: string
          success?: boolean
          token_usage?: Json | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "test_reports_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "test_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      create_shared_report: {
        Args: { p_expires_at: string; p_payload: Json; p_share_id: string }
        Returns: undefined
      }
      get_shared_report: { Args: { p_share_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
