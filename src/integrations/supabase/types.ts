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
          organization_id: string
          rating: string
          user_id: string | null
        }
        Insert: {
          conversation_messages?: Json | null
          created_at?: string | null
          id?: string
          message_id: string
          organization_id: string
          rating: string
          user_id?: string | null
        }
        Update: {
          conversation_messages?: Json | null
          created_at?: string | null
          id?: string
          message_id?: string
          organization_id?: string
          rating?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          bot_type: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          error_count: number
          fields_applied: boolean
          fields_extracted: number
          id: string
          message_count: number
          navigation_action: string | null
          organization_id: string
          scenario_id: string | null
          user_id: string | null
        }
        Insert: {
          bot_type: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          error_count?: number
          fields_applied?: boolean
          fields_extracted?: number
          id?: string
          message_count?: number
          navigation_action?: string | null
          organization_id: string
          scenario_id?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          error_count?: number
          fields_applied?: boolean
          fields_extracted?: number
          id?: string
          message_count?: number
          navigation_action?: string | null
          organization_id?: string
          scenario_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_cards: {
        Row: {
          coaching_tips: string
          common_failure: string
          confidence_dependency: string
          created_at: string
          enhanced: string
          example_prompt: string | null
          financial_impact: string
          gdpr_guardrail: string
          id: string
          min_required: string
          navigation_guidance: string
          purpose: string
          scenario_group: string
          scenario_id: number
          scenario_name: string
          scenario_slug: string
          trigger_phrases: string
          updated_at: string
        }
        Insert: {
          coaching_tips: string
          common_failure: string
          confidence_dependency: string
          created_at?: string
          enhanced: string
          example_prompt?: string | null
          financial_impact: string
          gdpr_guardrail: string
          id?: string
          min_required: string
          navigation_guidance: string
          purpose: string
          scenario_group: string
          scenario_id: number
          scenario_name: string
          scenario_slug: string
          trigger_phrases: string
          updated_at?: string
        }
        Update: {
          coaching_tips?: string
          common_failure?: string
          confidence_dependency?: string
          created_at?: string
          enhanced?: string
          example_prompt?: string | null
          financial_impact?: string
          gdpr_guardrail?: string
          id?: string
          min_required?: string
          navigation_guidance?: string
          purpose?: string
          scenario_group?: string
          scenario_id?: number
          scenario_name?: string
          scenario_slug?: string
          trigger_phrases?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string | null
          status: string
          template_name: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          status?: string
          template_name?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string | null
          status?: string
          template_name?: string | null
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enterprise_trackers: {
        Row: {
          created_at: string
          file_references: Json
          id: string
          name: string
          organization_id: string
          parameters: Json
          status: string
          tracker_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_references?: Json
          id?: string
          name: string
          organization_id: string
          parameters?: Json
          status?: string
          tracker_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_references?: Json
          id?: string
          name?: string
          organization_id?: string
          parameters?: Json
          status?: string
          tracker_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_trackers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      file_access_audit: {
        Row: {
          accessed_by: string
          action: string
          created_at: string
          error_message: string | null
          file_id: string | null
          id: string
          ip_address: string | null
          organization_id: string
          status: string
          user_agent: string | null
        }
        Insert: {
          accessed_by: string
          action: string
          created_at?: string
          error_message?: string | null
          file_id?: string | null
          id?: string
          ip_address?: string | null
          organization_id: string
          status: string
          user_agent?: string | null
        }
        Update: {
          accessed_by?: string
          action?: string
          created_at?: string
          error_message?: string | null
          file_id?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_access_audit_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "user_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_file_audit_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_metrics: {
        Row: {
          active_users: number
          burn_rate: number
          created_at: string
          id: string
          mrr: number
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          runway_months?: number
          strategic_hypothesis?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      inflation_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          alert_level: string
          alert_source: string
          bridge_scenarios: string[] | null
          created_at: string
          driver_id: string
          id: string
          organization_id: string
          scan_id: string | null
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          alert_level: string
          alert_source: string
          bridge_scenarios?: string[] | null
          created_at?: string
          driver_id: string
          id?: string
          organization_id: string
          scan_id?: string | null
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          alert_level?: string
          alert_source?: string
          bridge_scenarios?: string[] | null
          created_at?: string
          driver_id?: string
          id?: string
          organization_id?: string
          scan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inflation_alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inflation_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inflation_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inflation_alerts_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "inflation_event_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      inflation_drivers: {
        Row: {
          context_summary: string | null
          created_at: string
          current_status: string
          driver_name: string
          enrichment_cadence: string
          id: string
          is_active: boolean
          last_enriched_at: string | null
          last_scanned_at: string | null
          organization_id: string
          rationale: string | null
          scan_cadence: string
          source: string
          tracker_id: string
          trigger_description: string | null
          weight: number | null
        }
        Insert: {
          context_summary?: string | null
          created_at?: string
          current_status?: string
          driver_name: string
          enrichment_cadence?: string
          id?: string
          is_active?: boolean
          last_enriched_at?: string | null
          last_scanned_at?: string | null
          organization_id: string
          rationale?: string | null
          scan_cadence?: string
          source?: string
          tracker_id: string
          trigger_description?: string | null
          weight?: number | null
        }
        Update: {
          context_summary?: string | null
          created_at?: string
          current_status?: string
          driver_name?: string
          enrichment_cadence?: string
          id?: string
          is_active?: boolean
          last_enriched_at?: string | null
          last_scanned_at?: string | null
          organization_id?: string
          rationale?: string | null
          scan_cadence?: string
          source?: string
          tracker_id?: string
          trigger_description?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inflation_drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inflation_drivers_tracker_id_fkey"
            columns: ["tracker_id"]
            isOneToOne: false
            referencedRelation: "inflation_trackers"
            referencedColumns: ["id"]
          },
        ]
      }
      inflation_event_scans: {
        Row: {
          confidence_level: string | null
          created_at: string
          driver_id: string
          event_detected: boolean
          id: string
          organization_id: string
          scan_date: string
          source_summary: string | null
          source_urls: string[] | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          driver_id: string
          event_detected?: boolean
          id?: string
          organization_id: string
          scan_date?: string
          source_summary?: string | null
          source_urls?: string[] | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          driver_id?: string
          event_detected?: boolean
          id?: string
          organization_id?: string
          scan_date?: string
          source_summary?: string | null
          source_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "inflation_event_scans_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "inflation_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inflation_event_scans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inflation_trackers: {
        Row: {
          created_at: string
          created_by: string
          driver_count_target: number
          goods_definition: string
          id: string
          is_active: boolean
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          driver_count_target?: number
          goods_definition: string
          id?: string
          is_active?: boolean
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          driver_count_target?: number
          goods_definition?: string
          id?: string
          is_active?: boolean
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inflation_trackers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      intel_queries: {
        Row: {
          citations: Json | null
          created_at: string
          domain_filter: string[] | null
          error_message: string | null
          id: string
          model_used: string | null
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          processing_time_ms?: number | null
          query_text?: string
          query_type?: string
          raw_response?: Json | null
          recency_filter?: string | null
          success?: boolean
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intel_queries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      methodology_change_log: {
        Row: {
          change_summary: string | null
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Insert: {
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
        }
        Update: {
          change_summary?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      methodology_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          updated_at?: string
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
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_super_admin: boolean
          organization_id: string | null
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          is_super_admin?: boolean
          organization_id?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_super_admin?: boolean
          organization_id?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_intel_configs: {
        Row: {
          config_type: string
          context: string | null
          created_at: string
          domain_filter: string[] | null
          grounding_target: Json | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          organization_id: string
          query_text: string
          query_type: string
          recency_filter: string | null
          schedule_cron: string | null
          trigger_instruction: string | null
          user_id: string
        }
        Insert: {
          config_type: string
          context?: string | null
          created_at?: string
          domain_filter?: string[] | null
          grounding_target?: Json | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          organization_id: string
          query_text: string
          query_type: string
          recency_filter?: string | null
          schedule_cron?: string | null
          trigger_instruction?: string | null
          user_id: string
        }
        Update: {
          config_type?: string
          context?: string | null
          created_at?: string
          domain_filter?: string[] | null
          grounding_target?: Json | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          organization_id?: string
          query_text?: string
          query_type?: string
          recency_filter?: string | null
          schedule_cron?: string | null
          trigger_instruction?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_intel_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          feedback_type: string | null
          id: string
          rating: number
          scenario_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          rating: number
          scenario_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          rating?: number
          scenario_id?: string
        }
        Relationships: []
      }
      scenario_field_config: {
        Row: {
          block_guidance: string | null
          block_id: string
          block_label: string
          created_at: string
          degraded_guidance: string | null
          deviation_type: string
          expected_data_type: string
          expected_keywords: string[] | null
          id: string
          is_required: boolean
          min_words: number
          minimum_guidance: string | null
          optimal_guidance: string | null
          scenario_id: number
          scenario_slug: string
          sub_prompts: Json | null
          updated_at: string
        }
        Insert: {
          block_guidance?: string | null
          block_id: string
          block_label: string
          created_at?: string
          degraded_guidance?: string | null
          deviation_type: string
          expected_data_type: string
          expected_keywords?: string[] | null
          id?: string
          is_required?: boolean
          min_words?: number
          minimum_guidance?: string | null
          optimal_guidance?: string | null
          scenario_id: number
          scenario_slug: string
          sub_prompts?: Json | null
          updated_at?: string
        }
        Update: {
          block_guidance?: string | null
          block_id?: string
          block_label?: string
          created_at?: string
          degraded_guidance?: string | null
          deviation_type?: string
          expected_data_type?: string
          expected_keywords?: string[] | null
          id?: string
          is_required?: boolean
          min_words?: number
          minimum_guidance?: string | null
          optimal_guidance?: string | null
          scenario_id?: number
          scenario_slug?: string
          sub_prompts?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_field_config_scenario_slug_fkey"
            columns: ["scenario_slug"]
            isOneToOne: false
            referencedRelation: "coaching_cards"
            referencedColumns: ["scenario_slug"]
          },
        ]
      }
      scenario_file_attachments: {
        Row: {
          attached_at: string
          file_id: string
          id: string
          organization_id: string
          scenario_run_id: string
          scenario_type: string
          user_id: string
        }
        Insert: {
          attached_at?: string
          file_id: string
          id?: string
          organization_id: string
          scenario_run_id: string
          scenario_type: string
          user_id: string
        }
        Update: {
          attached_at?: string
          file_id?: string
          id?: string
          organization_id?: string
          scenario_run_id?: string
          scenario_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_file_attachments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "user_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_file_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_reports: {
        Row: {
          created_at: string
          expires_at: string
          organization_id: string
          payload: Json
          share_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          organization_id: string
          payload: Json
          share_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          organization_id?: string
          payload?: Json
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          scenario_data?: Json
          scenario_type?: string
          system_prompt?: string
          user_prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_prompts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_reports: {
        Row: {
          completion_tokens: number | null
          created_at: string
          deanonymized_response: string | null
          error_message: string | null
          id: string
          model: string
          organization_id: string
          processing_time_ms: number | null
          prompt_id: string
          prompt_tokens: number | null
          raw_response: string
          shadow_log: Json | null
          success: boolean
          token_usage: Json | null
          total_tokens: number | null
          validation_result: Json | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          deanonymized_response?: string | null
          error_message?: string | null
          id?: string
          model: string
          organization_id: string
          processing_time_ms?: number | null
          prompt_id: string
          prompt_tokens?: number | null
          raw_response: string
          shadow_log?: Json | null
          success?: boolean
          token_usage?: Json | null
          total_tokens?: number | null
          validation_result?: Json | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          deanonymized_response?: string | null
          error_message?: string | null
          id?: string
          model?: string
          organization_id?: string
          processing_time_ms?: number | null
          prompt_id?: string
          prompt_tokens?: number | null
          raw_response?: string
          shadow_log?: Json | null
          success?: boolean
          token_usage?: Json | null
          total_tokens?: number | null
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "test_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_reports_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "test_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          mime_type: string
          organization_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          mime_type: string
          organization_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          mime_type?: string
          organization_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_rules: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_active: boolean
          pattern: string
          rule_type: string
          scenario_type: string | null
          severity: string
          suggestion: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean
          pattern: string
          rule_type: string
          scenario_type?: string | null
          severity?: string
          suggestion?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean
          pattern?: string
          rule_type?: string
          scenario_type?: string | null
          severity?: string
          suggestion?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      pipeline_iq_stats: {
        Row: {
          accuracy: number | null
          avg_processing_time_ms: number | null
          batch_date: string | null
          total_runs: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      create_shared_report: {
        Args: { p_expires_at: string; p_payload: Json }
        Returns: string
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: undefined
      }
      get_evolutionary_directives: {
        Args: { limit_num?: number }
        Returns: {
          directive_text: string
          occurrence_count: number
          source_field_action: string
          target_scenario: string
        }[]
      }
      get_shared_report: { Args: { p_share_id: string }; Returns: Json }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_org_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      is_org_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      save_intel_to_knowledge_base: {
        Args: {
          p_category_name?: string
          p_category_slug?: string
          p_citations?: Json
          p_confidence_score?: number
          p_content: string
          p_industry_name?: string
          p_industry_slug?: string
          p_key_trends?: string[]
          p_model_used?: string
          p_opportunities?: string[]
          p_processing_time_ms?: number
          p_risk_signals?: string[]
        }
        Returns: string
      }
    }
    Enums: {
      org_role: "admin" | "manager" | "user"
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
      org_role: ["admin", "manager", "user"],
    },
  },
} as const
