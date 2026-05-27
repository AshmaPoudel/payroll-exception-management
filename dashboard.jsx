import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const CSV_DATA = `Ticket ID,Date Submitted,Employee ID,Issue Description,Category,Region,Severity,SLA Target,Assigned To,Escalation Rule,Estimated Impact (USD),Status,Resolution Time (hrs)
TKT-001,2024-01-03,EMP-1042,Overtime not calculated correctly,Overtime,West,High,24hrs,Alice Morgan,Escalate if >24hrs,1250,Resolved,18.5
TKT-002,2024-01-05,EMP-2031,Missing bonus payment,Bonus,East,Critical,12hrs,Bob Chen,Escalate if >12hrs,4800,Open,
TKT-003,2024-01-05,EMP-3078,Wrong tax withholding,Tax,Central,Medium,48hrs,Carol Davis,Escalate if >48hrs,670,In Progress,
TKT-004,2024-01-06,EMP-1155,Deduction applied twice,Deduction,West,High,24hrs,Alice Morgan,Escalate if >24hrs,930,Resolved,22.0
TKT-005,2024-01-07,EMP-4201,Base salary discrepancy,Salary,East,Critical,12hrs,Bob Chen,Escalate if >12hrs,5200,Open,
TKT-006,2024-01-08,EMP-2087,PTO payout missing,PTO,South,Medium,48hrs,Dana Lee,Escalate if >48hrs,420,Resolved,31.0
TKT-007,2024-01-09,EMP-3310,Commission not paid,Commission,West,High,24hrs,Alice Morgan,Escalate if >24hrs,2100,In Progress,
TKT-008,2024-01-10,EMP-1099,Shift differential error,Overtime,Central,Low,72hrs,Eve Torres,Escalate if >72hrs,310,Resolved,45.0
TKT-009,2024-01-11,EMP-5021,Garnishment not applied,Deduction,East,High,24hrs,Bob Chen,Escalate if >24hrs,780,Open,
TKT-010,2024-01-12,EMP-2245,Retroactive pay missing,Salary,South,Critical,12hrs,Dana Lee,Escalate if >12hrs,6100,Escalated,
TKT-011,2024-01-13,EMP-3087,Health benefit deduction wrong,Deduction,West,Medium,48hrs,Alice Morgan,Escalate if >48hrs,540,Resolved,29.0
TKT-012,2024-01-14,EMP-1378,Night shift premium missing,Overtime,North,High,24hrs,Frank Yuen,Escalate if >24hrs,1450,In Progress,
TKT-013,2024-01-15,EMP-4409,Severance not processed,Salary,East,Critical,12hrs,Bob Chen,Escalate if >12hrs,8900,Escalated,
TKT-014,2024-01-15,EMP-2563,Duplicate paycheck issued,Salary,Central,Critical,12hrs,Carol Davis,Escalate if >12hrs,3200,Open,
TKT-015,2024-01-16,EMP-3671,401k match missing,Deduction,South,Medium,48hrs,Dana Lee,Escalate if >48hrs,890,Resolved,52.0
TKT-016,2024-01-17,EMP-1802,Wrong pay period dates,Salary,West,Low,72hrs,Alice Morgan,Escalate if >72hrs,220,Resolved,60.0
TKT-017,2024-01-18,EMP-5134,Unpaid holiday pay,PTO,North,High,24hrs,Frank Yuen,Escalate if >24hrs,1100,In Progress,
TKT-018,2024-01-19,EMP-2790,Stock option deduction error,Deduction,East,Medium,48hrs,Bob Chen,Escalate if >48hrs,650,Open,
TKT-019,2024-01-20,EMP-3902,Relocation bonus not paid,Bonus,Central,High,24hrs,Carol Davis,Escalate if >24hrs,3500,Escalated,
TKT-020,2024-01-21,EMP-1677,Incorrect FICA calculation,Tax,South,High,24hrs,Dana Lee,Escalate if >24hrs,980,Resolved,20.0
TKT-021,2024-01-22,EMP-4811,Wage garnishment excess,Deduction,West,High,24hrs,Alice Morgan,Escalate if >24hrs,720,In Progress,
TKT-022,2024-01-23,EMP-2034,Paycheck not issued,Salary,North,Critical,12hrs,Frank Yuen,Escalate if >12hrs,4400,Open,
TKT-023,2024-01-24,EMP-3156,Sign-on bonus missing,Bonus,East,High,24hrs,Bob Chen,Escalate if >24hrs,2800,Resolved,23.5
TKT-024,2024-01-25,EMP-1523,Leave balance error,PTO,Central,Medium,48hrs,Carol Davis,Escalate if >48hrs,310,Resolved,44.0
TKT-025,2024-01-26,EMP-5267,Union dues not deducted,Deduction,South,Low,72hrs,Dana Lee,Escalate if >72hrs,180,Resolved,68.0
TKT-026,2024-01-27,EMP-2419,Hazard pay not included,Overtime,West,High,24hrs,Alice Morgan,Escalate if >24hrs,1680,In Progress,
TKT-027,2024-01-28,EMP-3845,Direct deposit routing error,Salary,North,Critical,12hrs,Frank Yuen,Escalate if >12hrs,5500,Escalated,
TKT-028,2024-01-29,EMP-1934,Performance bonus underpaid,Bonus,East,High,24hrs,Bob Chen,Escalate if >24hrs,2200,Open,
TKT-029,2024-01-30,EMP-4078,State tax over-withheld,Tax,Central,Medium,48hrs,Carol Davis,Escalate if >48hrs,430,Resolved,39.0
TKT-030,2024-01-31,EMP-2601,Workers comp deduction error,Deduction,South,Low,72hrs,Dana Lee,Escalate if >72hrs,260,In Progress,
TKT-031,2024-02-01,EMP-3290,Vacation payout incorrect,PTO,West,Medium,48hrs,Alice Morgan,Escalate if >48hrs,870,Open,
TKT-032,2024-02-02,EMP-1745,Car allowance missing,Bonus,North,Medium,48hrs,Frank Yuen,Escalate if >48hrs,600,Resolved,41.0
TKT-033,2024-02-03,EMP-5389,Overtime rate miscalculated,Overtime,East,High,24hrs,Bob Chen,Escalate if >24hrs,1320,In Progress,
TKT-034,2024-02-04,EMP-2167,Final paycheck delayed,Salary,Central,Critical,12hrs,Carol Davis,Escalate if >12hrs,3900,Escalated,
TKT-035,2024-02-05,EMP-3512,Medicare surcharge error,Tax,South,Medium,48hrs,Dana Lee,Escalate if >48hrs,520,Open,
TKT-036,2024-02-06,EMP-1389,Shift swap pay missing,Overtime,West,High,24hrs,Alice Morgan,Escalate if >24hrs,940,Resolved,19.0
TKT-037,2024-02-07,EMP-4623,Pension contribution wrong,Deduction,North,High,24hrs,Frank Yuen,Escalate if >24hrs,1150,In Progress,
TKT-038,2024-02-08,EMP-2856,Referral bonus not paid,Bonus,East,Medium,48hrs,Bob Chen,Escalate if >48hrs,750,Open,
TKT-039,2024-02-09,EMP-3078,Jury duty pay missing,PTO,Central,Low,72hrs,Carol Davis,Escalate if >72hrs,290,Resolved,55.0
TKT-040,2024-02-10,EMP-1501,Double tax withholding,Tax,South,High,24hrs,Dana Lee,Escalate if >24hrs,1080,Escalated,
TKT-041,2024-02-11,EMP-5012,Unpaid expense reimbursement,Bonus,West,Medium,48hrs,Alice Morgan,Escalate if >48hrs,480,In Progress,
TKT-042,2024-02-12,EMP-2378,Salary advance not deducted,Deduction,North,Low,72hrs,Frank Yuen,Escalate if >72hrs,200,Resolved,70.0
TKT-043,2024-02-13,EMP-3734,On-call pay omitted,Overtime,East,High,24hrs,Bob Chen,Escalate if >24hrs,1560,Open,
TKT-044,2024-02-14,EMP-1867,Maternity leave pay error,PTO,Central,Critical,12hrs,Carol Davis,Escalate if >12hrs,7200,Escalated,
TKT-045,2024-02-15,EMP-4290,Local tax not withheld,Tax,South,Medium,48hrs,Dana Lee,Escalate if >48hrs,370,In Progress,
TKT-046,2024-02-16,EMP-2045,Equity vesting payout wrong,Bonus,West,High,24hrs,Alice Morgan,Escalate if >24hrs,4100,Open,
TKT-047,2024-02-17,EMP-3567,Bereavement pay missing,PTO,North,High,24hrs,Frank Yuen,Escalate if >24hrs,880,Resolved,21.0
TKT-048,2024-02-18,EMP-1234,Incorrect pay grade applied,Salary,East,High,24hrs,Bob Chen,Escalate if >24hrs,2600,In Progress,
TKT-049,2024-02-19,EMP-5078,FSA contribution error,Deduction,Central,Medium,48hrs,Carol Davis,Escalate if >48hrs,340,Open,
TKT-050,2024-02-20,EMP-2712,Incentive pay calculation wrong,Commission,South,High,24hrs,Dana Lee,Escalate if >24hrs,1900,In Progress,
TKT-051,2024-02-21,EMP-3901,Payroll system sync failure,Salary,West,Critical,12hrs,Alice Morgan,Escalate if >12hrs,9500,Escalated,`;

