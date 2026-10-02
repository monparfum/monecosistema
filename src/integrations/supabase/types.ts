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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          recipient: string
          state: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          recipient: string
          state: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          recipient?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          channel: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          name: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          name: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_line1: string | null
          address_postal_code: string | null
          address_state: string | null
          cnpj: string | null
          currency: string
          email: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          singleton: boolean
          updated_at: string
          address_number: string | null
          address_district: string | null
          address_complement: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_line1?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          cnpj?: string | null
          currency?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_line1?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          cnpj?: string | null
          currency?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          singleton?: boolean
          updated_at?: string
          address_number?: string | null
          address_district?: string | null
          address_complement?: string | null
        }
        Relationships: []
      }
      corporate_accounts: {
        Row: { cnpj: string | null; city: string | null; created_at: string; domain: string | null; id: string; name: string; notes: string | null; owner_id: string | null; segment: string | null; size: string | null; tags: string[]; updated_at: string; website: string | null }
        Insert: { cnpj?: string | null; city?: string | null; created_at?: string; domain?: string | null; id?: string; name: string; notes?: string | null; owner_id?: string | null; segment?: string | null; size?: string | null; tags?: string[]; updated_at?: string; website?: string | null }
        Update: { cnpj?: string | null; city?: string | null; created_at?: string; domain?: string | null; id?: string; name?: string; notes?: string | null; owner_id?: string | null; segment?: string | null; size?: string | null; tags?: string[]; updated_at?: string; website?: string | null }
        Relationships: []
      }
      corporate_contacts: {
        Row: { account_id: string; created_at: string; email: string | null; id: string; is_primary: boolean; name: string; notes: string | null; phone: string | null; role: string | null }
        Insert: { account_id: string; created_at?: string; email?: string | null; id?: string; is_primary?: boolean; name: string; notes?: string | null; phone?: string | null; role?: string | null }
        Update: { account_id?: string; created_at?: string; email?: string | null; id?: string; is_primary?: boolean; name?: string; notes?: string | null; phone?: string | null; role?: string | null }
        Relationships: []
      }
      customer_notes: {
        Row: {
          author_user_id: string | null
          body: string
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          author_user_id?: string | null
          body: string
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          author_user_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: { account_id: string | null; author_id: string | null; body: string; created_at: string; id: string; kind: string; lead_id: string | null }
        Insert: { account_id?: string | null; author_id?: string | null; body: string; created_at?: string; id?: string; kind: string; lead_id?: string | null }
        Update: { account_id?: string | null; author_id?: string | null; body?: string; created_at?: string; id?: string; kind?: string; lead_id?: string | null }
        Relationships: []
      }
      leads: {
        Row: { account_id: string | null; closed_at: string | null; company: string | null; created_at: string; email: string; event_city: string | null; event_date: string | null; event_type: string | null; id: string; kind: string; lost_reason: string | null; name: string | null; next_action: string | null; next_action_at: string | null; owner_id: string | null; participants: number | null; payload: Json; phone: string | null; status: string; tags: string[]; updated_at: string; value_cents: number | null }
        Insert: { account_id?: string | null; closed_at?: string | null; company?: string | null; created_at?: string; email: string; event_city?: string | null; event_date?: string | null; event_type?: string | null; id?: string; kind: string; lost_reason?: string | null; name?: string | null; next_action?: string | null; next_action_at?: string | null; owner_id?: string | null; participants?: number | null; payload?: Json; phone?: string | null; status?: string; tags?: string[]; updated_at?: string; value_cents?: number | null }
        Update: { account_id?: string | null; closed_at?: string | null; company?: string | null; created_at?: string; email?: string; event_city?: string | null; event_date?: string | null; event_type?: string | null; id?: string; kind?: string; lost_reason?: string | null; name?: string | null; next_action?: string | null; next_action_at?: string | null; owner_id?: string | null; participants?: number | null; payload?: Json; phone?: string | null; status?: string; tags?: string[]; updated_at?: string; value_cents?: number | null }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          filename: string
          folder: string | null
          height: number | null
          id: string
          mime_type: string | null
          tags: string[]
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          filename: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          tags?: string[]
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          filename?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          tags?: string[]
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      module_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          subject_id: string | null
          subject_type: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          subject_id?: string | null
          subject_type: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          subject_id?: string | null
          subject_type?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          image_url: string | null
          line_total_cents: number
          order_id: string
          product_brand: string | null
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          line_total_cents: number
          order_id: string
          product_brand?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          id?: string
          image_url?: string | null
          line_total_cents?: number
          order_id?: string
          product_brand?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
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
          created_at: string
          email: string
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_reference: string | null
          shipping_cents: number
          shipping_city: string
          shipping_country: string
          shipping_line1: string
          shipping_line2: string | null
          shipping_phone: string | null
          shipping_postal_code: string
          shipping_recipient: string
          shipping_state: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          tracking_code: string | null
          updated_at: string
          user_id: string | null
          shipping_number: string | null
          shipping_district: string | null
          shipping_document: string | null
          shipping_service: string | null
          shipping_service_id: number | null
          shipping_label_id: string | null
          shipping_label_url: string | null
          stock_applied: boolean
          requires_shipping: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_reference?: string | null
          shipping_cents?: number
          shipping_city: string
          shipping_country?: string
          shipping_line1: string
          shipping_line2?: string | null
          shipping_phone?: string | null
          shipping_postal_code: string
          shipping_recipient: string
          shipping_state: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_reference?: string | null
          shipping_cents?: number
          shipping_city?: string
          shipping_country?: string
          shipping_line1?: string
          shipping_line2?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string
          shipping_recipient?: string
          shipping_state?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
          shipping_number?: string | null
          shipping_district?: string | null
          shipping_document?: string | null
          shipping_service?: string | null
          shipping_service_id?: number | null
          shipping_label_id?: string | null
          shipping_label_url?: string | null
          stock_applied?: boolean
          requires_shipping?: boolean
        }
        Relationships: []
      }
      shipping_quotes: {
        Row: {
          created_at: string
          delivery_days: number | null
          expires_at: string
          id: string
          items: Json
          postal_code: string
          price_cents: number
          service_id: number | null
          service_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_days?: number | null
          expires_at?: string
          id?: string
          items: Json
          postal_code: string
          price_cents: number
          service_id?: number | null
          service_name: string
          user_id: string
        }
        Update: {
          delivery_days?: number | null
          expires_at?: string
          items?: Json
          postal_code?: string
          price_cents?: number
          service_id?: number | null
          service_name?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: { key: string; value: string; updated_at: string; updated_by: string | null }
        Insert: { key: string; value: string; updated_at?: string; updated_by?: string | null }
        Update: { key?: string; value?: string; updated_at?: string; updated_by?: string | null }
        Relationships: []
      }
      site_content: {
        Row: { data: Json; page: string; updated_at: string; updated_by: string | null }
        Insert: { data?: Json; page: string; updated_at?: string; updated_by?: string | null }
        Update: { data?: Json; page?: string; updated_at?: string; updated_by?: string | null }
        Relationships: []
      }
      stock_movements: {
        Row: {
          actor_user_id: string | null
          created_at: string
          delta: number
          id: string
          order_id: string | null
          product_id: string
          reason: string
          stock_after: number
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          delta: number
          id?: string
          order_id?: string | null
          product_id: string
          reason: string
          stock_after: number
        }
        Update: {
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      page_blocks: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_id: string
          position: number
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          page_id: string
          position?: number
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_id?: string
          position?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_versions: {
        Row: {
          blocks_snapshot: Json
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          page_id: string
          seo_description: string | null
          seo_title: string | null
          title: string
        }
        Insert: {
          blocks_snapshot?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          page_id: string
          seo_description?: string | null
          seo_title?: string | null
          title: string
        }
        Update: {
          blocks_snapshot?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          page_id?: string
          seo_description?: string | null
          seo_title?: string | null
          title?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string
          id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: { address: string | null; category: string | null; city: string | null; cnpj: string | null; created_at: string; created_by: string | null; email: string | null; external_id: string | null; extra: Json; id: string; lead_id: string | null; legal_name: string | null; name: string; notes: string | null; phone: string | null; rating: number | null; reviews: number | null; search: string | null; size: string | null; source: string; state: string | null; status: string; updated_at: string; website: string | null }
        Insert: { address?: string | null; category?: string | null; city?: string | null; cnpj?: string | null; created_at?: string; created_by?: string | null; email?: string | null; external_id?: string | null; extra?: Json; id?: string; lead_id?: string | null; legal_name?: string | null; name: string; notes?: string | null; phone?: string | null; rating?: number | null; reviews?: number | null; search?: string | null; size?: string | null; source: string; state?: string | null; status?: string; updated_at?: string; website?: string | null }
        Update: { address?: string | null; category?: string | null; city?: string | null; cnpj?: string | null; created_at?: string; created_by?: string | null; email?: string | null; external_id?: string | null; extra?: Json; id?: string; lead_id?: string | null; legal_name?: string | null; name?: string; notes?: string | null; phone?: string | null; rating?: number | null; reviews?: number | null; search?: string | null; size?: string | null; source?: string; state?: string | null; status?: string; updated_at?: string; website?: string | null }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean
          fragrance_family: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          price_cents: number
          slug: string
          stock: number
          updated_at: string
          volume_ml: number | null
          sku: string | null
          weight_g: number
          length_cm: number
          width_cm: number
          height_cm: number
          low_stock_threshold: number
          delivery_type: Database["public"]["Enums"]["product_delivery"]
          member_course_ids: string[]
          compare_at_cents: number | null
          details: Json
          coming_soon: boolean
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          fragrance_family?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          price_cents: number
          slug: string
          stock?: number
          updated_at?: string
          volume_ml?: number | null
          sku?: string | null
          weight_g?: number
          length_cm?: number
          width_cm?: number
          height_cm?: number
          low_stock_threshold?: number
          delivery_type?: Database["public"]["Enums"]["product_delivery"]
          member_course_ids?: string[]
          compare_at_cents?: number | null
          details?: Json
          coming_soon?: boolean
        }
        Update: {
          active?: boolean
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          fragrance_family?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          price_cents?: number
          slug?: string
          stock?: number
          updated_at?: string
          volume_ml?: number | null
          sku?: string | null
          weight_g?: number
          length_cm?: number
          width_cm?: number
          height_cm?: number
          low_stock_threshold?: number
          delivery_type?: Database["public"]["Enums"]["product_delivery"]
          member_course_ids?: string[]
          compare_at_cents?: number | null
          details?: Json
          coming_soon?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      can_publish: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_studio_access: { Args: { _user_id: string }; Returns: boolean }
      log_module_event: {
        Args: {
          _actor: string
          _event_type: string
          _payload: Json
          _subject_id: string
          _subject_type: string
        }
        Returns: string
      }
      place_order: { Args: { _address: Json; _items: Json; _quote_id?: string | null }; Returns: Json }
      normalize_cart: { Args: { _items: Json }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "customer" | "editor" | "reviewer"
      product_delivery: "physical" | "digital" | "hybrid"
      order_status:
        | "pending_payment"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
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
      app_role: ["admin", "customer", "editor", "reviewer"],
      order_status: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_delivery: ["physical", "digital", "hybrid"],
    },
  },
} as const
