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
      admin_sessions: {
        Row: {
          id: string
          ip_address: unknown
          is_active: boolean | null
          login_time: string
          logout_time: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          login_time?: string
          logout_time?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          login_time?: string
          logout_time?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alert_outcomes: {
        Row: {
          alert_log_id: string
          created_at: string
          entry_price: number | null
          exit_price: number | null
          id: string
          notes: string | null
          outcome_type: string
          pnl_percentage: number | null
          trade_duration_hours: number | null
          user_id: string
        }
        Insert: {
          alert_log_id: string
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          notes?: string | null
          outcome_type: string
          pnl_percentage?: number | null
          trade_duration_hours?: number | null
          user_id: string
        }
        Update: {
          alert_log_id?: string
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          notes?: string | null
          outcome_type?: string
          pnl_percentage?: number | null
          trade_duration_hours?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_outcomes_alert_log_id_fkey"
            columns: ["alert_log_id"]
            isOneToOne: false
            referencedRelation: "alerts_log"
            referencedColumns: ["id"]
          },
        ]
      }
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
      backtest_presets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          parameters: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          parameters?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          parameters?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_runs: {
        Row: {
          avg_holding_time_hours: number | null
          avg_loss: number | null
          avg_rr: number | null
          avg_win: number | null
          bars_processed: number | null
          cagr: number | null
          commission: number
          created_at: string
          data_granularity: string | null
          drawdown_data: Json | null
          engine_version: string
          equity_curve_data: Json | null
          error_message: string | null
          expectancy: number | null
          exposure_percentage: number | null
          fee_model: string | null
          from_date: string
          id: string
          initial_capital: number
          instrument: string
          is_starred: boolean | null
          max_drawdown: number | null
          net_pnl: number | null
          notes: string | null
          order_type: string
          parameters: Json
          position_size: number
          position_sizing_type: string
          profit_factor: number | null
          run_duration_seconds: number | null
          sharpe_ratio: number | null
          slippage: number
          sortino_ratio: number | null
          status: string
          stop_loss: number | null
          strategy_id: string | null
          strategy_name: string
          strategy_version: string | null
          tags: string[] | null
          take_profit: number | null
          timeframe: string
          to_date: string
          total_trades: number | null
          trade_log: Json | null
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          avg_holding_time_hours?: number | null
          avg_loss?: number | null
          avg_rr?: number | null
          avg_win?: number | null
          bars_processed?: number | null
          cagr?: number | null
          commission?: number
          created_at?: string
          data_granularity?: string | null
          drawdown_data?: Json | null
          engine_version?: string
          equity_curve_data?: Json | null
          error_message?: string | null
          expectancy?: number | null
          exposure_percentage?: number | null
          fee_model?: string | null
          from_date: string
          id?: string
          initial_capital?: number
          instrument: string
          is_starred?: boolean | null
          max_drawdown?: number | null
          net_pnl?: number | null
          notes?: string | null
          order_type?: string
          parameters?: Json
          position_size?: number
          position_sizing_type?: string
          profit_factor?: number | null
          run_duration_seconds?: number | null
          sharpe_ratio?: number | null
          slippage?: number
          sortino_ratio?: number | null
          status?: string
          stop_loss?: number | null
          strategy_id?: string | null
          strategy_name: string
          strategy_version?: string | null
          tags?: string[] | null
          take_profit?: number | null
          timeframe: string
          to_date: string
          total_trades?: number | null
          trade_log?: Json | null
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          avg_holding_time_hours?: number | null
          avg_loss?: number | null
          avg_rr?: number | null
          avg_win?: number | null
          bars_processed?: number | null
          cagr?: number | null
          commission?: number
          created_at?: string
          data_granularity?: string | null
          drawdown_data?: Json | null
          engine_version?: string
          equity_curve_data?: Json | null
          error_message?: string | null
          expectancy?: number | null
          exposure_percentage?: number | null
          fee_model?: string | null
          from_date?: string
          id?: string
          initial_capital?: number
          instrument?: string
          is_starred?: boolean | null
          max_drawdown?: number | null
          net_pnl?: number | null
          notes?: string | null
          order_type?: string
          parameters?: Json
          position_size?: number
          position_sizing_type?: string
          profit_factor?: number | null
          run_duration_seconds?: number | null
          sharpe_ratio?: number | null
          slippage?: number
          sortino_ratio?: number | null
          status?: string
          stop_loss?: number | null
          strategy_id?: string | null
          strategy_name?: string
          strategy_version?: string | null
          tags?: string[] | null
          take_profit?: number | null
          timeframe?: string
          to_date?: string
          total_trades?: number | null
          trade_log?: Json | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      backtester_v2_usage: {
        Row: {
          created_at: string
          id: string
          run_date: string
          runs_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          run_date?: string
          runs_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          run_date?: string
          runs_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      community_analytics: {
        Row: {
          ai_responses: number
          avg_response_time_minutes: number | null
          created_at: string
          date: string
          id: string
          sentiment_score: number | null
          top_categories: Json | null
          total_messages: number
          total_questions: number
          user_responses: number
        }
        Insert: {
          ai_responses?: number
          avg_response_time_minutes?: number | null
          created_at?: string
          date?: string
          id?: string
          sentiment_score?: number | null
          top_categories?: Json | null
          total_messages?: number
          total_questions?: number
          user_responses?: number
        }
        Update: {
          ai_responses?: number
          avg_response_time_minutes?: number | null
          created_at?: string
          date?: string
          id?: string
          sentiment_score?: number | null
          top_categories?: Json | null
          total_messages?: number
          total_questions?: number
          user_responses?: number
        }
        Relationships: []
      }
      community_message_likes: {
        Row: {
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_message_likes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          ai_confidence_score: number | null
          content: string
          created_at: string
          id: string
          is_ai_response: boolean
          likes_count: number
          message_type: string
          parent_id: string | null
          replies_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          is_ai_response?: boolean
          likes_count?: number
          message_type?: string
          parent_id?: string | null
          replies_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          is_ai_response?: boolean
          likes_count?: number
          message_type?: string
          parent_id?: string | null
          replies_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_strategies: {
        Row: {
          created_at: string
          description: string
          downloads_count: number | null
          id: string
          is_featured: boolean | null
          likes_count: number | null
          original_strategy_id: string | null
          performance_data: Json | null
          strategy_code: string
          strategy_type: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          downloads_count?: number | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number | null
          original_strategy_id?: string | null
          performance_data?: Json | null
          strategy_code: string
          strategy_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          downloads_count?: number | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number | null
          original_strategy_id?: string | null
          performance_data?: Json | null
          strategy_code?: string
          strategy_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_strategies_original_strategy_id_fkey"
            columns: ["original_strategy_id"]
            isOneToOne: false
            referencedRelation: "user_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      country_language_mapping: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          id: string
          primary_language_code: string
          secondary_language_codes: string[] | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          primary_language_code: string
          secondary_language_codes?: string[] | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          primary_language_code?: string
          secondary_language_codes?: string[] | null
        }
        Relationships: []
      }
      economic_alerts: {
        Row: {
          delivery_method: string
          event_id: string | null
          id: string
          sent_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          delivery_method: string
          event_id?: string | null
          id?: string
          sent_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          delivery_method?: string
          event_id?: string | null
          id?: string
          sent_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "economic_alerts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "economic_events"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_calendar_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          email_frequency: string | null
          id: string
          impact_levels: string[] | null
          indicator_types: string[] | null
          regions: string[] | null
          telegram_chat_id: string | null
          telegram_enabled: boolean | null
          twitter_enabled: boolean | null
          twitter_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          email_frequency?: string | null
          id?: string
          impact_levels?: string[] | null
          indicator_types?: string[] | null
          regions?: string[] | null
          telegram_chat_id?: string | null
          telegram_enabled?: boolean | null
          twitter_enabled?: boolean | null
          twitter_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          email_frequency?: string | null
          id?: string
          impact_levels?: string[] | null
          indicator_types?: string[] | null
          regions?: string[] | null
          telegram_chat_id?: string | null
          telegram_enabled?: boolean | null
          twitter_enabled?: boolean | null
          twitter_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      economic_events: {
        Row: {
          actual_value: string | null
          country_code: string
          created_at: string
          event_name: string
          forecast_value: string | null
          id: string
          impact_level: string
          indicator_type: string
          market_impact: string | null
          previous_value: string | null
          region: string
          released: boolean | null
          scheduled_time: string
          updated_at: string
        }
        Insert: {
          actual_value?: string | null
          country_code: string
          created_at?: string
          event_name: string
          forecast_value?: string | null
          id?: string
          impact_level: string
          indicator_type: string
          market_impact?: string | null
          previous_value?: string | null
          region: string
          released?: boolean | null
          scheduled_time: string
          updated_at?: string
        }
        Update: {
          actual_value?: string | null
          country_code?: string
          created_at?: string
          event_name?: string
          forecast_value?: string | null
          id?: string
          impact_level?: string
          indicator_type?: string
          market_impact?: string | null
          previous_value?: string | null
          region?: string
          released?: boolean | null
          scheduled_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      extracted_strings: {
        Row: {
          context_element: string | null
          context_path: string | null
          context_selector: string | null
          created_at: string
          extraction_method: string | null
          id: string
          is_translatable: boolean | null
          original_text: string
          parent_component: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scan_session_id: string
          string_hash: string
          string_key: string
        }
        Insert: {
          context_element?: string | null
          context_path?: string | null
          context_selector?: string | null
          created_at?: string
          extraction_method?: string | null
          id?: string
          is_translatable?: boolean | null
          original_text: string
          parent_component?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scan_session_id: string
          string_hash: string
          string_key: string
        }
        Update: {
          context_element?: string | null
          context_path?: string | null
          context_selector?: string | null
          created_at?: string
          extraction_method?: string | null
          id?: string
          is_translatable?: boolean | null
          original_text?: string
          parent_component?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scan_session_id?: string
          string_hash?: string
          string_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_strings_scan_session_id_fkey"
            columns: ["scan_session_id"]
            isOneToOne: false
            referencedRelation: "site_scan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      guided_strategies: {
        Row: {
          answers: Json
          backtest_results: Json | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          backtest_results?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          backtest_results?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          accuracy_percentage: number | null
          correct_answers: number | null
          created_at: string
          id: string
          last_practiced_at: string | null
          mastery_level: string | null
          pattern_type: string
          quiz_attempts: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number | null
          correct_answers?: number | null
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          mastery_level?: string | null
          pattern_type: string
          quiz_attempts?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_percentage?: number | null
          correct_answers?: number | null
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          mastery_level?: string | null
          pattern_type?: string
          quiz_attempts?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_report_subscriptions: {
        Row: {
          created_at: string
          email: string
          frequency: string
          id: string
          is_active: boolean
          markets: string[]
          send_time: string
          time_span: string
          timezone: string
          tone: string
          unsubscribe_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          frequency?: string
          id?: string
          is_active?: boolean
          markets?: string[]
          send_time?: string
          time_span?: string
          timezone?: string
          tone?: string
          unsubscribe_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          is_active?: boolean
          markets?: string[]
          send_time?: string
          time_span?: string
          timezone?: string
          tone?: string
          unsubscribe_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_reports: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          markets: string[]
          report_content: string
          time_span: string
          timezone: string
          tone: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          markets?: string[]
          report_content: string
          time_span?: string
          timezone: string
          tone?: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          markets?: string[]
          report_content?: string
          time_span?: string
          timezone?: string
          tone?: string
        }
        Relationships: []
      }
      moderator_reports: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_portfolios: {
        Row: {
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          total_pnl: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          total_pnl?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          total_pnl?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_trades: {
        Row: {
          closed_at: string | null
          created_at: string
          entry_price: number
          exit_price: number | null
          id: string
          notes: string | null
          pnl: number | null
          portfolio_id: string
          quantity: number
          status: string
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          trade_type: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          entry_price: number
          exit_price?: number | null
          id?: string
          notes?: string | null
          pnl?: number | null
          portfolio_id: string
          quantity: number
          status?: string
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          trade_type: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          notes?: string | null
          pnl?: number | null
          portfolio_id?: string
          quantity?: number
          status?: string
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          trade_type?: string
          user_id?: string
        }
        Relationships: []
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
      refunds: {
        Row: {
          admin_notes: string | null
          amount_cents: number
          billing_event_id: string | null
          created_at: string
          eligibility_reason: string | null
          id: string
          is_eligible: boolean
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          status: string
          stripe_refund_id: string | null
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_cents: number
          billing_event_id?: string | null
          created_at?: string
          eligibility_reason?: string | null
          id?: string
          is_eligible?: boolean
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          stripe_refund_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_cents?: number
          billing_event_id?: string | null
          created_at?: string
          eligibility_reason?: string | null
          id?: string
          is_eligible?: boolean
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          stripe_refund_id?: string | null
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_billing_event_id_fkey"
            columns: ["billing_event_id"]
            isOneToOne: false
            referencedRelation: "billing_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      site_scan_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          modified_strings_count: number | null
          new_strings_count: number | null
          scan_date: string
          scan_metadata: Json | null
          scan_status: string
          total_strings_found: number | null
          version_number: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          modified_strings_count?: number | null
          new_strings_count?: number | null
          scan_date?: string
          scan_metadata?: Json | null
          scan_status?: string
          total_strings_found?: number | null
          version_number: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          modified_strings_count?: number | null
          new_strings_count?: number | null
          scan_date?: string
          scan_metadata?: Json | null
          scan_status?: string
          total_strings_found?: number | null
          version_number?: number
        }
        Relationships: []
      }
      strategy_downloads: {
        Row: {
          created_at: string
          id: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          strategy_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_downloads_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "community_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_executions: {
        Row: {
          created_at: string
          executed_at: string
          execution_reason: string | null
          id: string
          paper_trade_id: string | null
          price: number
          quantity: number
          signal_type: string
          strategy_id: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          executed_at?: string
          execution_reason?: string | null
          id?: string
          paper_trade_id?: string | null
          price: number
          quantity: number
          signal_type: string
          strategy_id: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          executed_at?: string
          execution_reason?: string | null
          id?: string
          paper_trade_id?: string | null
          price?: number
          quantity?: number
          signal_type?: string
          strategy_id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      strategy_likes: {
        Row: {
          created_at: string
          id: string
          strategy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          strategy_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          strategy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_likes_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "community_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_performance: {
        Row: {
          avg_loss: number
          avg_win: number
          created_at: string
          execution_date: string
          id: string
          losing_trades: number
          max_drawdown: number
          strategy_id: string
          total_pnl: number
          total_trades: number
          user_id: string
          win_rate: number
          winning_trades: number
        }
        Insert: {
          avg_loss?: number
          avg_win?: number
          created_at?: string
          execution_date?: string
          id?: string
          losing_trades?: number
          max_drawdown?: number
          strategy_id: string
          total_pnl?: number
          total_trades?: number
          user_id: string
          win_rate?: number
          winning_trades?: number
        }
        Update: {
          avg_loss?: number
          avg_win?: number
          created_at?: string
          execution_date?: string
          id?: string
          losing_trades?: number
          max_drawdown?: number
          strategy_id?: string
          total_pnl?: number
          total_trades?: number
          user_id?: string
          win_rate?: number
          winning_trades?: number
        }
        Relationships: []
      }
      string_change_log: {
        Row: {
          change_type: string
          created_at: string
          id: string
          new_hash: string | null
          new_scan_session_id: string | null
          new_text: string | null
          old_hash: string | null
          old_scan_session_id: string | null
          old_text: string | null
          string_key: string
        }
        Insert: {
          change_type: string
          created_at?: string
          id?: string
          new_hash?: string | null
          new_scan_session_id?: string | null
          new_text?: string | null
          old_hash?: string | null
          old_scan_session_id?: string | null
          old_text?: string | null
          string_key: string
        }
        Update: {
          change_type?: string
          created_at?: string
          id?: string
          new_hash?: string | null
          new_scan_session_id?: string | null
          new_text?: string | null
          old_hash?: string | null
          old_scan_session_id?: string | null
          old_text?: string | null
          string_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "string_change_log_new_scan_session_id_fkey"
            columns: ["new_scan_session_id"]
            isOneToOne: false
            referencedRelation: "site_scan_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "string_change_log_old_scan_session_id_fkey"
            columns: ["old_scan_session_id"]
            isOneToOne: false
            referencedRelation: "site_scan_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      trading_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          description: string | null
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          description?: string | null
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          description?: string | null
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      translation_keys: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          element_context: string | null
          id: string
          key: string
          page_context: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          element_context?: string | null
          id?: string
          key: string
          page_context?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          element_context?: string | null
          id?: string
          key?: string
          page_context?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          automation_source: string | null
          context_element: string | null
          context_page: string | null
          created_at: string
          created_by: string | null
          id: string
          is_manual_override: boolean | null
          key: string
          language_code: string
          original_automated_value: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          value: string
          version: number
        }
        Insert: {
          automation_source?: string | null
          context_element?: string | null
          context_page?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_manual_override?: boolean | null
          key: string
          language_code: string
          original_automated_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          value: string
          version?: number
        }
        Update: {
          automation_source?: string | null
          context_element?: string | null
          context_page?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_manual_override?: boolean | null
          key?: string
          language_code?: string
          original_automated_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          value?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_translations_key"
            columns: ["key"]
            isOneToOne: false
            referencedRelation: "translation_keys"
            referencedColumns: ["key"]
          },
        ]
      }
      user_language_preferences: {
        Row: {
          created_at: string
          detected_country: string | null
          id: string
          is_manual_selection: boolean
          language_code: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detected_country?: string | null
          id?: string
          is_manual_selection?: boolean
          language_code: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detected_country?: string | null
          id?: string
          is_manual_selection?: boolean
          language_code?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_strategies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          strategy_code: string
          strategy_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          strategy_code: string
          strategy_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          strategy_code?: string
          strategy_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          added_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          symbol?: string
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
      check_refund_eligibility: {
        Args: { p_subscription_id: string; p_user_id: string }
        Returns: Json
      }
      get_backtester_v2_usage: { Args: { p_user_id: string }; Returns: number }
      get_translations: {
        Args: { p_language_code?: string }
        Returns: {
          key: string
          value: string
        }[]
      }
      get_user_language: { Args: { p_user_id?: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_backtester_v2_usage: {
        Args: { p_user_id: string }
        Returns: number
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      make_first_user_admin: { Args: never; Returns: undefined }
      process_plan_change: {
        Args: {
          p_billing_cycle?: string
          p_new_plan: Database["public"]["Enums"]["subscription_plan"]
          p_user_id: string
        }
        Returns: Json
      }
      set_user_language: {
        Args: {
          p_detected_country?: string
          p_is_manual?: boolean
          p_language_code: string
          p_user_id: string
        }
        Returns: undefined
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
      app_role: "admin" | "super_admin"
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
      subscription_plan: "starter" | "pro" | "elite" | "free" | "pro_plus"
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
      app_role: ["admin", "super_admin"],
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
      subscription_plan: ["starter", "pro", "elite", "free", "pro_plus"],
      timeframe: ["15m", "1h", "4h", "1d"],
    },
  },
} as const
