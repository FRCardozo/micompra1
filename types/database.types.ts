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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          admin_id: string | null
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          order_id: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          order_id: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_addresses: {
        Row: {
          address_line: string
          address_name: string
          city: string
          client_id: string
          created_at: string | null
          id: string
          instructions: string | null
          is_default: boolean | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          address_line: string
          address_name: string
          city?: string
          client_id: string
          created_at?: string | null
          id?: string
          instructions?: string | null
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          address_line?: string
          address_name?: string
          city?: string
          client_id?: string
          created_at?: string | null
          id?: string
          instructions?: string | null
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_addresses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_coupon_usage_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          category_id: string | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          is_for_new_users: boolean | null
          max_discount: number | null
          minimum_purchase: number | null
          store_id: string | null
          usage_count: number | null
          usage_limit: number | null
          usage_per_user: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          is_for_new_users?: boolean | null
          max_discount?: number | null
          minimum_purchase?: number | null
          store_id?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          usage_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          is_for_new_users?: boolean | null
          max_discount?: number | null
          minimum_purchase?: number | null
          store_id?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          usage_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_history: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          changes: Json | null
          id: string
          zone_id: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          changes?: Json | null
          id?: string
          zone_id?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          changes?: Json | null
          id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_history_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "coverage_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_zone_drivers: {
        Row: {
          created_at: string | null
          driver_id: string | null
          id: string
          is_enabled: boolean | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          is_enabled?: boolean | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          is_enabled?: boolean | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_zone_drivers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_zone_drivers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "coverage_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_zone_stats: {
        Row: {
          active_drivers: number | null
          active_stores: number | null
          average_delivery_time_minutes: number | null
          created_at: string | null
          date: string
          id: string
          peak_hours: Json | null
          total_orders: number | null
          total_revenue: number | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          active_drivers?: number | null
          active_stores?: number | null
          average_delivery_time_minutes?: number | null
          created_at?: string | null
          date: string
          id?: string
          peak_hours?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          active_drivers?: number | null
          active_stores?: number | null
          average_delivery_time_minutes?: number | null
          created_at?: string | null
          date?: string
          id?: string
          peak_hours?: Json | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_zone_stats_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "coverage_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_zone_stores: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          store_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          store_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          store_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_zone_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_zone_stores_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "coverage_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      coverage_zones: {
        Row: {
          base_delivery_cost: number | null
          center_lat: number
          center_lng: number
          city: string
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_delivery_time_minutes: number | null
          id: string
          is_active: boolean | null
          municipality: string | null
          name: string
          operating_hours: Json | null
          polygon: Json
          priority: number | null
          state: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          base_delivery_cost?: number | null
          center_lat: number
          center_lng: number
          city: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_delivery_time_minutes?: number | null
          id?: string
          is_active?: boolean | null
          municipality?: string | null
          name: string
          operating_hours?: Json | null
          polygon: Json
          priority?: number | null
          state?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          base_delivery_cost?: number | null
          center_lat?: number
          center_lng?: number
          city?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_delivery_time_minutes?: number | null
          id?: string
          is_active?: boolean | null
          municipality?: string | null
          name?: string
          operating_hours?: Json | null
          polygon?: Json
          priority?: number | null
          state?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_zones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coverage_zones_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          documents_url: string | null
          id: string
          is_approved: boolean | null
          license_plate: string | null
          rating: number | null
          status: Database["public"]["Enums"]["delivery_driver_status"] | null
          total_deliveries: number | null
          total_earnings: number | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          documents_url?: string | null
          id: string
          is_approved?: boolean | null
          license_plate?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["delivery_driver_status"] | null
          total_deliveries?: number | null
          total_earnings?: number | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          documents_url?: string | null
          id?: string
          is_approved?: boolean | null
          license_plate?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["delivery_driver_status"] | null
          total_deliveries?: number | null
          total_earnings?: number | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_drivers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          product_image_url: string | null
          product_name: string
          quantity: number
          special_instructions: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          product_image_url?: string | null
          product_name: string
          quantity: number
          special_instructions?: string | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          product_image_url?: string | null
          product_name?: string
          quantity?: number
          special_instructions?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          coupon_id: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_address: string
          delivery_cost: number
          delivery_instructions: string | null
          delivery_latitude: number | null
          delivery_longitude: number | null
          discount: number | null
          driver_id: string | null
          driver_rating: number | null
          driver_review: string | null
          estimated_delivery_time: string | null
          id: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          picked_up_at: string | null
          service_fee: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          store_id: string
          store_rating: number | null
          store_review: string | null
          subtotal: number
          tip: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          coupon_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_address: string
          delivery_cost: number
          delivery_instructions?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          discount?: number | null
          driver_id?: string | null
          driver_rating?: number | null
          driver_review?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          picked_up_at?: string | null
          service_fee?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          store_id: string
          store_rating?: number | null
          store_review?: string | null
          subtotal: number
          tip?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          coupon_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_address?: string
          delivery_cost?: number
          delivery_instructions?: string | null
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          discount?: number | null
          driver_id?: string | null
          driver_rating?: number | null
          driver_review?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          picked_up_at?: string | null
          service_fee?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          store_id?: string
          store_rating?: number | null
          store_review?: string | null
          subtotal?: number
          tip?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          store_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          store_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          name: string
          original_price: number | null
          preparation_time: number | null
          price: number
          slug: string
          stock_quantity: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name: string
          original_price?: number | null
          preparation_time?: number | null
          price: number
          slug: string
          stock_quantity?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name?: string
          original_price?: number | null
          preparation_time?: number | null
          price?: number
          slug?: string
          stock_quantity?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          is_risky: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          is_risky?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_risky?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      promotional_banners: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_to: string | null
          link_type: string | null
          subtitle: string | null
          title: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_to?: string | null
          link_type?: string | null
          subtitle?: string | null
          title: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_to?: string | null
          link_type?: string | null
          subtitle?: string | null
          title?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      store_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string
          banner_url: string | null
          business_hours: Json | null
          category_id: string | null
          city: string
          created_at: string | null
          delivery_cost: number | null
          delivery_radius_km: number | null
          description: string | null
          email: string | null
          estimated_delivery_time: number | null
          id: string
          is_featured: boolean | null
          is_open_now: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          minimum_order: number | null
          name: string
          owner_id: string
          phone: string | null
          rating: number | null
          slug: string
          status: Database["public"]["Enums"]["store_status"] | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          banner_url?: string | null
          business_hours?: Json | null
          category_id?: string | null
          city?: string
          created_at?: string | null
          delivery_cost?: number | null
          delivery_radius_km?: number | null
          description?: string | null
          email?: string | null
          estimated_delivery_time?: number | null
          id?: string
          is_featured?: boolean | null
          is_open_now?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          minimum_order?: number | null
          name: string
          owner_id: string
          phone?: string | null
          rating?: number | null
          slug: string
          status?: Database["public"]["Enums"]["store_status"] | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          banner_url?: string | null
          business_hours?: Json | null
          category_id?: string | null
          city?: string
          created_at?: string | null
          delivery_cost?: number | null
          delivery_radius_km?: number | null
          description?: string | null
          email?: string | null
          estimated_delivery_time?: number | null
          id?: string
          is_featured?: boolean | null
          is_open_now?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          minimum_order?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          rating?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["store_status"] | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          order_id: string | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          order_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          order_id?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
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
      assign_super_admin_by_email: {
        Args: { user_email: string }
        Returns: {
          message: string
          profile_id: string
          success: boolean
        }[]
      }
      generate_order_number: { Args: never; Returns: string }
      is_point_in_coverage: {
        Args: { p_lat: number; p_lng: number }
        Returns: {
          base_delivery_cost: number
          estimated_delivery_time_minutes: number
          zone_id: string
          zone_name: string
        }[]
      }
    }
    Enums: {
      delivery_driver_status: "offline" | "available" | "busy"
      notification_type:
        | "order_created"
        | "order_accepted"
        | "driver_assigned"
        | "driver_heading_to_store"
        | "order_picked_up"
        | "driver_heading_to_client"
        | "order_delivered"
        | "order_cancelled"
        | "new_message"
        | "new_rating"
        | "promotion"
      order_status:
        | "created"
        | "accepted_by_store"
        | "assigned_to_driver"
        | "driver_heading_to_store"
        | "picked_up"
        | "driver_heading_to_client"
        | "delivered"
        | "cancelled"
      payment_method: "cash" | "bank_transfer"
      store_status: "active" | "inactive" | "pending_approval" | "suspended"
      user_role: "client" | "delivery_driver" | "store" | "super_admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      delivery_driver_status: ["offline", "available", "busy"],
      notification_type: [
        "order_created",
        "order_accepted",
        "driver_assigned",
        "driver_heading_to_store",
        "order_picked_up",
        "driver_heading_to_client",
        "order_delivered",
        "order_cancelled",
        "new_message",
        "new_rating",
        "promotion",
      ],
      order_status: [
        "created",
        "accepted_by_store",
        "assigned_to_driver",
        "driver_heading_to_store",
        "picked_up",
        "driver_heading_to_client",
        "delivered",
        "cancelled",
      ],
      payment_method: ["cash", "bank_transfer"],
      store_status: ["active", "inactive", "pending_approval", "suspended"],
      user_role: ["client", "delivery_driver", "store", "super_admin", "ally_admin"],
    },
  },
} as const
