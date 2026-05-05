import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const D = {
  bg: "#04080f",
  surface: "#080d18",
  surface2: "#0d1525",
  surface3: "#111d30",
  cyan: "#00d4ff",
  cyanDim: "#0099cc",
  cyanGlow: "rgba(0,212,255,0.15)",
  orange: "#ff6b2b",
  orangeGlow: "rgba(255,107,43,0.12)",
  purple: "#9b64ff",
  green: "#3ecf8e",
  red: "#f05f5f",
  text: "#e8edf5",
  muted: "#6b7a94",
  border: "#1a2540",
  borderHi: "#2a3a5a",
};

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const GlobalStyle = () => {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { background: ${D.bg}; color: ${D.text}; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: ${D.bg}; }
      ::-webkit-scrollbar-thumb { background: ${D.border}; border-radius: 4px; }
      input, textarea { font-family: 'DM Sans', sans-serif; }
      input::placeholder, textarea::placeholder { color: ${D.muted}; }
      input:focus, textarea:focus { outline: none; }
      button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
      @keyframes fadeUp   { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
      @keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,.45);} 50%{box-shadow:0 0 0 5px rgba(0,212,255,0);} }
      @keyframes pulseG   { 0%,100%{box-shadow:0 0 0 0 rgba(62,207,142,.45);} 50%{box-shadow:0 0 0 5px rgba(62,207,142,0);} }
      @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes shimmer  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
      @keyframes codeGlow { 0%,100%{border-color:rgba(0,212,255,0.3);} 50%{border-color:rgba(0,212,255,0.65);} }
      .anim-fadein { animation: fadeUp .5s ease both; }
      .code-glow   { animation: codeGlow 3s ease infinite; }
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);
  return null;
};

// ─── PARTICLE CANVAS ───────────────────────────────────────────────────────────
const ParticleCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let W, H, pts = [], raf;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    class P {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W; this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.28; this.vy = (Math.random() - 0.5) * 0.28;
        this.r = Math.random() * 1.3 + 0.3; this.a = Math.random() * 0.4 + 0.1;
        this.c = Math.random() > 0.75;
      }
      update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset(); }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.c ? `rgba(0,212,255,${this.a})` : `rgba(255,107,43,${this.a * 0.5})`;
        ctx.fill();
      }
    }
    for (let i = 0; i < 70; i++) pts.push(new P());
    const go = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${0.055 * (1 - d / 110)})`; ctx.lineWidth = 0.4; ctx.stroke();
          }
        }
      }
      pts.forEach((p) => { p.update(); p.draw(); });
      raf = requestAnimationFrame(go);
    };
    go();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.35, pointerEvents: "none" }} />;
};

// ─── ICON HELPERS ──────────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, color = D.cyan, sw = 1.5, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill={fill} style={{ flexShrink: 0 }}>
    <path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CopyIcon = ({ size = 15, color = D.muted }) => <Ic size={size} color={color} d="M7 4H4a1 1 0 00-1 1v11a1 1 0 001 1h11a1 1 0 001-1v-3M7 4h9a1 1 0 011 1v9M7 4a1 1 0 011-1h2a1 1 0 011 1v1H8V4z" />;
const CheckIc = ({ size = 14, color = D.green }) => <Ic size={size} color={color} sw={2} d="M3 10l4 4L17 6" />;
const CrossIc = ({ size = 14, color = D.red }) => <Ic size={size} color={color} sw={2} d="M4 4l12 12M16 4L4 16" />;
const PlusIc = ({ size = 16, color = D.cyan }) => <Ic size={size} color={color} d="M10 3v14M3 10h14" />;
const TrashIc = ({ size = 15, color = D.red }) => <Ic size={size} color={color} d="M4 6h12M9 6V4h2v2M5 6l.8 10a1 1 0 001 .9h6.4a1 1 0 001-.9L15 6" />;
const UploadIc = ({ size = 18, color = D.cyan }) => <Ic size={size} color={color} d="M10 14V4M5 9l5-5 5 5M3 17h14" />;
const FlowIc = ({ size = 16, color = D.purple }) => <Ic size={size} color={color} d="M3 10h4M9 10h4M15 10h2M7 6v8M13 6v8" />;
const BotIc = ({ size = 16, color = D.cyan }) => <Ic size={size} color={color} d="M9 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8l-6-5z" />;
const KeyIc = ({ size = 16, color = D.orange }) => <Ic size={size} color={color} d="M8 11a4 4 0 100-8 4 4 0 000 8zm0 0l8 8M14 17l2-2" />;
const MsgIc = ({ size = 16, color = D.green }) => <Ic size={size} color={color} d="M2 4h16v11H2zM2 4l8 7 8-7" />;
const ProdIc = ({ size = 16, color = D.orange }) => <Ic size={size} color={color} d="M3 6l7-3 7 3v8l-7 3-7-3V6z" />;
const StoreIc = ({ size = 16, color = D.cyan }) => <Ic size={size} color={color} d="M2 7h16l-1.5 9H3.5L2 7zm2-3h12l1 3H3L5 4z" />;
const NotifIc = ({ size = 16, color = D.muted }) => <Ic size={size} color={color} d="M10 2a6 6 0 016 6v3l1.5 2.5H2.5L4 11V8a6 6 0 016-6zm-1.5 14h3" />;
const LogoutIc = ({ size = 16, color = D.muted }) => <Ic size={size} color={color} d="M13 10H3M10 7l3 3-3 3M7 4H4a1 1 0 00-1 1v10a1 1 0 001 1h3" />;
const DataIc = ({ size = 16, color = D.cyan }) => <Ic size={size} color={color} d="M4 4h12v4H4zM4 10h7M4 14h5M15 12l3 3-3 3" />;

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const CLIENT = {
  name: "Issam Boutique",
  email: "issam@boutique.dz",
  plan: "Growth",
  planColor: D.cyan,
  useCode: "ECA-G7X2-9KMN-4QPR",
  codeStatus: "active",
  group: "Group Beta",
  groupColor: D.orange,
  workflow: "Make Workflow #2",
  metaApp: "Meta App B",
  groupSlot: "9 / 15",
  renewal: "Jun 15, 2025",
  msgsUsed: 8420,
  msgsLimit: 15000,
  joinedAt: "Mar 4, 2025",
  planDataLimitMB: 200,
  planDataUsedMB: 74,
};

// Plan file limits
const PLAN_LIMITS = {
  Starter:  { maxFiles: 5,  maxMB: 50,  allowedTypes: ["txt","pdf"] },
  Growth:   { maxFiles: 20, maxMB: 200, allowedTypes: ["txt","pdf","doc","docx","xlsx","jpg","png"] },
  Pro:      { maxFiles: 50, maxMB: 500, allowedTypes: ["txt","pdf","doc","docx","xlsx","jpg","png","jpeg","gif"] },
};

const MOCK_PRODUCTS = [
  { id: 1, name: "Summer Kaftan Collection", price: "2,400 DA", category: "Fashion", status: "active", desc: "Premium cotton kaftans with hand-embroidered detailing. Available in 8 colors. Fast delivery across Algeria.", aiGenerated: false, img: "👗" },
  { id: 2, name: "Leather Handbag Set",      price: "4,800 DA", category: "Accessories", status: "active", desc: "Genuine leather handbags in 4 styles. Includes shoulder strap. Express 24h delivery in Algiers.", aiGenerated: true,  img: "👜" },
  { id: 3, name: "Kids Sportswear Bundle",   price: "1,950 DA", category: "Kids",        status: "draft",  desc: "", aiGenerated: false, img: "👕" },
];

// Conversation summaries (NOT chat logs)
const MOCK_CONVOS = [
  { id: 1, sender: "+213 770 *** 421", topic: "Product pricing enquiry", outcome: "Customer informed of price, confirmed interest", turns: 3,  date: "Today, 10:42 AM",  sentiment: "positive", product: "Summer Kaftan Collection" },
  { id: 2, sender: "+213 555 *** 089", topic: "Delivery availability — Constantine", outcome: "Confirmed delivery, customer placed an order",   turns: 5,  date: "Today, 10:28 AM",  sentiment: "positive", product: "Leather Handbag Set"   },
  { id: 3, sender: "+213 661 *** 334", topic: "Available colors & sizes",              outcome: "Customer browsing — no order yet",              turns: 2,  date: "Today, 09:15 AM",  sentiment: "neutral",  product: "Summer Kaftan Collection" },
  { id: 4, sender: "+213 792 *** 710", topic: "Cash on delivery question",             outcome: "Payment method confirmed, order submitted",     turns: 4,  date: "Yesterday, 6:30 PM", sentiment: "positive", product: "Kids Sportswear Bundle" },
  { id: 5, sender: "+213 540 *** 118", topic: "Bulk order — 2 units",                  outcome: "Order placed for 2 units, awaiting confirmation", turns: 6, date: "Yesterday, 4:12 PM", sentiment: "positive", product: "Leather Handbag Set" },
  { id: 6, sender: "+213 661 *** 901", topic: "Return & refund policy",               outcome: "Customer not satisfied — escalated to support",  turns: 4,  date: "Yesterday, 2:05 PM", sentiment: "negative", product: "Summer Kaftan Collection" },
];

const MOCK_ACTIVITY = [
  { type: "conv", text: "New conversation from +213 770 *** 421 — AI replied in 1.2s",     time: "2m ago",  color: D.cyan   },
  { type: "prod", text: "Product 'Leather Handbag Set' description generated by AI",        time: "18m ago", color: D.orange },
  { type: "conv", text: "5-turn conversation completed — customer confirmed order",          time: "1h ago",  color: D.green  },
  { type: "code", text: "Use code ECA-G7X2 verified by Make Workflow #2",                   time: "3h ago",  color: D.purple },
  { type: "conv", text: "New conversation from +213 661 *** 334 — AI replied in 0.8s",     time: "3h ago",  color: D.cyan   },
  { type: "sys",  text: "Workflow Group Beta at 9/15 capacity — 6 slots remaining",         time: "6h ago",  color: D.muted  },
];

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon, delay = "0s" }) => {
  const [hov, setHov] = useState(false);
  const rgb = color === D.cyan ? "0,212,255" : color === D.orange ? "255,107,43" : color === D.green ? "62,207,142" : color === D.purple ? "155,100,255" : "240,95,95";
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: D.surface, border: `1px solid ${hov ? D.borderHi : D.border}`, borderRadius: 14, padding: "1.25rem 1.4rem", position: "relative", overflow: "hidden", transition: "all .25s", transform: hov ? "translateY(-3px)" : "none", animation: `fadeUp .6s ${delay} ease both` }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, background: `radial-gradient(circle,rgba(${rgb},0.1),transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: ".9rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `rgba(${rgb},0.12)`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <span style={{ fontSize: ".68rem", color: D.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "2rem", fontWeight: 800, color, letterSpacing: "-.03em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: ".75rem", color: D.muted, marginTop: ".35rem", fontWeight: 300 }}>{sub}</div>}
    </div>
  );
};

