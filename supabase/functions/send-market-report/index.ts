import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, report, timezone, markets, timeSpan, tone, unsubscribeToken } = await req.json();

    console.log("Sending market report to:", email);

    if (!email || !report) {
      throw new Error("Email and report are required");
    }

    // Format the report for email
    const timeSpanText = timeSpan === "previous_day" ? "Previous Day" : "Past 5 Sessions";
    const marketList = markets.join(", ").toUpperCase();

    // Generate unsubscribe and preferences URLs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const baseUrl = supabaseUrl.replace('.supabase.co', '.supabase.co');
    const unsubscribeUrl = unsubscribeToken 
      ? `${baseUrl}/functions/v1/unsubscribe-market-report?token=${unsubscribeToken}`
      : `https://chartingpath.com/tools/market-breadth`;
    const preferencesUrl = `https://chartingpath.com/tools/market-breadth`;

    // Convert markdown to HTML for better email rendering
    const htmlReport = report
      .replace(/## (.*)/g, '<h2 style="color: #333; margin-top: 24px; margin-bottom: 12px;">$1</h2>')
      .replace(/### (.*)/g, '<h3 style="color: #555; margin-top: 16px; margin-bottom: 8px;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
      .replace(/- (.*)/g, '<li style="margin-left: 20px;">$1</li>');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Market Breadth Report</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Brand Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 20px; text-align: center;">
              <div style="background-color: rgba(255, 255, 255, 0.15); width: 64px; height: 64px; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">Market Breadth Report</h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0;">Professional Market Analysis & Insights</p>
            </div>

            <div style="padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Generated on ${new Date().toLocaleString('en-US', { timeZone: timezone })}</p>
              </div>

              <!-- Report Settings Summary -->
              <div style="background: linear-gradient(135deg, #f9f9f9 0%, #f3f4f6 100%); border-left: 4px solid #4f46e5; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.8;">
                  <strong style="color: #4f46e5;">📊 Markets:</strong> ${marketList}<br>
                  <strong style="color: #4f46e5;">📅 Time Span:</strong> ${timeSpanText}<br>
                  <strong style="color: #4f46e5;">🌍 Timezone:</strong> ${timezone}<br>
                  <strong style="color: #4f46e5;">📝 Tone:</strong> ${tone.charAt(0).toUpperCase() + tone.slice(1)}
                </p>
              </div>

              <!-- Report Content -->
              <div style="color: #333; font-size: 14px; line-height: 1.8;">
                <p style="margin: 12px 0;">${htmlReport}</p>
              </div>

              <!-- Disclaimer -->
              <div style="margin-top: 40px; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.6;">
                  <strong>⚠️ Disclaimer:</strong> This report is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or an offer to buy or sell securities. Always consult with a qualified financial advisor before making investment decisions.
                </p>
              </div>

              <!-- Visit Website CTA -->
              <div style="margin-top: 32px; text-align: center; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
                <a href="https://chartingpath.com" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  Visit ChartingPath
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 32px 20px; border-top: 1px solid #e5e7eb;">
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">ChartingPath</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Professional Trading Education & Tools</p>
              </div>

              <!-- Footer Links -->
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${preferencesUrl}" style="color: #4f46e5; text-decoration: none; font-size: 13px; margin: 0 12px;">Manage Preferences</a>
                ${unsubscribeToken ? `<span style="color: #d1d5db;">|</span>
                <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Unsubscribe</a>` : ''}
                <span style="color: #d1d5db;">|</span>
                <a href="https://chartingpath.com/privacy" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Privacy</a>
                <span style="color: #d1d5db;">|</span>
                <a href="https://chartingpath.com/terms" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Terms</a>
              </div>

              <!-- Legal Footer -->
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0; line-height: 1.6;">
                  ${unsubscribeToken ? `You are receiving this email because you subscribed to Market Breadth Reports.` : 'This is a one-time report you requested.'}
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                  ChartingPath LLC<br>
                  30 N Gould St, Suite R<br>
                  Sheridan, WY 82801, United States
                </p>
                <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} ChartingPath. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ChartingPath Market Reports <reports@chartingpath.com>",
      to: [email],
      subject: `📊 Market Breadth Report - ${timeSpanText} (${new Date().toLocaleDateString()})`,
      html: emailHtml,
      headers: unsubscribeToken ? {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      } : undefined,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-market-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});