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
      clients: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      financial_expense: {
        Row: {
          amount: number
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
          category?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          supplier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_income: {
        Row: {
          amount: number
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
          category?: string | null
          client_name?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fixed_costs: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
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
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      menu_settings: {
        Row: {
          business_hours: string | null
          cover_photo_url: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_hours?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_hours?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
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
        Relationships: []
      }
      products: {
        Row: {
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
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
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
        Relationships: []
      }
      recipes: {
        Row: {
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
        Relationships: []
      }
      shopping_list: {
        Row: {
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
          created_at?: string
          id?: string
          ingredient_name?: string
          quantity?: number | null
          store?: string | null
          total?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      variable_costs: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
