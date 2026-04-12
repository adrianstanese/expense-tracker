"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const F = "'DM Sans',system-ui,-apple-system,sans-serif";
const G = { r:16, rS:12, rXs:8, blur:"saturate(180%) blur(16px)", blurS:"saturate(140%) blur(10px)" };

const PAL = { navy:"#0f1d3d", blue:"#3b6de6", sky:"#5b9aff", gold:"#f5a623",
  mint:"#3ddba4", rose:"#e8466d", violet:"#7c5ce0", white:"#ffffff" };

const TH: Record<string, any> = {
  light: {
    id:"light",lb:"Light",ic:"☀️",
    bg:"linear-gradient(145deg,#f0f4fa 0%,#e6ecf5 50%,#dfe7f4 100%)",
    gbg:"rgba(255,255,255,0.55)",gbd:"rgba(255,255,255,0.75)",gbh:"rgba(255,255,255,0.8)",
    card:"rgba(255,255,255,0.72)",cardS:"0 4px 24px rgba(15,29,61,0.06)",
    hdr:"rgba(255,255,255,0.72)",hdrS:"0 1px 0 rgba(15,29,61,0.06)",
    tx:"#0f1d3d",t2:"#4a5578",t3:"#8892ab",
    bd:"rgba(15,29,61,0.08)",bd2:"rgba(15,29,61,0.04)",
    ac:PAL.blue,acS:"rgba(59,109,230,0.1)",acG:"linear-gradient(135deg,#3b6de6,#5b9aff)",
    acSh:"0 4px 20px rgba(59,109,230,0.25)",
    ok:"#059669",okBg:"rgba(5,150,105,0.08)",
    er:"#dc2626",erBg:"rgba(220,38,38,0.06)",
    adC:"#3b6de6",deC:"#7c5ce0",
    adG:"linear-gradient(135deg,#3b6de6,#5b9aff)",
    deG:"linear-gradient(135deg,#a78bfa,#7c5ce0)",
  },
  dark: {
    id:"dark",lb:"Dark",ic:"🌙",
    bg:"linear-gradient(145deg,#080c18 0%,#0d1224 50%,#111828 100%)",
    gbg:"rgba(17,24,40,0.65)",gbd:"rgba(91,154,255,0.08)",gbh:"rgba(91,154,255,0.12)",
    card:"rgba(17,24,40,0.7)",cardS:"0 4px 24px rgba(0,0,0,0.3)",
    hdr:"rgba(8,12,24,0.85)",hdrS:"0 1px 0 rgba(255,255,255,0.04)",
    tx:"#e8ecf4",t2:"#8a96b0",t3:"#4c5b78",
    bd:"rgba(255,255,255,0.06)",bd2:"rgba(255,255,255,0.03)",
    ac:PAL.sky,acS:"rgba(91,154,255,0.12)",acG:"linear-gradient(135deg,#2563eb,#5b9aff)",
    acSh:"0 4px 20px rgba(91,154,255,0.3)",
    ok:"#3ddba4",okBg:"rgba(61,219,164,0.1)",
    er:"#ff6b6b",erBg:"rgba(255,107,107,0.08)",
    adC:"#5b9aff",deC:"#a78bfa",
    adG:"linear-gradient(135deg,#2563eb,#5b9aff)",
    deG:"linear-gradient(135deg,#a78bfa,#7c5ce0)",
  },
  pink: {
    id:"pink",lb:"Pink",ic:"🌸",
    bg:"linear-gradient(145deg,#fef1f7 0%,#fde4ef 50%,#fcd9e8 100%)",
    gbg:"rgba(255,245,250,0.6)",gbd:"rgba(214,36,110,0.1)",gbh:"rgba(214,36,110,0.15)",
    card:"rgba(255,245,250,0.7)",cardS:"0 4px 24px rgba(214,36,110,0.06)",
    hdr:"rgba(255,245,250,0.75)",hdrS:"0 1px 0 rgba(214,36,110,0.06)",
    tx:"#4a0e2b",t2:"#8b1a50",t3:"#c44a83",
    bd:"rgba(214,36,110,0.1)",bd2:"rgba(214,36,110,0.05)",
    ac:"#d6246e",acS:"rgba(214,36,110,0.1)",acG:"linear-gradient(135deg,#d6246e,#f06daa)",
    acSh:"0 4px 20px rgba(214,36,110,0.25)",
    ok:"#059669",okBg:"rgba(5,150,105,0.08)",
    er:"#d6246e",erBg:"rgba(214,36,110,0.06)",
    adC:"#d6246e",deC:"#7c3aed",
    adG:"linear-gradient(135deg,#d6246e,#f06daa)",
    deG:"linear-gradient(135deg,#a78bfa,#7c3aed)",
  },
};

const CAT_EMOJI: Record<string,string> = {
  "Food & Dining":"🍽️","Groceries":"🛒","Transport":"🚗","Accommodation":"🏨",
  "Shopping":"🛍️","Entertainment":"🎬","Health & Pharmacy":"💊","Bills & Utilities":"📄",
  "Travel":"✈️","Coffee & Drinks":"☕","Gifts":"🎁","Personal Care":"💇",
  "Education":"📚","Subscriptions":"📱","Other":"📦",
};

const CAT_COLORS = ["#3b6de6","#7c5ce0","#059669","#d97706","#dc2626","#0891b2","#db2777","#4f46e5","#16a34a","#ea580c","#7c3aed","#0d9488","#c026d3","#2563eb","#64748b"];

const fE = (n: number) => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n);
const fD = (iso: string) => new Date(iso).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const fT = (iso: string) => new Date(iso).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});

function Ic({d,s=20,c="currentColor",sw=2}: {d:string,s?:number,c?:string,sw?:number}) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

type Expense = { id:string; username:string; amount:number; description:string; category:string; created_at:string };

async function fetchExpenses(): Promise<Expense[]> { const r = await fetch("/api/expenses"); return r.json(); }
async function postExpense(e: {id:string;username:string;amount:number;description:string}) {
  const r = await fetch("/api/expenses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(e) });
  return r.json();
}
async function deleteExpense(id: string) { await fetch("/api/expenses", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) }); }
async function clearAll() { await fetch("/api/expenses", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:"__ALL__"}) }); }

