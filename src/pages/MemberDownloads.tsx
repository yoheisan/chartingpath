import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Package, ArrowLeft, Star } from "lucide-react";
import { Link } from "react-router-dom";

const MemberDownloads = () => {
  const downloads = [
    {
      id: 1,
      name: "Trading Script Starter Pack",
      description: "Complete collection of 5 beginner-friendly trading scripts with setup guides",
      type: "Script Bundle",
      size: "2.4 MB",
      downloads: 1834,
      featured: true,
      files: [
        "Golden Cross Strategy (Pine Script)",
        "RSI Overbought/Oversold (Python)",
        "Moving Average Envelope (MQL5)",
        "Setup Guide (PDF)",
        "Risk Management Calculator (Excel)"
      ]
    },
    {
      id: 2,
      name: "Pattern Recognition Templates",
      description: "Visual templates for 20+ candlestick patterns with entry/exit rules",
      type: "Templates",
      size: "5.1 MB",
      downloads: 967,
      featured: false,
      files: [
        "Candlestick Pattern Guide (PDF)",
        "TradingView Template Files",
        "Pattern Cheat Sheet (PDF)",
        "Entry/Exit Rules Document"
      ]
    },
    {
      id: 3,
      name: "Risk Management Toolkit",
      description: "Professional risk management calculators and position sizing tools",
      type: "Tools",
      size: "1.8 MB",
      downloads: 1456,
      featured: true,
      files: [
        "Position Size Calculator (Excel)",
        "Risk/Reward Calculator (Excel)",
        "Portfolio Tracker (Excel)",
        "Risk Management Guide (PDF)"
      ]
    },
    {
      id: 4,
      name: "Market Analysis Workbook",
      description: "Comprehensive workbook for technical and fundamental analysis",
      type: "Educational",
      size: "12.3 MB",
      downloads: 743,
      featured: false,
      files: [
        "Technical Analysis Workbook (PDF)",
        "Market Structure Guide (PDF)",
        "Analysis Templates (Excel)",
        "Economic Calendar Template"
      ]
    }
  ];

  const handleDownload = (downloadId: number, downloadName: string) => {
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'asset_downloaded', {
        event_category: 'Members',
        event_label: downloadName,
        value: downloadId
      });
    }
    // Simulate download
    console.log(`Downloading: ${downloadName}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Downloads & Assets
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access your exclusive collection of trading assets, starter packs, and educational resources.
          </p>
        </div>

        {/* Stats */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {downloads.length}
                </div>
                <div className="text-sm text-muted-foreground">Available Packs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {downloads.reduce((sum, d) => sum + d.downloads, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {(downloads.reduce((sum, d) => sum + parseFloat(d.size), 0)).toFixed(1)} MB
                </div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Downloads */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Featured Downloads</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {downloads.filter(d => d.featured).map((download) => (
              <Card key={download.id} className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{download.name}</CardTitle>
                        <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                      <Badge variant="outline">{download.type}</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-base">{download.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Includes:</h4>
                    <ul className="space-y-1">
                      {download.files.map((file, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{download.downloads} downloads</span>
                    <span>{download.size}</span>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => handleDownload(download.id, download.name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Pack
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Downloads */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">All Downloads</h2>
          <div className="grid gap-4">
            {downloads.map((download) => (
              <Card key={download.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{download.name}</h3>
                        <Badge variant="secondary">{download.type}</Badge>
                        {download.featured && (
                          <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{download.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{download.downloads} downloads</span>
                        <span>•</span>
                        <span>{download.size}</span>
                        <span>•</span>
                        <span>{download.files.length} files</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline"
                        onClick={() => handleDownload(download.id, download.name)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Access Notice */}
        <Card className="mt-8 bg-secondary/50">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-foreground mb-2">Premium Member Benefits</h3>
            <p className="text-muted-foreground mb-4">
              As a premium member, you have unlimited access to all downloads, starter packs, and exclusive resources. 
              New assets are added monthly based on member requests and market trends.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" asChild>
                <Link to="/pricing">View All Plans</Link>
              </Button>
              <Button variant="ghost" size="sm">
                Request New Asset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberDownloads;