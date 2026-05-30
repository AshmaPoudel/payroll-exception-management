import { useState, useEffect, useCallback } from "react";

// ── Tax Regimes ──────────────────────────────────────────────────────────────
const TAX_REGIMES = {
  us: {
    name: "US Federal Tax", currency: "USD", symbol: "$",
    info: "US federal income tax with FICA (Social Security + Medicare). State taxes not included. Standard deduction of $13,850 applied.",
    ssLabel: "Social Security (6.2%)",
    incomeTax: (g) => {
      const brackets = [[11000,0.10],[44725,0.12],[95375,0.22],[201050,0.24],[383900,0.32],[487450,0.35],[Infinity,0.37]];
      const sd = 13850; let taxable = Math.max(0, g - sd), tax = 0, prev = 0;
      for (const [top, rate] of brackets) {
        if (taxable <= 0) break;
        const slice = Math.min(taxable, top - prev); tax += slice * rate; taxable -= slice; prev = top;
      }
      return tax;
    },
    ss: (g) => Math.min(g, 160200) * 0.062,
    medicare: (g) => g * 0.0145,
  },
  uk: {
    name: "UK PAYE / National Insurance", currency: "GBP", symbol: "£",
    info: "UK income tax bands (20%, 40%, 45%) + Class 1 National Insurance. Personal allowance of £12,570.",
    ssLabel: "National Insurance",
    incomeTax: (g) => {
      const pa = 12570; let taxable = Math.max(0, g - pa), tax = 0;
      const t1 = Math.min(taxable, 37700); tax += t1 * 0.20; taxable -= t1;
      const t2 = Math.min(taxable, 112300); tax += t2 * 0.40; taxable -= t2;
      tax += Math.max(0, taxable) * 0.45;
      return tax;
    },
    ss: (g) => {
      const monthly = g / 12;
      const ni = Math.max(0, Math.min(monthly, 4189) - 1048) * 0.12 + Math.max(0, monthly - 4189) * 0.02;
      return ni * 12;
    },
    medicare: () => 0,
  },
  de: {
    name: "German Income Tax + SolZ", currency: "EUR", symbol: "€",
    info: "German progressive income tax + 5.5% solidarity surcharge. Social insurance ~19.5% employee share (health, pension, unemployment, care).",
    ssLabel: "Social Insurance (~19.5%)",
    incomeTax: (g) => {
      if (g <= 10908) return 0;
      if (g <= 15999) { const y = (g - 10908) / 10000; return (979.18 * y + 1400) * y; }
      if (g <= 62809) { const y = (g - 15999) / 10000; return (192.59 * y + 2397) * y + 966.53; }
      if (g <= 277825) return g * 0.42 - 9972.98;
      return g * 0.45 - 18307.73;
    },
    ss: (g) => g * 0.195,
    medicare: (g) => g * 0.014,
  },
  fr: {
    name: "French Income Tax + Social", currency: "EUR", symbol: "€",
    info: "French progressive income tax (0–45%). Employee social contributions ~22% on gross salary covering health, pension, unemployment.",
    ssLabel: "Social contributions (~22%)",
    incomeTax: (g) => {
      const brackets = [[10777,0],[27478,0.11],[78570,0.30],[168994,0.41],[Infinity,0.45]];
      let tax = 0, prev = 0;
      for (const [top, rate] of brackets) {
        const slice = Math.min(g, top) - prev; if (slice <= 0) break;
        tax += slice * rate; prev = top;
      }
      return tax;
    },
    ss: (g) => g * 0.22,
    medicare: () => 0,
  },
  au: {
    name: "Australian Tax + Medicare", currency: "AUD", symbol: "A$",
    info: "Australian progressive income tax + 2% Medicare levy. Employer superannuation (11%) shown as deduction from CTC perspective.",
    ssLabel: "Superannuation (11%)",
    incomeTax: (g) => {
      if (g <= 18200) return 0;
      if (g <= 45000) return (g - 18200) * 0.19;
      if (g <= 120000) return 5092 + (g - 45000) * 0.325;
      if (g <= 180000) return 29467 + (g - 120000) * 0.37;
      return 51667 + (g - 180000) * 0.45;
    },
    ss: (g) => g * 0.11,
    medicare: (g) => g * 0.02,
  },
  ca: {
    name: "Canada Federal Tax + CPP/EI", currency: "CAD", symbol: "C$",
    info: "Canadian federal income tax excluding provincial tax. CPP (5.7%) + EI (1.63%) contributions included.",
    ssLabel: "CPP + EI contributions",
    incomeTax: (g) => {
      const pa = 15000;
      const brackets = [[53359,0.15],[53359,0.205],[64313,0.26],[70245,0.29],[Infinity,0.33]];
      let taxable = Math.max(0, g - pa), tax = 0;
      for (const [band, rate] of brackets) {
        const slice = Math.min(taxable, band); tax += slice * rate; taxable -= slice; if (taxable <= 0) break;
      }
      return tax;
    },
    ss: (g) => Math.min(g, 66600) * 0.057,
    medicare: (g) => Math.min(g, 61500) * 0.0163,
  },
  sg: {
    name: "Singapore Income Tax + CPF", currency: "SGD", symbol: "S$",
    info: "Singapore progressive income tax. CPF employee contribution ~20% up to S$72,000 annual ordinary wages.",
    ssLabel: "CPF contribution (~20%)",
    incomeTax: (g) => {
      const bands = [[20000,0],[10000,0.02],[10000,0.035],[40000,0.07],[40000,0.115],[40000,0.15],[40000,0.18],[40000,0.19],[40000,0.195],[40000,0.20],[Infinity,0.22]];
      let rem = g, tax = 0;
      for (const [band, rate] of bands) {
        const slice = Math.min(rem, band); tax += slice * rate; rem -= slice; if (rem <= 0) break;
      }
      return tax;
    },
    ss: (g) => Math.min(g, 72000) * 0.20,
    medicare: () => 0,
  },
  jp: {
    name: "Japan Income Tax + Social", currency: "JPY", symbol: "¥",
    info: "Japanese national income tax (5–45%). Social insurance (health + pension) ~15% employee share. Resident tax not included.",
    ssLabel: "Social insurance (~15%)",
    incomeTax: (g) => {
      const brackets = [[1950000,0.05],[1950000,0.10],[1950000,0.20],[2250000,0.23],[4000000,0.33],[Infinity,0.40]];
      let rem = g, tax = 0;
      for (const [band, rate] of brackets) {
        const slice = Math.min(rem, band); tax += slice * rate; rem -= slice; if (rem <= 0) break;
      }
      return tax;
    },
    ss: (g) => g * 0.15,
    medicare: () => 0,
  },
  th: {
    name: "Thailand Personal Income Tax", currency: "THB", symbol: "฿",
    info: "Thai PIT with personal allowance ฿60,000 + 50% employment income deduction (max ฿100,000). Social security 5% capped at ฿180k/yr.",
    ssLabel: "Social Security (5% capped)",
    incomeTax: (g) => {
      const taxable = Math.max(0, g - 60000 - Math.min(g * 0.50, 100000));
      const brackets = [[150000,0],[150000,0.05],[200000,0.10],[250000,0.15],[250000,0.20],[500000,0.25],[750000,0.30],[Infinity,0.35]];
      let rem = taxable, tax = 0;
      for (const [band, rate] of brackets) {
        const slice = Math.min(rem, band); tax += slice * rate; rem -= slice; if (rem <= 0) break;
      }
      return tax;
    },
    ss: (g) => Math.min(g, 180000) * 0.05,
    medicare: () => 0,
  },
  ae: {
    name: "UAE — Zero Income Tax", currency: "AED", symbol: "AED ",
    info: "The UAE levies no personal income tax. UAE national employees pay social security (5% employee). Expats have no mandatory deductions.",
    ssLabel: "Social Security (UAE nationals)",
    incomeTax: () => 0,
    ss: () => 0,
    medicare: () => 0,
  },
  in: {
    name: "India New Tax Regime (FY 2024-25)", currency: "INR", symbol: "₹",
    info: "India new tax regime. PF contribution 12% on basic salary (estimated at 50% of gross). Health & Education Cess 4% on tax.",
    ssLabel: "Provident Fund (12% on basic)",
    incomeTax: (g) => {
      const brackets = [[300000,0],[300000,0.05],[300000,0.10],[300000,0.15],[300000,0.20],[Infinity,0.30]];
      let rem = g, tax = 0;
      for (const [band, rate] of brackets) {
        const slice = Math.min(rem, band); tax += slice * rate; rem -= slice; if (rem <= 0) break;
      }
      return tax * 1.04;
    },
    ss: (g) => g * 0.50 * 0.12,
    medicare: () => 0,
  },
  nl: {
    name: "Netherlands Box 1 Tax", currency: "EUR", symbol: "€",
    info: "Dutch Box 1 income tax including national insurance premiums (AOW/ANW/WLZ). Two-bracket system as of 2024.",
    ssLabel: "National insurance (included in rate)",
    incomeTax: (g) => {
      if (g <= 73031) return g * 0.3693;
      return 73031 * 0.3693 + (g - 73031) * 0.495;
    },
    ss: () => 0,
    medicare: () => 0,
  },
};