// ─── SECTION HEADER ────────────────────────────────────────────────────────────
const SectionHead = ({ icon, title, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
      {icon}
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: ".95rem", color: D.text }}>{title}</span>
    </div>
    {action}
  </div>
);

// ─── BADGE ─────────────────────────────────────────────────────────────────────
const Badge = ({ label, color = D.cyan }) => {
  const rgb = color === D.cyan ? "0,212,255" : color === D.orange ? "255,107,43" : color === D.green ? "62,207,142" : color === D.red ? "240,95,95" : color === D.purple ? "155,100,255" : "107,122,148";
  return (
    <span style={{ background: `rgba(${rgb},0.1)`, color, border: `1px solid rgba(${rgb},0.2)`, borderRadius: 100, padding: ".18rem .6rem", fontSize: ".68rem", fontWeight: 700, letterSpacing: ".04em", flexShrink: 0 }}>{label}</span>
  );
};

// ─── PRODUCT MODAL ─────────────────────────────────────────────────────────────
const ProductModal = ({ onClose, onSave }) => {
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [category, setCategory] = useState(""); const [desc, setDesc] = useState(""); const [generating, setGenerating] = useState(false); const [dragging, setDragging] = useState(false); const [imgName, setImgName] = useState(null);
  const fakeGenerate = () => { setGenerating(true); setTimeout(() => { setDesc(`Premium quality ${name || "product"} available for fast delivery across Algeria. Competitive pricing at ${price || "contact us for price"}. Order via WhatsApp — our AI assistant handles inquiries 24/7.`); setGenerating(false); }, 1800); };
  const inputStyle = { width: "100%", background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: ".7rem 1rem", color: D.text, fontSize: ".88rem", transition: "border-color .2s" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(4,8,15,0.82)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 20, width: "100%", maxWidth: 520, padding: "2rem", position: "relative", maxHeight: "90vh", overflowY: "auto", animation: "fadeUp .35s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.8rem" }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: D.text }}>Add Product</div>
            <div style={{ fontSize: ".78rem", color: D.muted, marginTop: ".2rem", fontWeight: 300 }}>AI will use this to answer customer questions</div>
          </div>
          <button onClick={onClose} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: ".4rem .55rem", color: D.muted, transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = D.red; e.currentTarget.style.color = D.red; }} onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.muted; }}><CrossIc size={14} color="currentColor" /></button>
        </div>
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setImgName(f.name); }} style={{ border: `2px dashed ${dragging ? D.cyan : D.border}`, borderRadius: 12, padding: "1.5rem", textAlign: "center", marginBottom: "1.2rem", cursor: "pointer", transition: "all .2s", background: dragging ? "rgba(0,212,255,0.04)" : D.surface2 }}>
          {imgName ? <div style={{ display: "flex", alignItems: "center", gap: ".6rem", justifyContent: "center" }}><div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><UploadIc size={16} /></div><span style={{ fontSize: ".82rem", color: D.cyan }}>{imgName}</span></div>
          : <><UploadIc size={24} color={D.muted} /><div style={{ fontSize: ".82rem", color: D.muted, marginTop: ".5rem", fontWeight: 300 }}>Drag product image or <span style={{ color: D.cyan, cursor: "pointer" }}>browse</span></div><div style={{ fontSize: ".72rem", color: "rgba(107,122,148,0.6)", marginTop: ".25rem" }}>PNG, JPG up to 5MB</div></>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".9rem", marginBottom: "1.2rem" }}>
          <div><label style={{ fontSize: ".75rem", color: D.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase", display: "block", marginBottom: ".4rem" }}>Product Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Kaftan Collection" style={inputStyle} onFocus={e => e.target.style.borderColor = D.cyan} onBlur={e => e.target.style.borderColor = D.border} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem" }}>
            <div><label style={{ fontSize: ".75rem", color: D.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase", display: "block", marginBottom: ".4rem" }}>Price</label><input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 2,400 DA" style={inputStyle} onFocus={e => e.target.style.borderColor = D.cyan} onBlur={e => e.target.style.borderColor = D.border} /></div>
            <div><label style={{ fontSize: ".75rem", color: D.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase", display: "block", marginBottom: ".4rem" }}>Category</label><input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Fashion" style={inputStyle} onFocus={e => e.target.style.borderColor = D.cyan} onBlur={e => e.target.style.borderColor = D.border} /></div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".4rem" }}>
              <label style={{ fontSize: ".75rem", color: D.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase" }}>AI Description</label>
              <button onClick={fakeGenerate} disabled={generating || !name} style={{ background: "rgba(0,212,255,0.08)", border: `1px solid rgba(0,212,255,0.2)`, borderRadius: 6, padding: ".25rem .7rem", color: generating || !name ? D.muted : D.cyan, fontSize: ".72rem", fontWeight: 600, transition: "all .2s", cursor: generating || !name ? "not-allowed" : "pointer" }}>{generating ? "Generating..." : "✦ Generate with AI"}</button>
            </div>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe your product — or let AI generate it" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} onFocus={e => e.target.style.borderColor = D.cyan} onBlur={e => e.target.style.borderColor = D.border} />
          </div>
        </div>
        <div style={{ display: "flex", gap: ".8rem" }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", border: `1px solid ${D.border}`, borderRadius: 9, padding: ".75rem", color: D.muted, fontSize: ".88rem", fontWeight: 500, transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = D.borderHi; e.currentTarget.style.color = D.text; }} onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.muted; }}>Cancel</button>
          <button onClick={() => onSave({ name, price, category, desc, aiGenerated: false })} style={{ flex: 2, background: `linear-gradient(135deg,${D.cyan},${D.cyanDim})`, border: "none", borderRadius: 9, padding: ".75rem", color: D.bg, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: ".88rem", boxShadow: "0 0 20px rgba(0,212,255,0.25)", transition: "all .2s" }}>Save Product</button>
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ───────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: "overview",       label: "Overview",       icon: <StoreIc size={16} /> },
  { id: "products",       label: "My Products",    icon: <ProdIc size={16} /> },
  { id: "conversations",  label: "Conversations",  icon: <MsgIc size={16} /> },
  { id: "data",           label: "Knowledge Base", icon: <DataIc size={16} /> },
  { id: "usecode",        label: "Use Code",       icon: <KeyIc size={16} /> },
  { id: "workflow",       label: "Automation",     icon: <FlowIc size={16} /> },
];

const Sidebar = ({ active, onChange }) => {
  const msgsUsedPct = Math.round((CLIENT.msgsUsed / CLIENT.msgsLimit) * 100);
  return (
    <aside style={{ width: 240, flexShrink: 0, background: D.surface, borderRight: `1px solid ${D.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflow: "hidden" }}>
      <div style={{ padding: "1.4rem 1.4rem 1rem", borderBottom: `1px solid ${D.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
          <svg width={28} height={28} viewBox="0 0 32 32" fill="none"><rect width={32} height={32} rx={8} fill="rgba(0,212,255,0.08)" /><path d="M8 16L14 10L20 16L26 10" stroke={D.cyan} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><path d="M8 22L14 16L20 22L26 16" stroke={D.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><circle cx={16} cy={16} r={2.5} fill={D.cyan} /></svg>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1rem", color: D.text }}>Ecom<span style={{ color: D.cyan }}>Auto</span></span>
        </div>
        <div style={{ marginTop: "1rem", background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: ".65rem .85rem", display: "flex", alignItems: "center", gap: ".7rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,212,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: ".75rem", color: D.cyan, flexShrink: 0 }}>{CLIENT.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: ".82rem", fontWeight: 500, color: D.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{CLIENT.name}</div>
            <Badge label={CLIENT.plan} color={CLIENT.planColor} />
          </div>
        </div>
      </div>
      <div role="navigation" style={{ flex: 1, padding: "1rem .75rem", display: "flex", flexDirection: "column", gap: ".25rem", overflowY: "auto" }}>
        {SIDEBAR_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onChange(item.id)} style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".7rem .85rem", borderRadius: 9, background: isActive ? "rgba(0,212,255,0.08)" : "transparent", border: `1px solid ${isActive ? "rgba(0,212,255,0.2)" : "transparent"}`, color: isActive ? D.cyan : D.muted, fontWeight: isActive ? 500 : 400, fontSize: ".88rem", transition: "all .2s", textAlign: "left", width: "100%" }}>
              {item.icon} {item.label}
              {item.id === "conversations" && <span style={{ marginLeft: "auto", background: "rgba(0,212,255,0.1)", color: D.cyan, borderRadius: 100, padding: ".1rem .45rem", fontSize: ".65rem", fontWeight: 700 }}>{MOCK_CONVOS.length}</span>}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "1rem 1.2rem", borderTop: `1px solid ${D.border}` }}>
        <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: ".85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
            <span style={{ fontSize: ".72rem", color: D.muted, fontWeight: 500 }}>AI Messages</span>
            <span style={{ fontSize: ".72rem", color: D.cyan, fontWeight: 700 }}>{msgsUsedPct}%</span>
          </div>
          <div style={{ height: 4, background: D.border, borderRadius: 2, overflow: "hidden", marginBottom: ".5rem" }}>
            <div style={{ height: "100%", borderRadius: 2, width: `${msgsUsedPct}%`, background: msgsUsedPct > 85 ? D.orange : D.cyan, transition: "width .6s ease" }} />
          </div>
          <div style={{ fontSize: ".7rem", color: D.muted, fontWeight: 300 }}>{CLIENT.msgsUsed.toLocaleString()} / {CLIENT.msgsLimit.toLocaleString()} used</div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: ".6rem", padding: ".65rem .85rem", borderRadius: 9, background: "transparent", border: "none", color: D.muted, fontSize: ".85rem", width: "100%", marginTop: ".4rem", transition: "color .2s" }} onMouseEnter={e => e.currentTarget.style.color = D.text} onMouseLeave={e => e.currentTarget.style.color = D.muted}><LogoutIc /> Sign Out</button>
      </div>
    </aside>
  );
};

// ─── TOP BAR ───────────────────────────────────────────────────────────────────
const TopBar = ({ pageTitle, pageSubtitle }) => (
  <div style={{ padding: "1.2rem 2rem", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(4,8,15,0.6)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
    <div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: D.text, letterSpacing: "-.01em" }}>{pageTitle}</div>
      <div style={{ fontSize: ".78rem", color: D.muted, fontWeight: 300, marginTop: ".1rem" }}>{pageSubtitle}</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
      <button style={{ width: 36, height: 36, borderRadius: 9, background: D.surface2, border: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", position: "relative" }} onMouseEnter={e => e.currentTarget.style.borderColor = D.cyan} onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
        <NotifIc />
        <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: D.cyan, animation: "pulse 2s infinite" }} />
      </button>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: ".75rem", color: D.cyan }}>{CLIENT.name.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── VIEWS ────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── OVERVIEW VIEW ─────────────────────────────────────────────────────────────
const OverviewView = ({ setActiveTab }) => {
  const [copied, setCopied] = useState(false);
  const copyCode = () => { navigator.clipboard?.writeText(CLIENT.useCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const card = { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: "1.4rem 1.6rem" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", animation: "fadeUp .5s ease" }}>
      {/* Welcome banner */}
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: "1.6rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: 80, width: 250, height: 250, background: "radial-gradient(circle,rgba(0,212,255,0.06),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle,rgba(255,107,43,0.05),transparent 70%)", pointerEvents: "none" }} />
        <div>
          <div style={{ fontSize: ".78rem", color: D.muted, fontWeight: 300, marginBottom: ".3rem" }}>Welcome back,</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: D.text, letterSpacing: "-.02em" }}>{CLIENT.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginTop: ".5rem", flexWrap: "wrap" }}>
            <Badge label={`Plan: ${CLIENT.plan}`} color={D.cyan} />
            <Badge label={CLIENT.group} color={D.orange} />
            <div style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".72rem", color: D.muted }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: D.green, display: "inline-block", animation: "pulseG 2s infinite" }} />Automation Active</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: ".8rem" }}>
          <button onClick={() => setActiveTab("products")} style={{ background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.25)", borderRadius: 9, padding: ".6rem 1.1rem", color: D.orange, fontSize: ".82rem", fontWeight: 600, transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,107,43,0.18)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,107,43,0.1)"}> + Add Product</button>
          <button onClick={() => setActiveTab("conversations")} style={{ background: `linear-gradient(135deg,${D.cyan},${D.cyanDim})`, border: "none", borderRadius: 9, padding: ".6rem 1.1rem", color: D.bg, fontSize: ".82rem", fontFamily: "'Syne',sans-serif", fontWeight: 700, boxShadow: "0 0 18px rgba(0,212,255,0.25)", transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 28px rgba(0,212,255,0.4)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 18px rgba(0,212,255,0.25)"}>View Conversations</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        <StatCard label="AI Conversations" value="127" sub="This month" color={D.cyan} delay=".05s" icon={<MsgIc size={16} />} />
        <StatCard label="Messages Sent" value={CLIENT.msgsUsed.toLocaleString()} sub={`of ${CLIENT.msgsLimit.toLocaleString()} limit`} color={D.orange} delay=".1s" icon={<BotIc size={16} color={D.orange} />} />
        <StatCard label="Products Listed" value={MOCK_PRODUCTS.filter(p => p.status === "active").length.toString()} sub="Active in AI responses" color={D.green} delay=".15s" icon={<ProdIc size={16} color={D.green} />} />
        <StatCard label="Avg. Reply Time" value="1.4s" sub="AI response latency" color={D.purple} delay=".2s" icon={<FlowIc size={16} color={D.purple} />} />
      </div>

      {/* Use Code + Workflow */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "1.2rem" }}>
        <div style={{ ...card }} className="code-glow">
          <SectionHead icon={<KeyIc size={16} color={D.orange} />} title="Your Use Code" action={<Badge label="Active" color={D.green} />} />
          <div style={{ fontSize: ".78rem", color: D.muted, fontWeight: 300, marginBottom: ".9rem", lineHeight: 1.6 }}>This code is your account's activation key. Keep it private — sharing or leaking it may result in account suspension.</div>
          <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: ".9rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".8rem", marginBottom: ".9rem" }}>
            <code style={{ fontFamily: "'Courier New',monospace", fontSize: "1rem", fontWeight: 700, color: D.orange, letterSpacing: ".12em", wordBreak: "break-all" }}>{CLIENT.useCode}</code>
            <button onClick={copyCode} style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.18)", borderRadius: 7, padding: ".45rem .65rem", display: "flex", alignItems: "center", gap: ".4rem", flexShrink: 0, color: copied ? D.green : D.cyan, fontSize: ".75rem", fontWeight: 600, transition: "all .2s" }}>{copied ? <><CheckIc size={13} color={D.green} /> Copied!</> : <><CopyIcon size={13} /> Copy</>}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}>
            {[{ label: "Plan", val: CLIENT.plan, c: D.cyan }, { label: "Renewal", val: CLIENT.renewal, c: D.text }, { label: "Status", val: "Active", c: D.green }, { label: "Joined", val: CLIENT.joinedAt, c: D.text }].map(({ label, val, c }) => (
              <div key={label} style={{ background: D.surface2, borderRadius: 8, padding: ".55rem .75rem" }}>
                <div style={{ fontSize: ".65rem", color: D.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".2rem" }}>{label}</div>
                <div style={{ fontSize: ".82rem", fontWeight: 600, color: c }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <SectionHead icon={<FlowIc size={16} color={D.purple} />} title="Automation Status" />
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {[
              { label: "AI Agent",        val: "Online",      color: D.green  },
              { label: "Facebook Page",   val: "Connected",   color: D.green  },
              { label: "Message Handler", val: "Running",     color: D.cyan   },
              { label: "Group Capacity",  val: CLIENT.groupSlot, color: D.orange },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".55rem .8rem", background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9 }}>
                <span style={{ fontSize: ".8rem", color: D.muted }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
                  <span style={{ fontSize: ".82rem", fontWeight: 600, color }}>{val}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
              <span style={{ fontSize: ".7rem", color: D.muted }}>Group capacity</span>
              <span style={{ fontSize: ".7rem", color: D.orange, fontWeight: 600 }}>9 / 15 clients</span>
            </div>
            <div style={{ height: 5, background: D.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "60%", background: D.orange, borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div style={card}>
        <SectionHead icon={<svg width={16} height={16} viewBox="0 0 16 16" fill="none"><circle cx={8} cy={8} r={2.5} stroke={D.green} strokeWidth={1.4} /><path d="M8 1v3M8 12v3M1 8h3M12 8h3" stroke={D.green} strokeWidth={1.4} strokeLinecap="round" /></svg>} title="Recent Activity" action={<button onClick={() => setActiveTab("conversations")} style={{ background: "none", border: "none", color: D.cyan, fontSize: ".78rem", fontWeight: 600, cursor: "pointer" }}>View all →</button>} />
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          {MOCK_ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: ".75rem", padding: ".55rem .7rem", borderRadius: 9, transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = D.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.color, marginTop: ".45rem", flexShrink: 0 }} />
              <span style={{ fontSize: ".82rem", color: D.text, fontWeight: 300, flex: 1, lineHeight: 1.55 }}>{a.text}</span>
              <span style={{ fontSize: ".72rem", color: D.muted, flexShrink: 0, marginTop: ".05rem" }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PRODUCTS VIEW ─────────────────────────────────────────────────────────────
const ProductsView = () => {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
  const handleSave = (data) => { setProducts(prev => [...prev, { id: Date.now(), ...data, status: "active", img: "📦" }]); setShowModal(false); };
  const toggleStatus = (id) => setProducts(prev => prev.map(p => p.id === id ? { ...p, status: p.status === "active" ? "draft" : "active" } : p));
  const deleteProduct = (id) => setProducts(prev => prev.filter(p => p.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", animation: "fadeUp .5s ease" }}>
      {showModal && <ProductModal onClose={() => setShowModal(false)} onSave={handleSave} />}
      <div style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 12, padding: "1rem 1.3rem", display: "flex", alignItems: "center", gap: ".9rem" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BotIc size={16} /></div>
        <div>
          <div style={{ fontSize: ".85rem", fontWeight: 500, color: D.text, marginBottom: ".15rem" }}>How the AI uses your products</div>
          <div style={{ fontSize: ".78rem", color: D.muted, fontWeight: 300, lineHeight: 1.5 }}>Before every AI response, the workflow fetches your active products and uses them to answer customer questions about price, delivery, colors, and availability.</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 9, padding: ".65rem 1rem .65rem 2.4rem", color: D.text, fontSize: ".88rem", width: 260, transition: "border-color .2s" }} onFocus={e => e.target.style.borderColor = D.cyan} onBlur={e => e.target.style.borderColor = D.border} />
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: ".75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx={6} cy={6} r={4.5} stroke={D.muted} strokeWidth={1.4} /><path d="M10 10l2.5 2.5" stroke={D.muted} strokeWidth={1.4} strokeLinecap="round" /></svg>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: ".5rem", background: `linear-gradient(135deg,${D.cyan},${D.cyanDim})`, border: "none", borderRadius: 9, padding: ".65rem 1.3rem", color: D.bg, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: ".85rem", boxShadow: "0 0 18px rgba(0,212,255,0.22)", transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 28px rgba(0,212,255,0.38)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 18px rgba(0,212,255,0.22)"}><PlusIc size={16} color={D.bg} /> Add Product</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "1.1rem" }}>
        {filtered.map((p, i) => (
          <div key={p.id} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, padding: "1.3rem", display: "flex", flexDirection: "column", gap: ".85rem", transition: "all .25s", animation: `fadeUp .5s ${i * 0.08}s ease both` }} onMouseEnter={e => e.currentTarget.style.borderColor = D.borderHi} onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: ".6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,107,43,0.08)", border: "1px solid rgba(255,107,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>{p.img}</div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: ".92rem", color: D.text, marginBottom: ".25rem" }}>{p.name}</div>
                  <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}><Badge label={p.category} color={D.muted} />{p.aiGenerated && <Badge label="AI Generated" color={D.purple} />}</div>
                </div>
              </div>
              <Badge label={p.status === "active" ? "Active" : "Draft"} color={p.status === "active" ? D.green : D.muted} />
            </div>
            <div style={{ fontSize: ".82rem", color: p.desc ? D.muted : D.border, fontWeight: 300, lineHeight: 1.65, minHeight: "2.5rem" }}>{p.desc || <span style={{ color: D.border, fontStyle: "italic" }}>No description — AI cannot answer questions about this product</span>}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: ".6rem", borderTop: `1px solid ${D.border}` }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1rem", color: D.orange }}>{p.price || "—"}</span>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button onClick={() => toggleStatus(p.id)} style={{ background: `rgba(${p.status === "active" ? "62,207,142" : "107,122,148"},0.08)`, border: `1px solid rgba(${p.status === "active" ? "62,207,142" : "107,122,148"},0.2)`, borderRadius: 7, padding: ".35rem .65rem", color: p.status === "active" ? D.green : D.muted, fontSize: ".72rem", fontWeight: 600 }}>{p.status === "active" ? "Pause" : "Activate"}</button>
                <button onClick={() => deleteProduct(p.id)} style={{ background: "transparent", border: `1px solid ${D.border}`, borderRadius: 7, padding: ".35rem .5rem", transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = D.red; e.currentTarget.style.background = "rgba(240,95,95,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.background = "transparent"; }}><TrashIc size={13} /></button>
              </div>
            </div>
          </div>
        ))}
        <div onClick={() => setShowModal(true)} style={{ background: "transparent", border: `2px dashed ${D.border}`, borderRadius: 14, padding: "1.3rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: ".6rem", cursor: "pointer", transition: "all .2s", minHeight: 180 }} onMouseEnter={e => { e.currentTarget.style.borderColor = D.cyan; e.currentTarget.style.background = "rgba(0,212,255,0.03)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.background = "transparent"; }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><PlusIc size={18} /></div>
          <span style={{ fontSize: ".82rem", color: D.muted, fontWeight: 300 }}>Add another product</span>
        </div>
      </div>
    </div>
  );
};

// ─── CONVERSATIONS VIEW (summaries, not chat logs) ────────────────────────────
const ConversationsView = () => {
  const [filter, setFilter] = useState("all");

  const sentimentColor = { positive: D.green, neutral: D.cyan, negative: D.red };
  const sentimentLabel = { positive: "Positive", neutral: "Neutral", negative: "Negative" };

  const filtered = filter === "all" ? MOCK_CONVOS : MOCK_CONVOS.filter(c => c.sentiment === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", animation: "fadeUp .5s ease" }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        <StatCard label="Total Conversations" value={MOCK_CONVOS.length.toString()} sub="This month" color={D.cyan} icon={<MsgIc size={16} />} />
        <StatCard label="Positive Outcomes"   value={MOCK_CONVOS.filter(c => c.sentiment === "positive").length.toString()} sub="Orders or confirmed interest" color={D.green} delay=".05s" icon={<CheckIc size={16} color={D.green} />} />
        <StatCard label="Avg. Turns per Chat" value={(MOCK_CONVOS.reduce((s, c) => s + c.turns, 0) / MOCK_CONVOS.length).toFixed(1)} sub="AI messages exchanged" color={D.purple} delay=".1s" icon={<BotIc size={16} color={D.purple} />} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: ".5rem" }}>
        {["all", "positive", "neutral", "negative"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: ".4rem .9rem", borderRadius: 100, border: `1px solid ${filter === f ? (f === "all" ? D.cyan : sentimentColor[f]) : D.border}`, background: filter === f ? `rgba(${f === "all" ? "0,212,255" : f === "positive" ? "62,207,142" : f === "neutral" ? "0,212,255" : "240,95,95"},0.08)` : "transparent", color: filter === f ? (f === "all" ? D.cyan : sentimentColor[f]) : D.muted, fontSize: ".78rem", fontWeight: 600, cursor: "pointer", transition: "all .2s", textTransform: "capitalize" }}>{f === "all" ? "All" : sentimentLabel[f]}</button>
        ))}
      </div>

      {/* Conversation summary cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: ".85rem" }}>
        {filtered.map((c, i) => (
          <div key={c.id} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, padding: "1.2rem 1.4rem", display: "flex", alignItems: "flex-start", gap: "1.2rem", transition: "all .2s", animation: `fadeUp .4s ${i * 0.06}s ease both` }} onMouseEnter={e => e.currentTarget.style.borderColor = D.borderHi} onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
            {/* Sentiment dot */}
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${c.sentiment === "positive" ? "62,207,142" : c.sentiment === "neutral" ? "0,212,255" : "240,95,95"},0.1)`, border: `1px solid rgba(${c.sentiment === "positive" ? "62,207,142" : c.sentiment === "neutral" ? "0,212,255" : "240,95,95"},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {c.sentiment === "positive" ? <CheckIc size={16} color={D.green} /> : c.sentiment === "negative" ? <CrossIc size={16} color={D.red} /> : <MsgIc size={16} color={D.cyan} />}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".4rem", flexWrap: "wrap", gap: ".5rem" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: ".9rem", color: D.text }}>{c.sender}</div>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <Badge label={sentimentLabel[c.sentiment]} color={sentimentColor[c.sentiment]} />
                  <span style={{ fontSize: ".72rem", color: D.muted }}>{c.date}</span>
                </div>
              </div>
              <div style={{ fontSize: ".85rem", color: D.cyan, fontWeight: 500, marginBottom: ".35rem" }}>{c.topic}</div>
              <div style={{ fontSize: ".80rem", color: D.muted, fontWeight: 300, lineHeight: 1.55, marginBottom: ".6rem" }}>{c.outcome}</div>
              <div style={{ display: "flex", alignItems: "center", gap: ".7rem", flexWrap: "wrap" }}>
                <Badge label={`${c.turns} turns`} color={D.muted} />
                <div style={{ display: "flex", alignItems: "center", gap: ".35rem", fontSize: ".75rem", color: D.muted }}>
                  <ProdIc size={13} color={D.orange} />
                  {c.product}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DATA / KNOWLEDGE BASE VIEW ────────────────────────────────────────────────
