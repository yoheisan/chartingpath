import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1>🔒 Privacy Policy</h1>
          <p><strong>Last updated:</strong> August 23, 2025</p>

          <p>Market Leap Partners, Inc., registered in Tokyo, Japan ("Company", "we", "us", or "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information.</p>

          <h2>1. Information We Collect</h2>
          <p><strong>1.1</strong> We collect the following data:</p>
          <ul>
            <li>Email address (for accounts, subscriptions, alerts, and communication).</li>
            <li>Payment details (processed securely by Stripe and PayPal; we do not store credit card numbers).</li>
            <li>Anonymous usage analytics through Google Analytics.</li>
          </ul>

          <h2>2. Use of Information</h2>
          <p>We use collected data to:</p>
          <ul>
            <li>Provide subscription services.</li>
            <li>Send tutorials, alerts, and updates.</li>
            <li>Improve our website and offerings via analytics.</li>
            <li>Provide customer support.</li>
          </ul>

          <h2>3. Email Communication</h2>
          <p><strong>3.1</strong> We may use third-party email services (e.g., Mailchimp, SendGrid, or similar) to send tutorials, alerts, and newsletters.</p>
          <p><strong>3.2</strong> You may unsubscribe at any time using the link in our emails.</p>

          <h2>4. Community Platforms</h2>
          <p>We may provide access to Discord or similar platforms for community engagement. Messages shared on third-party platforms are subject to their privacy policies.</p>

          <h2>5. Data Storage</h2>
          <p><strong>5.1</strong> All user accounts and subscription data are stored on Japan-based servers.</p>
          <p><strong>5.2</strong> We take reasonable measures to secure your data, but cannot guarantee absolute security.</p>

          <h2>6. Cookies and Tracking</h2>
          <p>We do not use cookies for marketing or retargeting. Cookies may be used only for essential login sessions.</p>

          <h2>7. Data Retention</h2>
          <p>We retain user data indefinitely unless deletion is requested.</p>

          <h2>8. User Rights</h2>
          <p>Users may request account deletion by contacting contact@chartingpath.com. Upon verification, data will be permanently removed.</p>

          <h2>9. Sharing of Information</h2>
          <p>We do not sell or rent user data. Data is shared only with third-party services required for operation (Stripe, PayPal, Google Analytics, email providers, Discord).</p>

          <h2>10. Governing Law</h2>
          <p>This Privacy Policy is governed by the laws of Japan.</p>

          <h2>11. Updates to Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page.</p>

          <h2>12. Contact</h2>
          <p>For privacy concerns, please contact us:</p>
          <p>📧 contact@chartingpath.com</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;