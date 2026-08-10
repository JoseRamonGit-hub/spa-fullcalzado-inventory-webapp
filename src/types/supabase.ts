export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          business_id: string;
          exchange_rate_mode: Database["public"]["Enums"]["exchange_modes"] | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          business_id: string;
          exchange_rate_mode?: Database["public"]["Enums"]["exchange_modes"] | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          exchange_rate_mode?: Database["public"]["Enums"]["exchange_modes"] | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "app_settings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "app_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          is_active?: boolean;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cash_closes: {
        Row: {
          business_id: string;
          closed_at: string | null;
          closed_by: string;
          date: string;
          exchange_rate: number;
          id: string;
          total_billed_operations: number | null;
          total_returns: number;
          total_returns_usd: number;
          total_returns_ves: number;
          total_transactions: number;
          total_units_sold: number;
          total_usd: number;
          total_ves: number;
        };
        Insert: {
          business_id: string;
          closed_at?: string | null;
          closed_by: string;
          date?: string;
          exchange_rate: number;
          id?: string;
          total_billed_operations?: number | null;
          total_returns?: number;
          total_returns_usd?: number;
          total_returns_ves?: number;
          total_transactions?: number;
          total_units_sold?: number;
          total_usd?: number;
          total_ves?: number;
        };
        Update: {
          business_id?: string;
          closed_at?: string | null;
          closed_by?: string;
          date?: string;
          exchange_rate?: number;
          id?: string;
          total_billed_operations?: number | null;
          total_returns?: number;
          total_returns_usd?: number;
          total_returns_ves?: number;
          total_transactions?: number;
          total_units_sold?: number;
          total_usd?: number;
          total_ves?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cash_closes_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_closes_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      exchange_rates: {
        Row: {
          business_id: string;
          id: string;
          rate: number;
          source: Database["public"]["Enums"]["exchange_modes"];
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          business_id: string;
          id?: string;
          rate: number;
          source: Database["public"]["Enums"]["exchange_modes"];
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          id?: string;
          rate?: number;
          source?: Database["public"]["Enums"]["exchange_modes"];
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exchange_rates_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exchange_rates_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          adjustment_reason: string | null;
          business_id: string;
          created_at: string | null;
          date: string;
          description_before: string | null;
          id: string;
          price_usd: number | null;
          price_usd_before: number | null;
          product_id: string;
          quantity: number;
          return_id: string | null;
          stock_before: number | null;
          time: string;
          type: Database["public"]["Enums"]["movement_types"];
          user_id: string;
        };
        Insert: {
          adjustment_reason?: string | null;
          business_id: string;
          created_at?: string | null;
          date?: string;
          description_before?: string | null;
          id?: string;
          price_usd?: number | null;
          price_usd_before?: number | null;
          product_id: string;
          quantity: number;
          return_id?: string | null;
          stock_before?: number | null;
          time?: string;
          type: Database["public"]["Enums"]["movement_types"];
          user_id: string;
        };
        Update: {
          adjustment_reason?: string | null;
          business_id?: string;
          created_at?: string | null;
          date?: string;
          description_before?: string | null;
          id?: string;
          price_usd?: number | null;
          price_usd_before?: number | null;
          product_id?: string;
          quantity?: number;
          return_id?: string | null;
          stock_before?: number | null;
          time?: string;
          type?: Database["public"]["Enums"]["movement_types"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_business_product_fkey";
            columns: ["business_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "inventory_movements_business_return_fkey";
            columns: ["business_id", "return_id"];
            isOneToOne: false;
            referencedRelation: "returns";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "inventory_movements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          business_id: string;
          code: string;
          created_at: string | null;
          description: string;
          id: string;
          price_usd: number;
          stock: number;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean;
          business_id: string;
          code: string;
          created_at?: string | null;
          description: string;
          id?: string;
          price_usd: number;
          stock: number;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean;
          business_id?: string;
          code?: string;
          created_at?: string | null;
          description?: string;
          id?: string;
          price_usd?: number;
          stock?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      return_items: {
        Row: {
          business_id: string;
          id: string;
          price_usd: number;
          price_ves: number;
          product_id: string;
          quantity: number;
          return_id: string;
        };
        Insert: {
          business_id: string;
          id?: string;
          price_usd: number;
          price_ves: number;
          product_id: string;
          quantity: number;
          return_id: string;
        };
        Update: {
          business_id?: string;
          id?: string;
          price_usd?: number;
          price_ves?: number;
          product_id?: string;
          quantity?: number;
          return_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "return_items_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "return_items_business_product_fkey";
            columns: ["business_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "return_items_business_return_fkey";
            columns: ["business_id", "return_id"];
            isOneToOne: false;
            referencedRelation: "returns";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      returns: {
        Row: {
          business_id: string;
          created_at: string | null;
          credit_usd: number;
          credit_ves: number;
          date: string;
          difference_usd: number;
          difference_ves: number;
          exchange_rate: number;
          id: string;
          notes: string | null;
          time: string;
          type: Database["public"]["Enums"]["return_types"];
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string | null;
          credit_usd: number;
          credit_ves: number;
          date?: string;
          difference_usd?: number;
          difference_ves?: number;
          exchange_rate: number;
          id?: string;
          notes?: string | null;
          time?: string;
          type: Database["public"]["Enums"]["return_types"];
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string | null;
          credit_usd?: number;
          credit_ves?: number;
          date?: string;
          difference_usd?: number;
          difference_ves?: number;
          exchange_rate?: number;
          id?: string;
          notes?: string | null;
          time?: string;
          type?: Database["public"]["Enums"]["return_types"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "returns_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "returns_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sales: {
        Row: {
          business_id: string;
          created_at: string;
          date: string;
          id: string;
          time: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          date?: string;
          id?: string;
          time?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          date?: string;
          id?: string;
          time?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          business_id: string;
          created_at: string | null;
          date: string;
          exchange_rate: number;
          id: string;
          price_usd: number;
          price_ves: number;
          product_id: string;
          quantity: number;
          return_id: string | null;
          sale_id: string | null;
          time: string;
          total_usd: number | null;
          total_ves: number | null;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string | null;
          date?: string;
          exchange_rate: number;
          id?: string;
          price_usd: number;
          price_ves: number;
          product_id: string;
          quantity: number;
          return_id?: string | null;
          sale_id?: string | null;
          time?: string;
          total_usd?: number | null;
          total_ves?: number | null;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string | null;
          date?: string;
          exchange_rate?: number;
          id?: string;
          price_usd?: number;
          price_ves?: number;
          product_id?: string;
          quantity?: number;
          return_id?: string | null;
          sale_id?: string | null;
          time?: string;
          total_usd?: number | null;
          total_ves?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_business_product_fkey";
            columns: ["business_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "transactions_business_return_fkey";
            columns: ["business_id", "return_id"];
            isOneToOne: false;
            referencedRelation: "returns";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "transactions_business_sale_fkey";
            columns: ["business_id", "sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_business_access: {
        Row: {
          business_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_business_access_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_business_access_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          default_business_id: string;
          email: string;
          fullname: string;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["roles"];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          default_business_id: string;
          email: string;
          fullname: string;
          id: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["roles"];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          default_business_id?: string;
          email?: string;
          fullname?: string;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["roles"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_default_business_id_fkey";
            columns: ["default_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      adjust_product_stock: {
        Args: {
          p_business_id: string;
          p_expected_stock: number;
          p_new_stock: number;
          p_product_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
      admin_set_user_business_access: {
        Args: {
          p_business_ids: string[];
          p_default_business_id: string;
          p_user_id: string;
        };
        Returns: {
          created_at: string | null;
          default_business_id: string;
          email: string;
          fullname: string;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["roles"];
          updated_at: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "users";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_update_user: {
        Args: {
          p_business_ids: string[];
          p_default_business_id: string;
          p_fullname: string;
          p_is_active: boolean;
          p_role: Database["public"]["Enums"]["roles"];
          p_user_id: string;
        };
        Returns: {
          created_at: string | null;
          default_business_id: string;
          email: string;
          fullname: string;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["roles"];
          updated_at: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "users";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_sale: {
        Args: { p_business_id: string; p_exchange_rate: number; p_items: Json };
        Returns: string;
      };
      edit_product: {
        Args: {
          p_business_id: string;
          p_code?: string;
          p_description?: string;
          p_price_usd?: number;
          p_product_id: string;
          p_stock?: number;
        };
        Returns: Json;
      };
      generate_daily_cash_close: {
        Args: { p_business_id: string };
        Returns: {
          business_id: string;
          closed_at: string | null;
          closed_by: string;
          date: string;
          exchange_rate: number;
          id: string;
          total_billed_operations: number | null;
          total_returns: number;
          total_returns_usd: number;
          total_returns_ves: number;
          total_transactions: number;
          total_units_sold: number;
          total_usd: number;
          total_ves: number;
        };
        SetofOptions: {
          from: "*";
          to: "cash_closes";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_cash_close_summary: {
        Args: { p_business_id: string; p_date?: string };
        Returns: {
          billed_operations: number;
          net_usd: number;
          net_ves: number;
          total_returns: number;
          total_returns_usd: number;
          total_returns_ves: number;
          total_transactions: number;
          total_units_sold: number;
          total_usd: number;
          total_ves: number;
        }[];
      };
      get_dashboard_daily_metrics: {
        Args: { p_business_id: string };
        Returns: {
          billed_operations: number;
          dashboard_date: string;
          exchange_rate: number;
          exchange_rate_source: Database["public"]["Enums"]["exchange_modes"];
          exchange_rate_updated_at: string;
          low_stock_products: number;
          products_in_stock: number;
          returns_credit_usd: number;
          stock_units: number;
          total_billed_usd: number;
          total_produced_usd: number;
          units_sold: number;
        }[];
      };
      get_dashboard_sales_period: {
        Args: {
          p_business_id: string;
          p_end_date?: string;
          p_period?: string;
          p_start_date?: string;
        };
        Returns: {
          average_ticket_usd: number;
          bucket_end: string;
          bucket_index: number;
          bucket_label: string;
          bucket_start: string;
          bucket_total_usd: number;
          comparison_end: string;
          comparison_start: string;
          current_end: string;
          current_operations: number;
          current_start: string;
          current_total_usd: number;
          is_available: boolean;
          period: string;
          previous_operations: number;
          previous_total_usd: number;
        }[];
      };
      get_dashboard_top_products: {
        Args: {
          p_business_id: string;
          p_end_date?: string;
          p_period?: string;
          p_rank_by?: string;
          p_start_date?: string;
        };
        Returns: {
          code: string;
          description: string;
          gross_usd: number;
          product_id: string;
          rank: number;
          units: number;
        }[];
      };
      get_product_history: {
        Args: {
          p_business_id: string;
          p_end_date?: string;
          p_product_id: string;
          p_show_all?: boolean;
          p_start_date?: string;
        };
        Returns: {
          adjustment_reason: string;
          business_id: string;
          created_at: string;
          date: string;
          description_before: string;
          id: string;
          price_usd: number;
          price_usd_before: number;
          product_id: string;
          quantity: number;
          return_id: string;
          stock_before: number;
          time: string;
          type: Database["public"]["Enums"]["movement_types"];
          user_fullname: string;
          user_id: string;
        }[];
      };
      get_product_stagnation: {
        Args: { p_business_id: string; p_product_id: string };
        Returns: {
          stagnant_days: number;
          stagnant_since: string;
        }[];
      };
      get_product_stock_alerts: {
        Args: {
          p_alert_type?: string;
          p_business_id: string;
          p_created_date?: string;
          p_limit?: number;
        };
        Returns: {
          active: boolean;
          alert_rank: number;
          alert_type: string;
          business_id: string;
          code: string;
          created_at: string;
          description: string;
          price_usd: number;
          product_id: string;
          stagnant_days: number;
          stagnant_since: string;
          stock: number;
          updated_at: string;
        }[];
      };
      process_return: {
        Args: {
          p_business_id: string;
          p_exchange_rate?: number;
          p_new_items?: Json;
          p_notes?: string;
          p_returned_items: Json;
          p_type: string;
        };
        Returns: Json;
      };
      set_product_active: {
        Args: { p_active: boolean; p_business_id: string; p_product_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      exchange_modes: "manual" | "bcv";
      movement_types: "entry" | "exit" | "return" | "edit" | "activation" | "deactivation";
      return_types: "exchange" | "refund";
      roles: "admin" | "employee";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      exchange_modes: ["manual", "bcv"],
      movement_types: ["entry", "exit", "return", "edit", "activation", "deactivation"],
      return_types: ["exchange", "refund"],
      roles: ["admin", "employee"],
    },
  },
} as const;
