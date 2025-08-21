import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  alert: {
    id: string;
    symbol: string;
    timeframe: string;
    pattern: string;
    profiles: {
      email: string;
    };
  };
  patternResult: {
    confidence: number;
    description: string;
  };
  marketData: Array<{
    o: number;
    h: number;
    l: number;
    c: number;
    t: number;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alert, patternResult, marketData }: AlertEmailRequest = await req.json();

    console.log(`Sending pattern alert email for ${alert.symbol} to ${alert.profiles.email}`);

    const patternNames: { [key: string]: string } = {
      'hammer': 'Hammer',
      'inverted_hammer': 'Inverted Hammer',
      'bullish_engulfing': 'Bullish Engulfing',
      'bearish_engulfing': 'Bearish Engulfing',
      'doji': 'Doji',
      'morning_star': 'Morning Star',
      'evening_star': 'Evening Star',
      'ema_cross_bullish': 'EMA Cross (Bullish)',
      'ema_cross_bearish': 'EMA Cross (Bearish)',
      'rsi_divergence_bullish': 'RSI Divergence (Bullish)',
      'rsi_divergence_bearish': 'RSI Divergence (Bearish)',
    };

    const timeframeNames: { [key: string]: string } = {
      '15m': '15 Minutes',
      '1h': '1 Hour',
      '4h': '4 Hours',
      '1d': '1 Day',
    };

    const patternName = patternNames[alert.pattern] || alert.pattern;
    const timeframeName = timeframeNames[alert.timeframe] || alert.timeframe;
    const currentPrice = marketData[marketData.length - 1]?.c || 0;
    const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${alert.symbol}`;

    const subject = `Pattern Alert: ${patternName} detected on ${alert.symbol} (${timeframeName})`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chart Pattern Alert</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .pattern-card { background-color: #f1f5f9; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .price-info { background-color: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .footer { background-color: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; }
          .disclaimer { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Chart Pattern Alert</h1>
            <p>Pattern detected on ${alert.symbol}</p>
          </div>
          
          <div class="content">
            <div class="pattern-card">
              <h2 style="margin-top: 0; color: #1e293b;">Pattern Detected: ${patternName}</h2>
              <p><strong>Symbol:</strong> ${alert.symbol}</p>
              <p><strong>Timeframe:</strong> ${timeframeName}</p>
              <p><strong>Confidence:</strong> ${(patternResult.confidence * 100).toFixed(0)}%</p>
              <p><strong>Description:</strong> ${patternResult.description}</p>
            </div>

            <div class="price-info">
              <h3 style="margin-top: 0; color: #065f46;">Market Information</h3>
              <p><strong>Current Price:</strong> $${currentPrice.toFixed(4)}</p>
              <p><strong>Alert Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <div style="text-align: center;">
              <a href="${tradingViewUrl}" class="cta-button">View Chart on TradingView</a>
            </div>

            <div class="disclaimer">
              <h4 style="margin-top: 0; color: #92400e;">⚠️ Important Disclaimer</h4>
              <p style="margin-bottom: 0; color: #92400e; font-size: 14px;">
                This alert is for educational purposes only and does not constitute financial advice. 
                Trading involves substantial risk of loss. Always conduct your own research and consider 
                your risk tolerance before making trading decisions.
              </p>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              This alert was generated by ChartingPath's automated pattern detection system. 
              You can manage your alerts by logging into your account.
            </p>
          </div>

          <div class="footer">
            <p>ChartingPath - Chart Pattern Email Alerts</p>
            <p>Turn Charts Into Trading Scripts — Without the Guesswork</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "ChartingPath Alerts <alerts@chartingpath.com>",
      to: [alert.profiles.email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Pattern alert email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-pattern-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);