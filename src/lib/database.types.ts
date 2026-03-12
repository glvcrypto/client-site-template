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
      ad_config: {
        Row: {
          id: string
          platform: Database["public"]["Enums"]["ad_platform"]
          account_id: string | null
          is_enabled: boolean | null
          config_json: Json | null
          last_synced_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          platform: Database["public"]["Enums"]["ad_platform"]
          account_id?: string | null
          is_enabled?: boolean | null
          config_json?: Json | null
          last_synced_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          platform?: Database["public"]["Enums"]["ad_platform"]
          account_id?: string | null
          is_enabled?: boolean | null
          config_json?: Json | null
          last_synced_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_ad_performance: {
        Row: {
          id: string
          snapshot_date: string
          platform: Database["public"]["Enums"]["ad_platform"]
          campaign_name: string | null
          campaign_id: string | null
          ad_set_name: string | null
          ad_name: string | null
          spend: number | null
          impressions: number | null
          clicks: number | null
          ctr: number | null
          cpc: number | null
          conversions: number | null
          conversion_value: number | null
          roas: number | null
          status: Database["public"]["Enums"]["ad_status"] | null
        }
        Insert: {
          id?: string
          snapshot_date: string
          platform: Database["public"]["Enums"]["ad_platform"]
          campaign_name?: string | null
          campaign_id?: string | null
          ad_set_name?: string | null
          ad_name?: string | null
          spend?: number | null
          impressions?: number | null
          clicks?: number | null
          ctr?: number | null
          cpc?: number | null
          conversions?: number | null
          conversion_value?: number | null
          roas?: number | null
          status?: Database["public"]["Enums"]["ad_status"] | null
        }
        Update: {
          id?: string
          snapshot_date?: string
          platform?: Database["public"]["Enums"]["ad_platform"]
          campaign_name?: string | null
          campaign_id?: string | null
          ad_set_name?: string | null
          ad_name?: string | null
          spend?: number | null
          impressions?: number | null
          clicks?: number | null
          ctr?: number | null
          cpc?: number | null
          conversions?: number | null
          conversion_value?: number | null
          roas?: number | null
          status?: Database["public"]["Enums"]["ad_status"] | null
        }
        Relationships: []
      }
      analytics_device_breakdown: {
        Row: {
          id: string
          snapshot_date: string
          device_type: Database["public"]["Enums"]["device_type"]
          sessions: number | null
          percentage: number | null
        }
        Insert: {
          id?: string
          snapshot_date: string
          device_type: Database["public"]["Enums"]["device_type"]
          sessions?: number | null
          percentage?: number | null
        }
        Update: {
          id?: string
          snapshot_date?: string
          device_type?: Database["public"]["Enums"]["device_type"]
          sessions?: number | null
          percentage?: number | null
        }
        Relationships: []
      }
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
      analytics_top_pages: {
        Row: {
          id: string
          snapshot_date: string
          page_path: string
          page_title: string | null
          pageviews: number | null
          avg_time_on_page: number | null
          bounce_rate: number | null
        }
        Insert: {
          id?: string
          snapshot_date: string
          page_path: string
          page_title?: string | null
          pageviews?: number | null
          avg_time_on_page?: number | null
          bounce_rate?: number | null
        }
        Update: {
          id?: string
          snapshot_date?: string
          page_path?: string
          page_title?: string | null
          pageviews?: number | null
          avg_time_on_page?: number | null
          bounce_rate?: number | null
        }
        Relationships: []
      }
      analytics_traffic_sources: {
        Row: {
          id: string
          snapshot_date: string
          source: string
          medium: string
          sessions: number | null
          users: number | null
          bounce_rate: number | null
          pages_per_session: number | null
        }
        Insert: {
          id?: string
          snapshot_date: string
          source: string
          medium: string
          sessions?: number | null
          users?: number | null
          bounce_rate?: number | null
          pages_per_session?: number | null
        }
        Update: {
          id?: string
          snapshot_date?: string
          source?: string
          medium?: string
          sessions?: number | null
          users?: number | null
          bounce_rate?: number | null
          pages_per_session?: number | null
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "dealer_inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "site_locations"
            referencedColumns: ["id"]
          },
        ]
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
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
          {
            foreignKeyName: "dealer_services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "site_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_config: {
        Row: {
          id: string
          event_type: string
          email_enabled: boolean | null
          email_to: string | null
          webhook_enabled: boolean | null
          webhook_url: string | null
          webhook_headers_json: Json | null
        }
        Insert: {
          id?: string
          event_type: string
          email_enabled?: boolean | null
          email_to?: string | null
          webhook_enabled?: boolean | null
          webhook_url?: string | null
          webhook_headers_json?: Json | null
        }
        Update: {
          id?: string
          event_type?: string
          email_enabled?: boolean | null
          email_to?: string | null
          webhook_enabled?: boolean | null
          webhook_url?: string | null
          webhook_headers_json?: Json | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          event_type: string
          channel: Database["public"]["Enums"]["notification_channel"]
          recipient: string | null
          status: Database["public"]["Enums"]["notification_status"]
          payload_json: Json | null
          error_message: string | null
          sent_at: string | null
        }
        Insert: {
          id?: string
          event_type: string
          channel: Database["public"]["Enums"]["notification_channel"]
          recipient?: string | null
          status: Database["public"]["Enums"]["notification_status"]
          payload_json?: Json | null
          error_message?: string | null
          sent_at?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          recipient?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          payload_json?: Json | null
          error_message?: string | null
          sent_at?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          id: string
          event_type: string
          subject: string
          body_html: string
          body_text: string | null
          is_customer_facing: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_type: string
          subject: string
          body_html: string
          body_text?: string | null
          is_customer_facing?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          subject?: string
          body_html?: string
          body_text?: string | null
          is_customer_facing?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
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
          location_id: string | null
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
          location_id?: string | null
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
          location_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "portal_leads_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "site_locations"
            referencedColumns: ["id"]
          },
        ]
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
      review_config: {
        Row: {
          id: string
          google_place_id: string | null
          auto_request_enabled: boolean
          request_delay_hours: number
          request_email_template: string
          min_rating_to_display: number
          review_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          google_place_id?: string | null
          auto_request_enabled?: boolean
          request_delay_hours?: number
          request_email_template?: string
          min_rating_to_display?: number
          review_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          google_place_id?: string | null
          auto_request_enabled?: boolean
          request_delay_hours?: number
          request_email_template?: string
          min_rating_to_display?: number
          review_url?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          id: string
          customer_name: string
          email: string
          phone: string | null
          trigger_type: Database["public"]["Enums"]["review_trigger_type"]
          trigger_id: string | null
          sent_at: string | null
          clicked_at: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["review_request_status"]
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_name: string
          email: string
          phone?: string | null
          trigger_type?: Database["public"]["Enums"]["review_trigger_type"]
          trigger_id?: string | null
          sent_at?: string | null
          clicked_at?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["review_request_status"]
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_name?: string
          email?: string
          phone?: string | null
          trigger_type?: Database["public"]["Enums"]["review_trigger_type"]
          trigger_id?: string | null
          sent_at?: string | null
          clicked_at?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["review_request_status"]
          created_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          source: Database["public"]["Enums"]["review_source"]
          reviewer_name: string
          rating: number
          review_text: string | null
          review_date: string
          response_text: string | null
          responded_at: string | null
          external_id: string | null
          is_visible: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          source?: Database["public"]["Enums"]["review_source"]
          reviewer_name: string
          rating: number
          review_text?: string | null
          review_date?: string
          response_text?: string | null
          responded_at?: string | null
          external_id?: string | null
          is_visible?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          source?: Database["public"]["Enums"]["review_source"]
          reviewer_name?: string
          rating?: number
          review_text?: string | null
          review_date?: string
          response_text?: string | null
          responded_at?: string | null
          external_id?: string | null
          is_visible?: boolean
          created_at?: string | null
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
      service_availability: {
        Row: {
          id: string
          location_id: string
          day_of_week: number
          open_time: string
          close_time: string
          max_bookings_per_slot: number
          slot_duration_minutes: number
          is_available: boolean
        }
        Insert: {
          id?: string
          location_id: string
          day_of_week: number
          open_time: string
          close_time: string
          max_bookings_per_slot?: number
          slot_duration_minutes?: number
          is_available?: boolean
        }
        Update: {
          id?: string
          location_id?: string
          day_of_week?: number
          open_time?: string
          close_time?: string
          max_bookings_per_slot?: number
          slot_duration_minutes?: number
          is_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_availability_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "site_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          id: string
          customer_name: string
          email: string
          phone: string | null
          service_id: string | null
          preferred_date: string
          preferred_time_slot: string
          status: Database["public"]["Enums"]["booking_status"]
          notes: string | null
          confirmed_date: string | null
          confirmed_time: string | null
          location_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_name: string
          email: string
          phone?: string | null
          service_id?: string | null
          preferred_date: string
          preferred_time_slot: string
          status?: Database["public"]["Enums"]["booking_status"]
          notes?: string | null
          confirmed_date?: string | null
          confirmed_time?: string | null
          location_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          customer_name?: string
          email?: string
          phone?: string | null
          service_id?: string | null
          preferred_date?: string
          preferred_time_slot?: string
          status?: Database["public"]["Enums"]["booking_status"]
          notes?: string | null
          confirmed_date?: string | null
          confirmed_time?: string | null
          location_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "site_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_catalogue: {
        Row: {
          id: string
          name: string
          description: string | null
          default_price: number | null
          estimated_duration_minutes: number | null
          category: string | null
          allow_booking: boolean
          is_active: boolean
          display_order: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          default_price?: number | null
          estimated_duration_minutes?: number | null
          category?: string | null
          allow_booking?: boolean
          is_active?: boolean
          display_order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          default_price?: number | null
          estimated_duration_minutes?: number | null
          category?: string | null
          allow_booking?: boolean
          is_active?: boolean
          display_order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_banners: {
        Row: {
          id: string
          title: string
          image_url: string | null
          link_url: string | null
          display_order: number
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
          location_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          image_url?: string | null
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          location_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          image_url?: string | null
          link_url?: string | null
          display_order?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          location_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_banners_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "site_locations"
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
      site_content: {
        Row: {
          id: string
          page_slug: string
          content_key: string
          content_value: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          page_slug: string
          content_key: string
          content_value?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          page_slug?: string
          content_key?: string
          content_value?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      site_hours: {
        Row: {
          id: string
          location_id: string
          day_of_week: number
          open_time: string | null
          close_time: string | null
          is_closed: boolean
        }
        Insert: {
          id?: string
          location_id: string
          day_of_week: number
          open_time?: string | null
          close_time?: string | null
          is_closed?: boolean
        }
        Update: {
          id?: string
          location_id?: string
          day_of_week?: number
          open_time?: string | null
          close_time?: string | null
          is_closed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "site_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "site_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_integrations: {
        Row: {
          id: string
          integration_type: string
          config_json: Json | null
          is_connected: boolean
          last_synced_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          integration_type: string
          config_json?: Json | null
          is_connected?: boolean
          last_synced_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          integration_type?: string
          config_json?: Json | null
          is_connected?: boolean
          last_synced_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_locations: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          province: string
          postal_code: string | null
          phone: string | null
          email: string | null
          is_primary: boolean
          lat: number | null
          lng: number | null
          display_order: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          city?: string | null
          province?: string
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          is_primary?: boolean
          lat?: number | null
          lng?: number | null
          display_order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          city?: string | null
          province?: string
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          is_primary?: boolean
          lat?: number | null
          lng?: number | null
          display_order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_modules: {
        Row: {
          id: string
          module_key: string
          is_enabled: boolean
          enabled_by: string | null
          enabled_at: string | null
        }
        Insert: {
          id?: string
          module_key: string
          is_enabled?: boolean
          enabled_by?: string | null
          enabled_at?: string | null
        }
        Update: {
          id?: string
          module_key?: string
          is_enabled?: boolean
          enabled_by?: string | null
          enabled_at?: string | null
        }
        Relationships: []
      }
      site_navigation: {
        Row: {
          id: string
          label: string
          route_path: string
          parent_id: string | null
          display_order: number
          is_visible: boolean
          icon: string | null
          module_key: string | null
        }
        Insert: {
          id?: string
          label: string
          route_path: string
          parent_id?: string | null
          display_order?: number
          is_visible?: boolean
          icon?: string | null
          module_key?: string | null
        }
        Update: {
          id?: string
          label?: string
          route_path?: string
          parent_id?: string | null
          display_order?: number
          is_visible?: boolean
          icon?: string | null
          module_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_navigation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "site_navigation"
            referencedColumns: ["id"]
          },
        ]
      }
      site_social_links: {
        Row: {
          id: string
          platform: string
          url: string
          is_active: boolean
          display_order: number
        }
        Insert: {
          id?: string
          platform: string
          url: string
          is_active?: boolean
          display_order?: number
        }
        Update: {
          id?: string
          platform?: string
          url?: string
          is_active?: boolean
          display_order?: number
        }
        Relationships: []
      }
      site_staff: {
        Row: {
          id: string
          full_name: string
          role_title: string | null
          department: string | null
          photo_url: string | null
          bio: string | null
          email: string | null
          phone: string | null
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          role_title?: string | null
          department?: string | null
          photo_url?: string | null
          bio?: string | null
          email?: string | null
          phone?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          role_title?: string | null
          department?: string | null
          photo_url?: string | null
          bio?: string | null
          email?: string | null
          phone?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_testimonials: {
        Row: {
          id: string
          customer_name: string
          quote: string
          rating: number | null
          photo_url: string | null
          is_active: boolean
          display_order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_name: string
          quote: string
          rating?: number | null
          photo_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_name?: string
          quote?: string
          rating?: number | null
          photo_url?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string | null
        }
        Relationships: []
      }
      store_categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          parent_id?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          parent_id?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string | null
          quantity: number | null
          unit_price: number | null
          total: number | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          unit_price?: number | null
          total?: number | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          unit_price?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "store_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          id: string
          order_number: number
          customer_name: string | null
          email: string | null
          phone: string | null
          shipping_address: Json | null
          billing_address: Json | null
          subtotal: number | null
          tax: number | null
          shipping_cost: number | null
          total: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_id: string | null
          tracking_number: string | null
          notes: string | null
          promo_code: string | null
          discount_amount: number | null
          location_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_number?: number
          customer_name?: string | null
          email?: string | null
          phone?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          subtotal?: number | null
          tax?: number | null
          shipping_cost?: number | null
          total?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_id?: string | null
          tracking_number?: string | null
          notes?: string | null
          promo_code?: string | null
          discount_amount?: number | null
          location_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_number?: number
          customer_name?: string | null
          email?: string | null
          phone?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          subtotal?: number | null
          tax?: number | null
          shipping_cost?: number | null
          total?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_id?: string | null
          tracking_number?: string | null
          notes?: string | null
          promo_code?: string | null
          discount_amount?: number | null
          location_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "site_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      store_payment_config: {
        Row: {
          id: string
          provider: Database["public"]["Enums"]["payment_method"]
          is_enabled: boolean | null
          config_json: Json | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          provider: Database["public"]["Enums"]["payment_method"]
          is_enabled?: boolean | null
          config_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          provider?: Database["public"]["Enums"]["payment_method"]
          is_enabled?: boolean | null
          config_json?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      store_promo_codes: {
        Row: {
          id: string
          code: string
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number | null
          min_order: number | null
          max_uses: number | null
          uses_count: number | null
          valid_from: string | null
          valid_to: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          code: string
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          min_order?: number | null
          max_uses?: number | null
          uses_count?: number | null
          valid_from?: string | null
          valid_to?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          min_order?: number | null
          max_uses?: number | null
          uses_count?: number | null
          valid_from?: string | null
          valid_to?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      store_products: {
        Row: {
          id: string
          name: string
          sku: string | null
          price: number | null
          sale_price: number | null
          description: string | null
          images: Json | null
          category_id: string | null
          brand: string | null
          quantity_available: number | null
          weight: number | null
          dimensions: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          sku?: string | null
          price?: number | null
          sale_price?: number | null
          description?: string | null
          images?: Json | null
          category_id?: string | null
          brand?: string | null
          quantity_available?: number | null
          weight?: number | null
          dimensions?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          sku?: string | null
          price?: number | null
          sale_price?: number | null
          description?: string | null
          images?: Json | null
          category_id?: string | null
          brand?: string | null
          quantity_available?: number | null
          weight?: number | null
          dimensions?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_shipping_methods: {
        Row: {
          id: string
          name: string
          type: Database["public"]["Enums"]["shipping_type"] | null
          rate: number | null
          min_order_for_free: number | null
          is_enabled: boolean | null
          display_order: number | null
        }
        Insert: {
          id?: string
          name: string
          type?: Database["public"]["Enums"]["shipping_type"] | null
          rate?: number | null
          min_order_for_free?: number | null
          is_enabled?: boolean | null
          display_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["shipping_type"] | null
          rate?: number | null
          min_order_for_free?: number | null
          is_enabled?: boolean | null
          display_order?: number | null
        }
        Relationships: []
      }
      store_tax_config: {
        Row: {
          id: string
          region: string | null
          province_code: string | null
          rate_percent: number | null
          charge_on_shipping: boolean | null
          is_enabled: boolean | null
        }
        Insert: {
          id?: string
          region?: string | null
          province_code?: string | null
          rate_percent?: number | null
          charge_on_shipping?: boolean | null
          is_enabled?: boolean | null
        }
        Update: {
          id?: string
          region?: string | null
          province_code?: string | null
          rate_percent?: number | null
          charge_on_shipping?: boolean | null
          is_enabled?: boolean | null
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
      ad_platform: "google_ads" | "meta" | "tiktok"
      ad_status: "active" | "paused" | "completed"
      approval_status: "pending" | "approved" | "rejected"
      approval_type: "price_change" | "lead_close" | "content_review" | "inventory_update"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      content_type: "text" | "html" | "image_url" | "json"
      device_type: "desktop" | "mobile" | "tablet"
      discount_type: "percentage" | "fixed"
      inventory_condition: "new" | "used" | "demo"
      inventory_source: "manual" | "lightspeed" | "csv_import"
      inventory_status: "available" | "sold" | "on_order" | "featured" | "clearance"
      lead_source: "google_organic" | "google_ads" | "direct" | "facebook" | "referral" | "other"
      lead_status: "new" | "contacted" | "quoted" | "negotiating" | "won" | "lost"
      lead_type: "quote_request" | "contact" | "service_request" | "financing" | "trade_in"
      message_category: "general" | "lead_question" | "inventory_request" | "support" | "approval"
      notification_channel: "email" | "webhook"
      notification_status: "sent" | "failed"
      order_status: "pending" | "paid" | "processing" | "shipped" | "picked_up" | "cancelled" | "refunded"
      payment_method: "stripe" | "paypal" | "in_store"
      report_type: "monthly" | "quarterly" | "special"
      review_request_status: "pending" | "sent" | "completed" | "expired"
      review_source: "google" | "facebook" | "manual"
      review_trigger_type: "service_complete" | "unit_sold" | "manual"
      sender_role: "admin" | "owner" | "staff"
      service_status: "received" | "scheduled" | "in_progress" | "complete" | "picked_up"
      shipping_type: "flat_rate" | "weight_based" | "free" | "pickup"
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