function parseData() {
  return Papa.parse(CSV_DATA.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true }).data;
}

const SLA_HOURS = { "12hrs": 12, "24hrs": 24, "48hrs": 48, "72hrs": 72 };
const isSLABreached = t => t.Status !== "Resolved" && (new Date("2024-02-22") - new Date(t["Date Submitted"])) / 36e5 > (SLA_HOURS[t["SLA Target"]] || 24);
const isAtRisk = t => t.Status !== "Resolved" && !isSLABreached(t) && (new Date("2024-02-22") - new Date(t["Date Submitted"])) / 36e5 > (SLA_HOURS[t["SLA Target"]] || 24) * 0.75;

const DONUT_COLORS = ["#1e3a5f","#2e6da4","#c0392b","#d35400","#1a6b3a","#7d3c98","#148f77","#b7770d"];
const SEV_COLOR = { Critical: "#b91c1c", High: "#b45309", Medium: "#1d4ed8", Low: "#15803d" };
const SEV_BG   = { Critical: "#fee2e2", High: "#fef3c7", Medium: "#dbeafe", Low: "#dcfce7" };
const STATUS_COLOR = { Open: "#d35400", "In Progress": "#2e6da4", Resolved: "#1a6b3a", Escalated: "#c0392b" };
const STATUS_BG    = { Open: "#fef3ec", "In Progress": "#e8f0fb", Resolved: "#e8f5ee", Escalated: "#fdecea" };

