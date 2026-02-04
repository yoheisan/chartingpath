import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
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

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1>📑 Terms and Conditions</h1>
          <p><strong>Last updated:</strong> February 4, 2026</p>

          <p>These Terms and Conditions ("Terms") govern the use of services provided by Market Leap Partners Inc., registered in Tokyo, Japan ("Company", "we", "us", or "our"). By accessing or using our website, services, or purchasing any subscription plan, you agree to be bound by these Terms.</p>

          <h2>1. Educational Purpose Only</h2>
          <p><strong>1.1</strong> All scripts, indicators, calculators, alerts, tutorials, and materials provided are for educational and informational purposes only.</p>
          <p><strong>1.2</strong> We are not a broker, financial advisor, or investment firm. Nothing on this Site constitutes financial, investment, or trading advice.</p>
          <p><strong>1.3</strong> You are solely responsible for your trading or investment decisions. Past performance does not guarantee future results.</p>

          <h2>2. Eligibility</h2>
          <p><strong>2.1</strong> You must be at least 18 years of age to use this Site.</p>
          <p><strong>2.2</strong> By creating an account or purchasing a plan, you confirm that you meet these requirements.</p>

          <h2>3. Subscription Plans and Payments</h2>
          <p><strong>3.1</strong> Plans offered include:</p>
          <ul>
            <li>Starter – $29/month or $313/year</li>
            <li>Pro – $79/month or $852/year</li>
            <li>Pro+ – $119/month or $1,284/year</li>
            <li>Elite – $199/month or $2,148/year or $999 lifetime</li>
          </ul>
          <p><strong>3.2</strong> Payments are processed via Stripe and PayPal.</p>
          <p><strong>3.3</strong> Monthly plans bill every month on the signup date. Annual plans bill once every 12 months.</p>
          <p><strong>3.4</strong> Annual plans offer a 10% discount compared to monthly billing and are billed once every 12 months on the signup date.</p>
          <p><strong>3.5</strong> The Lifetime plan ($999) grants access for the lifetime of the service. If the service is discontinued, lifetime access will end. This plan is refundable only within one (1) month of purchase, then non-refundable.</p>

          <h2>4. Refunds and Cancellations</h2>
          <p><strong>4.1</strong> Monthly plans: Non-refundable. Cancellation stops future billing, and access continues until the end of the paid month.</p>
          <p><strong>4.2</strong> Annual plans: If canceled before the end of the 12-month term, a prorated refund will be issued on a monthly basis for unused months.</p>
          <p><strong>Example:</strong> If you cancel 4 months into a Starter Annual plan ($313/year), you keep 4 months of access and receive a refund for 8 months = $208.67.</p>
          <p>Refunds are calculated by dividing the annual fee by 12 and multiplying by the unused full months. Partial months are not refundable.</p>
          <p><strong>4.3</strong> Lifetime plan: Refundable only within one (1) month of purchase; non-refundable afterward.</p>

          <h2>5. Use of Scripts and Tools</h2>
          <p><strong>5.1</strong> Scripts, indicators, calculators, and alerts are for personal educational use only.</p>
          <p><strong>5.2</strong> Redistribution, resale, or reverse-engineering of scripts is prohibited.</p>
          <p><strong>5.3</strong> We do not guarantee compatibility with all third-party platforms, brokers, or data feeds.</p>

          <h2>6. Account Responsibilities</h2>
          <p><strong>6.1</strong> You are responsible for maintaining the confidentiality of your account credentials.</p>
          <p><strong>6.2</strong> Sharing or reselling account access is strictly prohibited.</p>
          <p><strong>6.3</strong> Accounts found in violation may be suspended or terminated without refund.</p>

          <h2>7. Intellectual Property</h2>
          <p><strong>7.1</strong> All content on the Site (including text, videos, tutorials, software, and designs) is the property of Market Leap Partners Inc. or its licensors.</p>
          <p><strong>7.2</strong> You are granted a limited, non-exclusive, non-transferable license to access and use the Site for personal educational purposes.</p>

          <h2>8. Limitation of Liability</h2>
          <p><strong>8.1</strong> We make no warranties regarding accuracy, reliability, or completeness of content.</p>
          <p><strong>8.2</strong> To the fullest extent permitted by law, Market Leap Partners Inc. shall not be liable for any damages, direct or indirect, resulting from the use of the Site.</p>

          <h2>9. Termination</h2>
          <p>We reserve the right to suspend or terminate access if a user violates these Terms or engages in abuse.</p>

          <h2>10. Governing Law</h2>
          <p>These Terms shall be governed by and construed under the laws of Japan.</p>

          <h2>11. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Site after changes indicates acceptance of the revised Terms.</p>

          <h2>12. Contact</h2>
          <p>For questions about these Terms, please contact us:</p>
          <p>📧 contact@chartingpath.com</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;