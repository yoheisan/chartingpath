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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string | null
          id: string
          pattern: Database["public"]["Enums"]["chart_pattern"]
          status: Database["public"]["Enums"]["alert_status"] | null
          symbol: string
          timeframe: Database["public"]["Enums"]["timeframe"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pattern: Database["public"]["Enums"]["chart_pattern"]
          status?: Database["public"]["Enums"]["alert_status"] | null
          symbol: string
          timeframe: Database["public"]["Enums"]["timeframe"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pattern?: Database["public"]["Enums"]["chart_pattern"]
          status?: Database["public"]["Enums"]["alert_status"] | null
          symbol?: string
          timeframe?: Database["public"]["Enums"]["timeframe"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alerts_log: {
        Row: {
          alert_id: string
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          pattern_data: Json | null
          price_data: Json | null
          triggered_at: string | null
        }
        Insert: {
          alert_id: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          pattern_data?: Json | null
          price_data?: Json | null
          triggered_at?: string | null
        }
        Update: {
          alert_id?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          pattern_data?: Json | null
          price_data?: Json | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_log_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          billing_reason: string | null
          created_at: string
          event_timestamp: string
          event_type: string
          from_plan: Database["public"]["Enums"]["subscription_plan"] | null
          full_amount_cents: number | null
          id: string
          metadata: Json | null
          prorata_amount_cents: number | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          to_plan: Database["public"]["Enums"]["subscription_plan"] | null
          user_id: string
        }
        Insert: {
          billing_reason?: string | null
          created_at?: string
          event_timestamp?: string
          event_type: string
          from_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          full_amount_cents?: number | null
          id?: string
          metadata?: Json | null
          prorata_amount_cents?: number | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          to_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          user_id: string
        }
        Update: {
          billing_reason?: string | null
          created_at?: string
          event_timestamp?: string
          event_type?: string
          from_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          full_amount_cents?: number | null
          id?: string
          metadata?: Json | null
          prorata_amount_cents?: number | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          to_plan?: Database["public"]["Enums"]["subscription_plan"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_pricing: {
        Row: {
          created_at: string
          features: Json | null
          is_active: boolean | null
          max_alerts: number
          monthly_price_cents: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
          yearly_price_cents: number
        }
        Insert: {
          created_at?: string
          features?: Json | null
          is_active?: boolean | null
          max_alerts?: number
          monthly_price_cents: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          yearly_price_cents: number
        }
        Update: {
          created_at?: string
          features?: Json | null
          is_active?: boolean | null
          max_alerts?: number
          monthly_price_cents?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          yearly_price_cents?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle_anchor: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          current_plan: Database["public"]["Enums"]["subscription_plan"]
          id: string
          previous_plan: Database["public"]["Enums"]["subscription_plan"] | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle_anchor?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          current_plan?: Database["public"]["Enums"]["subscription_plan"]
          id?: string
          previous_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle_anchor?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          current_plan?: Database["public"]["Enums"]["subscription_plan"]
          id?: string
          previous_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_prorata_amount: {
        Args: {
          billing_cycle_days?: number
          current_plan: Database["public"]["Enums"]["subscription_plan"]
          days_remaining: number
          new_plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Returns: number
      }
      update_profile_subscription: {
        Args: {
          p_plan: Database["public"]["Enums"]["subscription_plan"]
          p_status?: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      alert_status: "active" | "paused" | "deleted"
      chart_pattern:
        | "hammer"
        | "inverted_hammer"
        | "bullish_engulfing"
        | "bearish_engulfing"
        | "doji"
        | "morning_star"
        | "evening_star"
        | "ema_cross_bullish"
        | "ema_cross_bearish"
        | "rsi_divergence_bullish"
        | "rsi_divergence_bearish"
      subscription_plan: "starter" | "pro" | "elite"
      timeframe: "15m" | "1h" | "4h" | "1d"
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
      alert_status: ["active", "paused", "deleted"],
      chart_pattern: [
        "hammer",
        "inverted_hammer",
        "bullish_engulfing",
        "bearish_engulfing",
        "doji",
        "morning_star",
        "evening_star",
        "ema_cross_bullish",
        "ema_cross_bearish",
        "rsi_divergence_bullish",
        "rsi_divergence_bearish",
      ],
      subscription_plan: ["starter", "pro", "elite"],
      timeframe: ["15m", "1h", "4h", "1d"],
    },
  },
} as const