export default function ExpenseTracker() {
  const [tk, setTk] = useState("light");
  const [user, setUser] = useState<string|null>(null);
  const [view, setView] = useState("add");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const amtRef = useRef<HTMLInputElement>(null);
  const th = TH[tk];

  useEffect(() => {
    fetchExpenses().then(d => { setExpenses(d); setLoading(false); }).catch(() => setLoading(false));
    const iv = setInterval(() => { fetchExpenses().then(setExpenses).catch(()=>{}); }, 15000);
    return () => clearInterval(iv);
  }, []);

  const addExpense = useCallback(async () => {
    const v = parseFloat(amount.replace(",","."));
    if (!v || v <= 0 || !desc.trim() || !user || saving) return;
    setSaving(true);
    const entry = { id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), username: user, amount: Math.round(v*100)/100, description: desc.trim() };
    try {
      const res = await postExpense(entry);
      const fresh = await fetchExpenses();
      setExpenses(fresh);
      setAmount(""); setDesc("");
      setToast(`Added → ${res.category || "categorizing..."}`);
      setTimeout(() => setToast(""), 2500);
      if (amtRef.current) amtRef.current.focus();
    } catch(e) { alert("Failed to save."); }
    setSaving(false);
  }, [amount, desc, user, saving]);

  const handleDelete = useCallback(async (id: string) => {
    try { await deleteExpense(id); setExpenses(p => p.filter(e=>e.id!==id)); } catch {}
  }, []);

  const handleClear = useCallback(async () => {
    if (!confirm("Clear ALL expenses? This cannot be undone.")) return;
    try { await clearAll(); setExpenses([]); } catch {}
  }, []);

  const totA = expenses.filter(e=>e.username==="Adrian").reduce((s,e)=>s+Number(e.amount),0);
  const totD = expenses.filter(e=>e.username==="Denitsa").reduce((s,e)=>s+Number(e.amount),0);
  const totAll = totA + totD;
  const filtered = filter==="all" ? expenses : expenses.filter(e=>e.username===filter);

  // Category breakdown
  const catMap: Record<string,{total:number,count:number,items:Expense[]}> = {};
  expenses.forEach(e => {
    const c = e.category || "Other";
    if (!catMap[c]) catMap[c] = {total:0,count:0,items:[]};
    catMap[c].total += Number(e.amount);
    catMap[c].count++;
    catMap[c].items.push(e);
  });
  const catSorted = Object.entries(catMap).sort((a,b) => b[1].total - a[1].total);

  const glass = (extra: any={}) => ({
    background:th.gbg, border:`1px solid ${th.gbd}`, borderRadius:G.r,
    backdropFilter:G.blur, WebkitBackdropFilter:G.blur, boxShadow:th.cardS, ...extra,
  });

  // ═══ USER SELECTION ════════════════════════════════════════
  if (!user) {
    return (
      <div style={{ fontFamily:F, background:th.bg, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, transition:"all .4s" }}>
        <div style={{ ...glass({padding:"48px 40px",maxWidth:440,width:"100%",textAlign:"center" as const}), animation:"fadeUp .5s ease" }}>
          <div style={{ width:64,height:64,borderRadius:16,background:th.acG,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:th.acSh }}>
            <span style={{fontSize:30}}>💰</span>
          </div>
          <h1 style={{ fontSize:24,fontWeight:800,color:th.tx,margin:"0 0 4px",letterSpacing:-.5 }}>Expense Tracker</h1>
          <p style={{ fontSize:14,color:th.t2,margin:"0 0 36px" }}>Who&apos;s adding an expense?</p>
          <div style={{ display:"flex",gap:16,justifyContent:"center" }}>
            {[{n:"Adrian",g:th.adG,c:th.adC},{n:"Denitsa",g:th.deG,c:th.deC}].map(({n,g,c})=>(
              <button key={n} onClick={()=>{setUser(n);setView("add");}}
                style={{ flex:1,padding:"24px 16px",borderRadius:G.r,background:th.gbg,border:`1.5px solid ${th.gbd}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:12,backdropFilter:G.blurS,WebkitBackdropFilter:G.blurS,transition:"all .25s",fontFamily:F }}
                onMouseEnter={(e: any)=>{e.currentTarget.style.borderColor=c;e.currentTarget.style.transform="translateY(-3px)";}}
                onMouseLeave={(e: any)=>{e.currentTarget.style.borderColor=th.gbd;e.currentTarget.style.transform="translateY(0)";}}
              >
                <div style={{ width:60,height:60,borderRadius:"50%",background:g,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#fff",fontWeight:800 }}>{n[0]}</div>
                <span style={{ fontSize:16,fontWeight:700,color:th.tx }}>{n}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop:32,display:"flex",justifyContent:"center",gap:8 }}>
            {Object.entries(TH).map(([k,v]: any)=>(
              <button key={k} onClick={()=>setTk(k)} style={{ width:32,height:32,borderRadius:"50%",border:tk===k?`2px solid ${th.ac}`:`1.5px solid ${th.bd}`,background:k==="light"?"#f0f4fa":k==="dark"?"#111828":"#fef1f7",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",boxShadow:tk===k?`0 0 0 3px ${th.acS}`:"none" }}>{v.ic}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══ MAIN APP ══════════════════════════════════════════════
  const NAV = [
    {k:"add",l:"Add",d:"M12 4v16m8-8H4"},
    {k:"list",l:"History",d:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"},
    {k:"cats",l:"Categories",d:"M4 6h16M4 10h16M4 14h16M4 18h16"},
  ];

  return (
    <div style={{ fontFamily:F, background:th.bg, minHeight:"100vh", transition:"all .4s" }}>
      {/* Header */}
      <header style={{ position:"sticky",top:0,zIndex:50,background:th.hdr,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderBottom:`1px solid ${th.bd}`,boxShadow:th.hdrS,padding:"0 24px",height:58,display:"flex",alignItems:"center" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:th.acG,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:th.acSh }}><span style={{fontSize:18}}>💰</span></div>
          <div>
            <div style={{ fontSize:16,fontWeight:800,color:th.tx,letterSpacing:-.3 }}>Expense Tracker</div>
            <div style={{ fontSize:10,color:th.t3,marginTop:-1,fontWeight:500 }}>Adrian & Denitsa</div>
          </div>
        </div>
        <div style={{flex:1}}/>
        <div style={{ display:"flex",gap:2,background:th.gbg,borderRadius:G.rS,padding:3,backdropFilter:G.blurS,WebkitBackdropFilter:G.blurS,border:`1px solid ${th.bd2}`,marginRight:14 }}>
          {NAV.map(n=>(
            <button key={n.k} onClick={()=>setView(n.k)} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:G.rXs,border:"none",cursor:"pointer",fontSize:12,fontWeight:view===n.k?700:500,background:view===n.k?th.card:"transparent",color:view===n.k?th.ac:th.t3,boxShadow:view===n.k?th.cardS:"none",transition:"all .2s" }}>
              <Ic d={n.d} s={14} c={view===n.k?th.ac:th.t3} sw={view===n.k?2.5:1.8}/>{n.l}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:7,padding:"4px 12px 4px 5px",borderRadius:20,background:th.gbg,border:`1px solid ${th.bd}`,backdropFilter:G.blurS,WebkitBackdropFilter:G.blurS }}>
          <div style={{ width:26,height:26,borderRadius:"50%",background:user==="Adrian"?th.adG:th.deG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700 }}>{user[0]}</div>
          <span style={{ fontSize:13,fontWeight:600,color:th.tx }}>{user}</span>
          <button onClick={()=>setUser(null)} style={{ background:"none",border:"none",cursor:"pointer",color:th.t3,fontSize:16,lineHeight:1,padding:0,marginLeft:2 }}>×</button>
        </div>
        <div style={{ display:"flex",gap:5,marginLeft:12 }}>
          {Object.entries(TH).map(([k,v]: any)=>(
            <button key={k} onClick={()=>setTk(k)} style={{ width:26,height:26,borderRadius:"50%",border:tk===k?`2px solid ${th.ac}`:`1px solid ${th.bd}`,background:k==="light"?"#f0f4fa":k==="dark"?"#111828":"#fef1f7",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s" }}>{v.ic}</button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth:640,margin:"0 auto",padding:"28px 20px" }}>
        {/* Summary */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:28 }}>
          {[
            {l:"Adrian",v:totA,c:th.adC,n:expenses.filter(e=>e.username==="Adrian").length},
            {l:"Denitsa",v:totD,c:th.deC,n:expenses.filter(e=>e.username==="Denitsa").length},
            {l:"Total",v:totAll,c:th.ac,n:expenses.length},
          ].map((s,i)=>(
            <div key={i} style={{ ...glass({padding:"16px 14px"}),borderLeft:`3px solid ${s.c}`,animation:`fadeUp .4s ease ${i*0.08}s both` }}>
              <div style={{ fontSize:10,fontWeight:700,color:s.c,textTransform:"uppercase" as const,letterSpacing:.8 }}>{s.l}</div>
              <div style={{ fontSize:20,fontWeight:800,color:th.tx,marginTop:4,letterSpacing:-.5 }}>{fE(s.v)}</div>
              <div style={{ fontSize:10,color:th.t3,marginTop:2 }}>{s.n} {s.n===1?"entry":"entries"}</div>
            </div>
          ))}
        </div>

        {/* ═══ ADD ═══ */}
        {view==="add" && (
          <div style={{ animation:"fadeUp .35s ease" }}>
            <h2 style={{ fontSize:18,fontWeight:800,color:th.tx,margin:"0 0 4px",letterSpacing:-.3 }}>Add Expense</h2>
            <p style={{ fontSize:13,color:th.t2,margin:"0 0 20px" }}>Recording as <strong style={{color:user==="Adrian"?th.adC:th.deC}}>{user}</strong> · AI auto-categorizes</p>
            {toast && (
              <div style={{ ...glass({padding:"12px 16px",marginBottom:16,borderColor:th.ok}),color:th.ok,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,animation:"slideDown .3s ease" }}>
                <Ic d="M20 6L9 17l-5-5" s={18} c={th.ok} sw={2.5}/> {toast}
              </div>
            )}
            <div style={{ ...glass({padding:"20px 22px",marginBottom:12}) }}>
              <label style={{ fontSize:10,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8 }}>Amount (EUR)</label>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:8 }}>
                <span style={{ fontSize:30,fontWeight:800,color:th.t3 }}>€</span>
                <input ref={amtRef} type="text" inputMode="decimal" value={amount}
                  onChange={(e: any)=>setAmount(e.target.value.replace(/[^0-9.,]/g,""))}
                  placeholder="0.00"
                  onKeyDown={(e: any)=>{if(e.key==="Enter")document.getElementById("desc-input")?.focus();}}
                  style={{ flex:1,fontSize:32,fontWeight:800,color:th.tx,background:"transparent",border:"none",outline:"none",fontFamily:F,letterSpacing:-1 }}
                />
              </div>
            </div>
            <div style={{ ...glass({padding:"20px 22px",marginBottom:20}) }}>
              <label style={{ fontSize:10,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8 }}>Description</label>
              <input id="desc-input" type="text" value={desc} onChange={(e: any)=>setDesc(e.target.value)}
                placeholder="What was this for?"
                onKeyDown={(e: any)=>{if(e.key==="Enter")addExpense();}}
                style={{ width:"100%",fontSize:16,fontWeight:500,color:th.tx,background:"transparent",border:"none",outline:"none",fontFamily:F,marginTop:8,padding:0 }}
              />
            </div>
            <button onClick={addExpense} disabled={!amount||!desc.trim()||saving}
              style={{ width:"100%",padding:"15px 24px",borderRadius:G.r,background:(!amount||!desc.trim())?th.bd:th.acG,color:(!amount||!desc.trim())?th.t3:"#fff",border:"none",cursor:(!amount||!desc.trim()||saving)?"default":"pointer",fontSize:15,fontWeight:700,fontFamily:F,boxShadow:(!amount||!desc.trim())?"none":th.acSh,transition:"all .25s",opacity:saving?.6:1 }}>
              {saving ? "Categorizing & Saving..." : "Add Expense"}
            </button>
            {expenses.length>0 && (
              <div style={{ marginTop:28 }}>
                <div style={{ fontSize:10,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8,marginBottom:10 }}>Recent</div>
                {expenses.slice(0,5).map((e,i)=>(
                  <div key={e.id} style={{ ...glass({padding:"10px 14px",marginBottom:6}),display:"flex",alignItems:"center",gap:10,animation:`fadeUp .3s ease ${i*0.04}s both` }}>
                    <div style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,background:e.username==="Adrian"?th.adG:th.deG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700 }}>{e.username[0]}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:th.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.description}</div>
                      <div style={{ fontSize:10,color:th.t3 }}>{fD(e.created_at)} · {CAT_EMOJI[e.category]||"📦"} {e.category||"Other"}</div>
                    </div>
                    <div style={{ fontSize:14,fontWeight:700,color:th.tx,whiteSpace:"nowrap" }}>{fE(Number(e.amount))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {view==="list" && (
          <div style={{ animation:"fadeUp .35s ease" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:18,fontWeight:800,color:th.tx,margin:0 }}>All Expenses</h2>
                <p style={{ fontSize:12,color:th.t3,margin:"2px 0 0" }}>{expenses.length} entries</p>
              </div>
              <div style={{ display:"flex",gap:3,background:th.gbg,borderRadius:G.rS,padding:3,backdropFilter:G.blurS,WebkitBackdropFilter:G.blurS,border:`1px solid ${th.bd2}` }}>
                {[{k:"all",l:"All"},{k:"Adrian",l:"Adrian"},{k:"Denitsa",l:"Denitsa"}].map(f=>(
                  <button key={f.k} onClick={()=>setFilter(f.k)} style={{ padding:"6px 13px",borderRadius:G.rXs,border:"none",background:filter===f.k?th.card:"transparent",color:filter===f.k?th.ac:th.t3,fontWeight:filter===f.k?700:500,fontSize:12,cursor:"pointer",fontFamily:F,boxShadow:filter===f.k?th.cardS:"none",transition:"all .15s" }}>{f.l}</button>
                ))}
              </div>
            </div>
            {loading ? <div style={{textAlign:"center",padding:40,color:th.t3}}>Loading...</div>
            : filtered.length===0 ? (
              <div style={{ ...glass({textAlign:"center" as const,padding:"48px 24px"}) }}>
                <div style={{fontSize:36,marginBottom:8}}>📭</div>
                <div style={{fontSize:15,fontWeight:600,color:th.tx}}>No expenses yet</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {filtered.map((e,i)=>(
                  <div key={e.id} style={{ ...glass({padding:"12px 16px"}),display:"flex",alignItems:"center",gap:12,animation:`fadeUp .3s ease ${Math.min(i,10)*0.03}s both`,transition:"all .2s" }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",flexShrink:0,background:e.username==="Adrian"?th.adG:th.deG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",fontWeight:700 }}>{e.username[0]}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                        <span style={{ fontSize:14,fontWeight:600,color:th.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.description}</span>
                        <span style={{ fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:10,background:th.acS,color:th.ac,whiteSpace:"nowrap",flexShrink:0 }}>{CAT_EMOJI[e.category]||"📦"} {e.category||"Other"}</span>
                      </div>
                      <div style={{ fontSize:11,color:th.t3,marginTop:1 }}>{e.username} · {fD(e.created_at)} at {fT(e.created_at)}</div>
                    </div>
                    <div style={{ fontSize:16,fontWeight:800,color:th.tx,whiteSpace:"nowrap",marginRight:8 }}>{fE(Number(e.amount))}</div>
                    <button onClick={()=>handleDelete(e.id)} style={{ background:"none",border:"none",cursor:"pointer",color:th.t3,padding:4,borderRadius:6,transition:"all .15s",opacity:.5 }}
                      onMouseEnter={(ev: any)=>{ev.currentTarget.style.color=th.er;ev.currentTarget.style.opacity="1";}}
                      onMouseLeave={(ev: any)=>{ev.currentTarget.style.color=th.t3;ev.currentTarget.style.opacity=".5";}}
                      title="Delete">
                      <Ic d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" s={15}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {expenses.length>0 && (
              <div style={{ marginTop:28,textAlign:"center" }}>
                <button onClick={handleClear} style={{ padding:"8px 20px",borderRadius:G.rS,background:th.erBg,border:`1px solid ${th.er}22`,color:th.er,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:F }}>Clear All Expenses</button>
              </div>
            )}
          </div>
        )}

        {/* ═══ CATEGORIES ═══ */}
        {view==="cats" && (
          <div style={{ animation:"fadeUp .35s ease" }}>
            <h2 style={{ fontSize:18,fontWeight:800,color:th.tx,margin:"0 0 4px" }}>Expenses by Category</h2>
            <p style={{ fontSize:13,color:th.t2,margin:"0 0 24px" }}>AI-powered categorization · {catSorted.length} categories</p>
            {catSorted.length===0 ? (
              <div style={{ ...glass({textAlign:"center" as const,padding:"48px 24px"}) }}>
                <div style={{fontSize:36,marginBottom:8}}>📊</div>
                <div style={{fontSize:15,fontWeight:600,color:th.tx}}>No data yet</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {catSorted.map(([cat, data], i) => {
                  const pct = totAll > 0 ? (data.total / totAll) * 100 : 0;
                  const color = CAT_COLORS[i % CAT_COLORS.length];
                  return (
                    <div key={cat} style={{ ...glass({padding:"16px 18px"}), animation:`fadeUp .3s ease ${i*0.05}s both` }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <span style={{ fontSize:20 }}>{CAT_EMOJI[cat]||"📦"}</span>
                          <div>
                            <div style={{ fontSize:14,fontWeight:700,color:th.tx }}>{cat}</div>
                            <div style={{ fontSize:11,color:th.t3 }}>{data.count} {data.count===1?"expense":"expenses"} · {pct.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div style={{ fontSize:18,fontWeight:800,color:th.tx }}>{fE(data.total)}</div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height:8,borderRadius:4,background:th.bd,overflow:"hidden" }}>
                        <div style={{ height:"100%",borderRadius:4,background:color,width:`${pct}%`,transition:"width .5s ease" }}/>
                      </div>
                      {/* Items */}
                      <div style={{ marginTop:10,display:"flex",flexDirection:"column",gap:4 }}>
                        {data.items.map(e => (
                          <div key={e.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"4px 0" }}>
                            <div style={{ width:20,height:20,borderRadius:"50%",flexShrink:0,background:e.username==="Adrian"?th.adG:th.deG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700 }}>{e.username[0]}</div>
                            <span style={{ fontSize:12,color:th.t2,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{e.description}</span>
                            <span style={{ fontSize:12,fontWeight:700,color:th.tx,whiteSpace:"nowrap" }}>{fE(Number(e.amount))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
