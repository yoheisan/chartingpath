import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Heart, Globe, Users, TrendingUp, Shield, BookOpen, Zap } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About ChartingPath
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Empowering traders worldwide with professional tools, education, and technology 
            to achieve consistent success in financial markets.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent">
                <Target className="h-6 w-6 text-white" />
              </div>
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              To democratize access to professional-grade trading tools and education, enabling traders 
              of all levels to make informed decisions, manage risk effectively, and achieve their 
              financial goals through systematic and data-driven approaches.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe that with the right tools, knowledge, and support, anyone can become a successful 
              trader. Our mission is to break down the barriers to entry and provide world-class resources 
              that were once available only to institutional traders.
            </p>
          </CardContent>
        </Card>

        {/* Vision Section */}
        <Card className="mb-8 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 rounded-xl bg-gradient-to-r from-accent to-primary">
                <Eye className="h-6 w-6 text-white" />
              </div>
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              To become the world's most trusted platform for retail traders, recognized for innovation, 
              education excellence, and unwavering commitment to our users' success across all global markets.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We envision a future where every trader has access to institutional-quality tools and knowledge, 
              creating a more level playing field in financial markets and fostering a global community of 
              informed, disciplined, and successful traders.
            </p>
          </CardContent>
        </Card>

        {/* Values Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              Our Core Values
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we do and shape our service to traders worldwide
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Value 1: Excellence */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We strive for excellence in every tool, feature, and piece of content we create. 
                  Our commitment to quality ensures you receive professional-grade resources that 
                  deliver real value.
                </p>
              </CardContent>
            </Card>

            {/* Value 2: Education */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-accent/10 w-fit mb-2">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">Education First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Knowledge is power in trading. We prioritize comprehensive education, providing 
                  clear explanations, practical examples, and continuous learning opportunities to 
                  help you grow as a trader.
                </p>
              </CardContent>
            </Card>

            {/* Value 3: Transparency */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We believe in complete transparency. From our pricing to our methodologies, we're 
                  upfront about everything. No hidden fees, no false promises – just honest, 
                  straightforward service.
                </p>
              </CardContent>
            </Card>

            {/* Value 4: Innovation */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-accent/10 w-fit mb-2">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Markets evolve, and so do we. We continuously innovate, incorporating the latest 
                  technology and trading methodologies to keep you at the cutting edge of market 
                  opportunities.
                </p>
              </CardContent>
            </Card>

            {/* Value 5: Community */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Trading doesn't have to be lonely. We foster a supportive community where traders 
                  can learn from each other, share insights, and grow together in their trading journey.
                </p>
              </CardContent>
            </Card>

            {/* Value 6: Global Reach */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-accent/10 w-fit mb-2">
                  <Globe className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">Global Accessibility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We serve traders worldwide, regardless of location or experience level. Our platform 
                  is designed to be accessible, inclusive, and valuable to traders across all markets 
                  and time zones.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Commitment Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Our Commitment to You</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
              Whether you're taking your first steps in trading or you're an experienced professional, 
              ChartingPath is committed to providing you with the tools, knowledge, and support you need 
              to succeed. We're not just a platform – we're your partner in the pursuit of trading excellence.
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Risk Management Focus</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Continuous Education</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>Global Market Coverage</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Educational Purpose:</strong> ChartingPath provides tools and educational content for informational 
            purposes only. We do not provide investment advice, and all trading involves risk.
          </p>
          <p>
            Past performance does not guarantee future results. Always conduct your own research and consider 
            your risk tolerance before making any trading decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;