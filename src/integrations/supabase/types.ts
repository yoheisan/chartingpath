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
      admin_kpi_subscriptions: {
        Row: {
          created_at: string
          email: string
          frequency: string
          id: string
          include_broken_paths: boolean | null
          include_journey_analytics: boolean | null
          include_revenue_metrics: boolean | null
          include_user_stats: boolean | null
          is_active: boolean
          last_sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          frequency?: string
          id?: string
          include_broken_paths?: boolean | null
          include_journey_analytics?: boolean | null
          include_revenue_metrics?: boolean | null
          include_user_stats?: boolean | null
          is_active?: boolean
          last_sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          include_broken_paths?: boolean | null
          include_journey_analytics?: boolean | null
          include_revenue_metrics?: boolean | null
          include_user_stats?: boolean | null
          is_active?: boolean
          last_sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          capture_method: string | null
          check_count: number | null
          checked_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          entry_price: number | null
          id: string
          is_auto_captured: boolean | null
          outcome_at: string | null
          outcome_pnl_percent: number | null
          outcome_price: number | null
          outcome_r_multiple: number | null
          outcome_status: string | null
          pattern_data: Json | null
          price_data: Json | null
          stop_loss_price: number | null
          take_profit_price: number | null
          triggered_at: string | null
        }
        Insert: {
          alert_id: string
          capture_method?: string | null
          check_count?: number | null
          checked_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          entry_price?: number | null
          id?: string
          is_auto_captured?: boolean | null
          outcome_at?: string | null
          outcome_pnl_percent?: number | null
          outcome_price?: number | null
          outcome_r_multiple?: number | null
          outcome_status?: string | null
          pattern_data?: Json | null
          price_data?: Json | null
          stop_loss_price?: number | null
          take_profit_price?: number | null
          triggered_at?: string | null
        }
        Update: {
          alert_id?: string
          capture_method?: string | null
          check_count?: number | null
          checked_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          entry_price?: number | null
          id?: string
          is_auto_captured?: boolean | null
          outcome_at?: string | null
          outcome_pnl_percent?: number | null
          outcome_price?: number | null
          outcome_r_multiple?: number | null
          outcome_status?: string | null
          pattern_data?: Json | null
          price_data?: Json | null
          stop_loss_price?: number | null
          take_profit_price?: number | null
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
      analytics_events: {
        Row: {
          event_name: string
          id: string
          properties: Json | null
          session_id: string | null
          ts: string
          user_id: string | null
        }
        Insert: {
          event_name: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          ts?: string
          user_id?: string | null
        }
        Update: {
          event_name?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          ts?: string
          user_id?: string | null
        }
        Relationships: []
      }
      article_likes: {
        Row: {
          article_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "learning_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_views: {
        Row: {
          article_id: string
          id: string
          ip_address: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          article_id: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          article_id?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "learning_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          artifact_json: Json
          created_at: string
          id: string
          project_run_id: string
          type: Database["public"]["Enums"]["artifact_type"]
        }
        Insert: {
          artifact_json?: Json
          created_at?: string
          id?: string
          project_run_id: string
          type: Database["public"]["Enums"]["artifact_type"]
        }
        Update: {
          artifact_json?: Json
          created_at?: string
          id?: string
          project_run_id?: string
          type?: Database["public"]["Enums"]["artifact_type"]
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_project_run_id_fkey"
            columns: ["project_run_id"]
            isOneToOne: false
            referencedRelation: "project_runs"
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
      backtest_result_cache: {
        Row: {
          cache_key: string
          created_at: string
          data_points: number | null
          expires_at: string
          hit_count: number | null
          id: string
          instrument: string
          parameters_hash: string
          results: Json
          timeframe: string
          trades: Json | null
        }
        Insert: {
          cache_key: string
          created_at?: string
          data_points?: number | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          instrument: string
          parameters_hash: string
          results: Json
          timeframe: string
          trades?: Json | null
        }
        Update: {
          cache_key?: string
          created_at?: string
          data_points?: number | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          instrument?: string
          parameters_hash?: string
          results?: Json
          timeframe?: string
          trades?: Json | null
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
          is_shared: boolean | null
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
          share_token: string | null
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
          is_shared?: boolean | null
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
          share_token?: string | null
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
          is_shared?: boolean | null
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
          share_token?: string | null
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
      cached_market_reports: {
        Row: {
          created_at: string
          expires_at: string
          generated_at: string
          id: string
          markets: string[]
          report: string
          time_span: string
          timezone: string
          tone: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          generated_at?: string
          id?: string
          markets: string[]
          report: string
          time_span: string
          timezone: string
          tone: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          generated_at?: string
          id?: string
          markets?: string[]
          report?: string
          time_span?: string
          timezone?: string
          tone?: string
        }
        Relationships: []
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
      content_library: {
        Row: {
          content: string
          content_type: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          last_posted_at: string | null
          link_back_url: string | null
          post_count: number
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_posted_at?: string | null
          link_back_url?: string | null
          post_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          last_posted_at?: string | null
          link_back_url?: string | null
          post_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      copilot_feedback: {
        Row: {
          content_gap_description: string | null
          content_gap_identified: boolean | null
          created_at: string
          id: string
          intent_category: string | null
          priority_score: number | null
          quality_score: number | null
          question: string
          resolved: boolean | null
          response: string | null
          response_helpful: boolean | null
          session_id: string | null
          topics: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content_gap_description?: string | null
          content_gap_identified?: boolean | null
          created_at?: string
          id?: string
          intent_category?: string | null
          priority_score?: number | null
          quality_score?: number | null
          question: string
          resolved?: boolean | null
          response?: string | null
          response_helpful?: boolean | null
          session_id?: string | null
          topics?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content_gap_description?: string | null
          content_gap_identified?: boolean | null
          created_at?: string
          id?: string
          intent_category?: string | null
          priority_score?: number | null
          quality_score?: number | null
          question?: string
          resolved?: boolean | null
          response?: string | null
          response_helpful?: boolean | null
          session_id?: string | null
          topics?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      daily_ai_usage: {
        Row: {
          created_at: string | null
          date: string
          updated_at: string | null
          usd_spent: number
        }
        Insert: {
          created_at?: string | null
          date: string
          updated_at?: string | null
          usd_spent?: number
        }
        Update: {
          created_at?: string | null
          date?: string
          updated_at?: string | null
          usd_spent?: number
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
      historical_overview_regime: {
        Row: {
          asof_date: string
          created_at: string
          market_drivers: string
          market_overview: string
          updated_at: string
        }
        Insert: {
          asof_date: string
          created_at?: string
          market_drivers: string
          market_overview: string
          updated_at?: string
        }
        Update: {
          asof_date?: string
          created_at?: string
          market_drivers?: string
          market_overview?: string
          updated_at?: string
        }
        Relationships: []
      }
      historical_overview_tactical: {
        Row: {
          asof_date: string
          created_at: string
          market_drivers: string
          market_overview: string
          updated_at: string
        }
        Insert: {
          asof_date: string
          created_at?: string
          market_drivers: string
          market_overview: string
          updated_at?: string
        }
        Update: {
          asof_date?: string
          created_at?: string
          market_drivers?: string
          market_overview?: string
          updated_at?: string
        }
        Relationships: []
      }
      historical_pattern_occurrences: {
        Row: {
          asset_type: string
          bars: Json
          bars_to_outcome: number | null
          bars_to_outcome_rr3: number | null
          bars_to_outcome_rr4: number | null
          bars_to_outcome_rr5: number | null
          created_at: string
          detected_at: string
          direction: string
          entry_price: number
          id: string
          multi_rr_computed_at: string | null
          outcome: string | null
          outcome_date: string | null
          outcome_pnl_percent: number | null
          outcome_pnl_percent_rr3: number | null
          outcome_pnl_percent_rr4: number | null
          outcome_pnl_percent_rr5: number | null
          outcome_price: number | null
          outcome_rr3: string | null
          outcome_rr4: string | null
          outcome_rr5: string | null
          pattern_end_date: string
          pattern_id: string
          pattern_name: string
          pattern_start_date: string
          quality_reasons: string[] | null
          quality_score: string | null
          risk_reward_ratio: number
          stop_loss_price: number
          symbol: string
          take_profit_price: number
          timeframe: string
          trend_alignment: string | null
          trend_indicators: Json | null
          updated_at: string
          visual_spec: Json
        }
        Insert: {
          asset_type: string
          bars?: Json
          bars_to_outcome?: number | null
          bars_to_outcome_rr3?: number | null
          bars_to_outcome_rr4?: number | null
          bars_to_outcome_rr5?: number | null
          created_at?: string
          detected_at: string
          direction: string
          entry_price: number
          id?: string
          multi_rr_computed_at?: string | null
          outcome?: string | null
          outcome_date?: string | null
          outcome_pnl_percent?: number | null
          outcome_pnl_percent_rr3?: number | null
          outcome_pnl_percent_rr4?: number | null
          outcome_pnl_percent_rr5?: number | null
          outcome_price?: number | null
          outcome_rr3?: string | null
          outcome_rr4?: string | null
          outcome_rr5?: string | null
          pattern_end_date: string
          pattern_id: string
          pattern_name: string
          pattern_start_date: string
          quality_reasons?: string[] | null
          quality_score?: string | null
          risk_reward_ratio: number
          stop_loss_price: number
          symbol: string
          take_profit_price: number
          timeframe?: string
          trend_alignment?: string | null
          trend_indicators?: Json | null
          updated_at?: string
          visual_spec?: Json
        }
        Update: {
          asset_type?: string
          bars?: Json
          bars_to_outcome?: number | null
          bars_to_outcome_rr3?: number | null
          bars_to_outcome_rr4?: number | null
          bars_to_outcome_rr5?: number | null
          created_at?: string
          detected_at?: string
          direction?: string
          entry_price?: number
          id?: string
          multi_rr_computed_at?: string | null
          outcome?: string | null
          outcome_date?: string | null
          outcome_pnl_percent?: number | null
          outcome_pnl_percent_rr3?: number | null
          outcome_pnl_percent_rr4?: number | null
          outcome_pnl_percent_rr5?: number | null
          outcome_price?: number | null
          outcome_rr3?: string | null
          outcome_rr4?: string | null
          outcome_rr5?: string | null
          pattern_end_date?: string
          pattern_id?: string
          pattern_name?: string
          pattern_start_date?: string
          quality_reasons?: string[] | null
          quality_score?: string | null
          risk_reward_ratio?: number
          stop_loss_price?: number
          symbol?: string
          take_profit_price?: number
          timeframe?: string
          trend_alignment?: string | null
          trend_indicators?: Json | null
          updated_at?: string
          visual_spec?: Json
        }
        Relationships: []
      }
      historical_prices: {
        Row: {
          close: number
          created_at: string | null
          date: string
          high: number
          id: string
          instrument_type: string
          low: number
          open: number
          symbol: string
          timeframe: string
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          close: number
          created_at?: string | null
          date: string
          high: number
          id?: string
          instrument_type: string
          low: number
          open: number
          symbol: string
          timeframe: string
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          close?: number
          created_at?: string | null
          date?: string
          high?: number
          id?: string
          instrument_type?: string
          low?: number
          open?: number
          symbol?: string
          timeframe?: string
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      instrument_search_analytics: {
        Row: {
          created_at: string | null
          id: string
          instrument_type: string
          search_query: string
          selected_instrument: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instrument_type: string
          search_query: string
          selected_instrument?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instrument_type?: string
          search_query?: string
          selected_instrument?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      learning_articles: {
        Row: {
          author_id: string | null
          canonical_url: string | null
          category: string
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          difficulty_level: string | null
          display_order: number | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          last_edited_by: string | null
          like_count: number | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          related_articles: string[] | null
          related_patterns: string[] | null
          scheduled_publish_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subcategory: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          canonical_url?: string | null
          category: string
          content: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          last_edited_by?: string | null
          like_count?: number | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_articles?: string[] | null
          related_patterns?: string[] | null
          scheduled_publish_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subcategory?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          canonical_url?: string | null
          category?: string
          content?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          last_edited_by?: string | null
          like_count?: number | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_articles?: string[] | null
          related_patterns?: string[] | null
          scheduled_publish_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
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
      live_pattern_detections: {
        Row: {
          asset_type: string
          bars: Json
          change_percent: number | null
          created_at: string
          current_price: number | null
          direction: string
          entry_price: number
          first_detected_at: string
          historical_performance: Json | null
          id: string
          instrument: string
          last_confirmed_at: string
          pattern_id: string
          pattern_name: string
          prev_close: number | null
          quality_reasons: string[] | null
          quality_score: string | null
          risk_reward_ratio: number
          status: string
          stop_loss_price: number
          take_profit_price: number
          timeframe: string
          trend_alignment: string | null
          trend_indicators: Json | null
          updated_at: string
          visual_spec: Json
        }
        Insert: {
          asset_type: string
          bars: Json
          change_percent?: number | null
          created_at?: string
          current_price?: number | null
          direction: string
          entry_price: number
          first_detected_at?: string
          historical_performance?: Json | null
          id?: string
          instrument: string
          last_confirmed_at?: string
          pattern_id: string
          pattern_name: string
          prev_close?: number | null
          quality_reasons?: string[] | null
          quality_score?: string | null
          risk_reward_ratio: number
          status?: string
          stop_loss_price: number
          take_profit_price: number
          timeframe?: string
          trend_alignment?: string | null
          trend_indicators?: Json | null
          updated_at?: string
          visual_spec: Json
        }
        Update: {
          asset_type?: string
          bars?: Json
          change_percent?: number | null
          created_at?: string
          current_price?: number | null
          direction?: string
          entry_price?: number
          first_detected_at?: string
          historical_performance?: Json | null
          id?: string
          instrument?: string
          last_confirmed_at?: string
          pattern_id?: string
          pattern_name?: string
          prev_close?: number | null
          quality_reasons?: string[] | null
          quality_score?: string | null
          risk_reward_ratio?: number
          status?: string
          stop_loss_price?: number
          take_profit_price?: number
          timeframe?: string
          trend_alignment?: string | null
          trend_indicators?: Json | null
          updated_at?: string
          visual_spec?: Json
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
          last_sent_at: string | null
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
          last_sent_at?: string | null
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
          last_sent_at?: string | null
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
      organization_members: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      outcome_analytics_cache: {
        Row: {
          avg_pnl_percent: number | null
          avg_r_multiple: number | null
          id: string
          instrument: string | null
          last_updated: string | null
          losses: number | null
          pattern_name: string
          timeframe: string
          timeouts: number | null
          total_signals: number | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          avg_pnl_percent?: number | null
          avg_r_multiple?: number | null
          id?: string
          instrument?: string | null
          last_updated?: string | null
          losses?: number | null
          pattern_name: string
          timeframe: string
          timeouts?: number | null
          total_signals?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          avg_pnl_percent?: number | null
          avg_r_multiple?: number | null
          id?: string
          instrument?: string | null
          last_updated?: string | null
          losses?: number | null
          pattern_name?: string
          timeframe?: string
          timeouts?: number | null
          total_signals?: number | null
          win_rate?: number | null
          wins?: number | null
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
      pattern_hit_rates: {
        Row: {
          avg_holding_bars: number | null
          avg_holding_hours: number | null
          avg_r_multiple: number
          created_at: string
          direction: string
          expectancy: number
          first_signal_date: string | null
          id: string
          instrument_category: string | null
          last_signal_date: string | null
          losses: number
          max_drawdown_r: number | null
          pattern_id: string
          pattern_name: string
          profit_factor: number
          regime_breakdown: Json | null
          reliability_score: number
          sample_confidence: string | null
          timeframe: string
          total_signals: number
          updated_at: string
          win_rate: number
          wins: number
        }
        Insert: {
          avg_holding_bars?: number | null
          avg_holding_hours?: number | null
          avg_r_multiple?: number
          created_at?: string
          direction: string
          expectancy?: number
          first_signal_date?: string | null
          id?: string
          instrument_category?: string | null
          last_signal_date?: string | null
          losses?: number
          max_drawdown_r?: number | null
          pattern_id: string
          pattern_name: string
          profit_factor?: number
          regime_breakdown?: Json | null
          reliability_score?: number
          sample_confidence?: string | null
          timeframe: string
          total_signals?: number
          updated_at?: string
          win_rate?: number
          wins?: number
        }
        Update: {
          avg_holding_bars?: number | null
          avg_holding_hours?: number | null
          avg_r_multiple?: number
          created_at?: string
          direction?: string
          expectancy?: number
          first_signal_date?: string | null
          id?: string
          instrument_category?: string | null
          last_signal_date?: string | null
          losses?: number
          max_drawdown_r?: number | null
          pattern_id?: string
          pattern_name?: string
          profit_factor?: number
          regime_breakdown?: Json | null
          reliability_score?: number
          sample_confidence?: string | null
          timeframe?: string
          total_signals?: number
          updated_at?: string
          win_rate?: number
          wins?: number
        }
        Relationships: []
      }
      pattern_images: {
        Row: {
          alt_text: string
          created_at: string | null
          description: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          image_path: string
          image_url: string | null
          is_active: boolean | null
          is_bullish: boolean | null
          mime_type: string | null
          pattern_key: string
          pattern_name: string
          pattern_type: string | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          width: number | null
        }
        Insert: {
          alt_text: string
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          image_path: string
          image_url?: string | null
          is_active?: boolean | null
          is_bullish?: boolean | null
          mime_type?: string | null
          pattern_key: string
          pattern_name: string
          pattern_type?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          image_path?: string
          image_url?: string | null
          is_active?: boolean | null
          is_bullish?: boolean | null
          mime_type?: string | null
          pattern_key?: string
          pattern_name?: string
          pattern_type?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          width?: number | null
        }
        Relationships: []
      }
      pattern_outcomes: {
        Row: {
          created_at: string
          direction: string
          entry_price: number
          exit_price: number | null
          exit_reason: string | null
          exit_timestamp: string | null
          holding_bars: number | null
          id: string
          instrument: string
          is_win: boolean | null
          pattern_hit_rate_id: string | null
          quality_score: number | null
          r_multiple: number | null
          regime_key: string | null
          signal_timestamp: string
          stop_loss: number
          take_profit: number
          trend_aligned: boolean | null
          volume_confirmed: boolean | null
        }
        Insert: {
          created_at?: string
          direction: string
          entry_price: number
          exit_price?: number | null
          exit_reason?: string | null
          exit_timestamp?: string | null
          holding_bars?: number | null
          id?: string
          instrument: string
          is_win?: boolean | null
          pattern_hit_rate_id?: string | null
          quality_score?: number | null
          r_multiple?: number | null
          regime_key?: string | null
          signal_timestamp: string
          stop_loss: number
          take_profit: number
          trend_aligned?: boolean | null
          volume_confirmed?: boolean | null
        }
        Update: {
          created_at?: string
          direction?: string
          entry_price?: number
          exit_price?: number | null
          exit_reason?: string | null
          exit_timestamp?: string | null
          holding_bars?: number | null
          id?: string
          instrument?: string
          is_win?: boolean | null
          pattern_hit_rate_id?: string | null
          quality_score?: number | null
          r_multiple?: number | null
          regime_key?: string | null
          signal_timestamp?: string
          stop_loss?: number
          take_profit?: number
          trend_aligned?: boolean | null
          volume_confirmed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_outcomes_pattern_hit_rate_id_fkey"
            columns: ["pattern_hit_rate_id"]
            isOneToOne: false
            referencedRelation: "pattern_hit_rates"
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
      post_history: {
        Row: {
          account_id: string | null
          clicks: number | null
          comments: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes: number | null
          link_back_url: string | null
          platform: string
          platform_post_id: string | null
          platform_response: Json | null
          post_type: string
          posted_at: string
          scheduled_post_id: string | null
          shares: number | null
        }
        Insert: {
          account_id?: string | null
          clicks?: number | null
          comments?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes?: number | null
          link_back_url?: string | null
          platform: string
          platform_post_id?: string | null
          platform_response?: Json | null
          post_type: string
          posted_at?: string
          scheduled_post_id?: string | null
          shares?: number | null
        }
        Update: {
          account_id?: string | null
          clicks?: number | null
          comments?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes?: number | null
          link_back_url?: string | null
          platform?: string
          platform_post_id?: string | null
          platform_response?: Json | null
          post_type?: string
          posted_at?: string
          scheduled_post_id?: string | null
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_media_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_history_scheduled_post_id_fkey"
            columns: ["scheduled_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      product_events: {
        Row: {
          created_at: string
          event_name: string
          event_props: Json | null
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_props?: Json | null
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_props?: Json | null
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          email_notifications_enabled: boolean | null
          id: string
          push_notifications_enabled: boolean | null
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
          email_notifications_enabled?: boolean | null
          id?: string
          push_notifications_enabled?: boolean | null
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
          email_notifications_enabled?: boolean | null
          id?: string
          push_notifications_enabled?: boolean | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_inputs: {
        Row: {
          created_at: string
          id: string
          input_json: Json
          project_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          input_json?: Json
          project_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          input_json?: Json
          project_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_inputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_runs: {
        Row: {
          created_at: string
          credits_estimated: number
          credits_used: number
          error_code: string | null
          error_message: string | null
          execution_metadata: Json | null
          finished_at: string | null
          id: string
          input_id: string
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["project_run_status"]
        }
        Insert: {
          created_at?: string
          credits_estimated?: number
          credits_used?: number
          error_code?: string | null
          error_message?: string | null
          execution_metadata?: Json | null
          finished_at?: string | null
          id?: string
          input_id: string
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_run_status"]
        }
        Update: {
          created_at?: string
          credits_estimated?: number
          credits_used?: number
          error_code?: string | null
          error_message?: string | null
          execution_metadata?: Json | null
          finished_at?: string | null
          id?: string
          input_id?: string
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_runs_input_id_fkey"
            columns: ["input_id"]
            isOneToOne: false
            referencedRelation: "project_inputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          name: string
          org_id: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          org_id?: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          org_id?: string | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          expiration_time: number | null
          id: string
          p256dh_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          expiration_time?: number | null
          id?: string
          p256dh_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          expiration_time?: number | null
          id?: string
          p256dh_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          attempted_at: string | null
          device_type: string | null
          id: string
          is_correct: boolean
          question_id: string
          quiz_session_id: string | null
          selected_answer: number
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          device_type?: string | null
          id?: string
          is_correct: boolean
          question_id: string
          quiz_session_id?: string | null
          selected_answer: number
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          device_type?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
          quiz_session_id?: string | null
          selected_answer?: number
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          category: Database["public"]["Enums"]["quiz_category"]
          correct_answer: number
          created_at: string | null
          created_by: string | null
          difficulty: Database["public"]["Enums"]["quiz_difficulty"]
          display_order: number | null
          explanation: string
          id: string
          image_metadata: Json | null
          image_url: string | null
          is_active: boolean | null
          last_edited_by: string | null
          options: Json
          pattern_key: string | null
          pattern_name: string | null
          question_code: string
          question_text: string
          related_patterns: string[] | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          tags: string[] | null
          times_correct: number | null
          times_shown: number | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["quiz_category"]
          correct_answer: number
          created_at?: string | null
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["quiz_difficulty"]
          display_order?: number | null
          explanation: string
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          is_active?: boolean | null
          last_edited_by?: string | null
          options: Json
          pattern_key?: string | null
          pattern_name?: string | null
          question_code: string
          question_text: string
          related_patterns?: string[] | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          tags?: string[] | null
          times_correct?: number | null
          times_shown?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["quiz_category"]
          correct_answer?: number
          created_at?: string | null
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["quiz_difficulty"]
          display_order?: number | null
          explanation?: string
          id?: string
          image_metadata?: Json | null
          image_url?: string | null
          is_active?: boolean | null
          last_edited_by?: string | null
          options?: Json
          pattern_key?: string | null
          pattern_name?: string | null
          question_code?: string
          question_text?: string
          related_patterns?: string[] | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          tags?: string[] | null
          times_correct?: number | null
          times_shown?: number | null
          updated_at?: string | null
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
      scheduled_posts: {
        Row: {
          account_id: string | null
          content: string | null
          content_library_id: string | null
          created_at: string
          error_message: string | null
          id: string
          image_url: string | null
          is_recurring: boolean
          link_back_url: string | null
          platform: string
          post_type: string
          posted_at: string | null
          recurrence_pattern: string | null
          recurrence_rule: string | null
          report_config: Json | null
          scheduled_time: string
          status: string
          timezone: string
          title: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          content?: string | null
          content_library_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_url?: string | null
          is_recurring?: boolean
          link_back_url?: string | null
          platform: string
          post_type: string
          posted_at?: string | null
          recurrence_pattern?: string | null
          recurrence_rule?: string | null
          report_config?: Json | null
          scheduled_time: string
          status?: string
          timezone?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          content?: string | null
          content_library_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_url?: string | null
          is_recurring?: boolean
          link_back_url?: string | null
          platform?: string
          post_type?: string
          posted_at?: string | null
          recurrence_pattern?: string | null
          recurrence_rule?: string | null
          report_config?: Json | null
          scheduled_time?: string
          status?: string
          timezone?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_media_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_content_library_id_fkey"
            columns: ["content_library_id"]
            isOneToOne: false
            referencedRelation: "content_library"
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
      social_media_accounts: {
        Row: {
          account_name: string
          created_at: string
          credentials: Json
          id: string
          is_active: boolean
          platform: string
          updated_at: string
        }
        Insert: {
          account_name: string
          created_at?: string
          credentials: Json
          id?: string
          is_active?: boolean
          platform: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          platform?: string
          updated_at?: string
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
      support_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
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
          category: Database["public"]["Enums"]["ticket_category"]
          context_json: Json | null
          created_at: string
          description: string
          id: string
          last_admin_message_at: string | null
          last_user_message_at: string | null
          org_id: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          context_json?: Json | null
          created_at?: string
          description: string
          id?: string
          last_admin_message_at?: string | null
          last_user_message_at?: string | null
          org_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          context_json?: Json | null
          created_at?: string
          description?: string
          id?: string
          last_admin_message_at?: string | null
          last_user_message_at?: string | null
          org_id?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_plans: {
        Row: {
          created_at: string
          direction: string
          entry_price: number
          entry_type: string
          execution_assumptions: Json
          id: string
          instrument_symbol: string
          pattern_name: string | null
          pattern_quality: number | null
          planned_rr: number
          source_artifact_id: string | null
          stop_loss_method: string | null
          stop_price: number
          take_profit_method: string | null
          take_profit_price: number
          time_stop_bars: number | null
          timeframe: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          entry_price: number
          entry_type?: string
          execution_assumptions?: Json
          id?: string
          instrument_symbol: string
          pattern_name?: string | null
          pattern_quality?: number | null
          planned_rr: number
          source_artifact_id?: string | null
          stop_loss_method?: string | null
          stop_price: number
          take_profit_method?: string | null
          take_profit_price: number
          time_stop_bars?: number | null
          timeframe: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          entry_price?: number
          entry_type?: string
          execution_assumptions?: Json
          id?: string
          instrument_symbol?: string
          pattern_name?: string | null
          pattern_quality?: number | null
          planned_rr?: number
          source_artifact_id?: string | null
          stop_loss_method?: string | null
          stop_price?: number
          take_profit_method?: string | null
          take_profit_price?: number
          time_stop_bars?: number | null
          timeframe?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_plans_source_artifact_id_fkey"
            columns: ["source_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
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
      usage_credits: {
        Row: {
          created_at: string
          credits_balance: number
          credits_reset_at: string
          daily_run_cap: number
          max_active_alerts: number
          max_instruments_per_run: number
          max_lookback_years: number
          max_watchlist_slots: number
          plan_tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_balance?: number
          credits_reset_at?: string
          daily_run_cap?: number
          max_active_alerts?: number
          max_instruments_per_run?: number
          max_lookback_years?: number
          max_watchlist_slots?: number
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_balance?: number
          credits_reset_at?: string
          daily_run_cap?: number
          max_active_alerts?: number
          max_instruments_per_run?: number
          max_lookback_years?: number
          max_watchlist_slots?: number
          plan_tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_ledger: {
        Row: {
          credits_delta: number
          id: string
          project_run_id: string | null
          reason: string
          ts: string
          user_id: string
        }
        Insert: {
          credits_delta: number
          id?: string
          project_run_id?: string | null
          reason: string
          ts?: string
          user_id: string
        }
        Update: {
          credits_delta?: number
          id?: string
          project_run_id?: string | null
          reason?: string
          ts?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_ledger_project_run_id_fkey"
            columns: ["project_run_id"]
            isOneToOne: false
            referencedRelation: "project_runs"
            referencedColumns: ["id"]
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
      user_report_requests: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          requested_at: string
          timezone: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          requested_at?: string
          timezone: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          requested_at?: string
          timezone?: string
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
      user_watchlist: {
        Row: {
          added_at: string
          asset_type: string | null
          id: string
          name: string | null
          notes: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          added_at?: string
          asset_type?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          added_at?: string
          asset_type?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist_monitors: {
        Row: {
          asset_type: string
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          symbol?: string
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
      article_analytics: {
        Row: {
          category: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string | null
          id: string | null
          like_count: number | null
          published_at: string | null
          slug: string | null
          status: Database["public"]["Enums"]["content_status"] | null
          title: string | null
          unique_likers: number | null
          unique_viewers: number | null
          view_count: number | null
        }
        Relationships: []
      }
      quiz_analytics: {
        Row: {
          avg_time_taken_seconds: number | null
          category: Database["public"]["Enums"]["quiz_category"] | null
          difficulty: Database["public"]["Enums"]["quiz_difficulty"] | null
          id: string | null
          pattern_name: string | null
          question_code: string | null
          success_rate_percentage: number | null
          times_correct: number | null
          times_shown: number | null
          unique_users_attempted: number | null
        }
        Relationships: []
      }
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
      check_backtest_limit: { Args: { p_user_id: string }; Returns: Json }
      check_project_run_allowed: {
        Args: {
          p_credits_needed: number
          p_instruments_count: number
          p_lookback_years: number
          p_user_id: string
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: { p_ip_address: string; p_timezone: string; p_user_id: string }
        Returns: boolean
      }
      check_refund_eligibility: {
        Args: { p_subscription_id: string; p_user_id: string }
        Returns: Json
      }
      cleanup_expired_backtest_cache: { Args: never; Returns: undefined }
      cleanup_expired_reports: { Args: never; Returns: undefined }
      estimate_project_credits: {
        Args: {
          p_instruments_count: number
          p_lookback_years: number
          p_timeframe: string
          p_type: Database["public"]["Enums"]["project_type"]
        }
        Returns: number
      }
      expire_stale_patterns: { Args: never; Returns: undefined }
      get_article_by_slug: {
        Args: { p_slug: string }
        Returns: {
          category: string
          content: string
          content_type: Database["public"]["Enums"]["content_type"]
          difficulty_level: string
          excerpt: string
          featured_image_url: string
          id: string
          like_count: number
          og_description: string
          og_image_url: string
          og_title: string
          published_at: string
          reading_time_minutes: number
          seo_description: string
          seo_keywords: string[]
          seo_title: string
          slug: string
          subcategory: string
          tags: string[]
          title: string
          view_count: number
        }[]
      }
      get_backtester_v2_usage: { Args: { p_user_id: string }; Returns: number }
      get_quiz_questions: {
        Args: {
          p_category?: Database["public"]["Enums"]["quiz_category"]
          p_difficulty?: Database["public"]["Enums"]["quiz_difficulty"]
          p_limit?: number
        }
        Returns: {
          category: Database["public"]["Enums"]["quiz_category"]
          correct_answer: number
          difficulty: Database["public"]["Enums"]["quiz_difficulty"]
          explanation: string
          id: string
          image_metadata: Json
          image_url: string
          options: Json
          pattern_key: string
          pattern_name: string
          question_code: string
          question_text: string
          tags: string[]
        }[]
      }
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
      is_service_role: { Args: never; Returns: boolean }
      make_first_user_admin: { Args: never; Returns: undefined }
      process_plan_change: {
        Args: {
          p_billing_cycle?: string
          p_new_plan: Database["public"]["Enums"]["subscription_plan"]
          p_user_id: string
        }
        Returns: Json
      }
      publish_scheduled_articles: { Args: never; Returns: number }
      purge_all_historical_patterns: { Args: never; Returns: Json }
      recalculate_pattern_stats: {
        Args: { p_hit_rate_id: string }
        Returns: undefined
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
      artifact_type:
        | "setup_list"
        | "backtest_report"
        | "portfolio_report"
        | "portfolio_sim"
        | "filings_report"
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
        | "donchian-breakout-long"
        | "donchian-breakout-short"
        | "double-top"
        | "double-bottom"
        | "ascending-triangle"
        | "descending-triangle"
        | "head-and-shoulders"
        | "inverse-head-and-shoulders"
        | "rising-wedge"
        | "falling-wedge"
        | "bull-flag"
        | "bear-flag"
        | "cup-and-handle"
        | "triple-top"
        | "triple-bottom"
        | "symmetrical-triangle"
        | "inverse-cup-and-handle"
      content_status: "draft" | "published" | "archived" | "scheduled"
      content_type:
        | "article"
        | "tutorial"
        | "guide"
        | "blog_post"
        | "pattern_analysis"
        | "strategy_guide"
      message_sender_type: "user" | "admin" | "system"
      plan_tier: "free" | "starter" | "pro" | "elite" | "enterprise"
      project_run_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled"
      project_type:
        | "setup_finder"
        | "pattern_lab"
        | "portfolio_checkup"
        | "portfolio_sim"
        | "filings_watch"
      quiz_category:
        | "visual_recognition"
        | "characteristics"
        | "statistics"
        | "risk_management"
        | "professional_practices"
        | "stock_market"
        | "forex"
        | "cryptocurrency"
        | "commodities"
      quiz_difficulty: "beginner" | "intermediate" | "advanced" | "expert"
      subscription_plan: "starter" | "pro" | "elite" | "free" | "pro_plus"
      ticket_category: "bug" | "feature" | "billing" | "account" | "other"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      artifact_type: [
        "setup_list",
        "backtest_report",
        "portfolio_report",
        "portfolio_sim",
        "filings_report",
      ],
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
        "donchian-breakout-long",
        "donchian-breakout-short",
        "double-top",
        "double-bottom",
        "ascending-triangle",
        "descending-triangle",
        "head-and-shoulders",
        "inverse-head-and-shoulders",
        "rising-wedge",
        "falling-wedge",
        "bull-flag",
        "bear-flag",
        "cup-and-handle",
        "triple-top",
        "triple-bottom",
        "symmetrical-triangle",
        "inverse-cup-and-handle",
      ],
      content_status: ["draft", "published", "archived", "scheduled"],
      content_type: [
        "article",
        "tutorial",
        "guide",
        "blog_post",
        "pattern_analysis",
        "strategy_guide",
      ],
      message_sender_type: ["user", "admin", "system"],
      plan_tier: ["free", "starter", "pro", "elite", "enterprise"],
      project_run_status: [
        "queued",
        "running",
        "succeeded",
        "failed",
        "cancelled",
      ],
      project_type: [
        "setup_finder",
        "pattern_lab",
        "portfolio_checkup",
        "portfolio_sim",
        "filings_watch",
      ],
      quiz_category: [
        "visual_recognition",
        "characteristics",
        "statistics",
        "risk_management",
        "professional_practices",
        "stock_market",
        "forex",
        "cryptocurrency",
        "commodities",
      ],
      quiz_difficulty: ["beginner", "intermediate", "advanced", "expert"],
      subscription_plan: ["starter", "pro", "elite", "free", "pro_plus"],
      ticket_category: ["bug", "feature", "billing", "account", "other"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      timeframe: ["15m", "1h", "4h", "1d"],
    },
  },
} as const
