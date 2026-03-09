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
      audit_logs: {
        Row: {
          action: string
          business_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          business_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          business_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          business_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_expense: {
        Row: {
          amount: number
          business_id: string | null
          category: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          supplier: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          business_id?: string | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          supplier?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          supplier?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_expense_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_income: {
        Row: {
          amount: number
          business_id: string | null
          category: string | null
          client_name: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          payment_method: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          business_id?: string | null
          category?: string | null
          client_name?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          category?: string | null
          client_name?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_income_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_costs: {
        Row: {
          amount: number
          business_id: string | null
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          business_id?: string | null
          category: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_costs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          business_id: string | null
          category: string | null
          cost_per_unit: number | null
          created_at: string
          current_stock: number | null
          id: string
          min_stock: number | null
          name: string
          quantity_purchased: number
          supplier: string | null
          total_cost: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          min_stock?: number | null
          name: string
          quantity_purchased?: number
          supplier?: string | null
          total_cost?: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          min_stock?: number | null
          name?: string
          quantity_purchased?: number
          supplier?: string | null
          total_cost?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          name: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_products: {
        Row: {
          available_today: boolean
          business_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          name: string
          photo_url: string | null
          price: number
          sort_order: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_today?: boolean
          business_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          name: string
          photo_url?: string | null
          price?: number
          sort_order?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_today?: boolean
          business_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          name?: string
          photo_url?: string | null
          price?: number
          sort_order?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_settings: {
        Row: {
          business_hours: string | null
          business_id: string | null
          button_color: string | null
          cover_photo_url: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          showcase_mode: boolean | null
          store_name: string | null
          tagline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_hours?: string | null
          business_id?: string | null
          button_color?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          showcase_mode?: boolean | null
          store_name?: string | null
          tagline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_hours?: string | null
          business_id?: string | null
          button_color?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          showcase_mode?: boolean | null
          store_name?: string | null
          tagline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string | null
          category: string | null
          client_id: string | null
          created_at: string
          delivery_address: string | null
          delivery_type: string | null
          dough: string | null
          event_date: string | null
          fee_card_percent: number | null
          fee_decoration: number | null
          fee_delivery: number | null
          fee_packaging: number | null
          fee_topper: number | null
          filling: string | null
          id: string
          notes: string | null
          observation: string | null
          payment_method: string | null
          payment_percent: number | null
          product_id: string | null
          size: string | null
          status: string
          topping: string | null
          total_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_type?: string | null
          dough?: string | null
          event_date?: string | null
          fee_card_percent?: number | null
          fee_decoration?: number | null
          fee_delivery?: number | null
          fee_packaging?: number | null
          fee_topper?: number | null
          filling?: string | null
          id?: string
          notes?: string | null
          observation?: string | null
          payment_method?: string | null
          payment_percent?: number | null
          product_id?: string | null
          size?: string | null
          status?: string
          topping?: string | null
          total_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_type?: string | null
          dough?: string | null
          event_date?: string | null
          fee_card_percent?: number | null
          fee_decoration?: number | null
          fee_delivery?: number | null
          fee_packaging?: number | null
          fee_topper?: number | null
          filling?: string | null
          id?: string
          notes?: string | null
          observation?: string | null
          payment_method?: string | null
          payment_percent?: number | null
          product_id?: string | null
          size?: string | null
          status?: string
          topping?: string | null
          total_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging: {
        Row: {
          business_id: string | null
          category: string | null
          cost_per_unit: number | null
          created_at: string
          current_stock: number | null
          id: string
          min_stock: number | null
          name: string
          quantity_purchased: number
          supplier: string | null
          total_cost: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          min_stock?: number | null
          name: string
          quantity_purchased?: number
          supplier?: string | null
          total_cost?: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string
          current_stock?: number | null
          id?: string
          min_stock?: number | null
          name?: string
          quantity_purchased?: number
          supplier?: string | null
          total_cost?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packaging_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          ingredients_json: Json | null
          name: string
          packaging_json: Json | null
          photo_url: string | null
          preparation_time: number | null
          profit_margin: number | null
          suggested_price: number | null
          total_cost: number | null
          updated_at: string
          user_id: string
          yield_quantity: number
          yield_unit: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ingredients_json?: Json | null
          name: string
          packaging_json?: Json | null
          photo_url?: string | null
          preparation_time?: number | null
          profit_margin?: number | null
          suggested_price?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
          yield_quantity?: number
          yield_unit?: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ingredients_json?: Json | null
          name?: string
          packaging_json?: Json | null
          photo_url?: string | null
          preparation_time?: number | null
          profit_margin?: number | null
          suggested_price?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
          yield_quantity?: number
          yield_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          business_id: string | null
          created_at: string
          desired_salary: number | null
          id: string
          logo_url: string | null
          name: string
          store_name: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
          work_days_per_week: number | null
          work_hours_per_day: number | null
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          created_at?: string
          desired_salary?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          store_name?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
          work_days_per_week?: number | null
          work_hours_per_day?: number | null
        }
        Update: {
          address?: string | null
          business_id?: string | null
          created_at?: string
          desired_salary?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          store_name?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
          work_days_per_week?: number | null
          work_hours_per_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          business_id: string | null
          category: string | null
          created_at: string
          id: string
          ingredients_json: Json | null
          name: string
          photo_url: string | null
          total_cost: number | null
          updated_at: string
          user_id: string
          yield_quantity: number | null
          yield_unit: string | null
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          ingredients_json?: Json | null
          name: string
          photo_url?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
          yield_quantity?: number | null
          yield_unit?: string | null
        }
        Update: {
          business_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          ingredients_json?: Json | null
          name?: string
          photo_url?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
          yield_quantity?: number | null
          yield_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          ingredient_name: string
          quantity: number | null
          store: string | null
          total: number | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          ingredient_name: string
          quantity?: number | null
          store?: string | null
          total?: number | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          ingredient_name?: string
          quantity?: number | null
          store?: string | null
          total?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      variable_costs: {
        Row: {
          amount: number
          business_id: string | null
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          business_id?: string | null
          category: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variable_costs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          _action: string
          _business_id: string
          _entity: string
          _entity_id?: string
          _metadata?: Json
          _user_id: string
        }
        Returns: undefined
      }
      user_in_business: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "staff"
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
      app_role: ["owner", "staff"],
    },
  },
} as const
