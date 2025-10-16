import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StarterScriptsRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: StarterScriptsRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Sending starter scripts to:", email);

    const emailResponse = await resend.emails.send({
      from: "ChartingPath <onboarding@resend.dev>",
      to: [email],
      subject: "Your Free Trading Starter Scripts - Now Available!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
            Welcome to ChartingPath!
          </h1>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for your interest in ChartingPath! We're excited to help you start your automated trading journey.
          </p>
          
          <h2 style="color: #1e40af; margin-top: 30px;">Your Free Starter Scripts Are Ready!</h2>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; margin-bottom: 15px;">We've added 3 professional trading scripts to your account:</p>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 8px 0;">✅ Moving Average Crossover Strategy</li>
              <li style="padding: 8px 0;">✅ RSI Overbought/Oversold Detector</li>
              <li style="padding: 8px 0;">✅ Support & Resistance Breakout System</li>
            </ul>
          </div>
          
          <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <h3 style="margin-top: 0; color: white;">Access Your Scripts Now</h3>
            <p style="margin-bottom: 20px;">Sign up for a free account to download your starter scripts and explore our complete library.</p>
            <a href="https://chartingpath.com/auth" style="display: inline-block; background: white; color: #2563eb; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Create Free Account
            </a>
          </div>
          
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;"><strong>Already have an account?</strong></p>
            <p style="margin: 10px 0 0 0; color: #065f46;">
              <a href="https://chartingpath.com/members/scripts" style="color: #059669; font-weight: bold;">Go to Script Library →</a>
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            <strong>What's included:</strong><br>
            • Ready-to-use Pine Script code<br>
            • Built-in risk management<br>
            • Detailed setup instructions<br>
            • Works on TradingView and compatible platforms
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af;">
            <p>ChartingPath - Automated Trading Education</p>
            <p>Not financial advice. Past performance does not guarantee future results.</p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log("Starter scripts email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Scripts sent successfully!" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-starter-scripts:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send scripts" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
