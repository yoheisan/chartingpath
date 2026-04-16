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
      agent_scores: {
        Row: {
          analyst_details: Json | null
          analyst_raw: number
          asset_type: string | null
          created_at: string
          detection_id: string
          direction: string | null
          expectancy_r: number | null
          id: string
          instrument: string
          is_proven: boolean
          pattern_id: string
          portfolio_raw: number
          risk_details: Json | null
          risk_raw: number
          sample_size: number | null
          scored_at: string
          timeframe: string
          timing_details: Json | null
          timing_raw: number
          win_rate: number | null
        }
        Insert: {
          analyst_details?: Json | null
          analyst_raw?: number
          asset_type?: string | null
          created_at?: string
          detection_id: string
          direction?: string | null
          expectancy_r?: number | null
          id?: string
          instrument: string
          is_proven?: boolean
          pattern_id: string
          portfolio_raw?: number
          risk_details?: Json | null
          risk_raw?: number
          sample_size?: number | null
          scored_at?: string
          timeframe: string
          timing_details?: Json | null
          timing_raw?: number
          win_rate?: number | null
        }
        Update: {
          analyst_details?: Json | null
          analyst_raw?: number
          asset_type?: string | null
          created_at?: string
          detection_id?: string
          direction?: string | null
          expectancy_r?: number | null
          id?: string
          instrument?: string
          is_proven?: boolean
          pattern_id?: string
          portfolio_raw?: number
          risk_details?: Json | null
          risk_raw?: number
          sample_size?: number | null
          scored_at?: string
          timeframe?: string
          timing_details?: Json | null
          timing_raw?: number
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_scores_detection_id_fkey"
            columns: ["detection_id"]
            isOneToOne: false
            referencedRelation: "live_pattern_detections"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_scoring_history: {
        Row: {
          asset_class_filter: string
          change_description: string | null
          change_source: string
          created_at: string
          id: string
          sub_filters: Json | null
          take_cutoff: number
          timeframe_filter: string
          user_id: string
          watch_cutoff: number
          weights: Json
        }
        Insert: {
          asset_class_filter?: string
          change_description?: string | null
          change_source?: string
          created_at?: string
          id?: string
          sub_filters?: Json | null
          take_cutoff: number
          timeframe_filter?: string
          user_id: string
          watch_cutoff: number
          weights: Json
        }
        Update: {
          asset_class_filter?: string
          change_description?: string | null
          change_source?: string
          created_at?: string
          id?: string
          sub_filters?: Json | null
          take_cutoff?: number
          timeframe_filter?: string
          user_id?: string
          watch_cutoff?: number
          weights?: Json
        }
        Relationships: []
      }
      agent_scoring_settings: {
        Row: {
          asset_class_filter: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          sub_filters: Json
          take_cutoff: number
          timeframe_filter: string
          updated_at: string
          user_id: string
          watch_cutoff: number
          weights: Json
        }
        Insert: {
          asset_class_filter?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          sub_filters?: Json
          take_cutoff?: number
          timeframe_filter?: string
          updated_at?: string
          user_id: string
          watch_cutoff?: number
          weights?: Json
        }
        Update: {
          asset_class_filter?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          sub_filters?: Json
          take_cutoff?: number
          timeframe_filter?: string
          updated_at?: string
          user_id?: string
          watch_cutoff?: number
          weights?: Json
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
          auto_paper_trade: boolean
          created_at: string | null
          id: string
          master_plan_id: string | null
          pattern: Database["public"]["Enums"]["chart_pattern"]
          risk_percent: number
          status: Database["public"]["Enums"]["alert_status"] | null
          symbol: string
          timeframe: Database["public"]["Enums"]["timeframe"]
          updated_at: string | null
          user_id: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          auto_paper_trade?: boolean
          created_at?: string | null
          id?: string
          master_plan_id?: string | null
          pattern: Database["public"]["Enums"]["chart_pattern"]
          risk_percent?: number
          status?: Database["public"]["Enums"]["alert_status"] | null
          symbol: string
          timeframe: Database["public"]["Enums"]["timeframe"]
          updated_at?: string | null
          user_id: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          auto_paper_trade?: boolean
          created_at?: string | null
          id?: string
          master_plan_id?: string | null
          pattern?: Database["public"]["Enums"]["chart_pattern"]
          risk_percent?: number
          status?: Database["public"]["Enums"]["alert_status"] | null
          symbol?: string
          timeframe?: Database["public"]["Enums"]["timeframe"]
          updated_at?: string | null
          user_id?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_master_plan_id_fkey"
            columns: ["master_plan_id"]
            isOneToOne: false
            referencedRelation: "master_plans"
            referencedColumns: ["id"]
          },
        ]
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
          mae_r: number | null
          mfe_r: number | null
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
          mae_r?: number | null
          mfe_r?: number | null
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
          mae_r?: number | null
          mfe_r?: number | null
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
          is_bot_suspect: boolean
          properties: Json | null
          session_id: string | null
          ts: string
          user_id: string | null
        }
        Insert: {
          event_name: string
          id?: string
          is_bot_suspect?: boolean
          properties?: Json | null
          session_id?: string | null
          ts?: string
          user_id?: string | null
        }
        Update: {
          event_name?: string
          id?: string
          is_bot_suspect?: boolean
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
      backtest_pattern_outcomes: {
        Row: {
          bars_to_close: number | null
          created_at: string
          direction: string
          entry_date: string
          grade: string | null
          id: string
          instrument: string
          outcome: string
          pattern_name: string
          r_multiple: number | null
          rr_target: number | null
          run_id: string
          timeframe: string
        }
        Insert: {
          bars_to_close?: number | null
          created_at?: string
          direction: string
          entry_date: string
          grade?: string | null
          id?: string
          instrument: string
          outcome: string
          pattern_name: string
          r_multiple?: number | null
          rr_target?: number | null
          run_id: string
          timeframe: string
        }
        Update: {
          bars_to_close?: number | null
          created_at?: string
          direction?: string
          entry_date?: string
          grade?: string | null
          id?: string
          instrument?: string
          outcome?: string
          pattern_name?: string
          r_multiple?: number | null
          rr_target?: number | null
          run_id?: string
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "backtest_pattern_outcomes_run_id_fkey"
            columns: ["run_id"]
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
      backtest_queue: {
        Row: {
          completed_at: string | null
          composite_score: number | null
          error_message: string | null
          id: string
          instrument: string
          pattern_id: string
          queued_at: string
          run_id: string | null
          started_at: string | null
          status: string
          timeframe: string
          user_id: string
          verdict: string | null
        }
        Insert: {
          completed_at?: string | null
          composite_score?: number | null
          error_message?: string | null
          id?: string
          instrument: string
          pattern_id: string
          queued_at?: string
          run_id?: string | null
          started_at?: string | null
          status?: string
          timeframe: string
          user_id: string
          verdict?: string | null
        }
        Update: {
          completed_at?: string | null
          composite_score?: number | null
          error_message?: string | null
          id?: string
          instrument?: string
          pattern_id?: string
          queued_at?: string
          run_id?: string | null
          started_at?: string | null
          status?: string
          timeframe?: string
          user_id?: string
          verdict?: string | null
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
          is_community_shared: boolean | null
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
          is_community_shared?: boolean | null
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
          is_community_shared?: boolean | null
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
      broker_connections: {
        Row: {
          account_balance: number | null
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          broker: string | null
          capital_allocated: number | null
          connected_at: string | null
          created_at: string | null
          id: string
          is_live: boolean | null
          is_paused: boolean | null
          user_id: string
        }
        Insert: {
          account_balance?: number | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          broker?: string | null
          capital_allocated?: number | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_live?: boolean | null
          is_paused?: boolean | null
          user_id: string
        }
        Update: {
          account_balance?: number | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          broker?: string | null
          capital_allocated?: number | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_live?: boolean | null
          is_paused?: boolean | null
          user_id?: string
        }
        Relationships: []
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
      community_bookmarks: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      community_likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          user_id?: string
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
      copilot_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          created_at: string | null
          direction: string | null
          entry_price: number | null
          full_context: Json | null
          id: string
          pattern_occurrence_id: string | null
          pattern_type: string | null
          rr_ratio: number | null
          status: string
          stop_price: number | null
          symbol: string
          target_price: number | null
          timeframe: string | null
          user_id: string
        }
        Insert: {
          alert_message: string
          alert_type?: string
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          full_context?: Json | null
          id?: string
          pattern_occurrence_id?: string | null
          pattern_type?: string | null
          rr_ratio?: number | null
          status?: string
          stop_price?: number | null
          symbol: string
          target_price?: number | null
          timeframe?: string | null
          user_id: string
        }
        Update: {
          alert_message?: string
          alert_type?: string
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          full_context?: Json | null
          id?: string
          pattern_occurrence_id?: string | null
          pattern_type?: string | null
          rr_ratio?: number | null
          status?: string
          stop_price?: number | null
          symbol?: string
          target_price?: number | null
          timeframe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      copilot_conversations: {
        Row: {
          created_at: string
          flow_type: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flow_type?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flow_type?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      copilot_learned_rules: {
        Row: {
          auto_expires_at: string | null
          confidence: number | null
          created_at: string
          id: string
          is_active: boolean | null
          rule_content: string
          rule_type: string
          source: string | null
          trigger_pattern: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          auto_expires_at?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          rule_content: string
          rule_type: string
          source?: string | null
          trigger_pattern: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          auto_expires_at?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          rule_content?: string
          rule_type?: string
          source?: string | null
          trigger_pattern?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_model_usage: {
        Row: {
          created_at: string
          id: string
          input_tokens: number | null
          model_used: string
          output_tokens: number | null
          request_type: string
          response_latency_ms: number | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          input_tokens?: number | null
          model_used: string
          output_tokens?: number | null
          request_type: string
          response_latency_ms?: number | null
          source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          input_tokens?: number | null
          model_used?: string
          output_tokens?: number | null
          request_type?: string
          response_latency_ms?: number | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      copilot_model_versions: {
        Row: {
          accuracy_metrics: Json | null
          created_at: string
          id: string
          is_active: boolean
          model_type: string
          training_date: string
          training_rows_count: number | null
          version_tag: string
        }
        Insert: {
          accuracy_metrics?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          model_type: string
          training_date?: string
          training_rows_count?: number | null
          version_tag: string
        }
        Update: {
          accuracy_metrics?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          model_type?: string
          training_date?: string
          training_rows_count?: number | null
          version_tag?: string
        }
        Relationships: []
      }
      copilot_platform_context: {
        Row: {
          computed_at: string
          context_data: Json
          context_type: string
          expires_at: string
          id: string
        }
        Insert: {
          computed_at?: string
          context_data?: Json
          context_type: string
          expires_at?: string
          id?: string
        }
        Update: {
          computed_at?: string
          context_data?: Json
          context_type?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      copilot_training_pairs: {
        Row: {
          created_at: string
          domain: string | null
          dpo_eligible: boolean | null
          id: string
          intent_classification: string | null
          is_preferred: boolean | null
          last_rescored_at: string | null
          outcome_signals: Json | null
          parameters_used: Json | null
          prompt: string
          quality_weight: number
          response: string
          reward_score: number | null
          session_id: string | null
          tool_calls: Json | null
          tool_results: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          dpo_eligible?: boolean | null
          id?: string
          intent_classification?: string | null
          is_preferred?: boolean | null
          last_rescored_at?: string | null
          outcome_signals?: Json | null
          parameters_used?: Json | null
          prompt: string
          quality_weight?: number
          response: string
          reward_score?: number | null
          session_id?: string | null
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          dpo_eligible?: boolean | null
          id?: string
          intent_classification?: string | null
          is_preferred?: boolean | null
          last_rescored_at?: string | null
          outcome_signals?: Json | null
          parameters_used?: Json | null
          prompt?: string
          quality_weight?: number
          response?: string
          reward_score?: number | null
          session_id?: string | null
          tool_calls?: Json | null
          tool_results?: Json | null
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
      data_seeding_status: {
        Row: {
          asset_class: string
          checked_at: string
          failed_tickers: number
          id: string
          last_error: string | null
          last_seed_at: string | null
          seeded_tickers: number
          source: string
          total_tickers: number
        }
        Insert: {
          asset_class: string
          checked_at?: string
          failed_tickers?: number
          id?: string
          last_error?: string | null
          last_seed_at?: string | null
          seeded_tickers?: number
          source: string
          total_tickers?: number
        }
        Update: {
          asset_class?: string
          checked_at?: string
          failed_tickers?: number
          id?: string
          last_error?: string | null
          last_seed_at?: string | null
          seeded_tickers?: number
          source?: string
          total_tickers?: number
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
      educational_content_pieces: {
        Row: {
          article_id: string | null
          article_title: string
          content: string
          created_at: string
          global_order: number | null
          hashtags: string[] | null
          id: string
          is_active: boolean
          last_posted_at: string | null
          link_back_url: string | null
          piece_type: string
          posted_count: number
          sequence_number: number
          total_in_series: number
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          article_title: string
          content: string
          created_at?: string
          global_order?: number | null
          hashtags?: string[] | null
          id?: string
          is_active?: boolean
          last_posted_at?: string | null
          link_back_url?: string | null
          piece_type: string
          posted_count?: number
          sequence_number: number
          total_in_series: number
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          article_title?: string
          content?: string
          created_at?: string
          global_order?: number | null
          hashtags?: string[] | null
          id?: string
          is_active?: boolean
          last_posted_at?: string | null
          link_back_url?: string | null
          piece_type?: string
          posted_count?: number
          sequence_number?: number
          total_in_series?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "educational_content_pieces_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "educational_content_pieces_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "learning_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_schedule_state: {
        Row: {
          created_at: string
          current_position: number
          id: string
          is_active: boolean
          last_scheduled_at: string | null
          market_region: string
          optimal_post_time_utc: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_position?: number
          id?: string
          is_active?: boolean
          last_scheduled_at?: string | null
          market_region: string
          optimal_post_time_utc: string
          timezone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_position?: number
          id?: string
          is_active?: boolean
          last_scheduled_at?: string | null
          market_region?: string
          optimal_post_time_utc?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          brief_mode: string | null
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          resend_message_id: string | null
          status: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          brief_mode?: string | null
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          resend_message_id?: string | null
          status: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          brief_mode?: string | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          resend_message_id?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
      gate_evaluations: {
        Row: {
          agent_score: number | null
          agent_verdict: string | null
          created_at: string
          direction: string | null
          gate_reason: string | null
          gate_result: string
          id: string
          master_plan_id: string | null
          setup_type: string | null
          source: string | null
          ticker: string
          timeframe: string | null
          user_id: string
        }
        Insert: {
          agent_score?: number | null
          agent_verdict?: string | null
          created_at?: string
          direction?: string | null
          gate_reason?: string | null
          gate_result: string
          id?: string
          master_plan_id?: string | null
          setup_type?: string | null
          source?: string | null
          ticker: string
          timeframe?: string | null
          user_id: string
        }
        Update: {
          agent_score?: number | null
          agent_verdict?: string | null
          created_at?: string
          direction?: string | null
          gate_reason?: string | null
          gate_result?: string
          id?: string
          master_plan_id?: string | null
          setup_type?: string | null
          source?: string | null
          ticker?: string
          timeframe?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_evaluations_master_plan_id_fkey"
            columns: ["master_plan_id"]
            isOneToOne: false
            referencedRelation: "master_plans"
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
          detector_version: string | null
          direction: string
          entry_price: number
          exchange: string | null
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
          validation_completed_at: string | null
          validation_layers_passed: string[] | null
          validation_status: string
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
          detector_version?: string | null
          direction: string
          entry_price: number
          exchange?: string | null
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
          validation_completed_at?: string | null
          validation_layers_passed?: string[] | null
          validation_status?: string
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
          detector_version?: string | null
          direction?: string
          entry_price?: number
          exchange?: string | null
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
          validation_completed_at?: string | null
          validation_layers_passed?: string[] | null
          validation_status?: string
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
          source: string | null
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
          source?: string | null
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
          source?: string | null
          symbol?: string
          timeframe?: string
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      insight_cache: {
        Row: {
          generated_at: string
          id: string
          insight: string
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          insight: string
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          insight?: string
          user_id?: string
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
      instruments: {
        Row: {
          asset_type: string
          country: string | null
          created_at: string | null
          currency: string | null
          exchange: string
          is_active: boolean | null
          name: string | null
          sector: string | null
          symbol: string
          updated_at: string | null
        }
        Insert: {
          asset_type: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          exchange: string
          is_active?: boolean | null
          name?: string | null
          sector?: string | null
          symbol: string
          updated_at?: string | null
        }
        Update: {
          asset_type?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          exchange?: string
          is_active?: boolean | null
          name?: string | null
          sector?: string | null
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_article_translations: {
        Row: {
          article_id: string
          content: string
          excerpt: string | null
          id: string
          is_manual_override: boolean
          language_code: string
          og_description: string | null
          og_title: string | null
          seo_description: string | null
          seo_title: string | null
          source_hash: string | null
          status: string
          title: string
          translated_at: string
          updated_at: string
        }
        Insert: {
          article_id: string
          content: string
          excerpt?: string | null
          id?: string
          is_manual_override?: boolean
          language_code: string
          og_description?: string | null
          og_title?: string | null
          seo_description?: string | null
          seo_title?: string | null
          source_hash?: string | null
          status?: string
          title: string
          translated_at?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          content?: string
          excerpt?: string | null
          id?: string
          is_manual_override?: boolean
          language_code?: string
          og_description?: string | null
          og_title?: string | null
          seo_description?: string | null
          seo_title?: string | null
          source_hash?: string | null
          status?: string
          title?: string
          translated_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "learning_articles"
            referencedColumns: ["id"]
          },
        ]
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
          exchange: string | null
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
          share_image_url: string | null
          share_token: string | null
          status: string
          stop_loss_price: number
          take_profit_price: number
          timeframe: string
          trend_alignment: string | null
          trend_indicators: Json | null
          updated_at: string
          validation_completed_at: string | null
          validation_layers_passed: string[] | null
          validation_status: string
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
          exchange?: string | null
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
          share_image_url?: string | null
          share_token?: string | null
          status?: string
          stop_loss_price: number
          take_profit_price: number
          timeframe?: string
          trend_alignment?: string | null
          trend_indicators?: Json | null
          updated_at?: string
          validation_completed_at?: string | null
          validation_layers_passed?: string[] | null
          validation_status?: string
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
          exchange?: string | null
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
          share_image_url?: string | null
          share_token?: string | null
          status?: string
          stop_loss_price?: number
          take_profit_price?: number
          timeframe?: string
          trend_alignment?: string | null
          trend_indicators?: Json | null
          updated_at?: string
          validation_completed_at?: string | null
          validation_layers_passed?: string[] | null
          validation_status?: string
          visual_spec?: Json
        }
        Relationships: []
      }
      live_trades: {
        Row: {
          attribution: string | null
          broker: string | null
          broker_order_id: string | null
          copilot_reasoning: string | null
          created_at: string | null
          entry_price: number | null
          entry_time: string | null
          exit_price: number | null
          exit_time: string | null
          filled_price: number | null
          gate_evaluation_id: string | null
          gate_reason: string | null
          gate_result: string | null
          hold_duration_mins: number | null
          id: string
          master_plan_id: string | null
          outcome: string | null
          pnl_dollars: number | null
          pnl_r: number | null
          position_size_pct: number | null
          setup_type: string | null
          slippage_r: number | null
          source: string | null
          stop_price: number | null
          target_price: number | null
          ticker: string | null
          user_action: string | null
          user_id: string
        }
        Insert: {
          attribution?: string | null
          broker?: string | null
          broker_order_id?: string | null
          copilot_reasoning?: string | null
          created_at?: string | null
          entry_price?: number | null
          entry_time?: string | null
          exit_price?: number | null
          exit_time?: string | null
          filled_price?: number | null
          gate_evaluation_id?: string | null
          gate_reason?: string | null
          gate_result?: string | null
          hold_duration_mins?: number | null
          id?: string
          master_plan_id?: string | null
          outcome?: string | null
          pnl_dollars?: number | null
          pnl_r?: number | null
          position_size_pct?: number | null
          setup_type?: string | null
          slippage_r?: number | null
          source?: string | null
          stop_price?: number | null
          target_price?: number | null
          ticker?: string | null
          user_action?: string | null
          user_id: string
        }
        Update: {
          attribution?: string | null
          broker?: string | null
          broker_order_id?: string | null
          copilot_reasoning?: string | null
          created_at?: string | null
          entry_price?: number | null
          entry_time?: string | null
          exit_price?: number | null
          exit_time?: string | null
          filled_price?: number | null
          gate_evaluation_id?: string | null
          gate_reason?: string | null
          gate_result?: string | null
          hold_duration_mins?: number | null
          id?: string
          master_plan_id?: string | null
          outcome?: string | null
          pnl_dollars?: number | null
          pnl_r?: number | null
          position_size_pct?: number | null
          setup_type?: string | null
          slippage_r?: number | null
          source?: string | null
          stop_price?: number | null
          target_price?: number | null
          ticker?: string | null
          user_action?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          region: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          region?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          region?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      market_breadth_cache: {
        Row: {
          advance_decline_line: number
          advance_decline_ratio: number
          advancing: number
          created_at: string
          declining: number
          exchange: string
          id: string
          unchanged: number
        }
        Insert: {
          advance_decline_line: number
          advance_decline_ratio: number
          advancing: number
          created_at?: string
          declining: number
          exchange?: string
          id?: string
          unchanged: number
        }
        Update: {
          advance_decline_line?: number
          advance_decline_ratio?: number
          advancing?: number
          created_at?: string
          declining?: number
          exchange?: string
          id?: string
          unchanged?: number
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
      master_plans: {
        Row: {
          asset_classes: string[] | null
          created_at: string
          crypto_categories: string[] | null
          excluded_conditions: Json | null
          fx_categories: string[] | null
          id: string
          is_active: boolean | null
          max_open_positions: number | null
          max_position_pct: number | null
          min_agent_score: number | null
          min_confluence_score: number | null
          min_market_cap: string | null
          mtf_min_aligned: number | null
          mtf_required_timeframes: string[] | null
          name: string | null
          override_constraints: Json | null
          plan_order: number | null
          preferred_patterns: Json | null
          raw_nl_input: string | null
          sector_filters: Json | null
          stock_exchanges: string[] | null
          stop_loss_rule: string | null
          timezone: string
          trading_schedules: Json | null
          trading_window_end: string | null
          trading_window_start: string | null
          trend_context_filter: string | null
          trend_direction: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_classes?: string[] | null
          created_at?: string
          crypto_categories?: string[] | null
          excluded_conditions?: Json | null
          fx_categories?: string[] | null
          id?: string
          is_active?: boolean | null
          max_open_positions?: number | null
          max_position_pct?: number | null
          min_agent_score?: number | null
          min_confluence_score?: number | null
          min_market_cap?: string | null
          mtf_min_aligned?: number | null
          mtf_required_timeframes?: string[] | null
          name?: string | null
          override_constraints?: Json | null
          plan_order?: number | null
          preferred_patterns?: Json | null
          raw_nl_input?: string | null
          sector_filters?: Json | null
          stock_exchanges?: string[] | null
          stop_loss_rule?: string | null
          timezone?: string
          trading_schedules?: Json | null
          trading_window_end?: string | null
          trading_window_start?: string | null
          trend_context_filter?: string | null
          trend_direction?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_classes?: string[] | null
          created_at?: string
          crypto_categories?: string[] | null
          excluded_conditions?: Json | null
          fx_categories?: string[] | null
          id?: string
          is_active?: boolean | null
          max_open_positions?: number | null
          max_position_pct?: number | null
          min_agent_score?: number | null
          min_confluence_score?: number | null
          min_market_cap?: string | null
          mtf_min_aligned?: number | null
          mtf_required_timeframes?: string[] | null
          name?: string | null
          override_constraints?: Json | null
          plan_order?: number | null
          preferred_patterns?: Json | null
          raw_nl_input?: string | null
          sector_filters?: Json | null
          stock_exchanges?: string[] | null
          stop_loss_rule?: string | null
          timezone?: string
          trading_schedules?: Json | null
          trading_window_end?: string | null
          trading_window_start?: string | null
          trend_context_filter?: string | null
          trend_direction?: string | null
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
          alerted_at: string | null
          asset_type: string | null
          attribution: string | null
          close_reason: string | null
          closed_at: string | null
          cooldown_until: string | null
          copilot_reasoning: string | null
          created_at: string
          detection_id: string | null
          detection_latency_ms: number | null
          entry_price: number
          exit_price: number | null
          forex_lot_size: number | null
          gate_evaluation_id: string | null
          gate_reason: string | null
          gate_result: string | null
          hold_duration_mins: number | null
          id: string
          ideal_exit_price: number | null
          instrument_type: string | null
          latest_price: number | null
          latest_price_at: string | null
          master_plan_id: string | null
          monitoring_paused: boolean
          notes: string | null
          notified_at: string | null
          outcome: string | null
          outcome_r: number | null
          override_notes: string | null
          override_reason: string | null
          pattern_id: string | null
          pnl: number | null
          portfolio_id: string
          position_size_pct: number | null
          price_crossed_at: string | null
          quantity: number
          setup_type: string | null
          slippage_bps: number | null
          source: string | null
          status: string
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          timeframe: string | null
          trade_type: string
          user_action: string | null
          user_id: string
        }
        Insert: {
          alerted_at?: string | null
          asset_type?: string | null
          attribution?: string | null
          close_reason?: string | null
          closed_at?: string | null
          cooldown_until?: string | null
          copilot_reasoning?: string | null
          created_at?: string
          detection_id?: string | null
          detection_latency_ms?: number | null
          entry_price: number
          exit_price?: number | null
          forex_lot_size?: number | null
          gate_evaluation_id?: string | null
          gate_reason?: string | null
          gate_result?: string | null
          hold_duration_mins?: number | null
          id?: string
          ideal_exit_price?: number | null
          instrument_type?: string | null
          latest_price?: number | null
          latest_price_at?: string | null
          master_plan_id?: string | null
          monitoring_paused?: boolean
          notes?: string | null
          notified_at?: string | null
          outcome?: string | null
          outcome_r?: number | null
          override_notes?: string | null
          override_reason?: string | null
          pattern_id?: string | null
          pnl?: number | null
          portfolio_id: string
          position_size_pct?: number | null
          price_crossed_at?: string | null
          quantity: number
          setup_type?: string | null
          slippage_bps?: number | null
          source?: string | null
          status?: string
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          timeframe?: string | null
          trade_type: string
          user_action?: string | null
          user_id: string
        }
        Update: {
          alerted_at?: string | null
          asset_type?: string | null
          attribution?: string | null
          close_reason?: string | null
          closed_at?: string | null
          cooldown_until?: string | null
          copilot_reasoning?: string | null
          created_at?: string
          detection_id?: string | null
          detection_latency_ms?: number | null
          entry_price?: number
          exit_price?: number | null
          forex_lot_size?: number | null
          gate_evaluation_id?: string | null
          gate_reason?: string | null
          gate_result?: string | null
          hold_duration_mins?: number | null
          id?: string
          ideal_exit_price?: number | null
          instrument_type?: string | null
          latest_price?: number | null
          latest_price_at?: string | null
          master_plan_id?: string | null
          monitoring_paused?: boolean
          notes?: string | null
          notified_at?: string | null
          outcome?: string | null
          outcome_r?: number | null
          override_notes?: string | null
          override_reason?: string | null
          pattern_id?: string | null
          pnl?: number | null
          portfolio_id?: string
          position_size_pct?: number | null
          price_crossed_at?: string | null
          quantity?: number
          setup_type?: string | null
          slippage_bps?: number | null
          source?: string | null
          status?: string
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string | null
          trade_type?: string
          user_action?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trades_detection_id_fkey"
            columns: ["detection_id"]
            isOneToOne: false
            referencedRelation: "live_pattern_detections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_trades_gate_evaluation_id_fkey"
            columns: ["gate_evaluation_id"]
            isOneToOne: false
            referencedRelation: "gate_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_trades_master_plan_id_fkey"
            columns: ["master_plan_id"]
            isOneToOne: false
            referencedRelation: "master_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_hit_rates: {
        Row: {
          avg_holding_bars: number | null
          avg_holding_hours: number | null
          avg_r_multiple: number
          created_at: string
          data_version: number | null
          direction: string
          expectancy: number
          first_signal_date: string | null
          id: string
          instrument_category: string | null
          is_reseeding: boolean | null
          last_reseeded_at: string | null
          last_signal_date: string | null
          losses: number
          max_drawdown_r: number | null
          pattern_id: string
          pattern_name: string
          previous_sample_size: number | null
          previous_win_rate: number | null
          profit_factor: number
          regime_breakdown: Json | null
          reliability_score: number
          reseed_reason: string | null
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
          data_version?: number | null
          direction: string
          expectancy?: number
          first_signal_date?: string | null
          id?: string
          instrument_category?: string | null
          is_reseeding?: boolean | null
          last_reseeded_at?: string | null
          last_signal_date?: string | null
          losses?: number
          max_drawdown_r?: number | null
          pattern_id: string
          pattern_name: string
          previous_sample_size?: number | null
          previous_win_rate?: number | null
          profit_factor?: number
          regime_breakdown?: Json | null
          reliability_score?: number
          reseed_reason?: string | null
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
          data_version?: number | null
          direction?: string
          expectancy?: number
          first_signal_date?: string | null
          id?: string
          instrument_category?: string | null
          is_reseeding?: boolean | null
          last_reseeded_at?: string | null
          last_signal_date?: string | null
          losses?: number
          max_drawdown_r?: number | null
          pattern_id?: string
          pattern_name?: string
          previous_sample_size?: number | null
          previous_win_rate?: number | null
          profit_factor?: number
          regime_breakdown?: Json | null
          reliability_score?: number
          reseed_reason?: string | null
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
      pattern_pipeline_results: {
        Row: {
          confidence: number | null
          created_at: string
          detection_id: string
          detection_source: string
          id: string
          layer_name: string
          layer_output: Json | null
          processing_time_ms: number | null
          reasoning: string | null
          verdict: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          detection_id: string
          detection_source?: string
          id?: string
          layer_name: string
          layer_output?: Json | null
          processing_time_ms?: number | null
          reasoning?: string | null
          verdict: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          detection_id?: string
          detection_source?: string
          id?: string
          layer_name?: string
          layer_output?: Json | null
          processing_time_ms?: number | null
          reasoning?: string | null
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_pipeline_results_layer_name_fkey"
            columns: ["layer_name"]
            isOneToOne: false
            referencedRelation: "pattern_validation_layers"
            referencedColumns: ["name"]
          },
        ]
      }
      pattern_validation_layers: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          edge_function_name: string | null
          fallback_action: string
          id: string
          is_active: boolean
          layer_order: number
          layer_type: string
          name: string
          timeout_ms: number
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          edge_function_name?: string | null
          fallback_action?: string
          id?: string
          is_active?: boolean
          layer_order: number
          layer_type?: string
          name: string
          timeout_ms?: number
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          edge_function_name?: string | null
          fallback_action?: string
          id?: string
          is_active?: boolean
          layer_order?: number
          layer_type?: string
          name?: string
          timeout_ms?: number
          updated_at?: string
        }
        Relationships: []
      }
      pattern_verification_failures: {
        Row: {
          asset_type: string | null
          created_at: string
          detected_at: string | null
          detection_data: Json | null
          detection_source: string
          direction: string | null
          failure_reason: string
          id: string
          pattern_id: string
          pattern_name: string | null
          symbol: string
          timeframe: string
        }
        Insert: {
          asset_type?: string | null
          created_at?: string
          detected_at?: string | null
          detection_data?: Json | null
          detection_source: string
          direction?: string | null
          failure_reason: string
          id?: string
          pattern_id: string
          pattern_name?: string | null
          symbol: string
          timeframe: string
        }
        Update: {
          asset_type?: string | null
          created_at?: string
          detected_at?: string | null
          detection_data?: Json | null
          detection_source?: string
          direction?: string | null
          failure_reason?: string
          id?: string
          pattern_id?: string
          pattern_name?: string | null
          symbol?: string
          timeframe?: string
        }
        Relationships: []
      }
      pending_copilot_actions: {
        Row: {
          action_type: string
          applied_at: string | null
          auto_run: boolean
          created_at: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          action_type: string
          applied_at?: string | null
          auto_run?: boolean
          created_at?: string
          id?: string
          payload: Json
          user_id: string
        }
        Update: {
          action_type?: string
          applied_at?: string | null
          auto_run?: boolean
          created_at?: string
          id?: string
          payload?: Json
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
      platform_data_version: {
        Row: {
          activated_at: string | null
          changes_summary: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          changes_summary?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          version: number
        }
        Update: {
          activated_at?: string | null
          changes_summary?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          version?: number
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
          pattern_id: string | null
          platform: string
          platform_post_id: string | null
          platform_response: Json | null
          post_type: string
          posted_at: string
          scheduled_post_id: string | null
          session_window: string | null
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
          pattern_id?: string | null
          platform: string
          platform_post_id?: string | null
          platform_response?: Json | null
          post_type: string
          posted_at?: string
          scheduled_post_id?: string | null
          session_window?: string | null
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
          pattern_id?: string | null
          platform?: string
          platform_post_id?: string | null
          platform_response?: Json | null
          post_type?: string
          posted_at?: string
          scheduled_post_id?: string | null
          session_window?: string | null
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
          avatar_color: string | null
          created_at: string | null
          display_alias: string | null
          email: string | null
          email_notifications_enabled: boolean | null
          first_destination: string | null
          id: string
          last_brief_sent_at: string | null
          last_sign_in_at: string | null
          morning_brief_enabled: boolean
          onboarding_completed: boolean | null
          push_notifications_enabled: boolean | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status: string | null
          trading_plan_structured: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_color?: string | null
          created_at?: string | null
          display_alias?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          first_destination?: string | null
          id?: string
          last_brief_sent_at?: string | null
          last_sign_in_at?: string | null
          morning_brief_enabled?: boolean
          onboarding_completed?: boolean | null
          push_notifications_enabled?: boolean | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          trading_plan_structured?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_color?: string | null
          created_at?: string | null
          display_alias?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          first_destination?: string | null
          id?: string
          last_brief_sent_at?: string | null
          last_sign_in_at?: string | null
          morning_brief_enabled?: boolean
          onboarding_completed?: boolean | null
          push_notifications_enabled?: boolean | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_status?: string | null
          trading_plan_structured?: Json | null
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
          name: string | null
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
          name?: string | null
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
          name?: string | null
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
      quiz_question_translations: {
        Row: {
          explanation: string
          id: string
          is_manual_override: boolean
          language_code: string
          options: Json
          question_id: string
          question_text: string
          source_hash: string | null
          status: string
          translated_at: string
          updated_at: string
        }
        Insert: {
          explanation: string
          id?: string
          is_manual_override?: boolean
          language_code: string
          options: Json
          question_id: string
          question_text: string
          source_hash?: string | null
          status?: string
          translated_at?: string
          updated_at?: string
        }
        Update: {
          explanation?: string
          id?: string
          is_manual_override?: boolean
          language_code?: string
          options?: Json
          question_id?: string
          question_text?: string
          source_hash?: string | null
          status?: string
          translated_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_translations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_question_translations_question_id_fkey"
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
      reseed_audit_log: {
        Row: {
          asset_class: string | null
          completed_at: string | null
          detections_after: number | null
          detections_before: number | null
          id: string
          instruments_affected: number | null
          pattern_id: string | null
          reseed_batch: string
          reseed_reason: string | null
          started_at: string | null
          status: string | null
          timeframe: string | null
          win_rate_after: number | null
          win_rate_before: number | null
        }
        Insert: {
          asset_class?: string | null
          completed_at?: string | null
          detections_after?: number | null
          detections_before?: number | null
          id?: string
          instruments_affected?: number | null
          pattern_id?: string | null
          reseed_batch: string
          reseed_reason?: string | null
          started_at?: string | null
          status?: string | null
          timeframe?: string | null
          win_rate_after?: number | null
          win_rate_before?: number | null
        }
        Update: {
          asset_class?: string | null
          completed_at?: string | null
          detections_after?: number | null
          detections_before?: number | null
          id?: string
          instruments_affected?: number | null
          pattern_id?: string | null
          reseed_batch?: string
          reseed_reason?: string | null
          started_at?: string | null
          status?: string | null
          timeframe?: string | null
          win_rate_after?: number | null
          win_rate_before?: number | null
        }
        Relationships: []
      }
      reseed_snapshot_batch1: {
        Row: {
          avg_r_multiple: number | null
          data_version: number | null
          direction: string | null
          expectancy: number | null
          instrument_category: string | null
          losses: number | null
          pattern_id: string | null
          pattern_name: string | null
          snapshotted_at: string | null
          timeframe: string | null
          total_signals: number | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          avg_r_multiple?: number | null
          data_version?: number | null
          direction?: string | null
          expectancy?: number | null
          instrument_category?: string | null
          losses?: number | null
          pattern_id?: string | null
          pattern_name?: string | null
          snapshotted_at?: string | null
          timeframe?: string | null
          total_signals?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          avg_r_multiple?: number | null
          data_version?: number | null
          direction?: string | null
          expectancy?: number | null
          instrument_category?: string | null
          losses?: number | null
          pattern_id?: string | null
          pattern_name?: string | null
          snapshotted_at?: string | null
          timeframe?: string | null
          total_signals?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      reseed_state: {
        Row: {
          id: number
          offset: number
          status: string
          timeframe: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          offset?: number
          status?: string
          timeframe?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          offset?: number
          status?: string
          timeframe?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scan_requests: {
        Row: {
          asset_type: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          notified: boolean
          patterns_found: number | null
          priority: number
          requested_at: string
          started_at: string | null
          status: string
          symbol: string
          user_id: string
        }
        Insert: {
          asset_type?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          notified?: boolean
          patterns_found?: number | null
          priority?: number
          requested_at?: string
          started_at?: string | null
          status?: string
          symbol: string
          user_id: string
        }
        Update: {
          asset_type?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          notified?: boolean
          patterns_found?: number | null
          priority?: number
          requested_at?: string
          started_at?: string | null
          status?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
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
          retry_count: number
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
          retry_count?: number
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
          retry_count?: number
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
      service_health_checks: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          response_body: string | null
          service_name: string
          status: string
          status_code: number | null
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          response_body?: string | null
          service_name: string
          status: string
          status_code?: number | null
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          response_body?: string | null
          service_name?: string
          status?: string
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_health_checks_service_name_fkey"
            columns: ["service_name"]
            isOneToOne: false
            referencedRelation: "service_registry"
            referencedColumns: ["service_name"]
          },
        ]
      }
      service_registry: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          health_endpoint: string | null
          id: string
          is_active: boolean
          service_name: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_name: string
          health_endpoint?: string | null
          id?: string
          is_active?: boolean
          service_name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          health_endpoint?: string | null
          id?: string
          is_active?: boolean
          service_name?: string
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          ai_pnl_r: number | null
          created_at: string | null
          human_pnl_r: number | null
          id: string
          session_date: string
          summary_text: string | null
          total_scanned: number | null
          trades_taken: number | null
          user_id: string
        }
        Insert: {
          ai_pnl_r?: number | null
          created_at?: string | null
          human_pnl_r?: number | null
          id?: string
          session_date: string
          summary_text?: string | null
          total_scanned?: number | null
          trades_taken?: number | null
          user_id: string
        }
        Update: {
          ai_pnl_r?: number | null
          created_at?: string | null
          human_pnl_r?: number | null
          id?: string
          session_date?: string
          summary_text?: string | null
          total_scanned?: number | null
          trades_taken?: number | null
          user_id?: string
        }
        Relationships: []
      }
      session_overrides: {
        Row: {
          created_at: string
          id: string
          override_text: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          override_text: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          override_text?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signal_webhook_log: {
        Row: {
          alert_id: string
          created_at: string
          detection_id: string | null
          id: string
          latency_ms: number | null
          payload: Json
          response_body: string | null
          response_status: number | null
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          detection_id?: string | null
          id?: string
          latency_ms?: number | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          detection_id?: string | null
          id?: string
          latency_ms?: number | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_webhook_log_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
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
      social_post_budget: {
        Row: {
          id: string
          max_posts: number
          platform: string
          post_count: number
          post_date: string
          updated_at: string
        }
        Insert: {
          id?: string
          max_posts?: number
          platform: string
          post_count?: number
          post_date?: string
          updated_at?: string
        }
        Update: {
          id?: string
          max_posts?: number
          platform?: string
          post_count?: number
          post_date?: string
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
          source_hash: string | null
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
          source_hash?: string | null
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
          source_hash?: string | null
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
      user_activation: {
        Row: {
          completed_at: string | null
          created_at: string
          dismissed: boolean
          id: string
          ran_backtest: boolean
          set_alert: boolean
          updated_at: string
          user_id: string
          viewed_signal: boolean
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dismissed?: boolean
          id?: string
          ran_backtest?: boolean
          set_alert?: boolean
          updated_at?: string
          user_id: string
          viewed_signal?: boolean
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dismissed?: boolean
          id?: string
          ran_backtest?: boolean
          set_alert?: boolean
          updated_at?: string
          user_id?: string
          viewed_signal?: boolean
        }
        Relationships: []
      }
      user_captures: {
        Row: {
          capture_type: string
          context_metadata: Json | null
          context_type: string | null
          created_at: string
          duration_seconds: number | null
          expires_at: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          is_temporary: boolean
          user_id: string
        }
        Insert: {
          capture_type: string
          context_metadata?: Json | null
          context_type?: string | null
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          is_temporary?: boolean
          user_id: string
        }
        Update: {
          capture_type?: string
          context_metadata?: Json | null
          context_type?: string | null
          created_at?: string
          duration_seconds?: number | null
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          is_temporary?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_data_providers: {
        Row: {
          api_key_encrypted: string
          api_secret_encrypted: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          api_key_encrypted: string
          api_secret_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          api_key_encrypted?: string
          api_secret_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          alert_emails: boolean | null
          created_at: string | null
          first_paper_trade_seen: boolean | null
          getting_started_sent: boolean | null
          id: string
          milestone_20_seen: boolean | null
          milestone_5_seen: boolean | null
          milestone_50_seen: boolean | null
          morning_briefing_enabled: boolean | null
          timezone: string | null
          unsubscribed: boolean | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
          welcome_sent: boolean | null
        }
        Insert: {
          alert_emails?: boolean | null
          created_at?: string | null
          first_paper_trade_seen?: boolean | null
          getting_started_sent?: boolean | null
          id?: string
          milestone_20_seen?: boolean | null
          milestone_5_seen?: boolean | null
          milestone_50_seen?: boolean | null
          morning_briefing_enabled?: boolean | null
          timezone?: string | null
          unsubscribed?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
          welcome_sent?: boolean | null
        }
        Update: {
          alert_emails?: boolean | null
          created_at?: string | null
          first_paper_trade_seen?: boolean | null
          getting_started_sent?: boolean | null
          id?: string
          milestone_20_seen?: boolean | null
          milestone_5_seen?: boolean | null
          milestone_50_seen?: boolean | null
          morning_briefing_enabled?: boolean | null
          timezone?: string | null
          unsubscribed?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
          welcome_sent?: boolean | null
        }
        Relationships: []
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
      user_signal_actions: {
        Row: {
          action: string
          actioned_at: string | null
          detection_id: string | null
          id: string
          instrument: string
          paper_trade_id: string | null
          pattern_id: string
          timeframe: string
          user_id: string
        }
        Insert: {
          action: string
          actioned_at?: string | null
          detection_id?: string | null
          id?: string
          instrument: string
          paper_trade_id?: string | null
          pattern_id: string
          timeframe: string
          user_id: string
        }
        Update: {
          action?: string
          actioned_at?: string | null
          detection_id?: string | null
          id?: string
          instrument?: string
          paper_trade_id?: string | null
          pattern_id?: string
          timeframe?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_signal_actions_detection_id_fkey"
            columns: ["detection_id"]
            isOneToOne: false
            referencedRelation: "live_pattern_detections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_signal_actions_paper_trade_id_fkey"
            columns: ["paper_trade_id"]
            isOneToOne: false
            referencedRelation: "paper_trades"
            referencedColumns: ["id"]
          },
        ]
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
      worker_runs: {
        Row: {
          circuit_open_until: string | null
          consecutive_failures: number
          created_at: string
          last_run_at: string | null
          last_success_at: string | null
          last_watermark: string | null
          metadata: Json
          status: string
          updated_at: string
          worker_name: string
        }
        Insert: {
          circuit_open_until?: string | null
          consecutive_failures?: number
          created_at?: string
          last_run_at?: string | null
          last_success_at?: string | null
          last_watermark?: string | null
          metadata?: Json
          status?: string
          updated_at?: string
          worker_name: string
        }
        Update: {
          circuit_open_until?: string | null
          consecutive_failures?: number
          created_at?: string
          last_run_at?: string | null
          last_success_at?: string | null
          last_watermark?: string | null
          metadata?: Json
          status?: string
          updated_at?: string
          worker_name?: string
        }
        Relationships: []
      }
      x_discovered_accounts: {
        Row: {
          created_at: string
          discovered_via: string[]
          discovery_count: number
          followers_count: number | null
          following_count: number | null
          id: string
          name: string | null
          status: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          discovered_via?: string[]
          discovery_count?: number
          followers_count?: number | null
          following_count?: number | null
          id?: string
          name?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          discovered_via?: string[]
          discovery_count?: number
          followers_count?: number | null
          following_count?: number | null
          id?: string
          name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      x_discovery_seeds: {
        Row: {
          accounts_found: number | null
          crawled_at: string | null
          created_at: string
          following_count: number | null
          id: string
          pagination_token: string | null
          seed_user_id: string
          seed_username: string | null
          status: string
        }
        Insert: {
          accounts_found?: number | null
          crawled_at?: string | null
          created_at?: string
          following_count?: number | null
          id?: string
          pagination_token?: string | null
          seed_user_id: string
          seed_username?: string | null
          status?: string
        }
        Update: {
          accounts_found?: number | null
          crawled_at?: string | null
          created_at?: string
          following_count?: number | null
          id?: string
          pagination_token?: string | null
          seed_user_id?: string
          seed_username?: string | null
          status?: string
        }
        Relationships: []
      }
      x_follow_queue: {
        Row: {
          attempted_at: string | null
          created_at: string
          error_message: string | null
          id: string
          status: string
          target_user_id: string
          target_username: string | null
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          target_user_id: string
          target_username?: string | null
        }
        Update: {
          attempted_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          target_user_id?: string
          target_username?: string | null
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
      instrument_pattern_stats_mv: {
        Row: {
          asset_type: string | null
          avg_bars: number | null
          avg_rr: number | null
          expectancy_r: number | null
          losses: number | null
          pattern_id: string | null
          pattern_name: string | null
          symbol: string | null
          timeframe: string | null
          total_trades: number | null
          win_rate_pct: number | null
          wins: number | null
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
      acquire_worker_lock: { Args: { p_worker_name: string }; Returns: boolean }
      activate_cron_job: { Args: { p_jobid: number }; Returns: undefined }
      apply_grade_floor: { Args: never; Returns: undefined }
      backfill_exchange_historical_patterns: { Args: never; Returns: undefined }
      backfill_exchange_live_patterns: { Args: never; Returns: undefined }
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
      check_scan_request_limit: { Args: { p_user_id: string }; Returns: Json }
      check_worker_can_run: {
        Args: {
          p_seeding_end_utc?: number
          p_seeding_start_utc?: number
          p_worker_name: string
        }
        Returns: Json
      }
      cleanup_expired_backtest_cache: { Args: never; Returns: undefined }
      cleanup_expired_captures: { Args: never; Returns: undefined }
      cleanup_expired_reports: { Args: never; Returns: undefined }
      cleanup_http_response_logs: {
        Args: { p_keep_hours?: number }
        Returns: number
      }
      cleanup_old_health_checks: { Args: never; Returns: undefined }
      cleanup_pattern_pipeline_results: {
        Args: { keep_days?: number }
        Returns: Json
      }
      cleanup_stale_historical_prices: {
        Args: { keep_days?: number }
        Returns: Json
      }
      compute_market_breadth_by_asset_class: {
        Args: { p_lookback_hours?: number }
        Returns: {
          advances: number
          asset_class: string
          declines: number
          latest_bar: string
          symbols_used: number
          unchanged: number
        }[]
      }
      compute_market_breadth_from_history: {
        Args: { p_lookback_hours?: number }
        Returns: {
          advances: number
          declines: number
          latest_bar: string
          symbols_used: number
          unchanged: number
        }[]
      }
      deactivate_cron_job: { Args: { p_jobid: number }; Returns: undefined }
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
      get_active_pattern_count: { Args: never; Returns: number }
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
      get_cron_job_by_id: {
        Args: { p_jobid: number }
        Returns: {
          active: boolean
          command: string
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          edge_function: string
          jobid: number
          jobname: string
          partition: string
          schedule: string
          timeframes: string
        }[]
      }
      get_cron_run_details: {
        Args: never
        Returns: {
          end_time: string
          jobid: number
          jobname: string
          return_message: string
          start_time: string
          status: string
        }[]
      }
      get_distinct_instrument_count: {
        Args: never
        Returns: {
          cnt: number
        }[]
      }
      get_edge_atlas_rankings: {
        Args: { p_asset_type: string; p_limit?: number; p_min_trades?: number }
        Returns: {
          avg_bars: number
          est_annualized_pct: number
          expectancy_r: number
          pattern_id: string
          pattern_name: string
          timeframe: string
          total_trades: number
          trades_per_year: number
          win_rate_pct: number
        }[]
      }
      get_edge_atlas_rankings_filtered: {
        Args: {
          p_asset_type?: string
          p_direction?: string
          p_fx_symbols?: string[]
          p_limit?: number
          p_min_annualized_pct?: number
          p_min_expectancy?: number
          p_min_trades?: number
          p_min_win_rate?: number
          p_pattern_name?: string
          p_sort_by?: string
          p_timeframe?: string
        }
        Returns: {
          asset_type: string
          avg_bars: number
          avg_rr: number
          direction: string
          est_annualized_pct: number
          expectancy_r: number
          pattern_id: string
          pattern_name: string
          timeframe: string
          total_trades: number
          trades_per_year: number
          win_rate_pct: number
        }[]
      }
      get_edge_atlas_rankings_fx: {
        Args: { p_limit?: number; p_min_trades?: number; p_symbols: string[] }
        Returns: {
          avg_bars: number
          est_annualized_pct: number
          expectancy_r: number
          pattern_id: string
          pattern_name: string
          timeframe: string
          total_trades: number
          trades_per_year: number
          win_rate_pct: number
        }[]
      }
      get_getting_started_batch: {
        Args: never
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
      get_homepage_stats: { Args: never; Returns: Json }
      get_most_detected_pattern: {
        Args: { p_since: string }
        Returns: {
          cnt: number
          pattern_name: string
        }[]
      }
      get_override_comparison: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          copilot_r: number
          copilot_trades: number
          gap: number
          override_r: number
          override_trades: number
          worst_override_pattern: string
          worst_override_r: number
          worst_override_symbol: string
        }[]
      }
      get_pattern_concentration: {
        Args: never
        Returns: {
          asset_type: string
          avg_grade_score: number
          grade_a: number
          grade_b: number
          grade_c: number
          grade_d: number
          pattern_count: number
          timeframe: string
        }[]
      }
      get_pattern_library_stats: {
        Args: never
        Returns: {
          best_instrument: string
          best_timeframe: string
          pattern_name: string
          total_detections: number
          win_rate: number
        }[]
      }
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
      get_top_win_rate_this_month: {
        Args: { p_min_samples?: number; p_since: string }
        Returns: {
          pattern_name: string
          sample_count: number
          timeframe: string
          win_rate: number
        }[]
      }
      get_translations: {
        Args: { p_language_code?: string }
        Returns: {
          key: string
          value: string
        }[]
      }
      get_user_activity_summary: {
        Args: never
        Returns: {
          active_days_30d: number
          active_days_7d: number
          last_active_at: string
          top_features: Json
          total_page_views: number
          user_id: string
        }[]
      }
      get_user_language: { Args: { p_user_id?: string }; Returns: string }
      get_user_org_ids: {
        Args: never
        Returns: {
          org_id: string
          role: string
        }[]
      }
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
      invoke_manage_trades_if_needed: { Args: never; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_org_member: { Args: { p_org_id: string }; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      make_first_user_admin: { Args: never; Returns: undefined }
      mark_worker_running: {
        Args: { p_worker_name: string }
        Returns: undefined
      }
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
      record_worker_failure: {
        Args: {
          p_circuit_open_mins?: number
          p_circuit_threshold?: number
          p_error?: string
          p_worker_name: string
        }
        Returns: Json
      }
      record_worker_success: {
        Args: {
          p_metadata?: Json
          p_new_watermark?: string
          p_worker_name: string
        }
        Returns: undefined
      }
      refresh_instrument_pattern_stats: { Args: never; Returns: undefined }
      release_worker_lock: {
        Args: { p_worker_name: string }
        Returns: undefined
      }
      reschedule_cron_job: {
        Args: { p_jobid: number; p_schedule: string }
        Returns: undefined
      }
      rescore_copilot_training_pairs: { Args: never; Returns: Json }
      run_cron_job_now: { Args: { p_jobid: number }; Returns: undefined }
      run_database_maintenance: { Args: never; Returns: Json }
      schedule_backfill_page: {
        Args: {
          p_body: string
          p_delay_minutes?: number
          p_headers: string
          p_url: string
        }
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
      worker_lock_key: { Args: { p_worker_name: string }; Returns: number }
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