const CARD_CONFIG = [
  { key: "open",   label: "Open Tickets",      icon: "🎫", color: "#1e3a5f", light: "#e8f0fb", sub: m => `${((m.open/51)*100).toFixed(0)}% of total` },
  { key: "sla",    label: "SLA Breaches",       icon: "⚠️", color: "#c0392b", light: "#fdecea", sub: m => m.sla > 0 ? "Needs attention" : "All clear" },
  { key: "risk",   label: "At Risk",            icon: "🔔", color: "#d35400", light: "#fef3ec", sub: m => m.risk > 0 ? "Monitor closely" : "On track" },
  { key: "impact", label: "Total Impact Value", icon: "💵", color: "#1a6b3a", light: "#e8f5ee", sub: () => "Across 51 tickets" },
];

const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + r * Math.sin(-midAngle * Math.PI / 180);
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{`${(percent*100).toFixed(0)}%`}</text>;
};

const BarLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 6} fill="#4a5568" textAnchor="middle" fontSize={12} fontWeight={700}>{value}</text>
);

const Badge = ({ label, color, bg, flash }) => (
  <>
    {flash && (
      <style>{`@keyframes flashRed { 0%,100%{background:#fdecea;color:#c0392b;} 50%{background:#c0392b;color:#fff;} }`}</style>
    )}
    <span style={{
      fontSize: 11, fontWeight: 700, color, background: bg,
      padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
      animation: flash ? "flashRed 1.2s ease-in-out infinite" : "none"
    }}>{label}</span>
  </>
);

