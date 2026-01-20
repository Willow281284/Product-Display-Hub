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
      batch_items: {
        Row: {
          batch_id: string
          category_id: string | null
          created_at: string
          error_message: string | null
          id: string
          marketplace: string
          product_id: string
          product_image: string | null
          product_name: string
          product_sku: string | null
          profit_margin: number | null
          sale_price: number | null
          status: Database["public"]["Enums"]["batch_item_status"]
          stock_qty: number | null
          updated_at: string
        }
        Insert: {
          batch_id: string
          category_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          marketplace: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_sku?: string | null
          profit_margin?: number | null
          sale_price?: number | null
          status?: Database["public"]["Enums"]["batch_item_status"]
          stock_qty?: number | null
          updated_at?: string
        }
        Update: {
          batch_id?: string
          category_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          marketplace?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_sku?: string | null
          profit_margin?: number | null
          sale_price?: number | null
          status?: Database["public"]["Enums"]["batch_item_status"]
          stock_qty?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "marketplace_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_attributes: {
        Row: {
          attribute_key: string
          attribute_name: string
          attribute_type: string
          category_id: string
          created_at: string
          display_order: number
          help_text: string | null
          id: string
          is_required: boolean
          placeholder: string | null
          section: string
          validation_rules: Json | null
        }
        Insert: {
          attribute_key: string
          attribute_name: string
          attribute_type?: string
          category_id: string
          created_at?: string
          display_order?: number
          help_text?: string | null
          id?: string
          is_required?: boolean
          placeholder?: string | null
          section?: string
          validation_rules?: Json | null
        }
        Update: {
          attribute_key?: string
          attribute_name?: string
          attribute_type?: string
          category_id?: string
          created_at?: string
          display_order?: number
          help_text?: string | null
          id?: string
          is_required?: boolean
          placeholder?: string | null
          section?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "category_attributes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_batches: {
        Row: {
          created_at: string
          failed_count: number
          id: string
          name: string
          selected_marketplaces: string[]
          status: Database["public"]["Enums"]["batch_status"]
          success_count: number
          total_items: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_count?: number
          id?: string
          name: string
          selected_marketplaces?: string[]
          status?: Database["public"]["Enums"]["batch_status"]
          success_count?: number
          total_items?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_count?: number
          id?: string
          name?: string
          selected_marketplaces?: string[]
          status?: Database["public"]["Enums"]["batch_status"]
          success_count?: number
          total_items?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          attribute_key: string
          attribute_value: string | null
          batch_item_id: string
          id: string
          is_valid: boolean | null
          updated_at: string
          validation_message: string | null
        }
        Insert: {
          attribute_key: string
          attribute_value?: string | null
          batch_item_id: string
          id?: string
          is_valid?: boolean | null
          updated_at?: string
          validation_message?: string | null
        }
        Update: {
          attribute_key?: string
          attribute_value?: string | null
          batch_item_id?: string
          id?: string
          is_valid?: boolean | null
          updated_at?: string
          validation_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_batch_item_id_fkey"
            columns: ["batch_item_id"]
            isOneToOne: false
            referencedRelation: "batch_items"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          marketplace: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          marketplace: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          marketplace?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_batch_owner: { Args: { batch_id: string }; Returns: boolean }
    }
    Enums: {
      batch_item_status: "pending" | "processing" | "success" | "failed"
      batch_status: "pending" | "processing" | "completed" | "failed"
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
      batch_item_status: ["pending", "processing", "success", "failed"],
      batch_status: ["pending", "processing", "completed", "failed"],
    },
  },
} as const
