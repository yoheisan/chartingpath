import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RESEND_API = 'https://api.resend.com/emails';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user via anon client
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = claimsData.user;
    const body = await req.json();

    const {
      subject,
      description,
      category = 'other',
      priority = 'medium',
      source = 'contact_form',
      context_json = null,
    } = body;

    if (!subject?.trim() || !description?.trim()) {
      return new Response(JSON.stringify({ error: 'Subject and description are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Insert ticket into database
    const { data: ticket, error: insertError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        context_json: context_json ? { ...context_json, source } : { source },
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[submit-support-ticket] DB insert error:', insertError);
      throw insertError;
    }

    console.log(`[submit-support-ticket] Ticket ${ticket.id} created for user ${user.id}`);

    // 2. Send email notification to contact@chartingpath.com via Resend
    // Reply-to is the user's email so replies go directly back to them
    if (resendKey) {
      try {
        const userEmail = user.email || 'unknown@user.com';
        const userName = user.user_metadata?.display_name || user.user_metadata?.full_name || userEmail;

        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
        const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0f172a; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #f97316; margin: 0;">🎫 New Support Ticket</h2>
              <p style="color: #94a3b8; margin: 4px 0 0 0;">ChartingPath Support System</p>
            </div>
            <div style="background: #1e293b; padding: 20px; border-radius: 0 0 8px 8px; color: #e2e8f0;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr><td style="padding: 6px 12px; color: #94a3b8;">Ticket ID</td><td style="padding: 6px 12px; font-family: monospace;">${ticket.id}</td></tr>
                <tr><td style="padding: 6px 12px; color: #94a3b8;">From</td><td style="padding: 6px 12px;">${userName} &lt;${userEmail}&gt;</td></tr>
                <tr><td style="padding: 6px 12px; color: #94a3b8;">Category</td><td style="padding: 6px 12px;">${categoryLabel}</td></tr>
                <tr><td style="padding: 6px 12px; color: #94a3b8;">Priority</td><td style="padding: 6px 12px;">${priorityLabel}</td></tr>
                <tr><td style="padding: 6px 12px; color: #94a3b8;">Source</td><td style="padding: 6px 12px;">${source}</td></tr>
              </table>
              <h3 style="color: #f8fafc; margin-bottom: 8px;">Subject: ${subject}</h3>
              <div style="background: #0f172a; padding: 16px; border-radius: 6px; white-space: pre-wrap; line-height: 1.6;">
                ${description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </div>
              <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
                💡 Reply directly to this email to respond to the user at ${userEmail}
              </p>
            </div>
          </div>
        `;

        const emailRes = await fetch(RESEND_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'ChartingPath Support <support@chartingpath.com>',
            to: ['contact@chartingpath.com'],
            reply_to: userEmail,
            subject: `[${categoryLabel}] ${subject} — Ticket #${ticket.id.slice(0, 8)}`,
            html: emailHtml,
          }),
        });

        if (!emailRes.ok) {
          const errText = await emailRes.text();
          console.error('[submit-support-ticket] Resend error:', errText);
        } else {
          console.log('[submit-support-ticket] Email notification sent successfully');
        }
      } catch (emailErr: any) {
        // Don't fail the ticket creation if email fails
        console.error('[submit-support-ticket] Email send failed:', emailErr.message);
      }
    } else {
      console.warn('[submit-support-ticket] RESEND_API_KEY not configured, skipping email');
    }

    return new Response(JSON.stringify({ success: true, ticketId: ticket.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[submit-support-ticket] Error:', err.message);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
