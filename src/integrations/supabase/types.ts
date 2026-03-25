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
      access_credentials: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          last_rotated_at: string | null
          member_id: string
          rotate_interval_minutes: number | null
          status: Database["public"]["Enums"]["credential_status"]
          token_hash: string
          type: Database["public"]["Enums"]["credential_type"]
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          last_rotated_at?: string | null
          member_id: string
          rotate_interval_minutes?: number | null
          status?: Database["public"]["Enums"]["credential_status"]
          token_hash: string
          type?: Database["public"]["Enums"]["credential_type"]
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          last_rotated_at?: string | null
          member_id?: string
          rotate_interval_minutes?: number | null
          status?: Database["public"]["Enums"]["credential_status"]
          token_hash?: string
          type?: Database["public"]["Enums"]["credential_type"]
        }
        Relationships: [
          {
            foreignKeyName: "access_credentials_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_credentials_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_logs: {
        Row: {
          credential_id: string | null
          decision: Database["public"]["Enums"]["access_decision"]
          device_id: string | null
          event_time: string
          gym_id: string
          id: string
          member_id: string | null
          raw: Json | null
          reason: string | null
        }
        Insert: {
          credential_id?: string | null
          decision?: Database["public"]["Enums"]["access_decision"]
          device_id?: string | null
          event_time?: string
          gym_id: string
          id?: string
          member_id?: string | null
          raw?: Json | null
          reason?: string | null
        }
        Update: {
          credential_id?: string | null
          decision?: Database["public"]["Enums"]["access_decision"]
          device_id?: string | null
          event_time?: string
          gym_id?: string
          id?: string
          member_id?: string | null
          raw?: Json | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "access_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_jobs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          gym_id: string
          id: string
          input: Json | null
          output: Json | null
          requested_by: string | null
          status: Database["public"]["Enums"]["ai_job_status"]
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          gym_id: string
          id?: string
          input?: Json | null
          output?: Json | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          gym_id?: string
          id?: string
          input?: Json | null
          output?: Json | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_jobs_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_jobs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assigned_workouts: {
        Row: {
          created_at: string
          end_date: string | null
          gym_id: string
          id: string
          member_id: string
          start_date: string | null
          status: string | null
          template_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          gym_id: string
          id?: string
          member_id: string
          start_date?: string | null
          status?: string | null
          template_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          gym_id?: string
          id?: string
          member_id?: string
          start_date?: string | null
          status?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assigned_workouts_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workouts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_workouts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          gym_id: string
          id: string
          rule: Json | null
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          gym_id: string
          id?: string
          rule?: Json | null
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          gym_id?: string
          id?: string
          rule?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          available_for_chat: boolean | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          experience_years: number | null
          gym_id: string
          id: string
          instagram: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          available_for_chat?: boolean | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          gym_id: string
          id?: string
          instagram?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          available_for_chat?: boolean | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          gym_id?: string
          id?: string
          instagram?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          config: Json | null
          created_at: string
          gym_id: string
          id: string
          location: string | null
          name: string
          status: string | null
          type: Database["public"]["Enums"]["device_type"]
        }
        Insert: {
          config?: Json | null
          created_at?: string
          gym_id: string
          id?: string
          location?: string | null
          name: string
          status?: string | null
          type?: Database["public"]["Enums"]["device_type"]
        }
        Update: {
          config?: Json | null
          created_at?: string
          gym_id?: string
          id?: string
          location?: string | null
          name?: string
          status?: string | null
          type?: Database["public"]["Enums"]["device_type"]
        }
        Relationships: [
          {
            foreignKeyName: "devices_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string
          equipment: string | null
          gym_id: string
          id: string
          instructions: string | null
          media_url: string | null
          muscle_group: string | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          equipment?: string | null
          gym_id: string
          id?: string
          instructions?: string | null
          media_url?: string | null
          muscle_group?: string | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          equipment?: string | null
          gym_id?: string
          id?: string
          instructions?: string | null
          media_url?: string | null
          muscle_group?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          accent_color: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          timezone: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          timezone?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          timezone?: string | null
        }
        Relationships: []
      }
      member_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          member_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          member_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          end_at: string | null
          gym_id: string
          id: string
          member_id: string
          plan_id: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["membership_status"]
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          gym_id: string
          id?: string
          member_id: string
          plan_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
        }
        Update: {
          created_at?: string
          end_at?: string | null
          gym_id?: string
          id?: string
          member_id?: string
          plan_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
        }
        Relationships: [
          {
            foreignKeyName: "memberships_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          gym_id: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          gym_id: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          gym_id?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_data: {
        Row: {
          activity_level: string | null
          age: number | null
          completed: boolean
          created_at: string
          equipment: string[] | null
          experience_level: string | null
          fitness_goal: string | null
          gender: string | null
          height: number | null
          id: string
          injuries: string[] | null
          preferred_time: string | null
          reminders: string | null
          updated_at: string
          user_id: string
          weight: number | null
          workout_duration: string | null
          workout_location: string | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          completed?: boolean
          created_at?: string
          equipment?: string[] | null
          experience_level?: string | null
          fitness_goal?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          injuries?: string[] | null
          preferred_time?: string | null
          reminders?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
          workout_duration?: string | null
          workout_location?: string | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          completed?: boolean
          created_at?: string
          equipment?: string[] | null
          experience_level?: string | null
          fitness_goal?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          injuries?: string[] | null
          preferred_time?: string | null
          reminders?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
          workout_duration?: string | null
          workout_location?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          gym_id: string
          id: string
          member_id: string
          paid_at: string | null
          plan_id: string | null
          provider: string | null
          provider_payment_id: string | null
          raw: Json | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          gym_id: string
          id?: string
          member_id: string
          paid_at?: string | null
          plan_id?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          raw?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount_cents?: number
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          paid_at?: string | null
          plan_id?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          raw?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean | null
          benefits: Json | null
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          duration_weeks: number | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          gym_id: string
          id: string
          level: string | null
          name: string
          personal_trainer_id: string | null
          price_cents: number
        }
        Insert: {
          active?: boolean | null
          benefits?: Json | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          duration_weeks?: number | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          gym_id: string
          id?: string
          level?: string | null
          name: string
          personal_trainer_id?: string | null
          price_cents?: number
        }
        Update: {
          active?: boolean | null
          benefits?: Json | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          duration_weeks?: number | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          gym_id?: string
          id?: string
          level?: string | null
          name?: string
          personal_trainer_id?: string | null
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          gym_id: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          gym_id?: string | null
          id: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          gym_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_metrics: {
        Row: {
          gym_id: string
          id: string
          measured_at: string
          member_id: string
          type: Database["public"]["Enums"]["progress_type"]
          unit: string | null
          value: number
        }
        Insert: {
          gym_id: string
          id?: string
          measured_at?: string
          member_id: string
          type?: Database["public"]["Enums"]["progress_type"]
          unit?: string | null
          value: number
        }
        Update: {
          gym_id?: string
          id?: string
          measured_at?: string
          member_id?: string
          type?: Database["public"]["Enums"]["progress_type"]
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "progress_metrics_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_metrics_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_cart_items: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          member_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          member_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_cart_items_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_cart_items_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          banner_image_url: string | null
          created_at: string
          description: string | null
          gym_id: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          gym_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          gym_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_items: {
        Row: {
          id: string
          name_snapshot: string
          order_id: string
          price_cents_snapshot: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          id?: string
          name_snapshot: string
          order_id: string
          price_cents_snapshot?: number
          product_id?: string | null
          quantity?: number
        }
        Update: {
          id?: string
          name_snapshot?: string
          order_id?: string
          price_cents_snapshot?: number
          product_id?: string | null
          quantity?: number
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
          created_at: string
          gym_id: string
          id: string
          member_id: string
          payment_provider: string | null
          payment_reference: string | null
          status: string
          total_cents: number
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          member_id: string
          payment_provider?: string | null
          payment_reference?: string | null
          status?: string
          total_cents?: number
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          payment_provider?: string | null
          payment_reference?: string | null
          status?: string
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_orders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          benefits: Json | null
          category_id: string | null
          compare_at_price_cents: number | null
          created_at: string
          description: string | null
          gym_id: string
          id: string
          images: Json | null
          ingredients_or_materials: Json | null
          is_active: boolean
          is_featured: boolean
          is_promotion: boolean
          name: string
          price_cents: number
          promotion_label: string | null
          short_description: string | null
          sku: string | null
          slug: string
          stock_quantity: number
          tags: string[] | null
          updated_at: string
          usage_instructions: string | null
        }
        Insert: {
          benefits?: Json | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          created_at?: string
          description?: string | null
          gym_id: string
          id?: string
          images?: Json | null
          ingredients_or_materials?: Json | null
          is_active?: boolean
          is_featured?: boolean
          is_promotion?: boolean
          name: string
          price_cents?: number
          promotion_label?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_quantity?: number
          tags?: string[] | null
          updated_at?: string
          usage_instructions?: string | null
        }
        Update: {
          benefits?: Json | null
          category_id?: string | null
          compare_at_price_cents?: number | null
          created_at?: string
          description?: string | null
          gym_id?: string
          id?: string
          images?: Json | null
          ingredients_or_materials?: Json | null
          is_active?: boolean
          is_featured?: boolean
          is_promotion?: boolean
          name?: string
          price_cents?: number
          promotion_label?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_quantity?: number
          tags?: string[] | null
          updated_at?: string
          usage_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          member_id: string
          next_billing_at: string | null
          plan_id: string | null
          provider: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          member_id: string
          next_billing_at?: string | null
          plan_id?: string | null
          provider?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          member_id?: string
          next_billing_at?: string | null
          plan_id?: string | null
          provider?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_metrics: {
        Row: {
          active_minutes: number
          avg_pace: string | null
          calories_burned: number
          calories_goal: number
          day: string
          distance_km: number
          gym_id: string
          id: string
          intensity_score: number
          steps: number
          streak_days: number
          updated_at: string
          user_id: string
          weekly_workout_goal: number
          workout_time_minutes: number
          workouts_completed_today: number
          workouts_completed_week: number
        }
        Insert: {
          active_minutes?: number
          avg_pace?: string | null
          calories_burned?: number
          calories_goal?: number
          day?: string
          distance_km?: number
          gym_id: string
          id?: string
          intensity_score?: number
          steps?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          weekly_workout_goal?: number
          workout_time_minutes?: number
          workouts_completed_today?: number
          workouts_completed_week?: number
        }
        Update: {
          active_minutes?: number
          avg_pace?: string | null
          calories_burned?: number
          calories_goal?: number
          day?: string
          distance_km?: number
          gym_id?: string
          id?: string
          intensity_score?: number
          steps?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          weekly_workout_goal?: number
          workout_time_minutes?: number
          workouts_completed_today?: number
          workouts_completed_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_metrics_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_daily_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string
          current_value: number | null
          deadline: string | null
          id: string
          name: string
          status: string
          target_value: number | null
          type: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          id?: string
          name: string
          status?: string
          target_value?: number | null
          type: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          id?: string
          name?: string
          status?: string
          target_value?: number | null
          type?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          gym_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          gym_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          gym_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          created_at: string
          day_index: number
          id: string
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          day_index?: number
          id?: string
          template_id: string
          title?: string
        }
        Update: {
          created_at?: string
          day_index?: number
          id?: string
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_items: {
        Row: {
          created_at: string
          exercise_id: string | null
          id: string
          intensity: string | null
          notes: string | null
          order_index: number | null
          reps: string | null
          rest_seconds: number | null
          sets: number | null
          workout_day_id: string
        }
        Insert: {
          created_at?: string
          exercise_id?: string | null
          id?: string
          intensity?: string | null
          notes?: string | null
          order_index?: number | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          workout_day_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string | null
          id?: string
          intensity?: string | null
          notes?: string | null
          order_index?: number | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number | null
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_items_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          calories_estimated: number | null
          created_at: string
          duration_seconds: number | null
          exercise_id: string | null
          id: string
          notes: string | null
          performed_sets: Json | null
          session_id: string
        }
        Insert: {
          calories_estimated?: number | null
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          performed_sets?: Json | null
          session_id: string
        }
        Update: {
          calories_estimated?: number | null
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          performed_sets?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          assigned_workout_id: string | null
          created_at: string
          date: string
          gym_id: string
          id: string
          member_id: string
          status: Database["public"]["Enums"]["workout_session_status"]
        }
        Insert: {
          assigned_workout_id?: string | null
          created_at?: string
          date?: string
          gym_id: string
          id?: string
          member_id: string
          status?: Database["public"]["Enums"]["workout_session_status"]
        }
        Update: {
          assigned_workout_id?: string | null
          created_at?: string
          date?: string
          gym_id?: string
          id?: string
          member_id?: string
          status?: Database["public"]["Enums"]["workout_session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_assigned_workout_id_fkey"
            columns: ["assigned_workout_id"]
            isOneToOne: false
            referencedRelation: "assigned_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          created_by: string | null
          goal_type: Database["public"]["Enums"]["goal_type"] | null
          gym_id: string
          id: string
          level: string | null
          name: string
          notes: string | null
          weeks: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"] | null
          gym_id: string
          id?: string
          level?: string | null
          name: string
          notes?: string | null
          weeks?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"] | null
          gym_id?: string
          id?: string
          level?: string | null
          name?: string
          notes?: string | null
          weeks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_daily_metrics: {
        Args: { _day?: string; _user_id: string }
        Returns: undefined
      }
      find_profile_by_email: {
        Args: { _email: string }
        Returns: {
          email: string
          gym_id: string
          id: string
          name: string
        }[]
      }
      get_user_gym_id: { Args: { _user_id: string }; Returns: string }
      has_gym_role: {
        Args: {
          _gym_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_gym_staff: {
        Args: { _gym_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_decision: "allow" | "deny"
      ai_job_status: "pending" | "running" | "done" | "error"
      app_role: "super_admin" | "owner" | "coach" | "member"
      billing_cycle: "monthly" | "semiannual" | "annual" | "one_time"
      credential_status: "active" | "blocked" | "expired"
      credential_type: "qr" | "rfid" | "pin"
      device_type: "henry_turnstile" | "generic"
      goal_type:
        | "hipertrofia"
        | "emagrecimento"
        | "performance"
        | "reabilitacao"
        | "outro"
      membership_status: "active" | "paused" | "cancelled" | "expired"
      notification_type:
        | "payment_paid"
        | "payment_failed"
        | "plan_expiring"
        | "plan_activated"
        | "promotion"
        | "order_paid"
        | "new_workout"
        | "coach_message"
      payment_status: "paid" | "pending" | "failed" | "refunded"
      progress_type: "weight" | "bodyfat" | "measurements"
      subscription_status: "active" | "past_due" | "cancelled" | "trialing"
      workout_session_status: "planned" | "done" | "missed"
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
      access_decision: ["allow", "deny"],
      ai_job_status: ["pending", "running", "done", "error"],
      app_role: ["super_admin", "owner", "coach", "member"],
      billing_cycle: ["monthly", "semiannual", "annual", "one_time"],
      credential_status: ["active", "blocked", "expired"],
      credential_type: ["qr", "rfid", "pin"],
      device_type: ["henry_turnstile", "generic"],
      goal_type: [
        "hipertrofia",
        "emagrecimento",
        "performance",
        "reabilitacao",
        "outro",
      ],
      membership_status: ["active", "paused", "cancelled", "expired"],
      notification_type: [
        "payment_paid",
        "payment_failed",
        "plan_expiring",
        "plan_activated",
        "promotion",
        "order_paid",
        "new_workout",
        "coach_message",
      ],
      payment_status: ["paid", "pending", "failed", "refunded"],
      progress_type: ["weight", "bodyfat", "measurements"],
      subscription_status: ["active", "past_due", "cancelled", "trialing"],
      workout_session_status: ["planned", "done", "missed"],
    },
  },
} as const
