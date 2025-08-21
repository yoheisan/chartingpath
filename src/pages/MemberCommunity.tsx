import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Crown, MessageSquare, Users, ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import MemberNavigation from "@/components/MemberNavigation";

const MemberCommunity = () => {
  const handleDiscordJoin = (channelType: string) => {
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'discord_join', {
        event_category: 'Community',
        event_label: channelType
      });
    }
    // In a real implementation, this would open Discord
    window.open('https://discord.gg/example', '_blank');
  };

  const communityFeatures = [
    {
      icon: MessageSquare,
      title: "Strategy Discussions",
      description: "Share and discuss trading strategies with fellow members",
      premium: false
    },
    {
      icon: Users,
      title: "Live Trading Sessions", 
      description: "Join live trading sessions and market analysis calls",
      premium: true
    },
    {
      icon: Crown,
      title: "Premium Alerts",
      description: "Get exclusive trading alerts and market opportunities",
      premium: true
    },
    {
      icon: Shield,
      title: "Priority Support",
      description: "Get faster responses from our support team",
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Member Navigation */}
        <MemberNavigation />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Community Access
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with traders worldwide. Access exclusive Discord channels based on your membership tier.
          </p>
        </div>

        {/* Discord Access Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Free Discord */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Free Community</CardTitle>
                  <CardDescription>Open to all ChartingPath users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• General trading discussions</li>
                <li>• Pattern recognition help</li>
                <li>• Basic script support</li>
                <li>• Community challenges</li>
                <li>• Market news updates</li>
              </ul>
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => handleDiscordJoin('free')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Free Discord
              </Button>
            </CardContent>
          </Card>

          {/* Premium Discord */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Premium Community
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                      Members Only
                    </Badge>
                  </CardTitle>
                  <CardDescription>Exclusive access for premium subscribers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• All free community features</li>
                <li>• Premium trading signals</li>
                <li>• Live market analysis sessions</li>
                <li>• 1-on-1 strategy consultations</li>
                <li>• Early access to new content</li>
                <li>• Direct access to instructors</li>
              </ul>
              
              <Button 
                className="w-full"
                onClick={() => handleDiscordJoin('premium')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Premium Discord
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Community Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Community Features</CardTitle>
            <CardDescription>
              What you can expect from our trading community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {communityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
                    <div className={`p-2 rounded-lg ${feature.premium ? 'bg-primary/10' : 'bg-secondary/50'}`}>
                      <Icon className={`h-4 w-4 ${feature.premium ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{feature.title}</h4>
                        {feature.premium && (
                          <Badge variant="secondary" className="text-xs">Premium</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Discord Setup Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Getting Your Premium Discord Role</CardTitle>
            <CardDescription>
              Follow these steps to access your premium Discord channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Join Our Discord Server</h4>
                  <p className="text-sm text-muted-foreground">Click the "Join Premium Discord" button above to join our server.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg border">
                <div className="flex-shrink-0 w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Verify Your Membership</h4>
                  <p className="text-sm text-muted-foreground">Use the !verify command with your membership email in the #verification channel.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-accent/5 rounded-lg border border-accent/20">
                <div className="flex-shrink-0 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Access Premium Channels</h4>
                  <p className="text-sm text-muted-foreground">Once verified, you'll automatically gain access to all premium channels and features.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
            <CardDescription>
              Please follow these guidelines to maintain a positive trading environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Be respectful and professional in all interactions</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>No financial advice - share educational content and personal opinions only</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>No spam, excessive self-promotion, or affiliate links without permission</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Keep discussions relevant to trading, chart patterns, and automated strategies</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Help fellow traders - share knowledge and support the community</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Need help?</strong> Contact our community moderators or use the #support channel in Discord for assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberCommunity;