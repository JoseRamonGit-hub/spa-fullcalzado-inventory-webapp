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
      app_settings: {
        Row: {
          exchange_rate_mode:
            | Database["public"]["Enums"]["exchange_modes"]
            | null
          id: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          exchange_rate_mode?:
            | Database["public"]["Enums"]["exchange_modes"]
            | null
          id?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          exchange_rate_mode?:
            | Database["public"]["Enums"]["exchange_modes"]
            | null
          id?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_closes: {
        Row: {
          closed_at: string | null
          closed_by: string
          date: string
          exchange_rate: number
          id: string
          total_transactions: number
          total_units_sold: number
          total_usd: number
          total_ves: number
        }
        Insert: {
          closed_at?: string | null
          closed_by: string
          date?: string
          exchange_rate: number
          id?: string
          total_transactions?: number
          total_units_sold?: number
          total_usd?: number
          total_ves?: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string
          date?: string
          exchange_rate?: number
          id?: string
          total_transactions?: number
          total_units_sold?: number
          total_usd?: number
          total_ves?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_closes_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          id: string
          rate: number
          source: Database["public"]["Enums"]["exchange_modes"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          rate: number
          source: Database["public"]["Enums"]["exchange_modes"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          rate?: number
          source?: Database["public"]["Enums"]["exchange_modes"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          date: string
          id: string
          product_id: string
          quantity: number
          time: string
          type: Database["public"]["Enums"]["movement_types"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          product_id: string
          quantity: number
          time?: string
          type: Database["public"]["Enums"]["movement_types"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          product_id?: string
          quantity?: number
          time?: string
          type?: Database["public"]["Enums"]["movement_types"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          code: string
          created_at: string | null
          description: string
          id: string
          price_usd: number
          stock: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string | null
          description: string
          id?: string
          price_usd: number
          stock: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string | null
          description?: string
          id?: string
          price_usd?: number
          stock?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string | null
          date: string
          exchange_rate: number
          id: string
          price_usd: number
          price_ves: number
          product_id: string
          quantity: number
          time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          exchange_rate: number
          id?: string
          price_usd: number
          price_ves: number
          product_id: string
          quantity: number
          time?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          exchange_rate?: number
          id?: string
          price_usd?: number
          price_ves?: number
          product_id?: string
          quantity?: number
          time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          fullname: string
          id: string
          role: Database["public"]["Enums"]["roles"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          fullname: string
          id: string
          role?: Database["public"]["Enums"]["roles"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          fullname?: string
          id?: string
          role?: Database["public"]["Enums"]["roles"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_daily_cash_close: {
        Args: { p_user_id: string }
        Returns: {
          closed_at: string | null
          closed_by: string
          date: string
          exchange_rate: number
          id: string
          total_transactions: number
          total_units_sold: number
          total_usd: number
          total_ves: number
        }
        SetofOptions: {
          from: "*"
          to: "cash_closes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      exchange_modes: "manual" | "bcv"
      movement_types: "entry" | "exit"
      roles: "admin" | "employee"
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
      exchange_modes: ["manual", "bcv"],
      movement_types: ["entry", "exit"],
      roles: ["admin", "employee"],
    },
  },
} as const