const SEVERITIES = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES   = ["All", "Open", "In Progress", "Escalated", "Resolved"];

export default function App() {
  const [data, setData]         = useState([]);
  const [metrics, setMetrics]   = useState(null);
  const [search, setSearch]     = useState("");
  const [sevFilter, setSev]     = useState("All");
  const [statusFilter, setStat] = useState("All");
  const [catFilter, setCat]     = useState("All");
  const [page, setPage]         = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const d = parseData();
    setData(d);
    const catMap = {}, sevMap = {};
    d.forEach(t => {
      const c = t.Category||"Other"; catMap[c] = (catMap[c]||0)+1;
      const s = t.Severity||"Unknown"; sevMap[s] = (sevMap[s]||0)+1;
    });
    const categoryData = Object.entries(catMap).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
    const severityData = ["Critical","High","Medium","Low"].map(s=>({name:s, tickets:sevMap[s]||0}));
    setMetrics({
      open: d.filter(t=>t.Status!=="Resolved").length,
      sla:  d.filter(isSLABreached).length,
      risk: d.filter(isAtRisk).length,
      impact: d.reduce((s,t)=>s+(t["Estimated Impact (USD)"]||0),0),
      categoryData, severityData
    });
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(data.map(t => t.Category).filter(Boolean))).sort()], [data]);

  const filtered = useMemo(() => {
    return data.filter(t => {
      const q = search.toLowerCase();
      const matchQ = !q || (t["Ticket ID"]||"").toLowerCase().includes(q) || (t["Issue Description"]||"").toLowerCase().includes(q) || (t.Category||"").toLowerCase().includes(q) || (t.Region||"").toLowerCase().includes(q);
      const matchS  = sevFilter    === "All" || t.Severity === sevFilter;
      const matchSt = statusFilter === "All" || t.Status   === statusFilter;
      const matchC  = catFilter    === "All" || t.Category === catFilter;
      return matchQ && matchS && matchSt && matchC;
    });
  }, [data, search, sevFilter, statusFilter, catFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", minHeight:"100vh", background:"#f4f6f9" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f2545,#1e3a5f)", padding:"0 32px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", fontSize:18 }}>📋</div>
          <div>
            <div style={{ color:"#fff", fontWeight:700, fontSize:17 }}>Payroll Exception Management</div>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:11, marginTop:1 }}>Exception Tracking & Resolution Dashboard</div>
          </div>
        </div>
        <div style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>Last updated: Feb 22, 2024</div>
      </div>

      <div style={{ padding:"28px 32px" }}>
        {/* Metrics label */}
        <div style={{ fontSize:12, fontWeight:600, color:"#7a8799", textTransform:"uppercase", letterSpacing:1, marginBottom:16 }}>Key Metrics Overview</div>

        {/* Total Banner */}
        <div style={{ background:"linear-gradient(135deg,#0f2545,#1e3a5f)", borderRadius:12, padding:"14px 24px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>📂</span>
            <span style={{ color:"rgba(255,255,255,0.75)", fontSize:13, fontWeight:600, textTransform:"uppercase", letterSpacing:0.8 }}>Total Tickets</span>
          </div>
          <span style={{ color:"#fff", fontSize:32, fontWeight:800 }}>51</span>
        </div>

        {/* Scorecards */}
        {metrics && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20 }}>
            {CARD_CONFIG.map(cfg => {
              const raw = metrics[cfg.key];
              const display = cfg.key==="impact" ? `$${raw.toLocaleString()}` : raw;
              return (
                <div key={cfg.key} style={{ background:"#fff", borderRadius:14, padding:"22px 24px", borderLeft:`5px solid ${cfg.color}`, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", transition:"transform 0.15s,box-shadow 0.15s", cursor:"default" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,0.06)";}}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:"#8a95a3", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>{cfg.label}</div>
                      <div style={{ fontSize:cfg.key==="impact"?28:36, fontWeight:800, color:cfg.color, lineHeight:1 }}>{display}</div>
                    </div>
                    <div style={{ background:cfg.light, borderRadius:10, width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{cfg.icon}</div>
                  </div>
                  <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid #f0f2f5" }}>
                    <span style={{ fontSize:12, color:cfg.color, fontWeight:600, background:cfg.light, padding:"3px 8px", borderRadius:20 }}>{cfg.sub(metrics)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts row */}
        {metrics && (
          <div style={{ marginTop:28, display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {/* Donut */}
            <div style={{ background:"#fff", borderRadius:14, padding:"24px 28px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#7a8799", textTransform:"uppercase", letterSpacing:1, marginBottom:20 }}>Ticket Breakdown by Category</div>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ flex:"0 0 220px", height:240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metrics.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={105} paddingAngle={3} dataKey="value" labelLine={false} label={renderDonutLabel}>
                        {metrics.categoryData.map((_,i)=><Cell key={i} fill={DONUT_COLORS[i%DONUT_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v,n)=>[`${v} tickets`,n]} contentStyle={{ borderRadius:8, fontSize:13, border:"1px solid #e8edf2" }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                  {metrics.categoryData.map((item,i)=>(
                    <div key={item.name} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:DONUT_COLORS[i%DONUT_COLORS.length], flexShrink:0 }}/>
                      <div style={{ flex:1, fontSize:12, color:"#2d3748", fontWeight:600 }}>{item.name}</div>
                      <div style={{ fontSize:12, color:"#8a95a3" }}>{item.value} · {((item.value/51)*100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar */}
            <div style={{ background:"#fff", borderRadius:14, padding:"24px 28px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#7a8799", textTransform:"uppercase", letterSpacing:1, marginBottom:20 }}>Ticket Volume by Severity</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics.severityData} margin={{ top:20, right:16, left:-10, bottom:0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize:13, fontWeight:600, fill:"#4a5568" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:12, fill:"#8a95a3" }} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <Tooltip cursor={{ fill:"rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius:8, fontSize:13, border:"1px solid #e8edf2" }} formatter={v=>[`${v} tickets`,"Count"]}/>
                  <Bar dataKey="tickets" radius={[6,6,0,0]} label={<BarLabel/>} maxBarSize={60}>
                    {metrics.severityData.map(e=><Cell key={e.name} fill={SEV_COLOR[e.name]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Ticket Table */}
        <div style={{ marginTop:28, background:"#fff", borderRadius:14, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", overflow:"hidden" }}>
          {/* Filter bar */}
          <div style={{ padding:"16px 24px", borderBottom:"1px solid #f0f2f5", background:"#f8fafc", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#7a8799", textTransform:"uppercase", letterSpacing:0.8, marginRight:4 }}>Filter by</span>
            {/* Severity */}
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              <label style={{ fontSize:10, fontWeight:700, color:"#7a8799", textTransform:"uppercase", letterSpacing:0.6 }}>Severity</label>
              <select value={sevFilter} onChange={e=>{setSev(e.target.value);resetPage();}}
                style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 10px", fontSize:13, color:"#2d3748", background:"#fff", outline:"none", minWidth:120 }}>
                {SEVERITIES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            {/* Status */}
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              <label style={{ fontSize:10, fontWeight:700, color:"#7a8799", textTransform:"uppercase", letterSpacing:0.6 }}>Status</label>
              <select value={statusFilter} onChange={e=>{setStat(e.target.value);resetPage();}}
                style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 10px", fontSize:13, color:"#2d3748", background:"#fff", outline:"none", minWidth:130 }}>
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            {/* Category */}
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              <label style={{ fontSize:10, fontWeight:700, color:"#7a8799", textTransform:"uppercase", letterSpacing:0.6 }}>Category</label>
              <select value={catFilter} onChange={e=>{setCat(e.target.value);resetPage();}}
                style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 10px", fontSize:13, color:"#2d3748", background:"#fff", outline:"none", minWidth:130 }}>
                {categories.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            {/* Clear */}
            {(sevFilter!=="All"||statusFilter!=="All"||catFilter!=="All"||search) && (
              <button onClick={()=>{setSev("All");setStat("All");setCat("All");setSearch("");resetPage();}}
                style={{ marginTop:16, padding:"6px 14px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color:"#c0392b", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                ✕ Clear all
              </button>
            )}
          </div>

          {/* Table header bar */}
          <div style={{ padding:"20px 24px", borderBottom:"1px solid #f0f2f5", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1e3a5f" }}>All Tickets</div>
              <div style={{ fontSize:12, color:"#8a95a3", marginTop:2 }}>{filtered.length} ticket{filtered.length!==1?"s":""} found</div>
            </div>
            <input placeholder="Search tickets…" value={search} onChange={e=>{setSearch(e.target.value);resetPage();}}
              style={{ border:"1px solid #e2e8f0", borderRadius:8, padding:"7px 12px", fontSize:13, outline:"none", width:200, color:"#2d3748" }}/>
          </div>

          {/* Table */}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["Ticket ID","Description","Category","Region","Severity","SLA Target","Status","Est. Impact"].map(h=>(
                    <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#7a8799", textTransform:"uppercase", letterSpacing:0.7, whiteSpace:"nowrap", borderBottom:"1px solid #f0f2f5" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding:"40px 16px", textAlign:"center", color:"#8a95a3", fontSize:13 }}>No tickets match your filters.</td></tr>
                ) : paged.map((t, i) => (
                  <tr key={t["Ticket ID"]} style={{ background: i%2===0?"#fff":"#fafbfc", borderBottom:"1px solid #f0f2f5" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#f0f5ff"}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafbfc"}>
                    <td style={{ padding:"12px 16px", fontWeight:700, color:"#1e3a5f", whiteSpace:"nowrap" }}>{t["Ticket ID"]}</td>
                    <td style={{ padding:"12px 16px", color:"#2d3748", maxWidth:220 }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={t["Issue Description"]}>{t["Issue Description"]}</div>
                    </td>
                    <td style={{ padding:"12px 16px", color:"#4a5568", whiteSpace:"nowrap" }}>{t.Category}</td>
                    <td style={{ padding:"12px 16px", color:"#4a5568", whiteSpace:"nowrap" }}>{t.Region}</td>
                    <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                      <Badge label={t.Severity} color={SEV_COLOR[t.Severity]||"#555"} bg={SEV_BG[t.Severity]||"#eee"}/>
                    </td>
                    <td style={{ padding:"12px 16px", color:"#4a5568", whiteSpace:"nowrap" }}>{t["SLA Target"]}</td>
                    <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                      <Badge label={t.Status} color={STATUS_COLOR[t.Status]||"#555"} bg={STATUS_BG[t.Status]||"#eee"} flash={isSLABreached(t)}/>
                    </td>
                    <td style={{ padding:"12px 16px", fontWeight:600, color:"#1a6b3a", whiteSpace:"nowrap" }}>${(t["Estimated Impact (USD)"]||0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding:"14px 24px", borderTop:"1px solid #f0f2f5", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:12, color:"#8a95a3" }}>Page {page} of {totalPages}</div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={{ padding:"6px 14px", borderRadius:7, border:"1px solid #e2e8f0", background:page===1?"#f8fafc":"#fff", color:page===1?"#b0bac5":"#1e3a5f", fontWeight:600, fontSize:13, cursor:page===1?"not-allowed":"pointer" }}>← Prev</button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                  <button key={n} onClick={()=>setPage(n)}
                    style={{ padding:"6px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:n===page?"#1e3a5f":"#fff", color:n===page?"#fff":"#4a5568", fontWeight:600, fontSize:13, cursor:"pointer" }}>{n}</button>
                ))}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  style={{ padding:"6px 14px", borderRadius:7, border:"1px solid #e2e8f0", background:page===totalPages?"#f8fafc":"#fff", color:page===totalPages?"#b0bac5":"#1e3a5f", fontWeight:600, fontSize:13, cursor:page===totalPages?"not-allowed":"pointer" }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
