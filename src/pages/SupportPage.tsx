import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactSupportDialog } from '@/components/support/ContactSupportDialog';
import { Mail, MessageSquare, Clock, Shield } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const SupportPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">
            {t('support.pageTitle', 'How Can We Help?')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('support.pageSubtitle', 'Get in touch with our team. We typically respond within 24 hours.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">24h Response</p>
              <p className="text-xs text-muted-foreground">Typical reply time</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Mail className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Email Support</p>
              <p className="text-xs text-muted-foreground">contact@chartingpath.com</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Secure</p>
              <p className="text-xs text-muted-foreground">Encrypted & tracked</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              {t('support.submitRequest', 'Submit a Request')}
            </CardTitle>
            <CardDescription>
              {t('support.submitDescription', 'Tell us about your issue, feedback, or feature request. We\'ll respond directly to your email.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactSupportDialog
              trigger={
                <button className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  {t('support.openForm', 'Open Support Form')}
                </button>
              }
              source="support_page"
            />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SupportPage;
