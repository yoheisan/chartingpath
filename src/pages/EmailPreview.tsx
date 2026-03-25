import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Layout is now provided by App.tsx - no need to import here

const EmailPreview = () => {
  const [selectedEmail, setSelectedEmail] = useState("market-report");

  const marketReportHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Market Breadth Report</h1>
          <p>Your Daily Market Analysis from ChartingPath</p>
        </div>
        <div class="content">
          <div class="section">
            <h2>Market Overview</h2>
            <p><strong>Time Span:</strong> Last 24 Hours</p>
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="section">
            <h2>📈 Analysis Summary</h2>
            <p>Here's your comprehensive market analysis covering stocks, forex, cryptocurrencies, and commodities...</p>
            <p><em>Sample analysis content would appear here based on real-time market data.</em></p>
          </div>
          <div style="text-align: center;">
            <a href="https://chartingpath.com" class="cta-button">View Full Dashboard</a>
          </div>
          <div class="section" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px;"><strong>⚠️ Disclaimer:</strong> This report is for informational purposes only and does not constitute financial advice.</p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ChartingPath. All rights reserved.</p>
          <p><a href="https://chartingpath.com/tools/market-breadth" style="color: #60a5fa;">Manage Preferences</a> | <a href="#" style="color: #60a5fa;">Unsubscribe</a></p>
        </div>
      </body>
    </html>
  `;

  const patternAlertHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .alert-badge { display: inline-block; background: #dc2626; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .content { background: #f9fafb; padding: 30px; }
          .pattern-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 Pattern Alert Detected!</h1>
          <div class="alert-badge">NEW SIGNAL</div>
        </div>
        <div class="content">
          <div class="pattern-details">
            <h2>Pattern: Head and Shoulders</h2>
            <p><strong>Symbol:</strong> EURUSD</p>
            <p><strong>Timeframe:</strong> 1 Hour</p>
            <p><strong>Confidence:</strong> 85%</p>
            <p><strong>Detected At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Alert Details</h3>
            <p>A bearish Head and Shoulders pattern has been detected on EURUSD. This pattern typically signals a potential trend reversal.</p>
            <p><strong>Suggested Action:</strong> Consider taking a short position with appropriate risk management.</p>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px;"><strong>⚠️ Risk Warning:</strong> Trading involves substantial risk. Always use proper risk management and never trade with money you cannot afford to lose.</p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ChartingPath. All rights reserved.</p>
          <p><a href="https://chartingpath.com" style="color: #60a5fa;">Visit Dashboard</a></p>
        </div>
      </body>
    </html>
  `;

  const starterScriptsHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .script-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #10b981; }
          .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to ChartingPath!</h1>
          <p>Your Free Trading Starter Scripts Are Ready</p>
        </div>
        <div class="content">
          <p>Thank you for joining ChartingPath! We're excited to help you on your trading journey.</p>
          
          <div class="script-box">
            <h3>📊 Moving Average Crossover</h3>
            <p>A proven strategy for identifying trend changes using dual moving averages.</p>
          </div>
          
          <div class="script-box">
            <h3>📈 RSI Divergence Detector</h3>
            <p>Spot potential reversals by identifying divergences between price and RSI.</p>
          </div>
          
          <div class="script-box">
            <h3>🎯 Support & Resistance Levels</h3>
            <p>Automatically plot key price levels for better trade entries and exits.</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://chartingpath.com/member/scripts" class="cta-button">Access Your Scripts</a>
          </div>
          
          <div style="background: #dbeafe; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h3>🚀 Next Steps</h3>
            <ul>
              <li>Log in to your member dashboard</li>
              <li>Browse our strategy library</li>
              <li>Start backtesting your ideas</li>
              <li>Join our community for tips and support</li>
            </ul>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ChartingPath. All rights reserved.</p>
          <p><a href="https://chartingpath.com" style="color: #60a5fa;">Visit Website</a></p>
        </div>
      </body>
    </html>
  `;

  const emailTemplates = {
    "market-report": marketReportHTML,
    "pattern-alert": patternAlertHTML,
    "starter-scripts": starterScriptsHTML,
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
          <CardHeader>
            <CardTitle>Email Template Previews</CardTitle>
            <CardDescription>
              Preview the design of all email templates sent by ChartingPath
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="market-report" onValueChange={setSelectedEmail}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="market-report">Market Reports</TabsTrigger>
                <TabsTrigger value="pattern-alert">Pattern Alerts</TabsTrigger>
                <TabsTrigger value="starter-scripts">Starter Scripts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="market-report" className="mt-6">
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={emailTemplates["market-report"]}
                    style={{ width: "100%", height: "800px", border: "none" }}
                    title="Market Report Email Preview"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="pattern-alert" className="mt-6">
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={emailTemplates["pattern-alert"]}
                    style={{ width: "100%", height: "800px", border: "none" }}
                    title="Pattern Alert Email Preview"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="starter-scripts" className="mt-6">
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={emailTemplates["starter-scripts"]}
                    style={{ width: "100%", height: "800px", border: "none" }}
                    title="Starter Scripts Email Preview"
                  />
                </div>
              </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
    </div>
  );
};

export default EmailPreview;
