const S = {
  bg: "#04080f", surface: "#080d18", border: "#1a2540",
  cyan: "#00d4ff", text: "#e8edf5", muted: "#6b7a94",
};

export default function TermsPage({ onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <button onClick={() => onNavigate && onNavigate("home")} style={{ background: "transparent", border: `1px solid ${S.border}`, borderRadius: 8, padding: ".45rem .9rem", color: S.muted, fontSize: ".82rem", cursor: "pointer", marginBottom: "2.5rem" }}>
          ← Back to Home
        </button>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-.03em", marginBottom: ".5rem" }}>Terms of Service</h1>
        <p style={{ color: S.muted, fontSize: ".85rem", marginBottom: "3rem" }}>Last updated: May 2025</p>

        {[
          ["1. Acceptance of Terms", "By accessing or using EcomAuto (the \"Service\"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service."],
          ["2. Description of Service", "EcomAuto provides an AI-powered e-commerce automation platform that connects your Facebook Messenger page to an automated sales assistant. The Service includes AI reply automation, product management, order tracking, and analytics tools."],
          ["3. Account Registration", "You must provide accurate and complete information when registering. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."],
          ["4. Subscription and Payment", "EcomAuto offers paid subscription plans billed in Algerian Dinars (DZD) via Baridi Mob / CCP bank transfer. Subscriptions are activated upon manual payment confirmation by our team, typically within 24 hours. Prices are subject to change with 30 days notice."],
          ["5. Trial Period", "New accounts receive a free trial period. At the end of the trial, your account will be deactivated unless you upgrade to a paid plan. We do not charge automatically — payment is always initiated by you."],
          ["6. Acceptable Use", "You agree not to use the Service to send spam, violate Meta's platform policies, distribute harmful content, or engage in any illegal activity. Violation may result in immediate account termination."],
          ["7. Facebook Integration", "You authorize EcomAuto to access your Facebook Page(s) through Meta's API to deliver automated replies. You remain responsible for your page content and compliance with Meta's terms."],
          ["8. Data and Privacy", "We collect and process data as described in our Privacy Policy. You retain ownership of your business data. We do not sell your data to third parties."],
          ["9. Service Availability", "We strive for high availability but do not guarantee uninterrupted service. Scheduled maintenance and unforeseen outages may occur."],
          ["10. Limitation of Liability", "EcomAuto is not liable for indirect, incidental, or consequential damages arising from use of the Service, including lost revenue or missed messages."],
          ["11. Termination", "Either party may terminate the account at any time. Upon termination, your data will be retained for 30 days before deletion unless you request earlier removal."],
          ["12. Governing Law", "These terms are governed by the laws of Algeria. Disputes shall be resolved through good-faith negotiation, or failing that, in the courts of Algiers."],
          ["13. Contact", "For questions about these terms, contact us at: support@ecomauto.app"],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: "1.8rem", paddingBottom: "1.8rem", borderBottom: `1px solid ${S.border}` }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", color: S.cyan, marginBottom: ".6rem" }}>{title}</h2>
            <p style={{ fontSize: ".9rem", color: S.muted, lineHeight: 1.75, fontWeight: 300 }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
