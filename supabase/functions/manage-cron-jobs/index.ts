/**
 * Cron Job Manager
 * 
 * Admin-only edge function to list, toggle, and reschedule cron jobs.
 * Provides full observability into the pg_cron scheduler.
 */
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      // Get all cron jobs
      const { data: jobs, error: jobsErr } = await supabase.rpc('get_cron_jobs');
      if (jobsErr) throw jobsErr;

      // Get recent run details (last 100)
      const { data: runs, error: runsErr } = await supabase.rpc('get_cron_run_details');
      if (runsErr) throw runsErr;

      return new Response(JSON.stringify({ success: true, jobs, runs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle') {
      const { jobid, active } = body;
      if (!jobid) throw new Error('jobid required');

      if (active) {
        await supabase.rpc('activate_cron_job', { p_jobid: jobid });
      } else {
        await supabase.rpc('deactivate_cron_job', { p_jobid: jobid });
      }

      return new Response(JSON.stringify({ success: true, message: `Job ${jobid} ${active ? 'activated' : 'deactivated'}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reschedule') {
      const { jobid, schedule } = body;
      if (!jobid || !schedule) throw new Error('jobid and schedule required');

      await supabase.rpc('reschedule_cron_job', { p_jobid: jobid, p_schedule: schedule });

      return new Response(JSON.stringify({ success: true, message: `Job ${jobid} rescheduled to ${schedule}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'run_now') {
      // Extract the command from the job and execute it
      const { jobid } = body;
      if (!jobid) throw new Error('jobid required');

      const { data: job } = await supabase.rpc('get_cron_job_by_id', { p_jobid: jobid });
      if (!job) throw new Error('Job not found');

      // Execute the command directly
      await supabase.rpc('run_cron_job_now', { p_jobid: jobid });

      return new Response(JSON.stringify({ success: true, message: `Job ${jobid} triggered` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[manage-cron-jobs] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
