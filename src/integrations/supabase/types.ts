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
      activity_logs: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          created_by: string | null
          flagged_as_incident: boolean | null
          group_id: string | null
          id: string
          instance_id: string
          location_lat: number | null
          location_lon: number | null
          location_source: string | null
          log_type: string
          notes: string | null
          participant_notes: Json | null
          reported_by: string | null
          tenant_id: string
          time_observed: string
          time_submitted: string
          title: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          created_by?: string | null
          flagged_as_incident?: boolean | null
          group_id?: string | null
          id?: string
          instance_id: string
          location_lat?: number | null
          location_lon?: number | null
          location_source?: string | null
          log_type: string
          notes?: string | null
          participant_notes?: Json | null
          reported_by?: string | null
          tenant_id: string
          time_observed: string
          time_submitted?: string
          title?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          created_by?: string | null
          flagged_as_incident?: boolean | null
          group_id?: string | null
          id?: string
          instance_id?: string
          location_lat?: number | null
          location_lon?: number | null
          location_source?: string | null
          log_type?: string
          notes?: string | null
          participant_notes?: Json | null
          reported_by?: string | null
          tenant_id?: string
          time_observed?: string
          time_submitted?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          scopes?: string[]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          key_prefix: string | null
          method: string
          path: string
          request_body: Json | null
          response_body: Json | null
          response_time_ms: number | null
          status_code: number
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          key_prefix?: string | null
          method: string
          path: string
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code: number
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          key_prefix?: string | null
          method?: string
          path?: string
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_cases: {
        Row: {
          assigned_to_id: string | null
          assigned_to_name: string | null
          associated_strike_id: string | null
          category: string
          created_at: string
          event_time: string | null
          id: string
          instance_id: string
          involved_staff: string[] | null
          involves_staff_member: boolean | null
          is_sensitive_safeguarding: boolean | null
          location: string | null
          metadata: Json | null
          overview: string | null
          parent_notification_date: string | null
          parent_notification_sent: boolean | null
          participant_id: string
          privacy_level: string
          raised_by: string | null
          requires_immediate_action: boolean | null
          severity_level: string
          status: string
          tenant_id: string
          timestamp: string
          updated_at: string
          witnesses: string[] | null
        }
        Insert: {
          assigned_to_id?: string | null
          assigned_to_name?: string | null
          associated_strike_id?: string | null
          category?: string
          created_at?: string
          event_time?: string | null
          id?: string
          instance_id: string
          involved_staff?: string[] | null
          involves_staff_member?: boolean | null
          is_sensitive_safeguarding?: boolean | null
          location?: string | null
          metadata?: Json | null
          overview?: string | null
          parent_notification_date?: string | null
          parent_notification_sent?: boolean | null
          participant_id: string
          privacy_level?: string
          raised_by?: string | null
          requires_immediate_action?: boolean | null
          severity_level?: string
          status?: string
          tenant_id: string
          timestamp?: string
          updated_at?: string
          witnesses?: string[] | null
        }
        Update: {
          assigned_to_id?: string | null
          assigned_to_name?: string | null
          associated_strike_id?: string | null
          category?: string
          created_at?: string
          event_time?: string | null
          id?: string
          instance_id?: string
          involved_staff?: string[] | null
          involves_staff_member?: boolean | null
          is_sensitive_safeguarding?: boolean | null
          location?: string | null
          metadata?: Json | null
          overview?: string | null
          parent_notification_date?: string | null
          parent_notification_sent?: boolean | null
          participant_id?: string
          privacy_level?: string
          raised_by?: string | null
          requires_immediate_action?: boolean | null
          severity_level?: string
          status?: string
          tenant_id?: string
          timestamp?: string
          updated_at?: string
          witnesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "behavior_cases_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_cases_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_cases_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_cases_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          geo_polygon: Json | null
          id: string
          instance_id: string | null
          name: string
          site_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          geo_polygon?: Json | null
          id: string
          instance_id?: string | null
          name: string
          site_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          geo_polygon?: Json | null
          id?: string
          instance_id?: string | null
          name?: string
          site_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      case_actions: {
        Row: {
          action_type: string
          case_id: string
          case_type: string
          created_at: string
          description: string | null
          id: string
          instance_id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          outcome: string | null
          participant_id: string | null
          performed_by: string | null
          performed_by_name: string | null
          timestamp: string
        }
        Insert: {
          action_type?: string
          case_id: string
          case_type?: string
          created_at?: string
          description?: string | null
          id?: string
          instance_id: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          outcome?: string | null
          participant_id?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          timestamp?: string
        }
        Update: {
          action_type?: string
          case_id?: string
          case_type?: string
          created_at?: string
          description?: string | null
          id?: string
          instance_id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          outcome?: string | null
          participant_id?: string | null
          performed_by?: string | null
          performed_by_name?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "behavior_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_actions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_actions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_actions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_categories: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled: boolean | null
          icon: string | null
          id: string
          instance_id: string | null
          name: string
          sort_order: number | null
          tenant_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          icon?: string | null
          id?: string
          instance_id?: string | null
          name: string
          sort_order?: number | null
          tenant_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          icon?: string | null
          id?: string
          instance_id?: string | null
          name?: string
          sort_order?: number | null
          tenant_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_categories_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      case_comments: {
        Row: {
          author_id: string
          author_name: string
          case_id: string
          content: string
          created_at: string
          id: string
          timestamp: string
        }
        Insert: {
          author_id: string
          author_name: string
          case_id: string
          content: string
          created_at?: string
          id?: string
          timestamp?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          case_id?: string
          content?: string
          created_at?: string
          id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_comments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "behavior_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_sessions: {
        Row: {
          attendees: Json | null
          completed_at: string | null
          group_id: string | null
          id: string
          instance_id: string
          notes: string | null
          session_name: string
          session_type: string | null
          started_at: string
          started_by: string | null
        }
        Insert: {
          attendees?: Json | null
          completed_at?: string | null
          group_id?: string | null
          id?: string
          instance_id: string
          notes?: string | null
          session_name: string
          session_type?: string | null
          started_at?: string
          started_by?: string | null
        }
        Update: {
          attendees?: Json | null
          completed_at?: string | null
          group_id?: string | null
          id?: string
          instance_id?: string
          notes?: string | null
          session_name?: string
          session_type?: string | null
          started_at?: string
          started_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_sessions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_sessions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_sessions_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      formal_warnings: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by_participant: boolean
          case_id: string | null
          created_at: string
          details: string | null
          id: string
          instance_id: string
          issued_by: string | null
          issued_by_name: string | null
          metadata: Json | null
          parent_notification_date: string | null
          parent_notified: boolean
          participant_id: string
          reason: string
          tenant_id: string
          updated_at: string
          warning_level: number
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by_participant?: boolean
          case_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          instance_id: string
          issued_by?: string | null
          issued_by_name?: string | null
          metadata?: Json | null
          parent_notification_date?: string | null
          parent_notified?: boolean
          participant_id: string
          reason: string
          tenant_id: string
          updated_at?: string
          warning_level?: number
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by_participant?: boolean
          case_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          instance_id?: string
          issued_by?: string | null
          issued_by_name?: string | null
          metadata?: Json | null
          parent_notification_date?: string | null
          parent_notified?: boolean
          participant_id?: string
          reason?: string
          tenant_id?: string
          updated_at?: string
          warning_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "formal_warnings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "behavior_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formal_warnings_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formal_warnings_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formal_warnings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      global_stage_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          template_data: Json
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          template_data: Json
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          template_data?: Json
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      group_stage_participant_status: {
        Row: {
          comment: string | null
          group_stage_progress_id: string | null
          id: string
          is_present: boolean | null
          participant_id: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          group_stage_progress_id?: string | null
          id?: string
          is_present?: boolean | null
          participant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          group_stage_progress_id?: string | null
          id?: string
          is_present?: boolean | null
          participant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_stage_participant_status_group_stage_progress_id_fkey"
            columns: ["group_stage_progress_id"]
            isOneToOne: false
            referencedRelation: "group_stage_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_stage_participant_status_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      group_stage_progress: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          incident_flag: boolean | null
          notes: string | null
          stage_template_id: string | null
          status: string
          subgroup_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          incident_flag?: boolean | null
          notes?: string | null
          stage_template_id?: string | null
          status?: string
          subgroup_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          incident_flag?: boolean | null
          notes?: string | null
          stage_template_id?: string | null
          status?: string
          subgroup_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_stage_progress_stage_template_id_fkey"
            columns: ["stage_template_id"]
            isOneToOne: false
            referencedRelation: "stage_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_stage_progress_subgroup_id_fkey"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_stage_task_completions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          group_stage_progress_id: string | null
          id: string
          response_data: Json | null
          response_value: string | null
          stage_task_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          group_stage_progress_id?: string | null
          id?: string
          response_data?: Json | null
          response_value?: string | null
          stage_task_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          group_stage_progress_id?: string | null
          id?: string
          response_data?: Json | null
          response_value?: string | null
          stage_task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_stage_task_completions_group_stage_progress_id_fkey"
            columns: ["group_stage_progress_id"]
            isOneToOne: false
            referencedRelation: "group_stage_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_stage_task_completions_stage_task_id_fkey"
            columns: ["stage_task_id"]
            isOneToOne: false
            referencedRelation: "stage_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          owner_id: string | null
          settings: Json | null
          site_id: string | null
          start_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id: string
          location?: string | null
          name: string
          owner_id?: string | null
          settings?: Json | null
          site_id?: string | null
          start_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          owner_id?: string | null
          settings?: Json | null
          site_id?: string | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instances_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_dietary_needs: {
        Row: {
          created_at: string
          notes: string | null
          participant_id: string
          restrictions: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          notes?: string | null
          participant_id: string
          restrictions?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          notes?: string | null
          participant_id?: string
          restrictions?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_dietary_needs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_instance_assignments: {
        Row: {
          arrival_date: string | null
          block_id: string | null
          created_at: string | null
          departure_date: string | null
          id: string
          instance_id: string
          is_off_site: boolean | null
          off_site_comment: string | null
          participant_id: string
          room_id: string | null
          room_number: string | null
          sub_group_id: string | null
          super_group_id: string | null
          updated_at: string | null
        }
        Insert: {
          arrival_date?: string | null
          block_id?: string | null
          created_at?: string | null
          departure_date?: string | null
          id?: string
          instance_id: string
          is_off_site?: boolean | null
          off_site_comment?: string | null
          participant_id: string
          room_id?: string | null
          room_number?: string | null
          sub_group_id?: string | null
          super_group_id?: string | null
          updated_at?: string | null
        }
        Update: {
          arrival_date?: string | null
          block_id?: string | null
          created_at?: string | null
          departure_date?: string | null
          id?: string
          instance_id?: string
          is_off_site?: boolean | null
          off_site_comment?: string | null
          participant_id?: string
          room_id?: string | null
          room_number?: string | null
          sub_group_id?: string | null
          super_group_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_instance_assignments_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_instance_assignments_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_instance_assignments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_instance_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_instance_assignments_sub_group_id_fkey"
            columns: ["sub_group_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_instance_assignments_super_group_id_fkey"
            columns: ["super_group_id"]
            isOneToOne: false
            referencedRelation: "supergroups"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_medical_info: {
        Row: {
          allergies: string[] | null
          conditions: string[] | null
          created_at: string
          notes: string | null
          participant_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          conditions?: string[] | null
          created_at?: string
          notes?: string | null
          participant_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          conditions?: string[] | null
          created_at?: string
          notes?: string | null
          participant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_medical_info_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          active_case_ids: string[] | null
          arrival_date: string | null
          block_id: string | null
          case_flags: Json | null
          created_at: string
          current_strike_count: number | null
          date_of_birth: string | null
          departure_date: string | null
          first_name: string
          full_name: string
          gender: string | null
          has_active_behavior_case: boolean | null
          has_active_welfare_case: boolean | null
          id: string
          instance_id: string | null
          is_off_site: boolean | null
          last_case_update: string | null
          light_load: boolean | null
          off_site_comment: string | null
          photo_link: string | null
          pronouns: string | null
          rank: string | null
          requires_welfare_check_in: boolean | null
          room_id: string | null
          room_number: string | null
          school_institute: string | null
          school_year: string | null
          status: string | null
          sub_group_id: string | null
          super_group_id: string | null
          surname: string
          tenant_id: string | null
          unit_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active_case_ids?: string[] | null
          arrival_date?: string | null
          block_id?: string | null
          case_flags?: Json | null
          created_at?: string
          current_strike_count?: number | null
          date_of_birth?: string | null
          departure_date?: string | null
          first_name: string
          full_name: string
          gender?: string | null
          has_active_behavior_case?: boolean | null
          has_active_welfare_case?: boolean | null
          id: string
          instance_id?: string | null
          is_off_site?: boolean | null
          last_case_update?: string | null
          light_load?: boolean | null
          off_site_comment?: string | null
          photo_link?: string | null
          pronouns?: string | null
          rank?: string | null
          requires_welfare_check_in?: boolean | null
          room_id?: string | null
          room_number?: string | null
          school_institute?: string | null
          school_year?: string | null
          status?: string | null
          sub_group_id?: string | null
          super_group_id?: string | null
          surname: string
          tenant_id?: string | null
          unit_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active_case_ids?: string[] | null
          arrival_date?: string | null
          block_id?: string | null
          case_flags?: Json | null
          created_at?: string
          current_strike_count?: number | null
          date_of_birth?: string | null
          departure_date?: string | null
          first_name?: string
          full_name?: string
          gender?: string | null
          has_active_behavior_case?: boolean | null
          has_active_welfare_case?: boolean | null
          id?: string
          instance_id?: string | null
          is_off_site?: boolean | null
          last_case_update?: string | null
          light_load?: boolean | null
          off_site_comment?: string | null
          photo_link?: string | null
          pronouns?: string | null
          rank?: string | null
          requires_welfare_check_in?: boolean | null
          room_id?: string | null
          room_number?: string | null
          school_institute?: string | null
          school_year?: string | null
          status?: string | null
          sub_group_id?: string | null
          super_group_id?: string | null
          surname?: string
          tenant_id?: string | null
          unit_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_sub_group_id_fkey"
            columns: ["sub_group_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_super_group_id_fkey"
            columns: ["super_group_id"]
            isOneToOne: false
            referencedRelation: "supergroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id: string
          name: string
          tenant_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rbac_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          performed_by: string | null
          performed_by_name: string | null
          target_user_id: string | null
          target_user_name: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          performed_by?: string | null
          performed_by_name?: string | null
          target_user_id?: string | null
          target_user_name?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          performed_by?: string | null
          performed_by_name?: string | null
          target_user_id?: string | null
          target_user_name?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      role_permission_mappings: {
        Row: {
          granted_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permission_mappings_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permission_mappings_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_system_role: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id: string
          is_system_role?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          block_id: string
          capacity: number | null
          created_at: string
          deleted_at: string | null
          geo_position: Json | null
          id: string
          instance_id: string | null
          name: string | null
          room_number: string
          room_type: string
          site_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          block_id: string
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          geo_position?: Json | null
          id: string
          instance_id?: string | null
          name?: string | null
          room_number: string
          room_type?: string
          site_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          block_id?: string
          capacity?: number | null
          created_at?: string
          deleted_at?: string | null
          geo_position?: Json | null
          id?: string
          instance_id?: string | null
          name?: string | null
          room_number?: string
          room_type?: string
          site_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          color: string
          created_at: string
          deleted_at: string | null
          gpx_geometry: Json | null
          id: string
          instance_id: string
          is_visible: boolean | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          deleted_at?: string | null
          gpx_geometry?: Json | null
          id: string
          instance_id: string
          is_visible?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          deleted_at?: string | null
          gpx_geometry?: Json | null
          id?: string
          instance_id?: string
          is_visible?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_features: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          feature_type: string
          geo_polygon: Json | null
          geo_position: Json | null
          icon: string | null
          id: string
          name: string
          site_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          feature_type?: string
          geo_polygon?: Json | null
          geo_position?: Json | null
          icon?: string | null
          id?: string
          name: string
          site_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          feature_type?: string
          geo_polygon?: Json | null
          geo_position?: Json | null
          icon?: string | null
          id?: string
          name?: string
          site_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_features_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          geo_bounds: Json | null
          id: string
          location: string | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          geo_bounds?: Json | null
          id?: string
          location?: string | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          geo_bounds?: Json | null
          id?: string
          location?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_completions: {
        Row: {
          checklist_data: Json | null
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          flagged_as_incident: boolean | null
          general_notes: string | null
          group_id: string
          id: string
          participant_notes: Json | null
          stage_number: number
          stage_template_id: string
          updated_at: string
        }
        Insert: {
          checklist_data?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          flagged_as_incident?: boolean | null
          general_notes?: string | null
          group_id: string
          id: string
          participant_notes?: Json | null
          stage_number: number
          stage_template_id: string
          updated_at?: string
        }
        Update: {
          checklist_data?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          flagged_as_incident?: boolean | null
          general_notes?: string | null
          group_id?: string
          id?: string
          participant_notes?: Json | null
          stage_number?: number
          stage_template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_completions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_completions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_completions_stage_template_id_fkey"
            columns: ["stage_template_id"]
            isOneToOne: false
            referencedRelation: "stage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_tasks: {
        Row: {
          created_at: string | null
          description: string
          field_config: Json | null
          field_type: string
          id: string
          order_number: number
          placeholder: string | null
          required: boolean | null
          stage_template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          field_config?: Json | null
          field_type?: string
          id?: string
          order_number: number
          placeholder?: string | null
          required?: boolean | null
          stage_template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          field_config?: Json | null
          field_type?: string
          id?: string
          order_number?: number
          placeholder?: string | null
          required?: boolean | null
          stage_template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_tasks_stage_template_id_fkey"
            columns: ["stage_template_id"]
            isOneToOne: false
            referencedRelation: "stage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_templates: {
        Row: {
          checklist_items: Json | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          instance_id: string
          order_number: number
          requires_previous_stage: boolean | null
          stage_number: number
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          checklist_items?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          instance_id: string
          order_number?: number
          requires_previous_stage?: boolean | null
          stage_number: number
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          checklist_items?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          instance_id?: string
          order_number?: number
          requires_previous_stage?: boolean | null
          stage_number?: number
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_templates_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subgroups: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          hardware_id: string | null
          id: string
          instance_id: string
          is_vehicle: boolean | null
          last_activity_at: string | null
          name: string
          notifications: boolean | null
          parent_supergroup_id: string
          purpose: string | null
          route_id: string | null
          tenant_id: string
          tracker_name: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          hardware_id?: string | null
          id: string
          instance_id: string
          is_vehicle?: boolean | null
          last_activity_at?: string | null
          name: string
          notifications?: boolean | null
          parent_supergroup_id: string
          purpose?: string | null
          route_id?: string | null
          tenant_id: string
          tracker_name?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          hardware_id?: string | null
          id?: string
          instance_id?: string
          is_vehicle?: boolean | null
          last_activity_at?: string | null
          name?: string
          notifications?: boolean | null
          parent_supergroup_id?: string
          purpose?: string | null
          route_id?: string | null
          tenant_id?: string
          tracker_name?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subgroups_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subgroups_parent_supergroup_id_fkey"
            columns: ["parent_supergroup_id"]
            isOneToOne: false
            referencedRelation: "supergroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subgroups_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subgroups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supergroups: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          instance_id: string
          name: string
          notifications: boolean | null
          purpose: string | null
          tenant_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id: string
          instance_id: string
          name: string
          notifications?: boolean | null
          purpose?: string | null
          tenant_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          instance_id?: string
          name?: string
          notifications?: boolean | null
          purpose?: string | null
          tenant_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supergroups_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supergroups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          database_id: string | null
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          reference_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          database_id?: string | null
          deleted_at?: string | null
          id: string
          is_active?: boolean
          name: string
          reference_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          database_id?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reference_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracker_logs: {
        Row: {
          accuracy: number | null
          altitude: number | null
          battery_level: number | null
          battery_volts: number | null
          created_at: string
          device_desc: string | null
          group_id: string
          id: string
          latitude: number | null
          longitude: number | null
          satellite_count: number | null
          subgroup_id: string | null
          timestamp: string
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          battery_level?: number | null
          battery_volts?: number | null
          created_at?: string
          device_desc?: string | null
          group_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          satellite_count?: number | null
          subgroup_id?: string | null
          timestamp: string
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          battery_level?: number | null
          battery_volts?: number | null
          created_at?: string
          device_desc?: string | null
          group_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          satellite_count?: number | null
          subgroup_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tracker_logs_subgroup"
            columns: ["subgroup_id"]
            isOneToOne: false
            referencedRelation: "subgroups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_group_assignments: {
        Row: {
          added_at: string
          group_id: string
          group_type: string
          id: string
          removed_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          group_type: string
          id?: string
          removed_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          group_type?: string
          id?: string
          removed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_instance_assignments: {
        Row: {
          added_at: string
          id: string
          instance_id: string
          instance_name: string | null
          removed_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          instance_id: string
          instance_name?: string | null
          removed_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          instance_id?: string
          instance_name?: string | null
          removed_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_instance_assignments_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_instance_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          id: string
          instance_id: string
          is_vehicle: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          timestamp: string | null
        }
        Insert: {
          id: string
          instance_id: string
          is_vehicle?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          instance_id?: string
          is_vehicle?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instances"
            referencedColumns: ["id"]
          },
        ]
      }
      user_participant_links: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          participant_id: string
          relationship_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          participant_id: string
          relationship_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          participant_id?: string
          relationship_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_participant_links_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_participant_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile_photo_history: {
        Row: {
          changed_at: string
          changed_by: string
          created_at: string
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          changed_at: string
          changed_by: string
          created_at?: string
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          created_at?: string
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_photo_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          id: string
          removed_at: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          removed_at?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          removed_at?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          api_key: string | null
          api_key_created_at: string | null
          api_key_last_used_at: string | null
          archive_status: string
          auth_id: string
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string | null
          profile_photo_url: string | null
          status: string
          surname: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_key_created_at?: string | null
          api_key_last_used_at?: string | null
          archive_status?: string
          auth_id: string
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name: string
          id: string
          last_name?: string | null
          profile_photo_url?: string | null
          status?: string
          surname?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_key_created_at?: string | null
          api_key_last_used_at?: string | null
          archive_status?: string
          auth_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string | null
          profile_photo_url?: string | null
          status?: string
          surname?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      welfare_cases: {
        Row: {
          assigned_to_id: string | null
          assigned_to_name: string | null
          category: string
          check_in_frequency: string | null
          check_in_required: boolean | null
          created_at: string | null
          id: string
          instance_id: string
          involves_staff_member: boolean | null
          is_safeguarding_issue: boolean | null
          is_sensitive_safeguarding: boolean | null
          location: string | null
          metadata: Json | null
          overview: string | null
          participant_id: string
          privacy_level: string
          raised_by: string | null
          requires_external_support: boolean | null
          status: string
          support_providers: string[] | null
          tenant_id: string
          timestamp: string | null
          updated_at: string | null
          urgency_level: string
          witnesses: string[] | null
        }
        Insert: {
          assigned_to_id?: string | null
          assigned_to_name?: string | null
          category?: string
          check_in_frequency?: string | null
          check_in_required?: boolean | null
          created_at?: string | null
          id?: string
          instance_id: string
          involves_staff_member?: boolean | null
          is_safeguarding_issue?: boolean | null
          is_sensitive_safeguarding?: boolean | null
          location?: string | null
          metadata?: Json | null
          overview?: string | null
          participant_id: string
          privacy_level?: string
          raised_by?: string | null
          requires_external_support?: boolean | null
          status?: string
          support_providers?: string[] | null
          tenant_id: string
          timestamp?: string | null
          updated_at?: string | null
          urgency_level?: string
          witnesses?: string[] | null
        }
        Update: {
          assigned_to_id?: string | null
          assigned_to_name?: string | null
          category?: string
          check_in_frequency?: string | null
          check_in_required?: boolean | null
          created_at?: string | null
          id?: string
          instance_id?: string
          involves_staff_member?: boolean | null
          is_safeguarding_issue?: boolean | null
          is_sensitive_safeguarding?: boolean | null
          location?: string | null
          metadata?: Json | null
          overview?: string | null
          participant_id?: string
          privacy_level?: string
          raised_by?: string | null
          requires_external_support?: boolean | null
          status?: string
          support_providers?: string[] | null
          tenant_id?: string
          timestamp?: string | null
          updated_at?: string | null
          urgency_level?: string
          witnesses?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_tenant_id: { Args: never; Returns: string }
      uuid_generate_v1: { Args: never; Returns: string }
      uuid_generate_v1mc: { Args: never; Returns: string }
      uuid_generate_v3: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_generate_v4: { Args: never; Returns: string }
      uuid_generate_v5: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_nil: { Args: never; Returns: string }
      uuid_ns_dns: { Args: never; Returns: string }
      uuid_ns_oid: { Args: never; Returns: string }
      uuid_ns_url: { Args: never; Returns: string }
      uuid_ns_x500: { Args: never; Returns: string }
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
