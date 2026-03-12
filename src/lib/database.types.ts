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
      analytics_snapshots: {
        Row: {
          created_at: string | null
          ga4_data: Json | null
          gsc_data: Json | null
          id: string
          semrush_data: Json | null
          snapshot_date: string
        }
        Insert: {
          created_at?: string | null
          ga4_data?: Json | null
          gsc_data?: Json | null
          id?: string
          semrush_data?: Json | null
          snapshot_date: string
        }
        Update: {
          created_at?: string | null
          ga4_data?: Json | null
          gsc_data?: Json | null
          id?: string
          semrush_data?: Json | null
          snapshot_date?: string
        }
        Relationships: []
      }
      client_onboarding_steps: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          id: string
          label: string
          sort_order: number
          step_key: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          label: string
          sort_order: number
          step_key: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          label?: string
          sort_order?: number
          step_key?: string
        }
        Relationships: []
      }
      client_reports: {
        Row: {
          created_at: string | null
          file_url: string | null
          highlights: Json | null
          id: string
          report_month: string
          report_type: Database["public"]["Enums"]["report_type"] | null
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          highlights?: Json | null
          id?: string
          report_month: string
          report_type?: Database["public"]["Enums"]["report_type"] | null
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          highlights?: Json | null
          id?: string
          report_month?: string
          report_type?: Database["public"]["Enums"]["report_type"] | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      client_updates: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_pinned: boolean | null
          title: string
          update_type: Database["public"]["Enums"]["update_type"] | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
          update_type?: Database["public"]["Enums"]["update_type"] | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
          update_type?: Database["public"]["Enums"]["update_type"] | null
        }
        Relationships: []
      }
      dealer_inventory: {
        Row: {
          condition: Database["public"]["Enums"]["inventory_condition"] | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          listed_date: string | null
          make: string | null
          model: string | null
          price: number | null
          sold_date: string | null
          source: Database["public"]["Enums"]["inventory_source"] | null
          specs: Json | null
          status: Database["public"]["Enums"]["inventory_status"] | null
          stock_number: string | null
          unit_name: string
          unit_type: string
          updated_at: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["inventory_condition"] | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          listed_date?: string | null
          make?: string | null
          model?: string | null
          price?: number | null
          sold_date?: string | null
          source?: Database["public"]["Enums"]["inventory_source"] | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["inventory_status"] | null
          stock_number?: string | null
          unit_name: string
          unit_type: string
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["inventory_condition"] | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          listed_date?: string | null
          make?: string | null
          model?: string | null
          price?: number | null
          sold_date?: string | null
          source?: Database["public"]["Enums"]["inventory_source"] | null
          specs?: Json | null
          status?: Database["public"]["Enums"]["inventory_status"] | null
          stock_number?: string | null
          unit_name?: string
          unit_type?: string
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      dealer_inventory_analytics: {
        Row: {
          clicks_to_call: number | null
          date: string
          id: string
          inventory_id: string
          leads_generated: number | null
          page_views: number | null
          search_impressions: number | null
          top_query: string | null
        }
        Insert: {
          clicks_to_call?: number | null
          date: string
          id?: string
          inventory_id: string
          leads_generated?: number | null
          page_views?: number | null
          search_impressions?: number | null
          top_query?: string | null
        }
        Update: {
          clicks_to_call?: number | null
          date?: string
          id?: string
          inventory_id?: string
          leads_generated?: number | null
          page_views?: number | null
          search_impressions?: number | null
          top_query?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_inventory_analytics_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "dealer_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_services: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          inventory_id: string | null
          notes: Json | null
          scheduled_date: string | null
          service_type: string
          status: Database["public"]["Enums"]["service_status"] | null
          unit_description: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          inventory_id?: string | null
          notes?: Json | null
          scheduled_date?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["service_status"] | null
          unit_description?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          inventory_id?: string | null
          notes?: Json | null
          scheduled_date?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["service_status"] | null
          unit_description?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_services_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "dealer_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          summary: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          summary: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          summary?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portal_approvals: {
        Row: {
          approval_type: Database["public"]["Enums"]["approval_type"]
          approve_by: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          requested_by: string
          resolved_at: string | null
          response_note: string | null
          status: Database["public"]["Enums"]["approval_status"] | null
        }
        Insert: {
          approval_type: Database["public"]["Enums"]["approval_type"]
          approve_by: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          requested_by: string
          resolved_at?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
        }
        Update: {
          approval_type?: Database["public"]["Enums"]["approval_type"]
          approve_by?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          requested_by?: string
          resolved_at?: string | null
          response_note?: string | null
          status?: Database["public"]["Enums"]["approval_status"] | null
        }
        Relationships: []
      }
      portal_leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string | null
          id: string
          landing_page: string | null
          lead_type: Database["public"]["Enums"]["lead_type"]
          message: string | null
          name: string
          notes: Json | null
          phone: string | null
          response_time_minutes: number | null
          search_query: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          landing_page?: string | null
          lead_type?: Database["public"]["Enums"]["lead_type"]
          message?: string | null
          name: string
          notes?: Json | null
          phone?: string | null
          response_time_minutes?: number | null
          search_query?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          landing_page?: string | null
          lead_type?: Database["public"]["Enums"]["lead_type"]
          message?: string | null
          name?: string
          notes?: Json | null
          phone?: string | null
          response_time_minutes?: number | null
          search_query?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      portal_message_threads: {
        Row: {
          category: Database["public"]["Enums"]["message_category"] | null
          created_at: string | null
          id: string
          last_message_at: string | null
          status: Database["public"]["Enums"]["thread_status"] | null
          subject: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["message_category"] | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["thread_status"] | null
          subject: string
        }
        Update: {
          category?: Database["public"]["Enums"]["message_category"] | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          status?: Database["public"]["Enums"]["thread_status"] | null
          subject?: string
        }
        Relationships: []
      }
      portal_messages: {
        Row: {
          attachments: Json | null
          body: string
          created_at: string | null
          id: string
          read_by: string[] | null
          reference_id: string | null
          reference_type: string | null
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["sender_role"]
          thread_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          reference_id?: string | null
          reference_type?: string | null
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["sender_role"]
          thread_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          created_at?: string | null
          id?: string
          read_by?: string[] | null
          reference_id?: string | null
          reference_type?: string | null
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["sender_role"]
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "portal_message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      seo_keywords: {
        Row: {
          id: string
          keyword: string
          position: number | null
          previous_position: number | null
          clicks: number | null
          impressions: number | null
          ctr: number | null
          page_url: string | null
          snapshot_date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          keyword: string
          position?: number | null
          previous_position?: number | null
          clicks?: number | null
          impressions?: number | null
          ctr?: number | null
          page_url?: string | null
          snapshot_date?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          keyword?: string
          position?: number | null
          previous_position?: number | null
          clicks?: number | null
          impressions?: number | null
          ctr?: number | null
          page_url?: string | null
          snapshot_date?: string
          created_at?: string | null
        }
        Relationships: []
      }
      blog_posts_performance: {
        Row: {
          id: string
          title: string
          slug: string
          published_date: string | null
          pageviews: number | null
          sessions: number | null
          avg_time_on_page: number | null
          bounce_rate: number | null
          top_keyword: string | null
          top_keyword_position: number | null
          snapshot_date: string
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          published_date?: string | null
          pageviews?: number | null
          sessions?: number | null
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          top_keyword?: string | null
          top_keyword_position?: number | null
          snapshot_date?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          published_date?: string | null
          pageviews?: number | null
          sessions?: number | null
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          top_keyword?: string | null
          top_keyword_position?: number | null
          snapshot_date?: string
          created_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          full_name: string
          role: string
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string
          role?: string
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: Record<string, never>; Returns: string }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      approval_type: "price_change" | "lead_close" | "content_review" | "inventory_update"
      inventory_condition: "new" | "used" | "demo"
      inventory_source: "manual" | "lightspeed" | "csv_import"
      inventory_status: "available" | "sold" | "on_order" | "featured" | "clearance"
      lead_source: "google_organic" | "google_ads" | "direct" | "facebook" | "referral" | "other"
      lead_status: "new" | "contacted" | "quoted" | "negotiating" | "won" | "lost"
      lead_type: "quote_request" | "contact" | "service_request" | "financing" | "trade_in"
      message_category: "general" | "lead_question" | "inventory_request" | "support" | "approval"
      report_type: "monthly" | "quarterly" | "special"
      sender_role: "admin" | "owner" | "staff"
      service_status: "received" | "scheduled" | "in_progress" | "complete" | "picked_up"
      thread_status: "open" | "resolved" | "archived"
      update_type: "milestone" | "status" | "deliverable" | "note"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
