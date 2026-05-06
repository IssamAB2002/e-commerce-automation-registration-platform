const S = {
  bg: "#04080f", surface: "#080d18", border: "#1a2540",
  cyan: "#00d4ff", text: "#e8edf5", muted: "#6b7a94",
};

export default function PrivacyPage({ onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <button onClick={() => onNavigate && onNavigate("home")} style={{ background: "transparent", border: `1px solid ${S.border}`, borderRadius: 8, padding: ".45rem .9rem", color: S.muted, fontSize: ".82rem", cursor: "pointer", marginBottom: "2.5rem" }}>
          ← Back to Home
        </button>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-.03em", marginBottom: ".5rem" }}>Privacy Policy</h1>
        <p style={{ color: S.muted, fontSize: ".85rem", marginBottom: "3rem" }}>Last updated: May 2025</p>

        {[
          ["1. Information We Collect", "We collect information you provide directly (name, email, company name, Facebook page details) and information generated through your use of the Service (messages handled, orders, activity logs, subscription data). We do not store the full content of customer messages — only metadata such as sender ID, message count, and AI-generated summaries."],
          ["2. How We Use Your Information", "We use your information to: provide and improve the Service, process payments, send activation codes, generate AI-powered analytics, and communicate important updates about your account. We do not use your data to train third-party AI models."],
          ["3. Facebook Data", "When you connect a Facebook Page, we store your page access token securely to deliver automated replies. We access only the permissions you explicitly grant. Revoking access in Facebook's settings will disconnect your page from the Service."],
          ["4. AI Processing", "Conversation summaries and sentiment analysis are processed using Google Gemini. Message content is sent to Gemini solely to generate anonymized summaries. No identifying customer information is retained by the AI provider beyond the processing window."],
          ["5. Data Storage", "Your data is stored on servers hosted by Supabase (database) and Railway (application). All data at rest is encrypted. Backups are retained for 7 days."],
          ["6. Data Sharing", "We do not sell your personal data. We share data only with: (a) service providers necessary to operate the platform (Supabase, Railway, Google Gemini); (b) when required by law or to protect legal rights."],
          ["7. Data Retention", "Account data is retained while your account is active. Upon termination, data is deleted within 30 days unless a longer retention period is required by law."],
          ["8. Your Rights", "You have the right to: access your data, correct inaccuracies, request deletion, and export your data. Contact us at privacy@ecomauto.app to exercise these rights."],
          ["9. Cookies", "We use essential cookies for authentication (JWT tokens stored in localStorage). No tracking or advertising cookies are used. See our Cookie Policy for details."],
          ["10. Security", "We use industry-standard security practices including HTTPS encryption, JWT authentication with short-lived tokens, and role-based database access controls."],
          ["11. Children", "The Service is not directed at children under 18. We do not knowingly collect data from minors."],
          ["12. Changes to This Policy", "We may update this policy. Significant changes will be notified by email or prominent notice within the dashboard."],
          ["13. Contact", "For privacy-related questions: privacy@ecomauto.app"],
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