const DataView = () => {
  const planLimits = PLAN_LIMITS[CLIENT.plan] || PLAN_LIMITS.Growth;
  const [files, setFiles] = useState([
    { id: 1, name: "kaftan-sizing-guide.pdf", type: "pdf", sizeMB: 1.2, product: "Summer Kaftan Collection", uploadedAt: "Apr 10, 2025" },
    { id: 2, name: "handbag-faq.txt",          type: "txt", sizeMB: 0.1, product: "Leather Handbag Set",    uploadedAt: "Apr 12, 2025" },
    { id: 3, name: "kaftan-colors.jpg",         type: "jpg", sizeMB: 2.4, product: "Summer Kaftan Collection", uploadedAt: "Apr 14, 2025" },
  ]);
  const [dragging, setDragging] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(MOCK_PRODUCTS[0].name);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const usedMB = files.reduce((s, f) => s + f.sizeMB, 0);
  const usedPct = Math.round((usedMB / planLimits.maxMB) * 100);

  const typeColor = { pdf: D.red, txt: D.cyan, doc: D.purple, docx: D.purple, xlsx: D.green, jpg: D.orange, jpeg: D.orange, png: D.orange, gif: D.orange };
  const typeIcon = { pdf: "📄", txt: "📝", doc: "📘", docx: "📘", xlsx: "📊", jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️" };

  const handleFiles = (incoming) => {
    setError(null);
    for (const f of incoming) {
      const ext = f.name.split(".").pop().toLowerCase();
      if (!planLimits.allowedTypes.includes(ext)) { setError(`File type .${ext} is not allowed on your ${CLIENT.plan} plan.`); return; }
      if (files.length >= planLimits.maxFiles) { setError(`You've reached the ${planLimits.maxFiles}-file limit on your ${CLIENT.plan} plan. Upgrade to add more.`); return; }
      const sizeMB = parseFloat((f.size / 1048576).toFixed(2));
      if (usedMB + sizeMB > planLimits.maxMB) { setError(`Not enough storage. Your plan allows ${planLimits.maxMB} MB.`); return; }
      setFiles(prev => [...prev, { id: Date.now() + Math.random(), name: f.name, type: ext, sizeMB, product: selectedProduct, uploadedAt: "Just now" }]);
    }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFiles([...e.dataTransfer.files]); };
  const onPick  = (e) => { if (e.target.files?.length) handleFiles([...e.target.files]); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", animation: "fadeUp .5s ease" }}>
      {/* Plan storage info */}
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: "1.4rem 1.6rem" }}>
        <SectionHead icon={<DataIc size={16} />} title="Knowledge Base Storage" action={<Badge label={`${CLIENT.plan} Plan`} color={D.cyan} />} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.2rem" }}>
          {[
            { label: "Files Uploaded", val: `${files.length} / ${planLimits.maxFiles}`, c: D.cyan },
            { label: "Storage Used",   val: `${usedMB.toFixed(1)} MB / ${planLimits.maxMB} MB`, c: D.orange },
            { label: "Allowed Types",  val: planLimits.allowedTypes.map(t => `.${t}`).join("  "), c: D.muted },
          ].map(({ label, val, c }) => (
            <div key={label} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: ".8rem 1rem" }}>
              <div style={{ fontSize: ".65rem", color: D.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".3rem" }}>{label}</div>
              <div style={{ fontSize: ".88rem", fontWeight: 600, color: c, lineHeight: 1.4 }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
          <span style={{ fontSize: ".75rem", color: D.muted }}>Storage usage</span>
          <span style={{ fontSize: ".75rem", color: usedPct > 80 ? D.orange : D.cyan, fontWeight: 600 }}>{usedPct}%</span>
        </div>
        <div style={{ height: 5, background: D.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${usedPct}%`, background: usedPct > 80 ? D.orange : D.cyan, borderRadius: 3, transition: "width .6s ease" }} />
        </div>
      </div>

      {/* Upload area */}
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: "1.4rem 1.6rem" }}>
        <SectionHead icon={<UploadIc size={16} />} title="Upload File" />

        {/* Product selector */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: ".75rem", color: D.muted, fontWeight: 500, letterSpacing: ".05em", textTransform: "uppercase", display: "block", marginBottom: ".4rem" }}>Link to Product *</label>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} style={{ width: "100%", maxWidth: 340, background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: ".65rem 1rem", color: D.text, fontSize: ".88rem", cursor: "pointer" }}>
            {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        {/* Drop zone */}
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileInputRef.current?.click()} style={{ border: `2px dashed ${dragging ? D.cyan : D.border}`, borderRadius: 14, padding: "2rem", textAlign: "center", cursor: "pointer", transition: "all .2s", background: dragging ? "rgba(0,212,255,0.04)" : D.surface2 }}>
          <UploadIc size={28} color={dragging ? D.cyan : D.muted} />
          <div style={{ fontSize: ".88rem", color: dragging ? D.cyan : D.muted, marginTop: ".7rem", fontWeight: 400 }}>Drag & drop here or <span style={{ color: D.cyan }}>browse files</span></div>
          <div style={{ fontSize: ".75rem", color: D.muted, marginTop: ".35rem", fontWeight: 300 }}>Allowed: {planLimits.allowedTypes.map(t => `.${t}`).join(", ")} — max {planLimits.maxMB} MB total</div>
          <input ref={fileInputRef} type="file" multiple accept={planLimits.allowedTypes.map(t => `.${t}`).join(",")} style={{ display: "none" }} onChange={onPick} />
        </div>

        {error && (
          <div style={{ marginTop: ".85rem", background: "rgba(240,95,95,0.06)", border: "1px solid rgba(240,95,95,0.2)", borderRadius: 10, padding: ".75rem 1rem", display: "flex", gap: ".6rem", alignItems: "center" }}>
            <CrossIc size={14} color={D.red} />
            <span style={{ fontSize: ".82rem", color: D.red }}>{error}</span>
          </div>
        )}
      </div>

      {/* File list */}
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: "1.4rem 1.6rem" }}>
        <SectionHead icon={<ProdIc size={16} color={D.orange} />} title="Uploaded Files" action={<Badge label={`${files.length} files`} color={D.muted} />} />
        {files.length === 0
          ? <div style={{ textAlign: "center", padding: "2rem", color: D.muted, fontSize: ".85rem", fontWeight: 300 }}>No files uploaded yet. Upload your first file above.</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
              {files.map((f, i) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: ".85rem 1rem", background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, transition: "all .2s", animation: `fadeUp .4s ${i * 0.05}s ease both` }} onMouseEnter={e => e.currentTarget.style.borderColor = D.borderHi} onMouseLeave={e => e.currentTarget.style.borderColor = D.border}>
                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `rgba(${typeColor[f.type] === D.red ? "240,95,95" : typeColor[f.type] === D.cyan ? "0,212,255" : typeColor[f.type] === D.purple ? "155,100,255" : typeColor[f.type] === D.green ? "62,207,142" : "255,107,43"},0.1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>{typeIcon[f.type] || "📁"}</div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: ".85rem", fontWeight: 500, color: D.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                    <div style={{ display: "flex", gap: ".5rem", alignItems: "center", marginTop: ".25rem", flexWrap: "wrap" }}>
                      <Badge label={`.${f.type}`} color={typeColor[f.type] || D.muted} />
                      <span style={{ fontSize: ".72rem", color: D.muted }}>{f.sizeMB} MB</span>
                      <div style={{ display: "flex", alignItems: "center", gap: ".3rem", fontSize: ".72rem", color: D.muted }}><ProdIc size={11} color={D.orange} />{f.product}</div>
                    </div>
                  </div>
                  {/* Date + Delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: ".7rem", flexShrink: 0 }}>
                    <span style={{ fontSize: ".72rem", color: D.muted }}>{f.uploadedAt}</span>
                    <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} style={{ background: "transparent", border: `1px solid ${D.border}`, borderRadius: 7, padding: ".3rem .45rem", transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = D.red; e.currentTarget.style.background = "rgba(240,95,95,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.background = "transparent"; }}><TrashIc size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

// ─── USE CODE VIEW (client-facing, not technical) ──────────────────────────────
const UseCodeView = () => {
  const [copied, setCopied] = useState(false);
  const [codeActive, setCodeActive] = useState(true);
  const copyCode = () => { navigator.clipboard?.writeText(CLIENT.useCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2200); };
  const card = { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: "1.6rem 1.8rem" };

  const DEACTIVATION_REASONS = [
    { icon: "💳", title: "Unpaid Subscription",   desc: "Your plan renewal was missed or the payment failed. Renew your subscription to restore access immediately.",    color: D.red    },
    { icon: "⚠️", title: "Policy Violation",       desc: "Your account was flagged for sending spam, prohibited content, or violating our terms of service.",              color: D.orange },
    { icon: "🔒", title: "Code Compromised",        desc: "We detected unusual activity suggesting your code was shared or leaked. Contact support for a code reset.",      color: D.orange },
    { icon: "⏸️", title: "Manual Pause by You",    desc: "You deactivated the code yourself using the toggle below. You can reactivate it at any time.",                   color: D.muted  },
    { icon: "📋", title: "Plan Limit Reached",      desc: "Your account has hit the AI message limit for this billing cycle. Upgrade your plan or wait for renewal.",       color: D.purple },
    { icon: "🛠️", title: "Maintenance Window",      desc: "Scheduled maintenance is in progress. Your automation will resume automatically once maintenance is complete.",  color: D.cyan   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", maxWidth: 700, animation: "fadeUp .5s ease" }}>
      {/* Main code card */}
      <div style={{ ...card, border: `1px solid ${codeActive ? "rgba(0,212,255,0.3)" : D.border}` }} className={codeActive ? "code-glow" : ""}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(255,107,43,0.1)", border: "1px solid rgba(255,107,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><KeyIc size={20} color={D.orange} /></div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.05rem", color: D.text }}>Your Activation Code</div>
              <div style={{ fontSize: ".75rem", color: D.muted, fontWeight: 300 }}>Generated on {CLIENT.joinedAt}</div>
            </div>
          </div>
          {/* Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <span style={{ fontSize: ".82rem", color: D.muted }}>{codeActive ? "Active" : "Paused"}</span>
            <button onClick={() => setCodeActive(!codeActive)} style={{ width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer", background: codeActive ? D.green : "rgba(107,122,148,0.2)", position: "relative", transition: "background .3s" }}>
              <div style={{ position: "absolute", top: 3, left: codeActive ? 27 : 3, width: 22, height: 22, borderRadius: "50%", background: codeActive ? D.bg : D.muted, transition: "left .3s", boxShadow: "0 1px 4px rgba(0,0,0,.5)" }} />
            </button>
          </div>
        </div>

        {/* The code */}
        <div style={{ background: D.bg, border: `1px solid ${D.border}`, borderRadius: 12, padding: "1.2rem 1.4rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.4rem" }}>
          <code style={{ fontFamily: "'Courier New',monospace", fontSize: "1.2rem", fontWeight: 700, color: codeActive ? D.orange : "rgba(107,122,148,0.7)", letterSpacing: ".14em", wordBreak: "break-all", flex: 1 }}>{codeActive ? CLIENT.useCode : "●●●●-●●●●-●●●●-●●●●"}</code>
          <button onClick={copyCode} disabled={!codeActive} style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 9, padding: ".55rem .9rem", display: "flex", alignItems: "center", gap: ".5rem", color: copied ? D.green : codeActive ? D.cyan : D.muted, fontSize: ".82rem", fontWeight: 600, transition: "all .2s", cursor: codeActive ? "pointer" : "not-allowed", flexShrink: 0 }}>{copied ? <><CheckIc size={14} color={D.green} /> Copied!</> : <><CopyIcon size={14} color="currentColor" /> Copy</>}</button>
        </div>

        {/* Status summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".7rem" }}>
          {[{ label: "Status", val: codeActive ? "Active" : "Paused", c: codeActive ? D.green : D.red }, { label: "Plan", val: CLIENT.plan, c: D.cyan }, { label: "Renewal", val: CLIENT.renewal, c: D.text }, { label: "Joined", val: CLIENT.joinedAt, c: D.text }].map(({ label, val, c }) => (
            <div key={label} style={{ background: D.surface2, borderRadius: 8, padding: ".55rem .75rem" }}>
              <div style={{ fontSize: ".65rem", color: D.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".2rem" }}>{label}</div>
              <div style={{ fontSize: ".82rem", fontWeight: 600, color: c }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What your code controls */}
      <div style={card}>
        <SectionHead icon={<BotIc size={16} />} title="What Your Code Controls" />
        <div style={{ fontSize: ".83rem", color: D.muted, fontWeight: 300, lineHeight: 1.65, marginBottom: "1.2rem" }}>
          Your activation code is the key that keeps your AI agent running. As long as it is active and valid, your automation responds to customers instantly. The moment it becomes invalid — for any of the reasons below — all automated replies stop until the issue is resolved.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".65rem" }}>
          {DEACTIVATION_REASONS.map((r, i) => {
            const rgb = r.color === D.red ? "240,95,95" : r.color === D.orange ? "255,107,43" : r.color === D.purple ? "155,100,255" : r.color === D.cyan ? "0,212,255" : "107,122,148";
            return (
              <div key={i} style={{ display: "flex", gap: ".9rem", alignItems: "flex-start", padding: ".85rem 1rem", background: D.surface2, border: `1px solid rgba(${rgb},0.12)`, borderRadius: 10, transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.background = `rgba(${rgb},0.05)`} onMouseLeave={e => e.currentTarget.style.background = D.surface2}>
                <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: ".05rem" }}>{r.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: ".88rem", color: r.color, marginBottom: ".25rem" }}>{r.title}</div>
                  <div style={{ fontSize: ".80rem", color: D.muted, fontWeight: 300, lineHeight: 1.6 }}>{r.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support CTA */}
      <div style={{ ...card, border: "1px solid rgba(0,212,255,0.15)", background: "rgba(0,212,255,0.03)", textAlign: "center" }}>
        <div style={{ fontSize: ".88rem", color: D.text, fontWeight: 500, marginBottom: ".4rem" }}>Having issues with your code?</div>
        <div style={{ fontSize: ".8rem", color: D.muted, fontWeight: 300, marginBottom: "1rem" }}>Contact support and we'll resolve it within 24 hours.</div>
        <button style={{ background: `linear-gradient(135deg,${D.cyan},${D.cyanDim})`, border: "none", borderRadius: 9, padding: ".65rem 1.6rem", color: D.bg, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: ".85rem", boxShadow: "0 0 18px rgba(0,212,255,0.22)", cursor: "pointer" }}>Contact Support</button>
      </div>
    </div>
  );
};

// ─── WORKFLOW / AUTOMATION VIEW (client-facing status, no internals) ───────────
const WorkflowView = () => {
  const card = { background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: "1.4rem 1.6rem" };

  const AUTOMATION_STATS = [
    { label: "Uptime This Month",   value: "99.7%",  sub: "2h 11m total downtime",     color: D.green  },
    { label: "Conversations Handled", value: "127",  sub: "100% by AI — no manual replies", color: D.cyan },
    { label: "Avg. Response Time",  value: "1.4s",   sub: "From message received to reply",  color: D.purple },
    { label: "Failed Deliveries",   value: "0",      sub: "All messages delivered",     color: D.green  },
  ];

  const HEALTH_CHECKS = [
    { label: "Facebook Page Connection", status: "Connected",    ok: true  },
    { label: "AI Agent",                 status: "Online",       ok: true  },
    { label: "Message Automation",       status: "Running",      ok: true  },
    { label: "Conversation Memory",      status: "Synced",       ok: true  },
    { label: "Knowledge Base",           status: "3 files loaded", ok: true },
    { label: "Subscription Status",      status: "Active",       ok: true  },
  ];

  const RECENT_LOGS = [
    { msg: "AI replied to +213 770 *** 421 in 1.2s",       time: "2m ago",  ok: true  },
    { msg: "AI replied to +213 555 *** 089 in 0.9s",       time: "14m ago", ok: true  },
    { msg: "Knowledge base updated — kaftan-colors.jpg",    time: "1h ago",  ok: true  },
    { msg: "AI replied to +213 661 *** 334 in 1.6s",       time: "3h ago",  ok: true  },
    { msg: "Message failed — customer blocked the number",  time: "5h ago",  ok: false },
    { msg: "AI replied to +213 540 *** 118 in 1.1s",       time: "6h ago",  ok: true  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem", animation: "fadeUp .5s ease" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        {AUTOMATION_STATS.map((s, i) => <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} delay={`${i * 0.06}s`} icon={<FlowIc size={16} color={s.color} />} />)}
      </div>

      {/* Health checks */}
      <div style={card}>
        <SectionHead icon={<svg width={16} height={16} viewBox="0 0 16 16" fill="none"><circle cx={8} cy={8} r={6} stroke={D.green} strokeWidth={1.4} /><path d="M5 8l2 2 4-4" stroke={D.green} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>} title="System Health" action={<Badge label="All Systems OK" color={D.green} />} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".65rem" }}>
          {HEALTH_CHECKS.map(({ label, status, ok }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".7rem .95rem", background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10 }}>
              <span style={{ fontSize: ".82rem", color: D.muted }}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: ok ? D.green : D.red, display: "inline-block" }} />
                <span style={{ fontSize: ".78rem", fontWeight: 600, color: ok ? D.green : D.red }}>{status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity log */}
      <div style={card}>
        <SectionHead icon={<BotIc size={16} />} title="Recent Automation Activity" />
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          {RECENT_LOGS.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: ".85rem", padding: ".6rem .75rem", borderRadius: 9, transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = D.surface2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.ok ? D.green : D.red, flexShrink: 0 }} />
              <span style={{ fontSize: ".82rem", color: D.text, fontWeight: 300, flex: 1, lineHeight: 1.55 }}>{l.msg}</span>
              <span style={{ fontSize: ".72rem", color: D.muted, flexShrink: 0 }}>{l.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ ...card, border: "1px solid rgba(155,100,255,0.15)" }}>
        <SectionHead icon={<FlowIc size={16} color={D.purple} />} title="Quick Actions" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".85rem" }}>
          {[
            { label: "Pause Automation", desc: "Temporarily stop all AI replies", color: D.orange, icon: "⏸️" },
            { label: "Contact Support",  desc: "Report an issue with your setup",  color: D.cyan,   icon: "🛠️" },
            { label: "Upgrade Plan",     desc: "Increase message & storage limits", color: D.purple, icon: "⬆️" },
          ].map(({ label, desc, color, icon }) => {
            const rgb = color === D.orange ? "255,107,43" : color === D.cyan ? "0,212,255" : "155,100,255";
            return (
              <button key={label} style={{ background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.15)`, borderRadius: 12, padding: "1rem 1.1rem", textAlign: "left", transition: "all .2s", cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.background = `rgba(${rgb},0.12)`; e.currentTarget.style.borderColor = `rgba(${rgb},0.3)`; }} onMouseLeave={e => { e.currentTarget.style.background = `rgba(${rgb},0.06)`; e.currentTarget.style.borderColor = `rgba(${rgb},0.15)`; }}>
                <div style={{ fontSize: "1.2rem", marginBottom: ".5rem" }}>{icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: ".88rem", color, marginBottom: ".25rem" }}>{label}</div>
                <div style={{ fontSize: ".75rem", color: D.muted, fontWeight: 300 }}>{desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const PAGE_META = {
    overview:      { title: "Dashboard Overview",      sub: `Welcome back, ${CLIENT.name} · ${CLIENT.plan} Plan`       },
    products:      { title: "My Products",             sub: "Products the AI uses to answer customer questions"         },
    conversations: { title: "Customer Conversations",  sub: "AI-handled conversation summaries"                         },
    data:          { title: "Knowledge Base",          sub: "Files and documents your AI uses to answer questions"      },
    usecode:       { title: "Activation Code",         sub: "Your account key — keep it private"                        },
    workflow:      { title: "Automation Status",       sub: "Live health and activity of your AI agent"                 },
  };

  return (
    <>
      <GlobalStyle />
      <ParticleCanvas />
      <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.5, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")` }} />
      <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 2 }}>
        <Sidebar active={activeTab} onChange={setActiveTab} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>
          <TopBar pageTitle={PAGE_META[activeTab].title} pageSubtitle={PAGE_META[activeTab].sub} />
          <div style={{ flex: 1, padding: "1.8rem 2rem", overflowY: "auto" }}>
            {activeTab === "overview"      && <OverviewView setActiveTab={setActiveTab} />}
            {activeTab === "products"      && <ProductsView />}
            {activeTab === "conversations" && <ConversationsView />}
            {activeTab === "data"          && <DataView />}
            {activeTab === "usecode"       && <UseCodeView />}
            {activeTab === "workflow"      && <WorkflowView />}
          </div>
        </div>
      </div>
    </>
  );
}