const COUNTRIES = [
  { code: "us", flag: "🇺🇸", name: "United States", currency: "USD", symbol: "$" },
  { code: "uk", flag: "🇬🇧", name: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "de", flag: "🇩🇪", name: "Germany", currency: "EUR", symbol: "€" },
  { code: "fr", flag: "🇫🇷", name: "France", currency: "EUR", symbol: "€" },
  { code: "au", flag: "🇦🇺", name: "Australia", currency: "AUD", symbol: "A$" },
  { code: "ca", flag: "🇨🇦", name: "Canada", currency: "CAD", symbol: "C$" },
  { code: "sg", flag: "🇸🇬", name: "Singapore", currency: "SGD", symbol: "S$" },
  { code: "jp", flag: "🇯🇵", name: "Japan", currency: "JPY", symbol: "¥" },
  { code: "th", flag: "🇹🇭", name: "Thailand", currency: "THB", symbol: "฿" },
  { code: "ae", flag: "🇦🇪", name: "UAE", currency: "AED", symbol: "AED " },
  { code: "in", flag: "🇮🇳", name: "India", currency: "INR", symbol: "₹" },
  { code: "nl", flag: "🇳🇱", name: "Netherlands", currency: "EUR", symbol: "€" },
];

const FREQ_OPTIONS = [
  { key: "weekly", label: "Weekly", divisor: 52 },
  { key: "biweekly", label: "Bi-weekly", divisor: 26 },
  { key: "monthly", label: "Monthly", divisor: 12 },
  { key: "annually", label: "Annual", divisor: 1 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n, sym = "$", decimals = 0) {
  if (!n || isNaN(n)) return sym + "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return sym + (n / 1_000_000).toFixed(2) + "M";
  return sym + Math.round(n).toLocaleString();
}

function calcTax(gross, countryCode, pensionPct, healthMo, otherMo) {
  const r = TAX_REGIMES[countryCode];
  const pensionAnn = gross * (pensionPct / 100);
  const healthAnn = healthMo * 12;
  const otherAnn = otherMo * 12;
  const incomeTax = r.incomeTax(gross);
  const ss = r.ss(gross);
  const medicare = r.medicare(gross);
  const totalTax = incomeTax + ss + medicare;
  const totalDed = pensionAnn + healthAnn + otherAnn;
  const net = gross - totalTax - totalDed;
  return { incomeTax, ss, medicare, totalTax, pensionAnn, healthAnn, otherAnn, totalDed, net };
}

// ── Styles (inline so it's one self-contained file) ──────────────────────────
const S = {
  shell: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', system-ui, sans-serif" },
  header: {
    background: "#0f2044",
    padding: "0 2rem",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: 64, borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  headerBrand: { display: "flex", alignItems: "center", gap: 12 },
  headerIconBox: {
    width: 36, height: 36, borderRadius: 10,
    background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: 600, color: "#fff", letterSpacing: "0.01em" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 },
  headerBadge: {
    fontSize: 11, padding: "3px 12px", borderRadius: 20,
    background: "rgba(37,99,235,0.2)", color: "#93b4f5",
    border: "0.5px solid rgba(37,99,235,0.35)", letterSpacing: "0.04em",
  },
  nav: {
    background: "#162952",
    padding: "0 2rem", display: "flex",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  navItem: (active, disabled) => ({
    padding: "0 1.25rem", height: 46, display: "flex", alignItems: "center", gap: 7,
    fontSize: 13, fontWeight: 500,
    color: active ? "#fff" : disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)",
    borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap",
    transition: "color 0.15s",
  }),
  main: { padding: "2rem", maxWidth: 820, margin: "0 auto" },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.09em",
    textTransform: "uppercase", color: "#64748b", marginBottom: "1rem",
  },
  card: {
    background: "#fff", borderRadius: 14,
    border: "0.5px solid #e2e8f0", padding: "1.5rem", marginBottom: "1.25rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "#64748b", marginBottom: "1.5rem" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "#475569", letterSpacing: "0.03em" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputPrefix: {
    position: "absolute", left: 10, fontSize: 13, fontWeight: 600,
    color: "#64748b", pointerEvents: "none", zIndex: 1,
  },
  inputSuffix: {
    position: "absolute", right: 10, fontSize: 11, fontWeight: 600,
    color: "#94a3b8", pointerEvents: "none",
  },
  input: (hasPre, hasSuf) => ({
    width: "100%", height: 40, paddingLeft: hasPre ? 26 : 12,
    paddingRight: hasSuf ? 48 : 12,
    borderRadius: 8, border: "0.5px solid #cbd5e1",
    fontSize: 14, background: "#fff", color: "#0f172a",
    fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
  }),
  select: {
    width: "100%", height: 40, padding: "0 12px",
    borderRadius: 8, border: "0.5px solid #cbd5e1",
    fontSize: 14, background: "#fff", color: "#0f172a",
    fontFamily: "inherit", outline: "none",
  },
  divider: { height: "0.5px", background: "#e2e8f0", margin: "1.25rem 0" },

  previewCard: {
    background: "linear-gradient(135deg, #0f2044 0%, #1e3a6e 100%)",
    borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  previewTitle: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.4)", marginBottom: "1.25rem" },
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" },
  pvMetricLabel: { fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 4 },
  pvMetricValue: (variant) => ({
    fontSize: 22, fontWeight: 700,
    color: variant === "positive" ? "#4ade80" : variant === "muted" ? "rgba(255,255,255,0.6)" : "#fff",
  }),
  pvMetricSub: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 },

  breakdownRow: (isTotal) => ({
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: isTotal ? "14px 0 0" : "9px 0",
    borderBottom: isTotal ? "none" : "0.5px solid #f1f5f9",
    fontSize: 13,
  }),
  brkLabel: { display: "flex", alignItems: "center", gap: 8, color: "#475569" },
  brkVal: (type) => ({
    fontWeight: type === "net" ? 700 : 600,
    fontSize: type === "net" ? 15 : 13,
    color: type === "net" ? "#16a34a" : type === "ded" ? "#e24b4a" : "#0f172a",
  }),
  dot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }),

  toggleGroup: {
    display: "flex", border: "0.5px solid #cbd5e1", borderRadius: 8, overflow: "hidden",
  },
  toggleBtn: (active) => ({
    flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 600, cursor: "pointer",
    background: active ? "#1d4ed8" : "transparent", color: active ? "#fff" : "#64748b",
    border: "none", fontFamily: "inherit", transition: "background 0.15s, color 0.15s",
  }),

  infoBox: {
    background: "#f0f9ff", border: "0.5px solid #bae6fd", borderRadius: 8,
    padding: "10px 14px", fontSize: 12, color: "#0369a1", marginTop: 8,
    lineHeight: 1.6,
  },

  actionRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem" },
  btnPrimary: {
    background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8,
    padding: "0 1.5rem", height: 42, fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
  },
  btnSecondary: {
    background: "transparent", color: "#475569",
    border: "0.5px solid #cbd5e1", borderRadius: 8,
    padding: "0 1.25rem", height: 42, fontSize: 14, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
  },
  savedPill: {
    fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 5, fontWeight: 500,
  },
};

