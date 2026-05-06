import { useEffect, useMemo, useState } from "react";
import ParticleBackground from "../components/ParticleBackground.jsx";
import { hrefForPage, navigateTo } from "../utils/navigation.js";
import { isAuthenticated } from "../api/client.js";

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2 7l3.5 3.5L12 3.5"
        stroke="#00d4ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6.5 5.5L9.5 8L6.5 10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepIcon1() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M11 2a9 9 0 100 18A9 9 0 0011 2z"
        stroke="#00d4ff"
        strokeWidth="1.5"
      />
      <path
        d="M11 7v4l3 3"
        stroke="#00d4ff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StepIcon2() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="2"
        stroke="#ff6b2b"
        strokeWidth="1.5"
      />
      <rect
        x="12"
        y="3"
        width="7"
        height="7"
        rx="2"
        stroke="#ff6b2b"
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="12"
        width="7"
        height="7"
        rx="2"
        stroke="#ff6b2b"
        strokeWidth="1.5"
      />
      <path
        d="M15.5 12v7M12 15.5h7"
        stroke="#ff6b2b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StepIcon3() {
  return (
    <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0014 0"
        stroke="#9b64ff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 4l3 3-3 3"
        stroke="#9b64ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 8h7"
        stroke="#9b64ff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="17"
        cy="15"
        r="2"
        fill="rgba(155,100,255,0.15)"
        stroke="#9b64ff"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function FlowIconRegistration() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1.5" fill="#00d4ff" />
      <rect
        x="9"
        y="2"
        width="5"
        height="5"
        rx="1.5"
        fill="#00d4ff"
        opacity=".4"
      />
      <rect
        x="2"
        y="9"
        width="5"
        height="5"
        rx="1.5"
        fill="#00d4ff"
        opacity=".4"
      />
      <rect
        x="9"
        y="9"
        width="5"
        height="5"
        rx="1.5"
        fill="#00d4ff"
        opacity=".7"
      />
    </svg>
  );
}

function FlowIconWorkflow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 8C2 4.69 4.69 2 8 2s6 2.69 6 6-2.69 6-6 6-6-2.69-6-6z"
        stroke="#ff6b2b"
        strokeWidth="1.4"
      />
      <path
        d="M5.5 8h5M8 5.5v5"
        stroke="#ff6b2b"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FlowIconMeta() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 13L6 7l3 3 3-5 1 8"
        stroke="#62bf62"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureIconClock() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10a6 6 0 1012 0A6 6 0 004 10z"
        stroke="#00d4ff"
        strokeWidth="1.4"
      />
      <path
        d="M10 7v3l2 2"
        stroke="#00d4ff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeatureIconChart() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 17l4-4 4 3 4-7 4 8"
        stroke="#ff6b2b"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureIconMonitor() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4h12v9H4z" rx="1" stroke="#9b64ff" strokeWidth="1.4" />
      <path
        d="M8 17h4M10 13v4"
        stroke="#9b64ff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeatureIconPortal() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="14"
        height="10"
        rx="2"
        stroke="#00d4ff"
        strokeWidth="1.4"
      />
      <path d="M3 8h14" stroke="#00d4ff" strokeWidth="1.4" />
      <circle cx="7" cy="12" r="1" fill="#00d4ff" />
      <circle cx="10" cy="12" r="1" fill="#00d4ff" />
    </svg>
  );
}

function FeatureIconScale() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3v14M3 10h14"
        stroke="#62bf62"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="7" stroke="#62bf62" strokeWidth="1.4" />
    </svg>
  );
}

