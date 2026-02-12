import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
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
          <h1>🔒 Privacy Policy</h1>
          <p><strong>Last updated:</strong> February 12, 2026</p>

          <p>Market Leap Partners, Inc., registered in Tokyo, Japan ("Company", "we", "us", or "our") respects your privacy. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our website, applications, and services (collectively, the "Services").</p>

          <h2>1. Information We Collect</h2>
          <p><strong>1.1 Account Information:</strong> Email address, display name, and authentication credentials when you create an account.</p>
          <p><strong>1.2 Payment Information:</strong> Payment details are processed securely by Stripe. We do not store full credit card numbers, CVVs, or bank account details on our servers. We may retain the last four digits of your card and billing address for record-keeping.</p>
          <p><strong>1.3 Usage Data:</strong> We collect anonymous usage analytics (page views, feature usage, session duration) to improve our Services. This includes data logged via our internal analytics system and may include Google Analytics.</p>
          <p><strong>1.4 Technical Data:</strong> IP address (anonymized where possible), browser type, device type, operating system, and referring URLs collected automatically when you access the Services.</p>
          <p><strong>1.5 User-Generated Content:</strong> Backtest configurations, alert settings, strategy parameters, community messages, and other content you create within the Services.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use collected data to:</p>
          <ul>
            <li>Provide, maintain, and improve our Services, including subscription management and feature delivery.</li>
            <li>Send transactional emails (account confirmations, alerts, subscription receipts).</li>
            <li>Send educational content, product updates, and newsletters (with your consent; you may opt out at any time).</li>
            <li>Analyze usage patterns to improve user experience, fix bugs, and develop new features.</li>
            <li>Prevent fraud, abuse, and enforce our Terms and Conditions.</li>
            <li>Provide customer support.</li>
          </ul>

          <h2>3. Legal Basis for Processing (GDPR)</h2>
          <p>If you are located in the European Economic Area (EEA), UK, or other jurisdictions with similar data protection laws, we process your data based on:</p>
          <ul>
            <li><strong>Contractual necessity:</strong> To provide the Services you subscribed to.</li>
            <li><strong>Legitimate interests:</strong> To improve our Services, prevent fraud, and conduct analytics (balanced against your rights).</li>
            <li><strong>Consent:</strong> For marketing emails and optional cookies. You may withdraw consent at any time.</li>
            <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations.</li>
          </ul>

          <h2>4. Email Communication</h2>
          <p><strong>4.1</strong> We use third-party email services (e.g., SendGrid or similar) to deliver transactional and marketing emails.</p>
          <p><strong>4.2</strong> You may unsubscribe from marketing emails at any time using the link in our emails. Transactional emails (e.g., billing receipts, security alerts) will continue as long as your account is active.</p>

          <h2>5. Community Platforms</h2>
          <p>We may provide access to Discord or similar platforms for community engagement. Any information you share on third-party platforms is subject to their respective privacy policies. We are not responsible for data practices of third-party platforms.</p>

          <h2>6. Cookies and Tracking</h2>
          <p><strong>6.1</strong> We use only essential cookies required for authentication and session management. We do not use cookies for advertising, retargeting, or third-party tracking.</p>
          <p><strong>6.2</strong> Our internal analytics system collects anonymized usage events to help us understand how users interact with the Services. This data is not shared with third parties for advertising purposes.</p>

          <h2>7. Data Sharing and Third Parties</h2>
          <p><strong>7.1</strong> We do not sell, rent, or trade your personal data to third parties.</p>
          <p><strong>7.2</strong> We share data only with the following categories of service providers, solely to operate the Services:</p>
          <ul>
            <li><strong>Payment processing:</strong> Stripe (PCI-DSS compliant).</li>
            <li><strong>Hosting and infrastructure:</strong> Cloud hosting providers with data stored primarily on servers in the United States and/or Japan.</li>
            <li><strong>Email delivery:</strong> Transactional and marketing email providers.</li>
            <li><strong>Analytics:</strong> Internal analytics and, optionally, Google Analytics (anonymized).</li>
            <li><strong>Community:</strong> Discord (if you choose to join).</li>
          </ul>
          <p><strong>7.3</strong> We may disclose data if required by law, court order, or governmental authority, or to protect the rights, safety, or property of the Company or others.</p>

          <h2>8. International Data Transfers</h2>
          <p>Your data may be transferred to and processed in countries outside your jurisdiction, including Japan and the United States. Where required by law, we ensure appropriate safeguards (such as standard contractual clauses) are in place to protect your data.</p>

          <h2>9. Data Retention</h2>
          <p><strong>9.1</strong> We retain your account data for as long as your account is active or as needed to provide the Services.</p>
          <p><strong>9.2</strong> After account deletion, we may retain certain data for up to 90 days for backup and fraud prevention purposes, after which it will be permanently deleted.</p>
          <p><strong>9.3</strong> Anonymized, aggregated data (which cannot identify you) may be retained indefinitely for analytics and product improvement.</p>

          <h2>10. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your account and personal data.</li>
            <li><strong>Data Portability:</strong> Request your data in a structured, machine-readable format.</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests.</li>
            <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances.</li>
          </ul>
          <p>To exercise any of these rights, contact us at <strong>contact@chartingpath.com</strong>. We will respond within 30 days (or as required by applicable law). We may ask for identity verification before processing your request.</p>

          <h2>11. Data Security</h2>
          <p>We implement industry-standard security measures including encryption in transit (TLS/SSL), row-level security on database access, and secure authentication. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

          <h2>12. Children's Privacy</h2>
          <p>Our Services are not directed to individuals under 18 years of age. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child, we will delete it promptly.</p>

          <h2>13. Governing Law</h2>
          <p>This Privacy Policy is governed by the laws of Japan, without regard to conflict of law principles.</p>

          <h2>14. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on the Services at least 14 days before taking effect. Continued use of the Services after the effective date constitutes acceptance of the updated policy.</p>

          <h2>15. Contact</h2>
          <p>For privacy concerns, data requests, or questions about this policy, please contact us:</p>
          <p>📧 <strong>contact@chartingpath.com</strong></p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;