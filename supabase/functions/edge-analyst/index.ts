import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, runId } = await req.json();
    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing question' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query aggregated pattern outcomes
    // If runId is provided, scope to that run; otherwise query all user's runs
    let query = supabase
      .from('backtest_pattern_outcomes')
      .select('instrument, timeframe, pattern_name, direction, grade, outcome, r_multiple, bars_to_close, run_id');

    if (runId) {
      query = query.eq('run_id', runId);
    }

    const { data: outcomes, error: queryError } = await query.limit(5000);

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(JSON.stringify({ error: 'Failed to query data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Aggregate by instrument + pattern_name + timeframe
    const groups: Record<string, {
      instrument: string;
      pattern_name: string;
      timeframe: string;
      direction: string;
      total: number;
      wins: number;
      total_r: number;
      grades: string[];
    }> = {};

    for (const row of (outcomes || [])) {
      const key = `${row.instrument}|${row.pattern_name}|${row.timeframe}`;
      if (!groups[key]) {
        groups[key] = {
          instrument: row.instrument,
          pattern_name: row.pattern_name,
          timeframe: row.timeframe,
          direction: row.direction,
          total: 0,
          wins: 0,
          total_r: 0,
          grades: [],
        };
      }
      const g = groups[key];
      g.total++;
      if (row.outcome === 'hit_tp') g.wins++;
      g.total_r += row.r_multiple ?? 0;
      if (row.grade) g.grades.push(row.grade);
    }

    // Filter to ≥10 samples and build summary
    const summary = Object.values(groups)
      .filter(g => g.total >= 10)
      .map(g => ({
        instrument: g.instrument,
        pattern: g.pattern_name,
        timeframe: g.timeframe,
        direction: g.direction,
        win_rate: Math.round((g.wins / g.total) * 1000) / 10,
        avg_r: Math.round((g.total_r / g.total) * 1000) / 1000,
        sample_size: g.total,
      }))
      .sort((a, b) => b.avg_r - a.avg_r);

    // Build context for AI
    const dataContext = summary.length > 0
      ? `Here is the aggregated backtest data (only patterns with ≥10 trades):\n\n${JSON.stringify(summary, null, 2)}`
      : `No patterns with ≥10 trade samples found in the data. Total raw outcomes: ${(outcomes || []).length}.`;

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are Edge Analyst, a quantitative trading pattern analysis assistant embedded in a Pattern Lab backtesting platform. You answer questions about pattern performance based on real backtest data.

Rules:
- Be direct and data-driven. Reference specific numbers from the data.
- If asked about a pattern/instrument not in the data, say so clearly.
- Format your answer concisely. Use bold for key metrics.
- When comparing, rank by expectancy (avg R-multiple) first, then win rate.
- Keep answers to 2-4 paragraphs maximum.
- Do not give financial advice. Frame everything as historical backtest results.`,
          },
          {
            role: 'user',
            content: `${dataContext}\n\nUser question: ${question}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error('AI error:', status, errText);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || 'No analysis generated.';

    return new Response(JSON.stringify({
      answer,
      summary,
      totalOutcomes: (outcomes || []).length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge analyst error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