// ── Icon SVG snippets (inline, no external deps) ─────────────────────────────
const Icon = ({ name, size = 16, style = {} }) => {
  const paths = {
    calc: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v2h10V7H7zm0 4v2h3v-2H7zm5 0v2h3v-2h-3zm-5 4v2h3v-2H7zm5 0v2h3v-2h-3z",
    globe: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2c1.1 0 2.4.9 3.4 2.6A13 13 0 0 1 16.5 10h-9a13 13 0 0 1 1.1-3.4C9.6 4.9 10.9 4 12 4zM4.1 10h3.4a17 17 0 0 0-.5 2H4a8 8 0 0 1 .1-2zm-.1 4h3c.1.7.3 1.4.5 2H4.1A8 8 0 0 1 4 14zm1.1 4h2.4A8.5 8.5 0 0 0 9 20a8 8 0 0 1-3.9-2zm5.9 2c-1-.2-2.2-1.1-3.1-2.6A11 11 0 0 1 7.5 16h9a11 11 0 0 1-.9 1.4C14.8 18.9 13.2 20 12 20zm4.9-2a8 8 0 0 1-3.9 2 8.5 8.5 0 0 0 1.5-2h2.4zm1.1-4h-3c-.2-.6-.3-1.3-.5-2h3.4A8 8 0 0 1 20 14zm-.1-4h-3a17 17 0 0 0-.5-2h3.4A8 8 0 0 1 19.9 10z",
    user: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.3 0-8 2.7-8 4v1h16v-1c0-1.3-2.7-4-8-4z",
    receipt: "M4 2h16a1 1 0 0 1 1 1v18l-3-2-2 2-2-2-2 2-2-2-3 2V3a1 1 0 0 1 1-1zm4 6h8v2H8V8zm0 4h8v2H8v-2z",
    briefcase: "M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-10-2h4v2h-4V5zm10 15H4V9h16v11z",
    dashboard: "M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z",
    bank: "M12 2L2 7v2h20V7L12 2zM4 11v8H2v2h20v-2h-2v-8h-2v8h-4v-8h-2v8H8v-8H4z",
    piggy: "M19.2 8c-.4-2.3-2.4-4-4.7-4-.7 0-1.4.2-2 .5A5 5 0 0 0 8 8H6a3 3 0 0 0 0 6h.1A7 7 0 0 0 12 18a7 7 0 0 0 5.9-4H19a3 3 0 0 0 0-6h-.8zM12 16a5 5 0 0 1-4.9-4h9.8A5 5 0 0 1 12 16z",
    shield: "M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
    check: "M5 13l4 4L19 7",
    refresh: "M4 4v5h.6l2.8-2.8A7 7 0 0 1 19 12a7 7 0 0 1-7 7 7 7 0 0 1-7-7H3a9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-6.3 2.6L3 9V4H4z",
    arrow: "M5 12h14M12 5l7 7-7 7",
    info: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 14h-2v-6h2v6zm0-8h-2V6h2v2z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={paths[name] || ""} />
    </svg>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, show }) {
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
      background: "#0f2044", color: "#fff", padding: "10px 20px", borderRadius: 10,
      fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
      border: "0.5px solid rgba(255,255,255,0.12)",
      opacity: show ? 1 : 0, transition: "opacity 0.25s", pointerEvents: "none", zIndex: 100,
    }}>
      {msg}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PayrollSim() {
  const [name, setName] = useState("");
  const [empType, setEmpType] = useState("employee");
  const [country, setCountry] = useState("us");
  const [salary, setSalary] = useState("");
  const [freq, setFreq] = useState("monthly");
  const [pensionPct, setPensionPct] = useState("");
  const [healthMo, setHealthMo] = useState("");
  const [otherMo, setOtherMo] = useState("");
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [loaded, setLoaded] = useState(false);

  const countryData = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];
  const regime = TAX_REGIMES[country];
  const gross = parseFloat(salary) || 0;
  const calc = calcTax(gross, country, parseFloat(pensionPct) || 0, parseFloat(healthMo) || 0, parseFloat(otherMo) || 0);
  const freqInfo = FREQ_OPTIONS.find(f => f.key === freq) || FREQ_OPTIONS[2];
  const effectiveRate = gross > 0 ? (calc.totalTax / gross * 100) : 0;
  const sym = countryData.symbol;

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  };

  // Persist
  useEffect(() => {
    if (!loaded) return;
    const data = { name, empType, country, salary, freq, pensionPct, healthMo, otherMo };
    try { window.storage?.set("payrollsim:salary", JSON.stringify(data)); } catch (e) {}
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(t);
  }, [name, empType, country, salary, freq, pensionPct, healthMo, otherMo]);

  useEffect(() => {
    async function load() {
      try {
        const res = await window.storage?.get("payrollsim:salary");
        if (res?.value) {
          const d = JSON.parse(res.value);
          if (d.name) setName(d.name);
          if (d.empType) setEmpType(d.empType);
          if (d.country) setCountry(d.country);
          if (d.salary) setSalary(d.salary);
          if (d.freq) setFreq(d.freq);
          if (d.pensionPct) setPensionPct(d.pensionPct);
          if (d.healthMo) setHealthMo(d.healthMo);
          if (d.otherMo) setOtherMo(d.otherMo);
          showToast("✓ Previous session restored");
        }
      } catch (e) {}
      setLoaded(true);
    }
    load();
  }, []);

  const handleReset = () => {
    setName(""); setEmpType("employee"); setCountry("us"); setSalary("");
    setFreq("monthly"); setPensionPct(""); setHealthMo(""); setOtherMo("");
    try { window.storage?.delete("payrollsim:salary"); } catch (e) {}
    showToast("Reset complete");
  };

  const handleContinue = () => {
    if (!name.trim()) { showToast("⚠ Please enter your name"); return; }
    if (!salary || gross <= 0) { showToast("⚠ Please enter a valid salary"); return; }
    showToast("✓ Saved! Ready to add expenses.");
  };

  // Input style helper
  const inp = (hasPre, hasSuf) => ({
    ...S.input(hasPre, hasSuf),
    fontFamily: "inherit",
  });

  return (
    <div style={S.shell}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerBrand}>
          <div style={S.headerIconBox}>
            <Icon name="calc" size={18} style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={S.headerTitle}>PayrollSim</div>
            <div style={S.headerSub}>Global Payroll & Expense Simulator</div>
          </div>
        </div>
        <span style={S.headerBadge}>
          <Icon name="globe" size={11} style={{ color: "#93b4f5", marginRight: 4, verticalAlign: -1 }} />
          Multi-country
        </span>
      </header>

      {/* Nav */}
      <nav style={S.nav}>
        {[
          { key: "salary", label: "Salary Setup", icon: "user", step: 1 },
          { key: "expenses", label: "Expenses", icon: "receipt", step: 2 },
          { key: "reimburse", label: "Reimbursements", icon: "briefcase", step: 3 },
          { key: "dashboard", label: "Dashboard", icon: "dashboard", step: 4 },
        ].map(({ key, label, icon, step }) => (
          <div key={key} style={S.navItem(key === "salary", step > 1)}>
            <Icon name={icon} size={15} />
            {label}
          </div>
        ))}
      </nav>

      {/* Main */}
      <div style={S.main}>
        <p style={S.sectionLabel}>Step 1 of 4 — Your Salary Profile</p>

        {/* Personal Details */}
        <div style={S.card}>
          <div style={S.cardTitle}>Personal & Employment Details</div>
          <div style={S.cardDesc}>Enter your name and select your employment type and country to tailor tax calculations.</div>
          <div style={{ ...S.grid2, marginBottom: "1rem" }}>
            <div style={S.field}>
              <label style={S.label}>Full name <span style={{ color: "#e24b4a" }}>*</span></label>
              <input style={inp(false, false)} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div style={S.field}>
              <label style={S.label}>Employment type <span style={{ color: "#e24b4a" }}>*</span></label>
              <select style={S.select} value={empType} onChange={e => setEmpType(e.target.value)}>
                <option value="employee">Full-time Employee</option>
                <option value="contractor">Independent Contractor</option>
                <option value="parttime">Part-time Employee</option>
                <option value="selfemployed">Self-employed</option>
              </select>
            </div>
          </div>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Country <span style={{ color: "#e24b4a" }}>*</span></label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>{countryData.flag}</span>
                <select style={{ ...S.select, flex: 1 }} value={country} onChange={e => setCountry(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Currency</label>
              <input
                style={{ ...inp(false, false), color: "#64748b" }}
                value={`${countryData.currency} — ${countryData.name} ${countryData.currency === "USD" ? "Dollar" : countryData.currency === "GBP" ? "Pound" : countryData.currency === "EUR" ? "Euro" : countryData.currency}`}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Salary */}
        <div style={S.card}>
          <div style={S.cardTitle}>Salary & Pay Frequency</div>
          <div style={{ ...S.grid2, marginBottom: "1rem" }}>
            <div style={S.field}>
              <label style={S.label}>Gross annual salary <span style={{ color: "#e24b4a" }}>*</span></label>
              <div style={S.inputWrap}>
                <span style={S.inputPrefix}>{sym}</span>
                <input style={inp(true, false)} type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="75000" min="0" step="1000" />
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Pay frequency</label>
              <div style={S.toggleGroup}>
                {FREQ_OPTIONS.map(f => (
                  <button key={f.key} style={S.toggleBtn(freq === f.key)} onClick={() => setFreq(f.key)}>{f.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={S.divider} />
          <div style={{ ...S.grid3, marginBottom: "1rem" }}>
            <div style={S.field}>
              <label style={S.label}>Pension / 401(k)</label>
              <div style={S.inputWrap}>
                <input style={inp(false, true)} type="number" value={pensionPct} onChange={e => setPensionPct(e.target.value)} placeholder="5" min="0" max="50" step="0.5" />
                <span style={S.inputSuffix}>% / yr</span>
              </div>
            </div>
            <div style={S.field}>
              <label style={S.label}>Health insurance</label>
              <div style={S.inputWrap}>
                <span style={S.inputPrefix}>{sym}</span>
                <input style={inp(true, false)} type="number" value={healthMo} onChange={e => setHealthMo(e.target.value)} placeholder="250" min="0" step="10" />
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>per month</span>
            </div>
            <div style={S.field}>
              <label style={S.label}>Other pre-tax deductions</label>
              <div style={S.inputWrap}>
                <span style={S.inputPrefix}>{sym}</span>
                <input style={inp(true, false)} type="number" value={otherMo} onChange={e => setOtherMo(e.target.value)} placeholder="0" min="0" step="10" />
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>per month</span>
            </div>
          </div>
          <div style={S.infoBox}>
            <strong style={{ fontWeight: 600 }}>{regime.name}:</strong> {regime.info}
          </div>
        </div>

        {/* Live Preview */}
        <div style={S.previewCard}>
          <div style={S.previewTitle}>Live pay preview — {country.toUpperCase()} {countryData.currency}</div>
          <div style={S.previewGrid}>
            {[
              { label: "Gross annual", val: fmt(gross, sym), sub: gross > 0 ? fmt(gross / freqInfo.divisor, sym) + " /" + freqInfo.key : "—", variant: "normal" },
              { label: "Est. total tax", val: fmt(calc.totalTax, sym), sub: effectiveRate.toFixed(1) + "% effective rate", variant: "muted" },
              { label: "Deductions", val: fmt(calc.totalDed, sym), sub: "pension + insurance", variant: "muted" },
              { label: "Est. net annual", val: fmt(calc.net, sym), sub: fmt(calc.net / 12, sym) + " / month", variant: "positive" },
            ].map(({ label, val, sub, variant }) => (
              <div key={label}>
                <div style={S.pvMetricLabel}>{label}</div>
                <div style={S.pvMetricValue(variant)}>{val}</div>
                <div style={S.pvMetricSub}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div style={S.card}>
          <div style={S.cardTitle}>Tax & Deduction Breakdown</div>
          <div style={{ marginTop: 12 }}>
            {[
              { label: "Gross salary", val: fmt(gross, sym) + " / yr", type: "gross", icon: null, dot: "#3b82f6" },
              { label: "Income tax", val: "−" + fmt(calc.incomeTax, sym), type: "ded", icon: "bank" },
              { label: regime.ssLabel, val: "−" + fmt(calc.ss, sym), type: "ded", icon: "user" },
              { label: "Medicare / Health levy", val: "−" + fmt(calc.medicare, sym), type: "ded", icon: "shield" },
              { label: "Pension / Retirement", val: "−" + fmt(calc.pensionAnn, sym), type: "ded", icon: "piggy" },
              { label: "Health insurance", val: "−" + fmt(calc.healthAnn, sym), type: "ded", icon: "shield" },
            ].map((row) => (
              <div key={row.label} style={S.breakdownRow(false)}>
                <span style={S.brkLabel}>
                  {row.dot ? <span style={S.dot(row.dot)} /> : <Icon name={row.icon} size={14} style={{ color: "#94a3b8" }} />}
                  {row.label}
                </span>
                <span style={S.brkVal(row.type)}>{row.val}</span>
              </div>
            ))}
            <div style={S.breakdownRow(true)}>
              <span style={{ ...S.brkLabel, fontWeight: 700, color: "#0f172a" }}>
                <span style={S.dot("#16a34a")} />
                Estimated net take-home
              </span>
              <span style={S.brkVal("net")}>{fmt(calc.net, sym)} / yr</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={S.actionRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.btnSecondary} onClick={handleReset}>
              <Icon name="refresh" size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Reset
            </button>
            {saved && (
              <div style={S.savedPill}>
                <Icon name="check" size={13} />
                Saved
              </div>
            )}
          </div>
          <button style={S.btnPrimary} onClick={handleContinue}>
            <Icon name="arrow" size={16} />
            Save & Continue to Expenses
          </button>
        </div>
      </div>

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  );
}
