export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      after_sales_returns: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_first: string | null
          customer_last: string | null
          id: string
          product_id: string
          reason: string
          refund_amount: number
          return_date: string
          return_type: string
          store_id: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_first?: string | null
          customer_last?: string | null
          id?: string
          product_id: string
          reason: string
          refund_amount: number
          return_date?: string
          return_type: string
          store_id: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_first?: string | null
          customer_last?: string | null
          id?: string
          product_id?: string
          reason?: string
          refund_amount?: number
          return_date?: string
          return_type?: string
          store_id?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      csv_import_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          error_rows: number | null
          errors: Json | null
          file_name: string
          file_size: number | null
          id: string
          status: string | null
          store_id: string
          success_rows: number | null
          total_rows: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_rows?: number | null
          errors?: Json | null
          file_name: string
          file_size?: number | null
          id?: string
          status?: string | null
          store_id: string
          success_rows?: number | null
          total_rows?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_rows?: number | null
          errors?: Json | null
          file_name?: string
          file_size?: number | null
          id?: string
          status?: string | null
          store_id?: string
          success_rows?: number | null
          total_rows?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          created_by: string | null
          customer_code: string | null
          email: string | null
          id: string
          import_batch_id: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          store_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          customer_code?: string | null
          email?: string | null
          id?: string
          import_batch_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          store_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          customer_code?: string | null
          email?: string | null
          id?: string
          import_batch_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          store_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      grab_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          grabbed_at: string | null
          grabbed_by: string | null
          id: string
          max_participants: number | null
          order_id: string
          reward_amount: number | null
          status: string | null
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          grabbed_at?: string | null
          grabbed_by?: string | null
          id?: string
          max_participants?: number | null
          order_id: string
          reward_amount?: number | null
          status?: string | null
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          grabbed_at?: string | null
          grabbed_by?: string | null
          id?: string
          max_participants?: number | null
          order_id?: string
          reward_amount?: number | null
          status?: string | null
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grab_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          last_counted_at: string | null
          max_stock: number | null
          product_id: string
          quantity: number
          reorder_point: number | null
          reserved_quantity: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_counted_at?: string | null
          max_stock?: number | null
          product_id: string
          quantity?: number
          reorder_point?: number | null
          reserved_quantity?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_counted_at?: string | null
          max_stock?: number | null
          product_id?: string
          quantity?: number
          reorder_point?: number | null
          reserved_quantity?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_claim_logs: {
        Row: {
          action: Database["public"]["Enums"]["claim_action"]
          id: string
          order_id: string
          store_id: string
          timestamp: string
        }
        Insert: {
          action: Database["public"]["Enums"]["claim_action"]
          id?: string
          order_id: string
          store_id: string
          timestamp?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["claim_action"]
          id?: string
          order_id?: string
          store_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_claim_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_pool"
            referencedColumns: ["id"]
          },
        ]
      }
      order_pool: {
        Row: {
          assigned_store_id: string | null
          created_at: string
          current_priority_list: string[]
          current_turn_store_id: string | null
          id: string
          order_code: string
          status: Database["public"]["Enums"]["order_pool_status"]
          timeout_minutes: number
          turn_start_time: string | null
          updated_at: string
        }
        Insert: {
          assigned_store_id?: string | null
          created_at?: string
          current_priority_list?: string[]
          current_turn_store_id?: string | null
          id?: string
          order_code: string
          status?: Database["public"]["Enums"]["order_pool_status"]
          timeout_minutes?: number
          turn_start_time?: string | null
          updated_at?: string
        }
        Update: {
          assigned_store_id?: string | null
          created_at?: string
          current_priority_list?: string[]
          current_turn_store_id?: string | null
          id?: string
          order_code?: string
          status?: Database["public"]["Enums"]["order_pool_status"]
          timeout_minutes?: number
          turn_start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          map_price: number | null
          model: string | null
          price: number | null
          product_name: string
          sku: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          map_price?: number | null
          model?: string | null
          price?: number | null
          product_name: string
          sku: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          map_price?: number | null
          model?: string | null
          price?: number | null
          product_name?: string
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          allocation_id: string
          created_at: string
          id: string
          items: Json
          status: string
          store_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          allocation_id: string
          created_at?: string
          id?: string
          items: Json
          status?: string
          store_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          allocation_id?: string
          created_at?: string
          id?: string
          items?: Json
          status?: string
          store_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      purchase_turns: {
        Row: {
          created_at: string
          current_store_id: string
          id: string
          round_number: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          current_store_id: string
          id?: string
          round_number?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          current_store_id?: string
          id?: string
          round_number?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string | null
          id: string
          items: Json | null
          number_of_items: number | null
          order_id: string | null
          reason: string
          refund_amount: number | null
          return_number: string | null
          status: string
          store_id: string
          total_map: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          items?: Json | null
          number_of_items?: number | null
          order_id?: string | null
          reason: string
          refund_amount?: number | null
          return_number?: string | null
          status?: string
          store_id: string
          total_map?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          items?: Json | null
          number_of_items?: number | null
          order_id?: string | null
          reason?: string
          refund_amount?: number | null
          return_number?: string | null
          status?: string
          store_id?: string
          total_map?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          product_id: string
          quantity: number
          sales_order_id: string
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          product_id: string
          quantity: number
          sales_order_id: string
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          product_id?: string
          quantity?: number
          sales_order_id?: string
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          accessory: string | null
          addr_city: string | null
          addr_country: string | null
          addr_state: string | null
          addr_street: string | null
          addr_zipcode: string | null
          cashier_id: string | null
          created_at: string
          created_by: string
          customer_email: string | null
          customer_first: string | null
          customer_last: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_source: string | null
          discount_amount: number
          id: string
          order_date: string | null
          order_number: string
          other_fee: number | null
          other_services: string | null
          payment_method: string | null
          payment_note: string | null
          status: string | null
          store_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
          walk_in_delivery: string | null
          warranty_amount: number | null
          warranty_years: number | null
        }
        Insert: {
          accessory?: string | null
          addr_city?: string | null
          addr_country?: string | null
          addr_state?: string | null
          addr_street?: string | null
          addr_zipcode?: string | null
          cashier_id?: string | null
          created_at?: string
          created_by: string
          customer_email?: string | null
          customer_first?: string | null
          customer_last?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_source?: string | null
          discount_amount?: number
          id?: string
          order_date?: string | null
          order_number: string
          other_fee?: number | null
          other_services?: string | null
          payment_method?: string | null
          payment_note?: string | null
          status?: string | null
          store_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          walk_in_delivery?: string | null
          warranty_amount?: number | null
          warranty_years?: number | null
        }
        Update: {
          accessory?: string | null
          addr_city?: string | null
          addr_country?: string | null
          addr_state?: string | null
          addr_street?: string | null
          addr_zipcode?: string | null
          cashier_id?: string | null
          created_at?: string
          created_by?: string
          customer_email?: string | null
          customer_first?: string | null
          customer_last?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_source?: string | null
          discount_amount?: number
          id?: string
          order_date?: string | null
          order_number?: string
          other_fee?: number | null
          other_services?: string | null
          payment_method?: string | null
          payment_note?: string | null
          status?: string | null
          store_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          walk_in_delivery?: string | null
          warranty_amount?: number | null
          warranty_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      scrap_audit: {
        Row: {
          action: string
          actor_id: string
          comment: string | null
          created_at: string
          header_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          comment?: string | null
          created_at?: string
          header_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          comment?: string | null
          created_at?: string
          header_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrap_audit_header_id_fkey"
            columns: ["header_id"]
            isOneToOne: false
            referencedRelation: "scrap_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      scrap_headers: {
        Row: {
          created_at: string
          created_by: string
          id: string
          scrap_no: string
          status: string
          store_id: string
          total_qty: number
          total_value: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          scrap_no: string
          status?: string
          store_id: string
          total_qty?: number
          total_value?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          scrap_no?: string
          status?: string
          store_id?: string
          total_qty?: number
          total_value?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      scrap_lines: {
        Row: {
          attachment_id: string | null
          batch_no: string | null
          created_at: string
          header_id: string
          id: string
          product_id: string
          qty: number
          reason: string
          unit_cost: number
          uom: string
          updated_at: string
        }
        Insert: {
          attachment_id?: string | null
          batch_no?: string | null
          created_at?: string
          header_id: string
          id?: string
          product_id: string
          qty: number
          reason: string
          unit_cost: number
          uom?: string
          updated_at?: string
        }
        Update: {
          attachment_id?: string | null
          batch_no?: string | null
          created_at?: string
          header_id?: string
          id?: string
          product_id?: string
          qty?: number
          reason?: string
          unit_cost?: number
          uom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrap_lines_header_id_fkey"
            columns: ["header_id"]
            isOneToOne: false
            referencedRelation: "scrap_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          created_at: string
          id: string
          manager_id: string | null
          phone: string | null
          region: string | null
          status: string | null
          store_code: string
          store_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          manager_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string | null
          store_code: string
          store_name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          manager_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string | null
          store_code?: string
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          store_id: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          store_id: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          store_id?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          store_id: string | null
          updated_at: string
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          updated_at?: string
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          updated_at?: string
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_allocations: {
        Row: {
          created_at: string
          id: string
          qty_left: number
          qty_total: number
          sku: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          qty_left: number
          qty_total: number
          sku: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          qty_left?: number
          qty_total?: number
          sku?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      warehouse_inventory: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          qty_available: number
          sku: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price: number
          qty_available?: number
          sku: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          qty_available?: number
          sku?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: []
      }
      warehouse_store_sequence: {
        Row: {
          created_at: string
          seq: number
          store_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          seq: number
          store_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          seq?: number
          store_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_sales_order_with_stock_deduction: {
        Args: { order_data: Json; line_items: Json[] }
        Returns: {
          id: string
          order_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          customer_first: string
          customer_last: string
          addr_country: string
          addr_state: string
          addr_city: string
          addr_street: string
          addr_zipcode: string
          order_date: string
          status: string
          total_amount: number
          discount_amount: number
          tax_amount: number
          warranty_years: number
          warranty_amount: number
          walk_in_delivery: string
          accessory: string
          other_services: string
          other_fee: number
          payment_method: string
          payment_note: string
          customer_source: string
          cashier_id: string
          store_id: string
          created_by: string
          created_at: string
          updated_at: string
        }[]
      }
      generate_scrap_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_profile: {
        Args: { user_uuid: string }
        Returns: {
          role: Database["public"]["Enums"]["user_role"]
          store_id: string
        }[]
      }
      get_user_roles: {
        Args: { user_uuid: string }
        Returns: {
          role: Database["public"]["Enums"]["user_role"]
          store_id: string
          warehouse_id: string
        }[]
      }
      has_role: {
        Args: {
          user_uuid: string
          check_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      initialize_order_pool: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      claim_action: "claimed" | "skipped" | "timeout"
      order_pool_status: "waiting" | "claimed" | "closed"
      user_role:
        | "store_manager"
        | "store_employee"
        | "warehouse_manager"
        | "warehouse_employee"
        | "hq_admin"
        | "hq_manager"
        | "warehouse_admin"
        | "store_staff"
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
      claim_action: ["claimed", "skipped", "timeout"],
      order_pool_status: ["waiting", "claimed", "closed"],
      user_role: [
        "store_manager",
        "store_employee",
        "warehouse_manager",
        "warehouse_employee",
        "hq_admin",
        "hq_manager",
        "warehouse_admin",
        "store_staff",
      ],
    },
  },
} as const
