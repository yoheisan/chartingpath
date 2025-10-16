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
      subject: "Your Free Trading Starter Scripts",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
            Welcome to ChartingPath!
          </h1>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for your interest in ChartingPath! We're excited to help you start your automated trading journey.
          </p>
          
          <h2 style="color: #1e40af; margin-top: 30px;">Your Free Starter Pack Includes:</h2>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📊 Script 1: Moving Average Crossover</h3>
            <p>A classic trend-following strategy that generates signals when short-term and long-term moving averages cross.</p>
            <ul>
              <li>Works on any timeframe</li>
              <li>Built-in risk management</li>
              <li>Stop loss and take profit included</li>
            </ul>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📈 Script 2: RSI Overbought/Oversold</h3>
            <p>Identify potential reversal points using the Relative Strength Index indicator.</p>
            <ul>
              <li>Customizable RSI periods</li>
              <li>Alert system included</li>
              <li>Works on multiple markets</li>
            </ul>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🎯 Script 3: Support & Resistance Breakout</h3>
            <p>Automatically identify and trade key support and resistance level breakouts.</p>
            <ul>
              <li>Dynamic level detection</li>
              <li>Breakout confirmation</li>
              <li>Position sizing calculator</li>
            </ul>
          </div>
          
          <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
            <h3 style="margin-top: 0; color: white;">Ready to Get Started?</h3>
            <p style="margin-bottom: 20px;">Access these scripts and more in your member dashboard.</p>
            <a href="https://chartingpath.com/pricing" style="display: inline-block; background: white; color: #2563eb; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Pricing & Sign Up
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            <strong>Note:</strong> These scripts are for educational purposes only. Always test strategies on a demo account before using real money.
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
