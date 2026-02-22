import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Heart, Globe, Users, TrendingUp, Shield, BookOpen, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('about.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent">
                <Target className="h-6 w-6 text-white" />
              </div>
              {t('about.missionTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('about.missionP1')}
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('about.missionP2')}
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
              {t('about.visionTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('about.visionP1')}
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('about.visionP2')}
            </p>
          </CardContent>
        </Card>

        {/* Values Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              {t('about.valuesTitle')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('about.valuesSubtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{t('about.excellence')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('about.excellenceDesc')}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-accent/10 w-fit mb-2">
                  <BookOpen className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{t('about.educationFirst')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('about.educationFirstDesc')}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{t('about.transparency')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('about.transparencyDesc')}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-accent/10 w-fit mb-2">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{t('about.innovation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('about.innovationDesc')}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{t('about.community')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('about.communityDesc')}</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="p-3 rounded-xl bg-accent/10 w-fit mb-2">
                  <Globe className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{t('about.globalAccessibility')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('about.globalAccessibilityDesc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Commitment Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">{t('about.commitmentTitle')}</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
              {t('about.commitmentDesc')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>{t('about.riskManagement')}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>{t('about.continuousEducation')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>{t('about.support247')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>{t('about.globalCoverage')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>{t('about.disclaimerTitle')}</strong> {t('about.disclaimerP1')}
          </p>
          <p>{t('about.disclaimerP2')}</p>
        </div>
      </div>
    </div>
  );
};

export default About;
