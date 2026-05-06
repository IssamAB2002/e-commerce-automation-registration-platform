const S = {
  bg: "#04080f", surface: "#080d18", border: "#1a2540",
  cyan: "#00d4ff", text: "#e8edf5", muted: "#6b7a94",
};

export default function CookiePage({ onNavigate }) {
  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
        <button onClick={() => onNavigate && onNavigate("home")} style={{ background: "transparent", border: `1px solid ${S.border}`, borderRadius: 8, padding: ".45rem .9rem", color: S.muted, fontSize: ".82rem", cursor: "pointer", marginBottom: "2.5rem" }}>
          ← Back to Home
        </button>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2.2rem", letterSpacing: "-.03em", marginBottom: ".5rem" }}>Cookie Policy</h1>
        <p style={{ color: S.muted, fontSize: ".85rem", marginBottom: "3rem" }}>Last updated: May 2025</p>

        {[
          ["What Are Cookies?", "Cookies are small text files stored on your device by your browser when you visit a website. EcomAuto uses browser localStorage (a similar mechanism) to store authentication tokens."],
          ["How We Use Storage", "We store two items in your browser's localStorage:\n• access_token — a short-lived JWT (1 hour) that authenticates your API requests.\n• refresh_token — a longer-lived token (30 days) used to obtain new access tokens without requiring re-login.\nNo tracking cookies, analytics cookies, or advertising cookies are used."],
          ["Essential Storage Only", "The tokens stored are strictly necessary for the Service to function. Without them, you would need to log in on every page load. We do not use third-party tracking cookies or share any browser storage data with advertisers."],
          ["Third-Party Services", "EcomAuto embeds no third-party analytics scripts (no Google Analytics, no Facebook Pixel, no Hotjar). The only external resource loaded is ParticleJS for background animations, which sets no cookies."],
          ["Managing Your Storage", "You can clear your browser's localStorage at any time through your browser settings. This will log you out of EcomAuto. On browsers that support it, you can also use Private/Incognito mode to prevent any persistent storage."],
          ["Facebook Login", "When you use \"Login with Facebook\", Meta may set its own cookies on facebook.com for their authentication flow. These are governed by Meta's Cookie Policy, not ours. EcomAuto does not read or write Meta's cookies."],
          ["Changes", "If we ever introduce cookies beyond the essential authentication tokens described above, we will update this policy and notify you within the dashboard."],
          ["Contact", "Questions about our use of cookies: privacy@ecomauto.app"],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: "1.8rem", paddingBottom: "1.8rem", borderBottom: `1px solid ${S.border}` }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", color: S.cyan, marginBottom: ".6rem" }}>{title}</h2>
            <p style={{ fontSize: ".9rem", color: S.muted, lineHeight: 1.75, fontWeight: 300, whiteSpace: "pre-line" }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