export default function HomePage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [isLoggedIn] = useState(isAuthenticated);

  const marqueeItems = useMemo(
    () => [
      "Auto Group Assignment",
      "Load Balancing",
      "Real-Time Notifications",
      "Meta App Distribution",
      "n8n Integration",
      "AI Message Automation",
      "Client Dashboard",
    ],
    [],
  );

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        }
      },
      { threshold: 0.12 },
    );

    const els = document.querySelectorAll(".scroll-reveal");
    for (const el of els) obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const steps = [
    {
      num: "01",
      iconClass: "c1",
      icon: <StepIcon1 />,
      title: "Client Registers",
      body: `Store owners sign up with their business info and Meta credentials. Our system validates and queues them instantly.`,
    },
    {
      num: "02",
      iconClass: "c2",
      icon: <StepIcon2 />,
      title: "Auto Group Placement",
      body: `The platform auto-assigns each client to a workflow group of 15 clients, balancing load across n8n workflows and Meta Apps.`,
    },
    {
      num: "03",
      iconClass: "c3",
      icon: <StepIcon3 />,
      title: "Automation Runs",
      body: `AI-powered messaging flows activate automatically. Clients receive smart notifications. You manage everything from one dashboard.`,
    },
  ];

  const groups = [
    {
      key: "g1",
      name: "Group Alpha",
      nameColor: "var(--cyan)",
      cap: "n8n Workflow #1 · Meta App A",
      badge: "12 / 15",
      badgeClass: "nb-active",
      fillClass: "gf1",
      clients: 12,
    },
    {
      key: "g2",
      name: "Group Beta",
      nameColor: "var(--orange)",
      cap: "n8n Workflow #2 · Meta App B",
      badge: "9 / 15",
      badgeClass: "nb-pending",
      fillClass: "gf2",
      clients: 9,
    },
    {
      key: "g3",
      name: "Group Gamma",
      nameColor: "#9b64ff",
      cap: "n8n Workflow #3 · Meta App C",
      badge: "6 / 15",
      badgeStyle: { background: "rgba(155,100,255,0.1)", color: "#9b64ff" },
      fillClass: "gf3",
      clients: 6,
    },
  ];

  const features = [
    {
      title: "Instant Group Assignment",
      body: `Every registered client is automatically placed into the least-loaded group. Zero manual configuration needed.`,
      icon: <FeatureIconClock />,
      iconClass: "ic-cyan",
    },
    {
      title: "Performance Dashboard",
      body: `Live metrics per group — message delivery rate, workflow health, Meta App quota usage, and client activity.`,
      icon: <FeatureIconChart />,
      iconClass: "ic-orange",
    },
    {
      title: "Push Notifications",
      body: `Broadcast system updates, maintenance windows, or feature announcements directly to client dashboards`,
      icon: <FeatureIconMonitor />,
      iconClass: "ic-purple",
    },
    {
      title: "Client Portal",
      body: `Each client gets a branded portal showing their group assignment, automation status, message logs, and next billing cycle. They stay informed without ever reaching your inbox.`,
      icon: <FeatureIconPortal />,
      iconClass: "ic-cyan",
      wide: true,
    },
    {
      title: "Auto-Scale Groups",
      body: `When a group fills up, the system automatically provisions a new workflow + Meta App pairing. Infinitely scalable.`,
      icon: <FeatureIconScale />,
      iconClass: "ic-green",
    },
  ];

  return (
    <>
      <ParticleBackground />

      <nav className={navScrolled ? "nav-scrolled" : undefined}>
        <div className="wrap nav-inner">
          <a href="#" className="logo" aria-label="EcomAuto home">
            <div className="logo-icon" aria-hidden="true">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <rect
                  width="32"
                  height="32"
                  rx="8"
                  fill="rgba(0,212,255,0.08)"
                />
                <path
                  d="M8 16L14 10L20 16L26 10"
                  stroke="#00d4ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 22L14 16L20 22L26 16"
                  stroke="#ff6b2b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="16" r="2.5" fill="#00d4ff" />
              </svg>
            </div>
            <span className="logo-text">
              Ecom<span>Auto</span>
            </span>
          </a>

          <ul className="nav-links">
            <li>
              <a href="#how">How It Works</a>
            </li>
            <li>
              <a href="#groups">Groups</a>
            </li>
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a
                href={hrefForPage("pricing")}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("pricing");
                }}>
                Pricing
              </a>
            </li>
          </ul>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {isLoggedIn ? (
              <a
                href={hrefForPage("dashboard")}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("dashboard");
                }}
                className="nav-cta">
                Dashboard →
              </a>
            ) : (
              <a
                href={hrefForPage("signup")}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("signup");
                }}
                className="nav-cta">
                Get Started →
              </a>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-left">
              <div className="hero-badge">
                <span className="badge-dot" />
                <span>AI-Powered E-Commerce Automation</span>
              </div>
              <h1 className="hero-title">
                <span>Scale Your</span>
                <br />
                <span className="line2">Messaging</span>
                <br />
                <span className="line3">Automatically.</span>
              </h1>
              <p className="hero-desc">
                Register your clients on our intelligent platform — we
                auto-assign them to optimized workflow groups, distribute load
                across Meta Apps, and keep everyone notified in real time.
              </p>
              <div className="hero-actions">
                <a
                  href={hrefForPage("signup")}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo("signup");
                  }}
                  className="btn-primary">
                  Register Your Store
                </a>
                <a href="#how" className="btn-ghost">
                  <PlayIcon />
                  See how it works
                </a>
              </div>
            </div>

            <div className="hero-visual">
              <div className="flow-card">
                <div className="flow-title">Live Automation Flow</div>
                <div className="flow-nodes">
                  <div className="flow-node active">
                    <div className="node-icon c">
                      <FlowIconRegistration />
                    </div>
                    <div className="node-info">
                      <div className="node-label">Client Registration</div>
                      <div className="node-sub">
                        Auto-assign to workflow group
                      </div>
                    </div>
                    <span className="node-badge nb-active">Live</span>
                  </div>
                  <div className="connector" />
                  <div className="flow-node">
                    <div className="node-icon o">
                      <FlowIconWorkflow />
                    </div>
                    <div className="node-info">
                      <div className="node-label">n8n Workflow</div>
                      <div className="node-sub">Group A · 12 / 15 clients</div>
                    </div>
                    <span className="node-badge nb-pending">Running</span>
                  </div>
                  <div className="connector" />
                  <div className="flow-node">
                    <div className="node-icon g">
                      <FlowIconMeta />
                    </div>
                    <div className="node-info">
                      <div className="node-label">Meta Messaging API</div>
                      <div className="node-sub">Distributed across 4 apps</div>
                    </div>
                    <span className="node-badge nb-ok">Active</span>
                  </div>
                </div>
                <div className="stats-row">
                  <div className="stat-chip">
                    <div className="val">4</div>
                    <div className="lbl">Meta Apps</div>
                  </div>
                  <div className="stat-chip">
                    <div className="val">48</div>
                    <div className="lbl">Clients</div>
                  </div>
                  <div className="stat-chip">
                    <div className="val">99.2%</div>
                    <div className="lbl">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-inner" id="marquee">
          {marqueeItems.concat(marqueeItems).map((item, idx) => (
            <div
              className="marquee-item"
              key={`${item}-${idx}`}
              aria-hidden={idx >= marqueeItems.length ? "true" : undefined}>
              <CheckIcon />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />

      <section className="section" id="how">
        <div className="wrap">
          <div className="scroll-reveal">
            <div className="section-tag">Process</div>
            <h2 className="section-title">
              From Registration
              <br />
              to Automation in Minutes
            </h2>
            <p className="section-sub">
              A streamlined onboarding flow that intelligently places every new
              client into the optimal workflow group, instantly.
            </p>
          </div>
          <div className="steps scroll-reveal">
            {steps.map((s) => (
              <div className="step" key={s.num}>
                <div className="step-num">{s.num}</div>
                <div className={`step-icon ${s.iconClass}`}>{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="groups">
        <div className="wrap">
          <div className="groups-grid">
            <div className="groups-content scroll-reveal">
              <div className="section-tag">Architecture</div>
              <h2 className="section-title">
                Smart Group
                <br />
                Distribution
              </h2>
              <p className="section-sub">
                Each workflow handles exactly 15 clients and one dedicated Meta
                App. This prevents API rate limits, distributes compute load,
                and maximizes message delivery reliability.
              </p>
              <div className="feature-list">
                <div className="feat-item">
                  <div className="feat-icon">
                    <CheckIcon />
                  </div>
                  <div>
                    <h4>15 clients per n8n workflow</h4>
                    <p>
                      Prevents workflow overloading and keeps execution times
                      predictable and fast.
                    </p>
                  </div>
                </div>
                <div className="feat-item">
                  <div className="feat-icon">
                    <CheckIcon />
                  </div>
                  <div>
                    <h4>Dedicated Meta App per group</h4>
                    <p>
                      Each group gets its own Meta App instance, keeping
                      messaging quotas healthy and isolated.
                    </p>
                  </div>
                </div>
                <div className="feat-item">
                  <div className="feat-icon">
                    <CheckIcon />
                  </div>
                  <div>
                    <h4>Auto-create new groups when full</h4>
                    <p>
                      When a group hits 15 clients, the next registration
                      automatically spawns a fresh workflow and App.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="groups-visual scroll-reveal">
              {groups.map((g) => (
                <div className={`group-block ${g.key}`} key={g.key}>
                  <div className="group-header">
                    <div>
                      <div
                        className="group-name"
                        style={{ color: g.nameColor }}>
                        {g.name}
                      </div>
                      <div className="group-cap">{g.cap}</div>
                    </div>
                    <span
                      className={`node-badge ${g.badgeClass || ""}`.trim()}
                      style={g.badgeStyle}>
                      {g.badge}
                    </span>
                  </div>
                  <div className="group-bar">
                    <div className={`group-fill ${g.fillClass}`} />
                  </div>
                  <div className={`group-ring ${g.key} group-ring-compact`}>
                    {Array.from({ length: g.clients }, (_, i) => (
                      <div className="client-dot" key={`${g.key}-c${i}`}>
                        {`C${String(i + 1).padStart(2, "0")}`}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="features">
        <div className="wrap">
          <div className="scroll-reveal">
            <div className="section-tag">Platform</div>
            <h2 className="section-title">
              Everything to Run
              <br />
              Your Automation at Scale
            </h2>
          </div>
          <div className="features-grid scroll-reveal">
            {features.map((f) => (
              <div
                className={`feat-card${f.wide ? " wide" : ""}`}
                key={f.title}>
                <div className={`ic ${f.iconClass}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>

                {f.title === "Client Portal" ? (
                  <div className="notif-preview">
                    <div className="notif-item">
                      <div
                        className="notif-avatar"
                        style={{
                          background: "rgba(0,212,255,0.1)",
                          color: "var(--cyan)",
                        }}>
                        MK
                      </div>
                      <div className="notif-body">
                        <div className="nb-title">
                          Your automation is active — Group Alpha
                        </div>
                        <div className="nb-time">2 minutes ago</div>
                      </div>
                      <div className="notif-status ns-new" aria-hidden="true" />
                    </div>
                    <div className="notif-item">
                      <div
                        className="notif-avatar"
                        style={{
                          background: "rgba(98,191,98,0.1)",
                          color: "#62bf62",
                        }}>
                        SA
                      </div>
                      <div className="notif-body">
                        <div className="nb-title">
                          1,240 messages sent this week
                        </div>
                        <div className="nb-time">1 hour ago</div>
                      </div>
                      <div
                        className="notif-status ns-sent"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="notif-item">
                      <div
                        className="notif-avatar"
                        style={{
                          background: "rgba(255,107,43,0.1)",
                          color: "var(--orange)",
                        }}>
                        SYS
                      </div>
                      <div className="notif-body">
                        <div className="nb-title">
                          Scheduled maintenance — Nov 28, 2AM
                        </div>
                        <div className="nb-time">Yesterday</div>
                      </div>
                      <div className="notif-status ns-q" aria-hidden="true" />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="cta-section" id="register">
        <div className="wrap">
          <div className="cta-box scroll-reveal">
            <h2>
              Ready to Automate
              <br />
              Your E-Commerce Messaging?
            </h2>
            <p>
              Join the waitlist — your store gets onboarded and grouped
              automatically.
            </p>
            <div className="cta-form" style={{ display: "flex", justifyContent: "center" }}>
              <button type="button" onClick={() => navigateTo("signup")}>
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap footer-inner">
          <div className="footer-logo">
            Ecom<span>Auto</span> App
          </div>
          <div className="footer-links">
            <a href="#" onClick={e => { e.preventDefault(); navigateTo('privacy'); }}>Privacy</a>
            <a href="#" onClick={e => { e.preventDefault(); navigateTo('terms'); }}>Terms</a>
            <a href="#" onClick={e => { e.preventDefault(); navigateTo('cookies'); }}>Cookies</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-copy">
            © 2025 EcomAuto. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
