"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   EXPENSE TRACKER V5 — Multi-group, dynamic members, 19 features
   ═══════════════════════════════════════════════════════════════ */

const F = "'DM Sans',system-ui,-apple-system,sans-serif";
const G = { r:16,rS:12,rXs:8,blur:"saturate(180%) blur(16px)",blurS:"saturate(140%) blur(10px)" };
const RON_EUR_RATE = 5.1; // Fixed RON to EUR conversion rate
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENCIES = [{c:"EUR",s:"€",f:"🇪🇺"},{c:"RON",s:"lei",f:"🇷🇴"}];
const CAT_E:Record<string,string>={"Food & Dining":"🍽️","Groceries":"🛒","Transport":"🚗","Accommodation":"🏨","Shopping":"🛍️","Entertainment":"🎬","Health & Pharmacy":"💊","Bills & Utilities":"📄","Travel":"✈️","Coffee & Drinks":"☕","Gifts":"🎁","Personal Care":"💇","Education":"📚","Subscriptions":"📱","Other":"📦"};
const CAT_C=["#3b6de6","#7c5ce0","#059669","#d97706","#dc2626","#0891b2","#db2777","#4f46e5","#16a34a","#ea580c","#7c3aed","#0d9488","#c026d3","#2563eb","#64748b"];
const MEM_C=["#3b6de6","#7c5ce0","#059669","#d97706"];
const MEM_G=["linear-gradient(135deg,#3b6de6,#5b9aff)","linear-gradient(135deg,#a78bfa,#7c5ce0)","linear-gradient(135deg,#34d399,#059669)","linear-gradient(135deg,#fbbf24,#d97706)"];

// ─── Auto theme by time of day (Feature #4) ──────────────────
function autoThemeKey():string {
  return "light";
}

const TH:Record<string,any>={
  light:{id:"light",lb:"Light",ic:"☀️",bg:"linear-gradient(145deg,#f0f4fa 0%,#e6ecf5 50%,#dfe7f4 100%)",gbg:"rgba(255,255,255,0.55)",gbd:"rgba(255,255,255,0.75)",card:"rgba(255,255,255,0.82)",cardS:"0 4px 24px rgba(15,29,61,0.06)",hdr:"rgba(255,255,255,0.72)",hdrS:"0 1px 0 rgba(15,29,61,0.06)",tx:"#0f1d3d",t2:"#4a5578",t3:"#8892ab",bd:"rgba(15,29,61,0.08)",bd2:"rgba(15,29,61,0.04)",ac:"#3b6de6",acS:"rgba(59,109,230,0.1)",acG:"linear-gradient(135deg,#3b6de6,#5b9aff)",acSh:"0 4px 20px rgba(59,109,230,0.25)",ok:"#059669",okBg:"rgba(5,150,105,0.08)",er:"#dc2626",erBg:"rgba(220,38,38,0.06)",modalBg:"rgba(0,0,0,0.3)",shC:"#059669",shBg:"rgba(5,150,105,0.08)",prC:"#d97706",prBg:"rgba(217,119,6,0.08)",skelA:"rgba(15,29,61,0.06)",skelB:"rgba(15,29,61,0.12)"},
  pink:{id:"pink",lb:"Pink",ic:"🌸",bg:"linear-gradient(145deg,#fef1f7 0%,#fde4ef 50%,#fcd9e8 100%)",gbg:"rgba(255,245,250,0.6)",gbd:"rgba(214,36,110,0.1)",card:"rgba(255,245,250,0.82)",cardS:"0 4px 24px rgba(214,36,110,0.06)",hdr:"rgba(255,245,250,0.75)",hdrS:"0 1px 0 rgba(214,36,110,0.06)",tx:"#4a0e2b",t2:"#8b1a50",t3:"#c44a83",bd:"rgba(214,36,110,0.1)",bd2:"rgba(214,36,110,0.05)",ac:"#d6246e",acS:"rgba(214,36,110,0.1)",acG:"linear-gradient(135deg,#d6246e,#f06daa)",acSh:"0 4px 20px rgba(214,36,110,0.25)",ok:"#059669",okBg:"rgba(5,150,105,0.08)",er:"#d6246e",erBg:"rgba(214,36,110,0.06)",modalBg:"rgba(0,0,0,0.3)",shC:"#059669",shBg:"rgba(5,150,105,0.08)",prC:"#d97706",prBg:"rgba(217,119,6,0.08)",skelA:"rgba(214,36,110,0.04)",skelB:"rgba(214,36,110,0.08)"},
};

const fE=(n:number)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n);
const fD=(iso:string)=>new Date(iso).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const fT=(iso:string)=>new Date(iso).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
const fDS=(iso:string)=>new Date(iso).toLocaleDateString("en-GB",{day:"2-digit",month:"short"});
function dayLabel(iso:string){const d=iso.slice(0,10),t=new Date().toISOString().slice(0,10),y=new Date(Date.now()-86400000).toISOString().slice(0,10);if(d===t)return"Today";if(d===y)return"Yesterday";return fD(iso);}

function Ic({d,s=20,c="currentColor",sw=2}:{d:string,s?:number,c?:string,sw?:number}){return<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;}

// SSR-safe storage
function ls(k:string,v?:string){if(typeof window==="undefined")return null;if(v!==undefined){try{localStorage.setItem(k,v);}catch{}return v;}try{return localStorage.getItem(k);}catch{return null;}}
function lsRm(k:string){if(typeof window!=="undefined")try{localStorage.removeItem(k);}catch{}}
function ss(k:string,v?:string){if(typeof window==="undefined")return null;if(v!==undefined){try{sessionStorage.setItem(k,v);}catch{}return v;}try{return sessionStorage.getItem(k);}catch{return null;}}

type Expense={id:string;group_id:string;username:string;amount:number;currency:string;amount_eur:number;description:string;category:string;trip:string;scope:string;comments:string;reactions:string;created_at:string};
type Group={id:string;name:string;members:string[];created_at:string};

// ─── Modal ───────────────────────────────────────────────────
function Modal({children,onClose,th}:{children:any,onClose:()=>void,th:any}){
  return<div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:th.modalBg,backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",padding:16,animation:"fadeIn .15s ease"}} onClick={onClose}>
    <div style={{background:th.card,border:`1px solid ${th.gbd}`,borderRadius:G.r,boxShadow:th.cardS,padding:20,maxWidth:400,width:"100%",animation:"scaleIn .2s ease"}} onClick={(e:any)=>e.stopPropagation()}>{children}</div>
  </div>;
}

// ─── Skeleton row (Feature #16) ──────────────────────────────
function Skel({th}:{th:any}){
  return<div style={{display:"flex",gap:10,padding:"10px 12px",marginBottom:4}}>
    <div style={{width:30,height:30,borderRadius:"50%",background:th.skelB,animation:"pulse 1.2s infinite"}}/>
    <div style={{flex:1}}><div style={{width:"60%",height:10,borderRadius:4,background:th.skelB,marginBottom:6,animation:"pulse 1.2s infinite"}}/><div style={{width:"40%",height:8,borderRadius:4,background:th.skelA,animation:"pulse 1.2s infinite"}}/></div>
    <div style={{width:50,height:14,borderRadius:4,background:th.skelB,animation:"pulse 1.2s infinite"}}/>
  </div>;
}

// ─── QR Code generator (simple SVG) ─────────────────────────
function QRCode({data,size=160}:{data:string,size?:number}){
  // Simple visual representation using a grid pattern derived from the data
  const cells:boolean[][]=[];const s=21;
  for(let y=0;y<s;y++){cells[y]=[];for(let x=0;x<s;x++){
    // Fixed patterns (corners)
    const inCorner=(x<7&&y<7)||(x>=s-7&&y<7)||(x<7&&y>=s-7);
    const cornerBorder=inCorner&&(x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4)||(x>=s-7&&(x===s-7||x===s-1))||(y>=s-7&&(y===s-7||y===s-1))||(x>=s-5&&x<=s-3&&y>=2&&y<=4)||(x>=2&&x<=4&&y>=s-5&&y<=s-3));
    if(inCorner){cells[y][x]=cornerBorder;}
    else{const i=(x*s+y)%data.length;cells[y][x]=data.charCodeAt(i)%3!==0;}
  }}
  const cs=size/s;
  return<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <rect width={size} height={size} fill="white" rx="8"/>
    {cells.map((row,y)=>row.map((on,x)=>on?<rect key={`${x}-${y}`} x={x*cs} y={y*cs} width={cs} height={cs} fill="#0f1d3d" rx={cs>4?1:0}/>:null))}
  </svg>;
}

// ═════════════════════════════════════════════════════════════
export default function App(){
  // ─── State ─────────────────────────────────────────────────
  const[tk,setTk]=useState("light");
  const[group,setGroup]=useState<Group|null>(null);
  const[groupId,setGroupId]=useState<string|null>(null);
  const[user,setUser]=useState<string|null>(null);
  const[pinUnlocked,setPinUnlocked]=useState(false);
  const[pinInput,setPinInput]=useState("");
  const[tab,setTab]=useState("home"); // home|history|stats|ai
  const[expenses,setExpenses]=useState<Expense[]>([]);
  const[loading,setLoading]=useState(true);
  const[amount,setAmount]=useState("");
  const[desc,setDesc]=useState("");
  const[currency,setCurrency]=useState("EUR");
  const[trip,setTrip]=useState("");
  const[scope,setScope]=useState("shared");
  const[expDate,setExpDate]=useState("");
  const[toast,setToast]=useState("");
  const[saving,setSaving]=useState(false);
  const[selMonth,setSelMonth]=useState<string|null>(null);
  const[showCal,setShowCal]=useState(false);
  const[editExp,setEditExp]=useState<Expense|null>(null);
  const[editAmt,setEditAmt]=useState("");
  const[editDesc,setEditDesc]=useState("");
  const[editCur,setEditCur]=useState("EUR");
  const[editTrip,setEditTrip]=useState("");
  const[editScope,setEditScope]=useState("shared");
  const[delConfirm,setDelConfirm]=useState<string|null>(null);
  const[insightText,setInsightText]=useState("");
  const[insightLoading,setInsightLoading]=useState(false);
  const[commentExpId,setCommentExpId]=useState<string|null>(null);
  const[commentText,setCommentText]=useState("");
  const[searchQ,setSearchQ]=useState("");
  const[showFab,setShowFab]=useState(false);
  const[showShare,setShowShare]=useState(false);
  const[confetti,setConfetti]=useState(false);
  const[filter,setFilter]=useState("all");
  const[pageTransition,setPageTransition]=useState(false);

  // Create group state
  const[createMode,setCreateMode]=useState(false);
  const[joinMode,setJoinMode]=useState(false);
  const[cgName,setCgName]=useState("");
  const[cgPin,setCgPin]=useState("");
  const[cgCount,setCgCount]=useState(2);
  const[cgMembers,setCgMembers]=useState(["","",""]);
  const[joinCode,setJoinCode]=useState("");
  const[joinPin,setJoinPin]=useState("");

  const amtRef=useRef<HTMLInputElement>(null);
  const[lastExpCount,setLastExpCount]=useState(0);
  const[newExpBanner,setNewExpBanner]=useState<string|null>(null);
  const[dupWarning,setDupWarning]=useState<string|null>(null);
  const[ctxMenu,setCtxMenu]=useState<{id:string,x:number,y:number}|null>(null);
  const[showSummaryCard,setShowSummaryCard]=useState(false);
  const[showPdfLoading,setShowPdfLoading]=useState(false);
  const[myGroupsList,setMyGroupsList]=useState<any[]>([]);
  const scrollRef=useRef<HTMLDivElement>(null);
  const[scrollY,setScrollY]=useState(0);

  // Resolve theme
  const resolvedTk = tk==="auto"?autoThemeKey():tk;
  const th=TH[resolvedTk];

  // ─── URL-based group loading ───────────────────────────────
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const params=new URLSearchParams(window.location.search);
    const gid=params.get("g");
    if(gid) setGroupId(gid);
    const savedTheme=ls("exp-theme");
    if(savedTheme) setTk(savedTheme);
    // Check session unlock
    if(ss("exp-unlocked")) setPinUnlocked(true);
  },[]);

  useEffect(()=>{ls("exp-theme",tk);},[tk]);

  useEffect(()=>{const g=ls("exp-groups");if(g)try{setMyGroupsList(JSON.parse(g));}catch{}},[]);

  // Load group data
  useEffect(()=>{
    if(!groupId) return;
    fetch(`/api/groups?id=${groupId}`).then(r=>r.json()).then(g=>{
      if(g && g.id) setGroup(g);
      else setGroup(null);
    }).catch(()=>{});
  },[groupId]);

  // Load expenses when group is set and PIN verified
  useEffect(()=>{
    if(!groupId||!pinUnlocked) return;
    setLoading(true);
    fetch(`/api/expenses?gid=${groupId}`).then(r=>r.json()).then(d=>{
      if(Array.isArray(d)) setExpenses(d);
      setLoading(false);
    }).catch(()=>setLoading(false));
    // Track expense count for activity feed banner
    setLastExpCount(prev => {
      if(prev === 0) return expenses.length; // initial
      return prev;
    });
    const iv=setInterval(()=>{
      fetch(`/api/expenses?gid=${groupId}`).then(r=>r.json()).then(d=>{
        if(Array.isArray(d)){
          // Feature #18: Activity feed — detect new expenses from others
          if(d.length>expenses.length && expenses.length>0){
            const newest=d[0];
            if(newest && newest.username!==user){
              setNewExpBanner(`${newest.username} added ${newest.description}`);
              setTimeout(()=>setNewExpBanner(null),4000);
            }
          }
          setExpenses(d);
        }
      }).catch(()=>{});
    },12000);
    return()=>clearInterval(iv);
  },[groupId,pinUnlocked]);

  // Scroll listener for progressive blur (Feature #15)
  useEffect(()=>{
    const el=scrollRef.current;
    if(!el) return;
    const h=()=>setScrollY(el.scrollTop);
    el.addEventListener("scroll",h,{passive:true});
    return()=>el.removeEventListener("scroll",h);
  },[tab,pinUnlocked,user]);

  // ─── Computed ──────────────────────────────────────────────
  const presets=useMemo(()=>{
    const freq:Record<string,number>={};
    expenses.forEach(e=>{const k=e.description.toLowerCase().trim();freq[k]=(freq[k]||0)+1;});
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k])=>{
      const o=expenses.find(e=>e.description.toLowerCase().trim()===k);
      return{desc:o?.description||k,cat:o?.category||"Other"};
    });
  },[expenses]);

  const streak=useMemo(()=>{
    if(!expenses.length)return 0;
    const days=new Set(expenses.map(e=>new Date(e.created_at).toISOString().slice(0,10)));
    let c=0;const d=new Date();
    while(days.has(d.toISOString().slice(0,10))){c++;d.setDate(d.getDate()-1);}
    return c;
  },[expenses]);

  const availMonths=useMemo(()=>{
    const s=new Set<string>();expenses.forEach(e=>s.add(e.created_at.slice(0,7)));
    return[...s].sort().reverse();
  },[expenses]);

  const availTrips=useMemo(()=>{
    const s=new Set<string>();expenses.forEach(e=>{if(e.trip)s.add(e.trip);});
    return[...s].sort();
  },[expenses]);

  const filtered=useMemo(()=>{
    let f=expenses;
    if(selMonth)f=f.filter(e=>e.created_at.startsWith(selMonth));
    if(filter!=="all")f=f.filter(e=>e.username===filter);
    if(searchQ){const q=searchQ.toLowerCase();f=f.filter(e=>e.description.toLowerCase().includes(q)||e.category.toLowerCase().includes(q)||(e.trip||"").toLowerCase().includes(q));}
    return f;
  },[expenses,selMonth,filter,searchQ]);

  // Group by date (Feature #10)
  const groupedByDate=useMemo(()=>{
    const map:Record<string,Expense[]>={};
    filtered.forEach(e=>{const k=e.created_at.slice(0,10);if(!map[k])map[k]=[];map[k].push(e);});
    return Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0]));
  },[filtered]);

  const members=group?.members||[];
  const memberTotals=useMemo(()=>{
    const m:Record<string,number>={};
    members.forEach(n=>{m[n]=filtered.filter(e=>e.username===n).reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);});
    return m;
  },[filtered,members]);
  const totAll=Object.values(memberTotals).reduce((a,b)=>a+b,0);
  const totShared=filtered.filter(e=>(e.scope||"shared")==="shared").reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);
  const totPersonal=filtered.filter(e=>e.scope==="personal").reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);

  const today=new Date().toISOString().slice(0,10);
  const todayExps=expenses.filter(e=>e.created_at.slice(0,10)===today);
  const todayTotal=todayExps.reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);

  // Chart data (Feature #13 monthly)
  const chartData=useMemo(()=>{
    const ms:{label:string;key:string;totals:Record<string,number>}[]=[];
    const now=new Date();
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const label=`${MONTHS[d.getMonth()]}`;
      const mExps=expenses.filter(e=>e.created_at.startsWith(key));
      const totals:Record<string,number>={};
      members.forEach(n=>{totals[n]=mExps.filter(e=>e.username===n).reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);});
      ms.push({label,key,totals});
    }
    return ms;
  },[expenses,members]);
  const chartMax=Math.max(...chartData.map(m=>Object.values(m.totals).reduce((a,b)=>a+b,0)),1);

  // Weekly sparkline (Feature #12)
  const sparkline=useMemo(()=>{
    const days:number[]=[];const now=new Date();
    for(let i=6;i>=0;i--){
      const d=new Date(now);d.setDate(d.getDate()-i);
      const key=d.toISOString().slice(0,10);
      days.push(expenses.filter(e=>e.created_at.slice(0,10)===key).reduce((s,e)=>s+Number(e.amount_eur||e.amount),0));
    }
    return days;
  },[expenses]);
  const sparkMax=Math.max(...sparkline,1);

  // Category breakdown
  const catMap:Record<string,{total:number,count:number}>={};
  filtered.forEach(e=>{const c=e.category||"Other";if(!catMap[c])catMap[c]={total:0,count:0};catMap[c].total+=Number(e.amount_eur||e.amount);catMap[c].count++;});
  const catSorted=Object.entries(catMap).sort((a,b)=>b[1].total-a[1].total);

  // Balance indicator (Feature #13)
  const balanceInfo=useMemo(()=>{
    if(members.length<2)return null;
    const avg=totAll/members.length;
    const diffs=members.map(n=>({name:n,diff:memberTotals[n]-avg}));
    const maxSpender=diffs.reduce((a,b)=>a.diff>b.diff?a:b);
    const minSpender=diffs.reduce((a,b)=>a.diff<b.diff?a:b);
    return{maxSpender,minSpender,gap:maxSpender.diff-minSpender.diff};
  },[members,memberTotals,totAll]);

  // ─── Handlers ──────────────────────────────────────────────
  const switchTab=(t:string)=>{setPageTransition(true);setTimeout(()=>{setTab(t);setPageTransition(false);},80);};

  const checkDuplicate=(desc:string,amt:number):boolean=>{
    const now=Date.now();
    const recent=expenses.filter(e=>{
      const age=now-new Date(e.created_at).getTime();
      return age<300000; // 5 minutes
    });
    return recent.some(e=>
      e.description.toLowerCase().trim()===desc.toLowerCase().trim() &&
      Math.abs(Number(e.amount_eur||e.amount)-amt)<0.01
    );
  };

  const addExpense=useCallback(async()=>{
    const v=parseFloat(amount.replace(",","."));
    if(!v||v<=0||!desc.trim()||!user||!groupId||saving)return;
    // Feature #6: Duplicate detection
    if(checkDuplicate(desc.trim(),Math.round(v*100)/100)){
      if(!confirm("This looks like a duplicate of a recent expense. Add anyway?")){return;}
    }
    setSaving(true);
    try{
      const customDate=expDate?new Date(expDate+"T12:00:00").toISOString():undefined;
      const res=await(await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),group_id:groupId,username:user,amount:Math.round(v*100)/100,description:desc.trim(),currency,trip,scope,created_at:customDate})})).json();
      const fresh=await(await fetch(`/api/expenses?gid=${groupId}`)).json();
      if(Array.isArray(fresh))setExpenses(fresh);
      setAmount("");setDesc("");setExpDate("");setShowFab(false);
      setToast(`${CAT_E[res.category]||"📦"} ${res.category}`);
      setTimeout(()=>setToast(""),2200);
      // Milestone confetti (Feature #5)
      const newTotal=fresh.reduce((s:number,e:any)=>s+Number(e.amount_eur||e.amount),0);
      const oldTotal=expenses.reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);
      if(Math.floor(newTotal/1000)>Math.floor(oldTotal/1000)||fresh.length%50===0){setConfetti(true);setTimeout(()=>setConfetti(false),3000);}
      if(amtRef.current)amtRef.current.focus();
    }catch{alert("Failed to save.");}
    setSaving(false);
  },[amount,desc,user,groupId,saving,currency,trip,scope,expenses]);

  const saveEdit=useCallback(async()=>{
    if(!editExp)return;
    const v=parseFloat(editAmt.replace(",","."));
    if(!v||!editDesc.trim())return;setSaving(true);
    try{
      await fetch("/api/expenses",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editExp.id,amount:Math.round(v*100)/100,description:editDesc.trim(),currency:editCur,trip:editTrip,scope:editScope})});
      const fresh=await(await fetch(`/api/expenses?gid=${groupId}`)).json();
      if(Array.isArray(fresh))setExpenses(fresh);
      setEditExp(null);setToast("Updated!");setTimeout(()=>setToast(""),2000);
    }catch{alert("Failed to update.");}
    setSaving(false);
  },[editExp,editAmt,editDesc,editCur,editTrip,editScope,groupId]);

  const confirmDelete=useCallback(async()=>{
    if(!delConfirm)return;
    if(delConfirm==="__ALL__")await fetch("/api/expenses",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:"__ALL__",group_id:groupId})});
    else await fetch("/api/expenses",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:delConfirm})});
    if(delConfirm==="__ALL__")setExpenses([]);
    else setExpenses(p=>p.filter(e=>e.id!==delConfirm));
    setDelConfirm(null);setEditExp(null);
  },[delConfirm,groupId]);

  const addComment=useCallback(async()=>{
    if(!commentExpId||!commentText.trim()||!user)return;
    const res=await(await fetch("/api/expenses",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:commentExpId,username:user,comment:commentText.trim()})})).json();
    setExpenses(p=>p.map(e=>e.id===commentExpId?{...e,comments:JSON.stringify(res.comments)}:e));
    setCommentText("");
  },[commentExpId,commentText,user]);

  const getInsights=useCallback(async()=>{
    if(!groupId)return;setInsightLoading(true);
    try{const r=await(await fetch(`/api/expenses?gid=${groupId}&action=insights`)).json();setInsightText(r.insight);}
    catch{setInsightText("Could not load insights.");}
    setInsightLoading(false);
  },[groupId]);

  const createGroup=useCallback(async()=>{
    const mems=cgMembers.slice(0,cgCount).map(m=>m.trim()).filter(Boolean);
    if(!cgName.trim()||cgPin.length!==4||mems.length<2)return;
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
    try{
      await fetch("/api/groups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,name:cgName.trim(),pin:cgPin,members:mems})});
      // Store in localStorage for "my groups"
      const myGroups=JSON.parse(ls("exp-groups")||"[]");
      myGroups.push({id,name:cgName.trim()});
      ls("exp-groups",JSON.stringify(myGroups));
      // Navigate
      if(typeof window!=="undefined") window.history.pushState({},"",`?g=${id}`);
      setGroupId(id);setGroup({id,name:cgName.trim(),members:mems,created_at:new Date().toISOString()});
      setPinUnlocked(true);ss("exp-unlocked","1");
      setCreateMode(false);
    }catch{alert("Failed to create group.");}
  },[cgName,cgPin,cgCount,cgMembers]);

  const verifyPin=useCallback(async()=>{
    if(!groupId||!pinInput)return;
    try{
      const res=await(await fetch("/api/groups",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:groupId,pin:pinInput})})).json();
      if(res.ok){setPinUnlocked(true);ss("exp-unlocked","1");setPinInput("");}
      else{setPinInput("");alert("Wrong PIN");}
    }catch{alert("Connection error");}
  },[groupId,pinInput]);

  const joinGroup=useCallback(async()=>{
    const code=joinCode.trim();
    if(!code)return;
    // Try to fetch group
    const res=await(await fetch(`/api/groups?id=${code}`)).json();
    if(res&&res.id){
      if(typeof window!=="undefined") window.history.pushState({},"",`?g=${code}`);
      setGroupId(code);setGroup(res);
      const myGroups=JSON.parse(ls("exp-groups")||"[]");
      if(!myGroups.find((g:any)=>g.id===code)){myGroups.push({id:code,name:res.name});ls("exp-groups",JSON.stringify(myGroups));}
      setJoinMode(false);
    }else{alert("Group not found");}
  },[joinCode]);

  const toggleReaction=useCallback(async(expId:string,emoji:string)=>{
    if(!user)return;
    const res=await(await fetch("/api/expenses",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:expId,username:user,reaction:emoji})})).json();
    if(res.ok){setExpenses(p=>p.map(e=>e.id===expId?{...e,reactions:JSON.stringify(res.reactions)}:e));}
  },[user]);

  const downloadPdfData=useCallback(async()=>{
    if(!groupId)return;
    setShowPdfLoading(true);
    try{
      const res=await(await fetch(`/api/report?gid=${groupId}${selMonth?'&month='+selMonth:''}`)).json();
      // Open as printable HTML in new tab
      const w=window.open('','_blank');
      if(!w)return;
      const memberRows=Object.entries(res.perMember||{}).map(([n,v]:any)=>`<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${n}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700">€${v.toFixed(2)}</td></tr>`).join('');
      const catRows=(res.catSorted||[]).map(([c,v]:any)=>`<tr><td style="padding:4px 12px;border-bottom:1px solid #eee">${c}</td><td style="padding:4px 12px;border-bottom:1px solid #eee;text-align:right">€${v.toFixed(2)}</td><td style="padding:4px 12px;border-bottom:1px solid #eee;text-align:right">${res.total>0?(v/res.total*100).toFixed(0):'0'}%</td></tr>`).join('');
      const tripRows=(res.perTrip||[]).map(([t,v]:any)=>`<tr><td style="padding:4px 12px;border-bottom:1px solid #eee">${t}</td><td style="padding:4px 12px;border-bottom:1px solid #eee;text-align:right">€${v.toFixed(2)}</td></tr>`).join('');
      w.document.write(`<!DOCTYPE html><html><head><title>${res.groupName} - ${res.period}</title><style>body{font-family:'DM Sans',system-ui,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#1a1a2e}h1{font-size:24px;margin:0}h2{font-size:16px;color:#666;margin:24px 0 8px;border-bottom:2px solid #3b6de6;padding-bottom:4px}table{width:100%;border-collapse:collapse}.hero{background:linear-gradient(135deg,#3b6de6,#5b9aff);color:white;padding:24px;border-radius:12px;margin-bottom:24px}.hero h1{color:white}.hero .big{font-size:36px;font-weight:800;margin:8px 0}.stat{display:inline-block;margin-right:24px;font-size:13px;opacity:0.9}@media print{body{margin:0;padding:10px}.hero{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
      <div class="hero"><h1>${res.groupName}</h1><div style="font-size:14px;opacity:0.85;margin:4px 0">${res.period} · Expense Report</div><div class="big">€${res.total.toFixed(2)}</div><span class="stat">${res.count} expenses</span><span class="stat">Shared: €${res.shared.toFixed(2)}</span><span class="stat">Personal: €${res.personal.toFixed(2)}</span></div>
      <h2>Per Member</h2><table>${memberRows}</table>
      <h2>By Category</h2><table><tr style="font-size:12px;color:#999"><td style="padding:4px 12px">Category</td><td style="padding:4px 12px;text-align:right">Amount</td><td style="padding:4px 12px;text-align:right">Share</td></tr>${catRows}</table>
      ${tripRows?`<h2>By Trip</h2><table>${tripRows}</table>`:''}
      <div style="margin-top:32px;font-size:11px;color:#999;text-align:center">Generated ${new Date().toLocaleDateString('en-GB')} · Expense Tracker</div>
      </body></html>`);
      w.document.close();
    }catch(e){alert("Failed to generate report");}
    setShowPdfLoading(false);
  },[groupId,selMonth]);

  const openEdit=(e:Expense)=>{setEditExp(e);setEditAmt(String(e.amount));setEditDesc(e.description);setEditCur(e.currency||"EUR");setEditTrip(e.trip||"");setEditScope(e.scope||"shared");};

  const shareUrl=typeof window!=="undefined"&&groupId?`${window.location.origin}?g=${groupId}`:"";

  const glass=(extra:any={})=>({background:th.gbg,border:`1px solid ${th.gbd}`,borderRadius:G.r,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,boxShadow:th.cardS,...extra});

  const ScopeBadge=({s}:{s:string})=><span style={{fontSize:7,fontWeight:600,padding:"1px 4px",borderRadius:6,background:s==="personal"?th.prBg:th.shBg,color:s==="personal"?th.prC:th.shC}}>{s==="personal"?"👤":"👫"}</span>;

  // ═══════════════════════════════════════════════════════════
  // LANDING — No group selected
  // ═══════════════════════════════════════════════════════════
  if(!groupId&&!createMode&&!joinMode){
    const myGroups=myGroupsList;
    return(
      <div style={{fontFamily:F,background:th.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes countUp{from{opacity:.4;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerSlide{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes donutDraw{from{stroke-dasharray:0 240}to{stroke-dasharray:var(--target) 240}}
        @keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
          button{font-family:${F};transition:all .2s}*{box-sizing:border-box;margin:0;padding:0}`}</style>

        <div style={{...glass({padding:"40px 36px",maxWidth:420,width:"100%",textAlign:"center" as const}),animation:"scaleIn .3s ease"}}>
          <div style={{width:60,height:60,borderRadius:14,background:th.acG,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:th.acSh}}><span style={{fontSize:28}}>💰</span></div>
          <h1 style={{fontSize:22,fontWeight:800,color:th.tx,margin:"0 0 4px",letterSpacing:-.5}}>Expense Tracker</h1>
          <p style={{fontSize:13,color:th.t2,margin:"0 0 28px"}}>Track shared expenses with your group</p>

          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={()=>setCreateMode(true)} style={{padding:"14px",borderRadius:G.r,background:th.acG,color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:th.acSh}}
              onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.97)";}}
              onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
            >Create a Group</button>
            <button onClick={()=>setJoinMode(true)} style={{padding:"14px",borderRadius:G.r,background:th.gbg,color:th.ac,border:`1.5px solid ${th.ac}44`,fontSize:14,fontWeight:700,cursor:"pointer"}}
              onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.97)";}}
              onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
            >Join with Code</button>
          </div>

          {myGroups.length>0&&(
            <div style={{marginTop:24}}>
              <div style={{fontSize:9,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8,marginBottom:8}}>My Groups</div>
              {myGroups.map((g:any)=>(
                <button key={g.id} onClick={()=>{if(typeof window!=="undefined")window.history.pushState({},"",`?g=${g.id}`);setGroupId(g.id);}}
                  style={{width:"100%",padding:"10px 14px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,marginBottom:4,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:F}}
                  onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.98)";}}
                  onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
                >
                  <span style={{fontSize:13,fontWeight:600,color:th.tx}}>{g.name}</span>
                  <Ic d="M9 5l7 7-7 7" s={14} c={th.t3}/>
                </button>
              ))}
            </div>
          )}

          {/* Theme */}
          <div style={{marginTop:24,display:"flex",justifyContent:"center",gap:6}}>
            
            {Object.entries(TH).map(([k,v]:any)=>(
              <button key={k} onClick={()=>setTk(k)} style={{width:26,height:26,borderRadius:"50%",border:tk===k?`2px solid ${th.ac}`:`1px solid ${th.bd}`,background:k==="light"?"#f0f4fa":k==="dark"?"#111828":"#fef1f7",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>{v.ic}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══ CREATE GROUP ══════════════════════════════════════════
  if(createMode){
    return(
      <div style={{fontFamily:F,background:th.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{...glass({padding:"36px 32px",maxWidth:420,width:"100%"}),animation:"scaleIn .3s ease"}}>
          <button onClick={()=>setCreateMode(false)} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,marginBottom:12,fontFamily:F,fontSize:13,display:"flex",alignItems:"center",gap:4}}>
            <Ic d="M15 19l-7-7 7-7" s={16} c={th.t3}/> Back
          </button>
          <h2 style={{fontSize:20,fontWeight:800,color:th.tx,margin:"0 0 20px"}}>Create Group</h2>

          <label style={{fontSize:9,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8}}>Group Name</label>
          <input value={cgName} onChange={(e:any)=>setCgName(e.target.value)} placeholder="Family, Trip Rome, etc."
            style={{width:"100%",padding:"10px 12px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontSize:14,fontFamily:F,outline:"none",marginTop:4,marginBottom:14}}/>

          <label style={{fontSize:9,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8}}>4-Digit PIN</label>
          <input type="password" inputMode="numeric" maxLength={4} value={cgPin} onChange={(e:any)=>setCgPin(e.target.value.replace(/\D/g,""))} placeholder="••••"
            style={{width:100,padding:"10px 12px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontSize:18,fontFamily:F,outline:"none",letterSpacing:4,textAlign:"center",marginTop:4,marginBottom:14}}/>

          <label style={{fontSize:9,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8}}>Members ({cgCount})</label>
          <div style={{display:"flex",gap:6,marginTop:6,marginBottom:10}}>
            {[2,3,4].map(n=>(
              <button key={n} onClick={()=>setCgCount(n)} style={{padding:"6px 14px",borderRadius:G.rXs,border:cgCount===n?`2px solid ${th.ac}`:`1px solid ${th.bd}`,background:cgCount===n?th.acS:"transparent",color:cgCount===n?th.ac:th.t3,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:F}}>{n}</button>
            ))}
          </div>
          {Array.from({length:cgCount}).map((_,i)=>(
            <input key={i} value={cgMembers[i]||""} onChange={(e:any)=>{const m=[...cgMembers];m[i]=e.target.value;setCgMembers(m);}}
              placeholder={`Member ${i+1} name`}
              style={{width:"100%",padding:"9px 12px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontSize:13,fontFamily:F,outline:"none",marginBottom:6}}/>
          ))}

          <button onClick={createGroup} disabled={!cgName.trim()||cgPin.length!==4||cgMembers.slice(0,cgCount).filter(m=>m.trim()).length<2}
            style={{width:"100%",padding:"13px",borderRadius:G.r,background:th.acG,color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:10,boxShadow:th.acSh,opacity:(!cgName.trim()||cgPin.length!==4)?.5:1}}
            onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.97)";}}
            onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
          >Create Group</button>
        </div>
      </div>
    );
  }

  // ═══ JOIN GROUP ════════════════════════════════════════════
  if(joinMode){
    return(
      <div style={{fontFamily:F,background:th.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{...glass({padding:"36px 32px",maxWidth:420,width:"100%"}),animation:"scaleIn .3s ease"}}>
          <button onClick={()=>setJoinMode(false)} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,marginBottom:12,fontFamily:F,fontSize:13,display:"flex",alignItems:"center",gap:4}}>
            <Ic d="M15 19l-7-7 7-7" s={16} c={th.t3}/> Back
          </button>
          <h2 style={{fontSize:20,fontWeight:800,color:th.tx,margin:"0 0 20px"}}>Join Group</h2>
          <label style={{fontSize:9,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8}}>Group Code</label>
          <input value={joinCode} onChange={(e:any)=>setJoinCode(e.target.value)} placeholder="Paste the group code"
            style={{width:"100%",padding:"10px 12px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontSize:14,fontFamily:F,outline:"none",marginTop:4,marginBottom:14}}/>
          <button onClick={joinGroup} disabled={!joinCode.trim()}
            style={{width:"100%",padding:"13px",borderRadius:G.r,background:th.acG,color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:th.acSh,opacity:!joinCode.trim()?.5:1}}
            onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.97)";}}
            onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
          >Join</button>
        </div>
      </div>
    );
  }

  // ═══ PIN GATE ══════════════════════════════════════════════
  if(groupId&&group&&!pinUnlocked){
    return(
      <div style={{fontFamily:F,background:th.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}button{font-family:${F}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
        <div style={{...glass({padding:"40px 36px",maxWidth:380,width:"100%",textAlign:"center" as const}),animation:"scaleIn .3s ease"}}>
          <div style={{fontSize:36,marginBottom:10}}>🔐</div>
          <h2 style={{fontSize:18,fontWeight:800,color:th.tx,margin:"0 0 4px"}}>{group.name}</h2>
          <p style={{fontSize:12,color:th.t3,margin:"0 0 20px"}}>Enter 4-digit PIN</p>
          <input type="password" inputMode="numeric" maxLength={4} value={pinInput}
            onChange={(e:any)=>setPinInput(e.target.value.replace(/\D/g,""))}
            onKeyDown={(e:any)=>{if(e.key==="Enter")verifyPin();}}
            style={{width:120,textAlign:"center",fontSize:28,fontWeight:800,letterSpacing:8,color:th.tx,background:th.gbg,border:`2px solid ${th.bd}`,borderRadius:G.rS,padding:"10px",outline:"none",fontFamily:F}} placeholder="····" autoFocus/>
          <div style={{marginTop:14}}>
            <button onClick={verifyPin} style={{padding:"10px 28px",borderRadius:G.rS,background:th.acG,color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:th.acSh}}
              onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.96)";}}
              onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
            >Unlock</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ MEMBER SELECT ════════════════════════════════════════
  if(groupId&&pinUnlocked&&!user){
    return(
      <div style={{fontFamily:F,background:th.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}button{font-family:${F}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
        <div style={{...glass({padding:"40px 36px",maxWidth:440,width:"100%",textAlign:"center" as const}),animation:"scaleIn .3s ease"}}>
          <h1 style={{fontSize:20,fontWeight:800,color:th.tx,margin:"0 0 4px"}}>{group?.name||"Group"}</h1>
          <p style={{fontSize:13,color:th.t2,margin:"0 0 6px"}}>Who&apos;s adding?</p>
          {streak>0&&<p style={{fontSize:11,color:th.ac,margin:"0 0 20px"}}>🔥 {streak}-day streak!</p>}
          {streak===0&&<p style={{fontSize:11,color:th.t3,margin:"0 0 20px"}}>Start tracking!</p>}

          <div style={{display:"grid",gridTemplateColumns:members.length<=2?"1fr 1fr":"1fr 1fr",gap:12}}>
            {members.map((n,i)=>(
              <button key={n} onClick={()=>{setUser(n);setTab("home");}}
                style={{padding:"20px 12px",borderRadius:G.r,background:th.gbg,border:`1.5px solid ${th.gbd}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:10,fontFamily:F}}
                onMouseEnter={(e:any)=>{e.currentTarget.style.borderColor=MEM_C[i%4];e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={(e:any)=>{e.currentTarget.style.borderColor=th.gbd;e.currentTarget.style.transform="translateY(0)";}}
                onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.96)";}}
                onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
              >
                <div style={{width:50,height:50,borderRadius:"50%",background:MEM_G[i%4],display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#fff",fontWeight:800}}>{n[0]}</div>
                <span style={{fontSize:14,fontWeight:700,color:th.tx}}>{n}</span>
              </button>
            ))}
          </div>

          <div style={{marginTop:24,display:"flex",justifyContent:"center",gap:6}}>
            <button onClick={()=>setShowShare(true)} style={{padding:"6px 14px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:11,color:th.t2,cursor:"pointer",fontFamily:F}}>📤 Share</button>
            <button onClick={()=>{setGroupId(null);setGroup(null);setPinUnlocked(false);if(typeof window!=="undefined")window.history.pushState({},"","?");}} style={{padding:"6px 14px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:11,color:th.t3,cursor:"pointer",fontFamily:F}}>← Groups</button>
          </div>

          {/* Theme */}
          <div style={{marginTop:16,display:"flex",justifyContent:"center",gap:6}}>
            
            {Object.entries(TH).map(([k,v]:any)=>(
              <button key={k} onClick={()=>setTk(k)} style={{width:22,height:22,borderRadius:"50%",border:tk===k?`2px solid ${th.ac}`:`1px solid ${th.bd}`,background:k==="light"?"#f0f4fa":k==="dark"?"#111828":"#fef1f7",cursor:"pointer",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center"}}>{v.ic}</button>
            ))}
          </div>
        </div>

        {/* Share modal */}
        {showShare&&(
          <Modal th={th} onClose={()=>setShowShare(false)}>
            <h3 style={{fontSize:16,fontWeight:800,color:th.tx,margin:"0 0 14px",textAlign:"center"}}>Share Group</h3>
            <div style={{textAlign:"center",marginBottom:14}}>
              <QRCode data={shareUrl} size={140}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:9,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8}}>Group Code</label>
              <div style={{display:"flex",gap:6,marginTop:4}}>
                <input readOnly value={groupId||""} style={{flex:1,padding:"8px 10px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontSize:13,fontFamily:F}}/>
                <button onClick={()=>{if(typeof navigator!=="undefined")navigator.clipboard?.writeText(groupId||"");setToast("Code copied!");setTimeout(()=>setToast(""),1500);}} style={{padding:"8px 12px",borderRadius:G.rXs,background:th.acG,color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F}}>Copy</button>
              </div>
            </div>
            <div>
              <label style={{fontSize:9,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8}}>Link</label>
              <div style={{display:"flex",gap:6,marginTop:4}}>
                <input readOnly value={shareUrl} style={{flex:1,padding:"8px 10px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontSize:11,fontFamily:F,overflow:"hidden",textOverflow:"ellipsis"}}/>
                <button onClick={()=>{if(typeof navigator!=="undefined")navigator.clipboard?.writeText(shareUrl);setToast("Link copied!");setTimeout(()=>setToast(""),1500);}} style={{padding:"8px 12px",borderRadius:G.rXs,background:th.acG,color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F}}>Copy</button>
              </div>
            </div>
            {typeof navigator!=="undefined"&&navigator.share&&(
              <button onClick={()=>navigator.share({title:`${group?.name} Expenses`,url:shareUrl}).catch(()=>{})} style={{width:"100%",padding:"10px",borderRadius:G.rXs,background:th.gbg,border:`1px solid ${th.bd}`,color:th.tx,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,marginTop:10}}>📱 Share via...</button>
            )}
          </Modal>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN APP
  // ═══════════════════════════════════════════════════════════
  const memIdx=members.indexOf(user||"");
  const memColor=MEM_C[memIdx%4]||th.ac;
  const memGrad=MEM_G[memIdx%4]||th.acG;

  return(
    <div style={{fontFamily:F,background:th.bg,minHeight:"100vh",paddingBottom:70,transition:"background .4s"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes countUp{from{opacity:.4;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerSlide{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes donutDraw{from{stroke-dasharray:0 240}to{stroke-dasharray:var(--target) 240}}
        @keyframes confettiFall{0%{transform:translateY(-10vh) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
        button{font-family:${F};transition:transform .1s}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${th.bd};border-radius:2px}`}</style>

      {/* Confetti (Feature #5) */}
      {confetti&&(
        <div style={{position:"fixed",inset:0,zIndex:999,pointerEvents:"none",overflow:"hidden"}}>
          {Array.from({length:30}).map((_,i)=>(
            <div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:"-5%",width:8,height:8,borderRadius:Math.random()>.5?"50%":"2px",background:CAT_C[i%CAT_C.length],animation:`confettiFall ${1.5+Math.random()*2}s ease ${Math.random()*.5}s forwards`}}/>
          ))}
        </div>
      )}

      {/* Header with progressive blur (Feature #15) */}
      <header style={{position:"sticky",top:0,zIndex:50,background:th.hdr,backdropFilter:`saturate(${140+Math.min(scrollY,60)}%) blur(${12+Math.min(scrollY/3,8)}px)`,WebkitBackdropFilter:`saturate(${140+Math.min(scrollY,60)}%) blur(${12+Math.min(scrollY/3,8)}px)`,borderBottom:`1px solid ${th.bd}`,boxShadow:scrollY>10?th.cardS:th.hdrS,padding:"0 12px",height:50,display:"flex",alignItems:"center",gap:6,transition:"box-shadow .3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:28,height:28,borderRadius:7,background:th.acG,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:14}}>💰</span></div>
          <span style={{fontSize:12,fontWeight:800,color:th.tx}}>{group?.name||"Expenses"}</span>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px 2px 3px",borderRadius:12,background:th.gbg,border:`1px solid ${th.bd}`,flexShrink:0}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:memGrad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{user?.[0]}</div>
          <span style={{fontSize:10,fontWeight:600,color:th.tx}}>{user}</span>
          <button onClick={()=>setUser(null)} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,fontSize:12,lineHeight:1,padding:0}}>×</button>
        </div>
        <button onClick={()=>setShowShare(true)} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,padding:2}}>
          <Ic d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" s={16} c={th.t3}/>
        </button>
      </header>

      {/* Content area */}
      <div ref={scrollRef} style={{maxWidth:600,margin:"0 auto",padding:"14px 12px",opacity:pageTransition?.3:1,transform:pageTransition?"translateY(4px)":"translateY(0)",transition:"opacity .08s,transform .08s"}}>

        {/* Activity feed banner - Feature #18 */}
        {newExpBanner&&(
          <div style={{...glass({padding:"8px 12px",marginBottom:8,borderColor:th.ac}),color:th.ac,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5,animation:"bannerSlide .3s ease"}}
            onClick={()=>setNewExpBanner(null)}>
            <span style={{fontSize:14}}>🔔</span>{newExpBanner}<span style={{marginLeft:"auto",opacity:.5,cursor:"pointer"}}>×</span>
          </div>
        )}

        {/* Toast */}
        {toast&&<div style={{...glass({padding:"8px 12px",marginBottom:10,borderColor:th.ok}),color:th.ok,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5,animation:"slideDown .2s ease"}}><Ic d="M20 6L9 17l-5-5" s={14} c={th.ok} sw={2.5}/>{toast}</div>}

        {/* ═══ HOME / BENTO DASHBOARD (Feature #1) ═══ */}
        {tab==="home"&&(
          <div style={{animation:"fadeUp .3s ease"}}>
            {/* Daily banner */}
            {todayExps.length>0&&(
              <div style={{...glass({padding:"8px 12px",marginBottom:10}),display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:10,color:th.t2}}>Today: <strong style={{color:th.tx}}>{fE(todayTotal)}</strong> ({todayExps.length})</span>
                {streak>0&&<span style={{fontSize:9,color:th.ac}}>🔥{streak}d</span>}
              </div>
            )}

            {/* Bento grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {/* Total card (large) */}
              <div style={{...glass({padding:"16px 14px"}),gridColumn:"1/3"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:8,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8}}>Total{selMonth?` · ${MONTHS[parseInt(selMonth.slice(5))-1]}`:" · All Time"}</div>
                    <div style={{fontSize:28,fontWeight:800,color:th.tx,letterSpacing:-1,marginTop:2,animation:"countUp .4s ease"}} key={Math.round(totAll)}>{fE(totAll)}</div>
                  </div>
                  {/* Weekly sparkline (Feature #12) */}
                  <svg width={80} height={32} style={{flexShrink:0}}>
                    {sparkline.map((v,i)=>{
                      const x=i*(80/6);const h=sparkMax>0?v/sparkMax*24:0;
                      return<rect key={i} x={x} y={32-h} width={10} height={h} rx={2} fill={i===6?th.ac:th.ac+"44"}/>;
                    })}
                  </svg>
                </div>
                {/* Shared/Personal bar */}
                {totAll>0&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
                    <span style={{fontSize:8,color:th.shC}}>👫{fE(totShared)}</span>
                    <div style={{flex:1,height:3,borderRadius:2,background:th.bd,overflow:"hidden"}}>
                      <div style={{height:"100%",background:`linear-gradient(90deg,${th.shC} ${totShared/totAll*100}%,${th.prC} ${totShared/totAll*100}%)`,width:"100%"}}/>
                    </div>
                    <span style={{fontSize:8,color:th.prC}}>👤{fE(totPersonal)}</span>
                  </div>
                )}
              </div>

              {/* Per-member cards */}
              {members.map((n,i)=>(
                <div key={n} style={{...glass({padding:"12px 10px"}),borderLeft:`3px solid ${MEM_C[i%4]}`}}>
                  <div style={{fontSize:8,fontWeight:700,color:MEM_C[i%4],textTransform:"uppercase" as const,letterSpacing:.8}}>{n}</div>
                  <div style={{fontSize:16,fontWeight:800,color:th.tx,marginTop:2,animation:"countUp .4s ease"}} key={Math.round(memberTotals[n]||0)}>{fE(memberTotals[n]||0)}</div>
                  <div style={{fontSize:8,color:th.t3}}>{filtered.filter(e=>e.username===n).length} entries</div>
                </div>
              ))}

              {/* Balance indicator (Feature #13) */}
              {balanceInfo&&balanceInfo.gap>1&&(
                <div style={{...glass({padding:"10px 12px"}),gridColumn:"1/3"}}>
                  <div style={{fontSize:8,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8,marginBottom:4}}>Balance</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {members.map((n,i)=>{
                      const pct=totAll>0?(memberTotals[n]||0)/totAll*100:100/members.length;
                      return<div key={n} style={{height:6,borderRadius:3,background:MEM_C[i%4],flex:pct,transition:"flex .5s"}}/>;
                    })}
                  </div>
                  <div style={{fontSize:9,color:th.t2,marginTop:4}}>{balanceInfo.maxSpender.name} spent {fE(balanceInfo.gap/2)} more than average</div>
                </div>
              )}

              {/* Top category */}
              {catSorted.length>0&&(
                <div style={{...glass({padding:"10px 12px"})}}>
                  <div style={{fontSize:8,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8}}>Top Category</div>
                  <div style={{fontSize:16,marginTop:4}}>{CAT_E[catSorted[0][0]]||"📦"}</div>
                  <div style={{fontSize:11,fontWeight:700,color:th.tx}}>{catSorted[0][0]}</div>
                  <div style={{fontSize:9,color:th.t3}}>{fE(catSorted[0][1].total)}</div>
                </div>
              )}

              {/* Streak card */}
              <div style={{...glass({padding:"10px 12px",textAlign:"center" as const})}}>
                <div style={{fontSize:24}}>{streak>0?"🔥":"❄️"}</div>
                <div style={{fontSize:16,fontWeight:800,color:th.tx}}>{streak}</div>
                <div style={{fontSize:8,color:th.t3}}>day streak</div>
              </div>
            </div>

            {/* Month picker */}
            <div style={{display:"flex",gap:4,marginBottom:10,alignItems:"center"}}>
              <button onClick={()=>setShowCal(!showCal)} style={{...glass({padding:"4px 8px",borderRadius:G.rXs}),cursor:"pointer",fontSize:10,fontWeight:600,color:selMonth?th.ac:th.t2,border:`1px solid ${selMonth?th.ac+"44":th.gbd}`,fontFamily:F,display:"flex",alignItems:"center",gap:3}}>
                <Ic d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" s={11} c={selMonth?th.ac:th.t3}/>
                {selMonth?`${MONTHS[parseInt(selMonth.slice(5))-1]} ${selMonth.slice(0,4)}`:"All Time"}
              </button>
              {selMonth&&<button onClick={()=>{setSelMonth(null);setShowCal(false);}} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,fontSize:14}}>×</button>}
            </div>

            {showCal&&availMonths.length>0&&(
              <div style={{...glass({padding:10,marginBottom:10}),animation:"fadeUp .15s ease"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                  {availMonths.map(m=>{
                    const[y,mo]=m.split("-");
                    const mT=expenses.filter(e=>e.created_at.startsWith(m)).reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);
                    return<button key={m} onClick={()=>{setSelMonth(m);setShowCal(false);}} style={{padding:"5px 2px",borderRadius:G.rXs,border:selMonth===m?`2px solid ${th.ac}`:`1px solid ${th.bd}`,background:selMonth===m?th.acS:"transparent",cursor:"pointer",fontFamily:F,textAlign:"center" as const}}>
                      <div style={{fontSize:11,fontWeight:700,color:selMonth===m?th.ac:th.tx}}>{MONTHS[parseInt(mo)-1]}</div>
                      <div style={{fontSize:8,color:th.t3}}>{y}</div>
                      <div style={{fontSize:8,fontWeight:600,color:th.t2}}>{fE(mT)}</div>
                    </button>;
                  })}
                </div>
              </div>
            )}

            {/* Recent expenses */}
            <div style={{fontSize:8,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8,marginBottom:6}}>Recent</div>
            {loading?<>{[0,1,2].map(i=><Skel key={i} th={th}/>)}</>:
              expenses.length===0?(
                <div style={{...glass({textAlign:"center" as const,padding:"32px 20px"})}}>
                  <div style={{fontSize:40,marginBottom:6}}>🏖️</div>
                  <div style={{fontSize:14,fontWeight:700,color:th.tx}}>No expenses yet</div>
                  <div style={{fontSize:11,color:th.t3,marginTop:2}}>Tap + to add your first one!</div>
                </div>
              ):
              expenses.slice(0,8).map((e,i)=>(
                <div key={e.id} style={{...glass({padding:"7px 10px",marginBottom:3}),display:"flex",alignItems:"center",gap:7,cursor:"pointer",animation:`fadeUp .2s ease ${i*0.02}s both`}} onClick={()=>openEdit(e)}
                  onMouseDown={(ev:any)=>{ev.currentTarget.style.transform="scale(0.98)";}}
                  onMouseUp={(ev:any)=>{ev.currentTarget.style.transform="scale(1)";}}
                >
                  <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:MEM_G[members.indexOf(e.username)%4]||th.acG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{e.username[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,color:th.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.description}</div>
                    <div style={{fontSize:7,color:th.t3,display:"flex",gap:2,alignItems:"center",flexWrap:"wrap"}}>{fDS(e.created_at)} {CAT_E[e.category]||"📦"}<ScopeBadge s={e.scope||"shared"}/></div>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:th.tx,whiteSpace:"nowrap"}}>{fE(Number(e.amount_eur||e.amount))}</div>
                </div>
              ))
            }
          </div>
        )}

        {/* ═══ HISTORY (Feature #10 grouped by date) ═══ */}
        {tab==="history"&&(
          <div style={{animation:"fadeUp .3s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <h2 style={{fontSize:16,fontWeight:800,color:th.tx}}>History</h2>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>api.exportCsv()} style={{padding:"3px 7px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:9,color:th.t2,cursor:"pointer",fontFamily:F}}>📥 CSV</button>
                <button onClick={()=>setShowShare(true)} style={{padding:"3px 7px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:9,color:th.t2,cursor:"pointer",fontFamily:F}}>📤</button>
              </div>
            </div>

            {/* Search (Feature #9) */}
            <div style={{...glass({padding:"6px 10px",marginBottom:8}),display:"flex",alignItems:"center",gap:6}}>
              <Ic d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" s={14} c={th.t3}/>
              <input value={searchQ} onChange={(e:any)=>setSearchQ(e.target.value)} placeholder="Search expenses..."
                style={{flex:1,border:"none",background:"transparent",color:th.tx,fontSize:12,outline:"none",fontFamily:F}}/>
              {searchQ&&<button onClick={()=>setSearchQ("")} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,fontSize:14}}>×</button>}
            </div>

            {/* Filter pills */}
            <div style={{display:"flex",gap:2,marginBottom:10,flexWrap:"wrap"}}>
              {["all",...members].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{padding:"3px 8px",borderRadius:5,border:"none",background:filter===f?th.acS:"transparent",color:filter===f?th.ac:th.t3,fontWeight:filter===f?700:500,fontSize:9,cursor:"pointer",fontFamily:F}}>{f==="all"?"All":f}</button>
              ))}
            </div>

            {loading?<>{[0,1,2,3].map(i=><Skel key={i} th={th}/>)}</>:
              groupedByDate.length===0?(
                <div style={{...glass({textAlign:"center" as const,padding:"32px 20px"})}}>
                  <div style={{fontSize:36}}>🔍</div>
                  <div style={{fontSize:13,fontWeight:600,color:th.tx,marginTop:4}}>Nothing found</div>
                </div>
              ):
              groupedByDate.map(([dateKey,dayExps])=>{
                const dayTotal=dayExps.reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);
                return(
                  <div key={dateKey} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,padding:"0 2px"}}>
                      <span style={{fontSize:10,fontWeight:700,color:th.t2}}>{dayLabel(dayExps[0].created_at)}</span>
                      <span style={{fontSize:10,fontWeight:700,color:th.tx}}>{fE(dayTotal)}</span>
                    </div>
                    {dayExps.map(e=>{
                      const comments:any[]=JSON.parse(e.comments||"[]");
                      return(
                        <div key={e.id} style={{...glass({padding:"8px 10px",marginBottom:3})}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:MEM_G[members.indexOf(e.username)%4]||th.acG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>{e.username[0]}</div>
                            <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>openEdit(e)}>
                              <div style={{display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
                                <span style={{fontSize:11,fontWeight:600,color:th.tx}}>{e.description}</span>
                                <span style={{fontSize:6,fontWeight:600,padding:"1px 4px",borderRadius:5,background:th.acS,color:th.ac}}>{CAT_E[e.category]||"📦"}{e.category}</span>
                                <ScopeBadge s={e.scope||"shared"}/>
                                {e.trip&&<span style={{fontSize:6,padding:"1px 3px",borderRadius:5,background:th.okBg,color:th.ok}}>🏷️{e.trip}</span>}
                              </div>
                              <div style={{fontSize:8,color:th.t3,marginTop:1}}>{e.username} · {fT(e.created_at)}{e.currency&&e.currency!=="EUR"?` · ${e.currency}→EUR`:""}</div>
                            </div>
                            <div style={{textAlign:"right" as const,flexShrink:0}}>
                              <div style={{fontSize:13,fontWeight:800,color:th.tx}}>{fE(Number(e.amount_eur||e.amount))}</div>
                              {e.currency&&e.currency!=="EUR"&&<div style={{fontSize:7,color:th.t3}}>{CURRENCIES.find(c=>c.c===e.currency)?.s}{e.amount}</div>}
                            </div>
                            <div style={{display:"flex",flexDirection:"column",gap:1,flexShrink:0}}>
                              <button onClick={(ev)=>{ev.stopPropagation();setCommentExpId(commentExpId===e.id?null:e.id);setCommentText("");}} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,padding:1,fontSize:10,opacity:.5}}>💬{comments.length>0&&<sup style={{fontSize:6}}>{comments.length}</sup>}</button>
                              {/* Reactions - Feature #16 */}
                              <div style={{display:"flex",gap:1,marginTop:1}}>
                                {["👍","😱","❓","😂"].map(em=>{
                                  const rx:Record<string,string[]>=JSON.parse(e.reactions||"{}");
                                  const count=(rx[em]||[]).length;
                                  const mine=(rx[em]||[]).includes(user||"");
                                  return<button key={em} onClick={(ev)=>{ev.stopPropagation();toggleReaction(e.id,em);}}
                                    style={{background:mine?th.acS:"transparent",border:count>0?`1px solid ${th.bd}`:"1px solid transparent",borderRadius:8,padding:"0px 3px",fontSize:10,cursor:"pointer",opacity:count>0?1:.3,lineHeight:"16px",display:"flex",alignItems:"center",gap:1}}
                                  >{em}{count>0&&<span style={{fontSize:7,color:th.t2}}>{count}</span>}</button>;
                                })}
                              </div>
                              <button onClick={(ev)=>{ev.stopPropagation();setDelConfirm(e.id);}} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,padding:1,opacity:.3}}
                                onMouseEnter={(ev:any)=>{ev.currentTarget.style.color=th.er;ev.currentTarget.style.opacity="1";}}
                                onMouseLeave={(ev:any)=>{ev.currentTarget.style.color=th.t3;ev.currentTarget.style.opacity=".3";}}>
                                <Ic d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" s={11}/>
                              </button>
                            </div>
                          </div>
                          {commentExpId===e.id&&(
                            <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${th.bd}`}}>
                              {comments.map((c:any,ci:number)=>(
                                <div key={ci} style={{fontSize:9,color:th.t2,marginBottom:2}}>
                                  <strong style={{color:MEM_C[members.indexOf(c.user)%4]||th.ac}}>{c.user}</strong>: {c.text} <span style={{fontSize:7,color:th.t3}}>· {fDS(c.at)}</span>
                                </div>
                              ))}
                              <div style={{display:"flex",gap:4,marginTop:3}}>
                                <input value={commentText} onChange={(e:any)=>setCommentText(e.target.value)} placeholder="Note..." onKeyDown={(e:any)=>{if(e.key==="Enter")addComment();}}
                                  style={{flex:1,fontSize:10,padding:"3px 6px",borderRadius:4,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,outline:"none",fontFamily:F}}/>
                                <button onClick={addComment} style={{padding:"3px 8px",borderRadius:4,background:th.acG,color:"#fff",border:"none",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:F}}>Send</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            }
            {expenses.length>0&&<div style={{marginTop:16,textAlign:"center"}}><button onClick={()=>setDelConfirm("__ALL__")} style={{padding:"4px 12px",borderRadius:G.rXs,background:th.erBg,border:`1px solid ${th.er}22`,color:th.er,fontWeight:600,fontSize:9,cursor:"pointer",fontFamily:F}}>Clear All</button></div>}
          </div>
        )}

        {/* ═══ STATS (Donut + Chart + Categories) ═══ */}
        {tab==="stats"&&(
          <div style={{animation:"fadeUp .3s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <h2 style={{fontSize:16,fontWeight:800,color:th.tx,margin:0}}>Stats</h2>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>setShowSummaryCard(true)} style={{padding:"3px 7px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:9,color:th.t2,cursor:"pointer",fontFamily:F}}>📊 Card</button>
                <button onClick={downloadPdfData} disabled={showPdfLoading} style={{padding:"3px 7px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:9,color:th.t2,cursor:"pointer",fontFamily:F}}>{showPdfLoading?"⏳":"📄"} Report</button>
              </div>
            </div>

            {/* Donut chart (Feature #11) */}
            {catSorted.length>0&&(
              <div style={{...glass({padding:14,marginBottom:10}),display:"flex",alignItems:"center",gap:16}}>
                <svg width={90} height={90} viewBox="0 0 100 100">
                  {(()=>{let offset=0;return catSorted.map(([cat,data],i)=>{
                    const pct=totAll>0?data.total/totAll*100:0;const r=38;const circ=2*Math.PI*r;
                    const seg=<circle key={cat} cx="50" cy="50" r={r} fill="none" stroke={CAT_C[i%CAT_C.length]} strokeWidth="12"
                      strokeDasharray={`${pct/100*circ} ${circ}`} strokeDashoffset={-offset/100*circ} transform="rotate(-90 50 50)" strokeLinecap="round" style={{transition:"stroke-dasharray .6s ease,stroke-dashoffset .6s ease"}}/>;
                    offset+=pct;return seg;
                  });})()}
                  <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="800" fill={th.tx}>{fE(totAll)}</text>
                  <text x="50" y="60" textAnchor="middle" fontSize="7" fill={th.t3}>{filtered.length} expenses</text>
                </svg>
                <div style={{flex:1}}>
                  {catSorted.slice(0,5).map(([cat,data],i)=>(
                    <div key={cat} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                      <div style={{width:8,height:8,borderRadius:2,background:CAT_C[i%CAT_C.length],flexShrink:0}}/>
                      <span style={{fontSize:9,color:th.tx,fontWeight:600,flex:1}}>{cat}</span>
                      <span style={{fontSize:9,color:th.t3,fontWeight:600}}>{(totAll>0?data.total/totAll*100:0).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly chart */}
            <div style={{...glass({padding:12,marginBottom:10})}}>
              <div style={{fontSize:8,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8,marginBottom:8}}>Monthly</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:5,height:80}}>
                {chartData.map((m,i)=>{
                  const total=Object.values(m.totals).reduce((a,b)=>a+b,0);
                  const h=chartMax>0?total/chartMax*60:0;
                  let cumH=0;
                  return<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                    <div style={{fontSize:7,fontWeight:700,color:th.tx}}>{total>0?fE(total):""}</div>
                    <div style={{width:"100%",height:60,display:"flex",flexDirection:"column",justifyContent:"flex-end",borderRadius:3,overflow:"hidden"}}>
                      {members.map((n,mi)=>{
                        const mh=chartMax>0?(m.totals[n]||0)/chartMax*60:0;
                        cumH+=mh;
                        return<div key={n} style={{width:"100%",height:Math.max(0,mh),background:MEM_G[mi%4]}}/>;
                      })}
                    </div>
                    <div style={{fontSize:7,color:th.t3}}>{m.label}</div>
                  </div>;
                })}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:6,flexWrap:"wrap"}}>
                {members.map((n,i)=><span key={n} style={{fontSize:8,color:MEM_C[i%4],fontWeight:600}}>● {n}</span>)}
              </div>
            </div>

            {/* Category bars */}
            {catSorted.map(([cat,data],i)=>{
              const pct=totAll>0?(data.total/totAll)*100:0;
              return<div key={cat} style={{...glass({padding:"10px 12px",marginBottom:4})}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:14}}>{CAT_E[cat]||"📦"}</span>
                    <span style={{fontSize:11,fontWeight:700,color:th.tx}}>{cat}</span>
                    <span style={{fontSize:8,color:th.t3}}>{data.count} · {pct.toFixed(0)}%</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:800,color:th.tx}}>{fE(data.total)}</span>
                </div>
                <div style={{height:4,borderRadius:2,background:th.bd,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:CAT_C[i%CAT_C.length],width:`${pct}%`,transition:"width .5s"}}/></div>
              </div>;
            })}
          </div>
        )}

        {/* ═══ AI ═══ */}
        {tab==="ai"&&(
          <div style={{animation:"fadeUp .3s ease"}}>
            <h2 style={{fontSize:16,fontWeight:800,color:th.tx,margin:"0 0 12px"}}>AI Insights</h2>
            <button onClick={getInsights} disabled={insightLoading}
              style={{width:"100%",padding:"12px",borderRadius:G.r,background:th.acG,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:insightLoading?"default":"pointer",fontFamily:F,boxShadow:th.acSh,opacity:insightLoading?.6:1,marginBottom:12}}
              onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.97)";}}
              onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
            >{insightLoading?"Analyzing...":"✨ Get Insights"}</button>
            {insightText&&<div style={{...glass({padding:14}),marginBottom:12}}><div style={{fontSize:11,lineHeight:1.7,color:th.tx,whiteSpace:"pre-wrap"}}>{insightText}</div></div>}

            <div style={{...glass({padding:12,textAlign:"center" as const}),marginBottom:12}}>
              <div style={{fontSize:28}}>{streak>0?"🔥":"❄️"}</div>
              <div style={{fontSize:18,fontWeight:800,color:th.tx}}>{streak}</div>
              <div style={{fontSize:10,color:th.t3}}>day streak</div>
            </div>

            {availTrips.length>0&&(
              <div style={{...glass({padding:12})}}>
                <div style={{fontSize:8,fontWeight:700,color:th.t3,textTransform:"uppercase" as const,letterSpacing:.8,marginBottom:6}}>Trips</div>
                {availTrips.map(t=>{
                  const tT=expenses.filter(e=>e.trip===t).reduce((s,e)=>s+Number(e.amount_eur||e.amount),0);
                  return<div key={t} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${th.bd}`}}>
                    <span style={{fontSize:11,fontWeight:600,color:th.tx}}>🏷️ {t}</span>
                    <span style={{fontSize:11,fontWeight:700,color:th.tx}}>{fE(tT)}</span>
                  </div>;
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ FAB (Feature #8) ═══ */}
      {!showFab&&(
        <button onClick={()=>setShowFab(true)} style={{position:"fixed",bottom:76,right:20,width:48,height:48,borderRadius:"50%",background:th.acG,color:"#fff",border:"none",fontSize:22,fontWeight:700,cursor:"pointer",boxShadow:th.acSh,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center"}}
          onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.9)";}}
          onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
        >+</button>
      )}

      {/* FAB sheet */}
      {showFab&&(
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"flex-end",background:th.modalBg,backdropFilter:"blur(4px)"}} onClick={()=>setShowFab(false)}>
          <div style={{width:"100%",maxWidth:600,margin:"0 auto",background:th.card,borderRadius:"20px 20px 0 0",padding:"20px 16px 32px",boxShadow:th.cardS,animation:"slideUp .2s ease"}} onClick={(e:any)=>e.stopPropagation()}>
            <div style={{width:36,height:4,borderRadius:2,background:th.bd,margin:"0 auto 14px"}}/>
            <h3 style={{fontSize:14,fontWeight:800,color:th.tx,marginBottom:10}}>Quick Add</h3>

            {/* Scope */}
            <div style={{display:"flex",gap:4,marginBottom:8}}>
              {[{k:"shared",l:"👫 Shared"},{k:"personal",l:"👤 Personal"}].map(s=>(
                <button key={s.k} onClick={()=>setScope(s.k)} style={{flex:1,padding:"6px",borderRadius:G.rXs,border:scope===s.k?`2px solid ${scope==="shared"?th.shC:th.prC}`:`1px solid ${th.bd}`,background:scope===s.k?(s.k==="shared"?th.shBg:th.prBg):"transparent",fontSize:10,fontWeight:scope===s.k?700:500,color:scope===s.k?(s.k==="shared"?th.shC:th.prC):th.t3,cursor:"pointer",fontFamily:F}}>{s.l}</button>
              ))}
            </div>

            <div style={{display:"flex",gap:6,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:4,flex:1,...glass({padding:"8px 10px"})}}>
                <span style={{fontSize:18,fontWeight:800,color:th.t3}}>€</span>
                <input ref={amtRef} type="text" inputMode="decimal" value={amount} onChange={(e:any)=>setAmount(e.target.value.replace(/[^0-9.,]/g,""))} placeholder="0.00"
                  style={{flex:1,fontSize:20,fontWeight:800,color:th.tx,background:"transparent",border:"none",outline:"none",fontFamily:F}}/>
              </div>
            </div>
            <div style={{...glass({padding:"8px 10px",marginBottom:8})}}>
              <input type="text" value={desc} onChange={(e:any)=>setDesc(e.target.value)} placeholder="Description"
                onKeyDown={(e:any)=>{if(e.key==="Enter")addExpense();}}
                style={{width:"100%",fontSize:13,color:th.tx,background:"transparent",border:"none",outline:"none",fontFamily:F}}/>
            </div>
            {presets.length>0&&!desc&&(
              <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
                {presets.map((p,i)=><button key={i} onClick={()=>setDesc(p.desc)} style={{padding:"3px 7px",borderRadius:8,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:9,color:th.t2,cursor:"pointer",fontFamily:F}}>{CAT_E[p.cat]||"📦"}{p.desc}</button>)}
              </div>
            )}
            {/* Date picker */}
            <div style={{...glass({padding:"6px 10px",marginBottom:8}),display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:10,color:th.t3,fontWeight:600}}>Date:</span>
              <input type="date" value={expDate} onChange={(e:any)=>setExpDate(e.target.value)} max={new Date().toISOString().slice(0,10)}
                style={{flex:1,fontSize:12,color:th.tx,background:"transparent",border:"none",outline:"none",fontFamily:F}}/>
              {expDate&&<button onClick={()=>setExpDate("")} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,fontSize:12}}>×</button>}
              {!expDate&&<span style={{fontSize:9,color:th.t3}}>Today</span>}
            </div>
            <button onClick={addExpense} disabled={!amount||!desc.trim()||saving}
              style={{width:"100%",padding:"12px",borderRadius:G.r,background:(!amount||!desc.trim())?th.bd:th.acG,color:(!amount||!desc.trim())?th.t3:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,boxShadow:(!amount||!desc.trim())?"none":th.acSh}}
              onMouseDown={(e:any)=>{if(amount&&desc.trim())e.currentTarget.style.transform="scale(0.97)";}}
              onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
            >{saving?"Saving...":"Add Expense"}</button>
          </div>
        </div>
      )}

      {/* ═══ Bottom Tab Bar (Feature #6) ═══ */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:60,background:th.hdr,backdropFilter:G.blur,WebkitBackdropFilter:G.blur,borderTop:`1px solid ${th.bd}`,display:"flex",justifyContent:"space-around",padding:"6px 0 env(safe-area-inset-bottom,8px)",boxShadow:"0 -2px 12px rgba(0,0,0,0.04)"}}>
        {[
          {k:"home",l:"Home",ic:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"},
          {k:"history",l:"History",ic:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"},
          {k:"stats",l:"Stats",ic:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"},
          {k:"ai",l:"AI",ic:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"},
        ].map(n=>(
          <button key={n.k} onClick={()=>switchTab(n.k)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 12px",border:"none",background:"transparent",cursor:"pointer",fontFamily:F,color:tab===n.k?th.ac:th.t3,transition:"color .15s"}}
            onMouseDown={(e:any)=>{e.currentTarget.style.transform="scale(0.9)";}}
            onMouseUp={(e:any)=>{e.currentTarget.style.transform="scale(1)";}}
          >
            <div style={{position:"relative"}}>
              <Ic d={n.ic} s={20} c={tab===n.k?th.ac:th.t3} sw={tab===n.k?2.2:1.5}/>
              {tab===n.k&&<div style={{position:"absolute",bottom:-4,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:th.ac}}/>}
            </div>
            <span style={{fontSize:9,fontWeight:tab===n.k?700:500}}>{n.l}</span>
          </button>
        ))}
      </nav>

      {/* ═══ SUMMARY CARD MODAL — Feature #17 ═══ */}
      {showSummaryCard&&(
        <Modal th={th} onClose={()=>setShowSummaryCard(false)}>
          <div id="summary-card" style={{background:th.acG,borderRadius:G.r,padding:20,color:"#fff",textAlign:"center" as const}}>
            <div style={{fontSize:10,opacity:.8,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:1}}>{group?.name}</div>
            <div style={{fontSize:11,opacity:.7,marginTop:2}}>{selMonth?`${MONTHS[parseInt(selMonth.slice(5))-1]} ${selMonth.slice(0,4)}`:"All Time"}</div>
            <div style={{fontSize:36,fontWeight:800,marginTop:8}}>{fE(totAll)}</div>
            <div style={{fontSize:11,opacity:.8,marginTop:2}}>{filtered.length} expenses · {streak>0?`🔥 ${streak}d streak`:""}</div>
            <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:14}}>
              {members.map((n,i)=>(
                <div key={n} style={{textAlign:"center" as const}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px",fontSize:13,fontWeight:700}}>{n[0]}</div>
                  <div style={{fontSize:10,fontWeight:700}}>{fE(memberTotals[n]||0)}</div>
                  <div style={{fontSize:8,opacity:.7}}>{n}</div>
                </div>
              ))}
            </div>
            {catSorted.length>0&&(
              <div style={{marginTop:12,fontSize:10,opacity:.85}}>Top: {CAT_E[catSorted[0][0]]||"📦"} {catSorted[0][0]} ({totAll>0?(catSorted[0][1].total/totAll*100).toFixed(0):"0"}%)</div>
            )}
            <div style={{marginTop:10,fontSize:8,opacity:.5}}>Expense Tracker · {new Date().toLocaleDateString("en-GB")}</div>
          </div>
          <div style={{display:"flex",gap:6,marginTop:12,justifyContent:"center"}}>
            <button onClick={()=>{
              const el=document.getElementById("summary-card");
              if(el&&navigator.clipboard){
                navigator.clipboard.writeText(`${group?.name} ${selMonth?MONTHS[parseInt(selMonth.slice(5))-1]+" "+selMonth.slice(0,4):"All Time"}: ${fE(totAll)} across ${filtered.length} expenses. ${members.map(n=>`${n}: ${fE(memberTotals[n]||0)}`).join(", ")}`);
                setToast("Summary copied!");setTimeout(()=>setToast(""),1500);
              }
            }} style={{padding:"8px 14px",borderRadius:G.rXs,background:th.acG,color:"#fff",border:"none",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F}}>📋 Copy Text</button>
            <button onClick={()=>setShowSummaryCard(false)} style={{padding:"8px 14px",borderRadius:G.rXs,background:th.gbg,border:`1px solid ${th.bd}`,color:th.t2,fontSize:11,cursor:"pointer",fontFamily:F}}>Close</button>
          </div>
        </Modal>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {editExp&&(
        <Modal th={th} onClose={()=>setEditExp(null)}>
          <h3 style={{fontSize:14,fontWeight:800,color:th.tx,margin:"0 0 12px"}}>Edit</h3>
          <div style={{display:"flex",gap:4,marginBottom:8}}>
            {[{k:"shared",l:"👫 Shared"},{k:"personal",l:"👤 Personal"}].map(s=>(
              <button key={s.k} onClick={()=>setEditScope(s.k)} style={{flex:1,padding:"5px",borderRadius:G.rXs,border:editScope===s.k?`2px solid ${editScope==="shared"?th.shC:th.prC}`:`1px solid ${th.bd}`,background:editScope===s.k?(s.k==="shared"?th.shBg:th.prBg):"transparent",fontSize:10,fontWeight:editScope===s.k?700:500,color:editScope===s.k?(s.k==="shared"?th.shC:th.prC):th.t3,cursor:"pointer",fontFamily:F}}>{s.l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:4,marginBottom:6}}>
            <select value={editCur} onChange={(e:any)=>setEditCur(e.target.value)} style={{padding:"6px",borderRadius:6,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontFamily:F,fontSize:11}}>
              {CURRENCIES.map(c=><option key={c.c} value={c.c}>{c.f} {c.c}</option>)}
            </select>
            <input type="text" inputMode="decimal" value={editAmt} onChange={(e:any)=>setEditAmt(e.target.value.replace(/[^0-9.,]/g,""))}
              style={{flex:1,fontSize:16,fontWeight:700,padding:"6px 8px",borderRadius:6,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,outline:"none",fontFamily:F}}/>
          </div>
          <input type="text" value={editDesc} onChange={(e:any)=>setEditDesc(e.target.value)}
            style={{width:"100%",fontSize:12,padding:"6px 8px",borderRadius:6,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,outline:"none",fontFamily:F,marginBottom:6}}/>
          <input type="text" value={editTrip} onChange={(e:any)=>setEditTrip(e.target.value)} placeholder="Trip (optional)"
            style={{width:"100%",fontSize:11,padding:"6px 8px",borderRadius:6,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,outline:"none",fontFamily:F,marginBottom:10}}/>
          <div style={{display:"flex",gap:6}}>
            <button onClick={saveEdit} disabled={saving} style={{flex:1,padding:"8px",borderRadius:G.rXs,background:th.acG,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Save</button>
            <button onClick={()=>setEditExp(null)} style={{padding:"8px 12px",borderRadius:G.rXs,background:th.gbg,border:`1px solid ${th.bd}`,color:th.t2,fontSize:12,cursor:"pointer",fontFamily:F}}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {delConfirm&&(
        <Modal th={th} onClose={()=>setDelConfirm(null)}>
          <div style={{textAlign:"center" as const}}>
            <div style={{fontSize:24,marginBottom:4}}>⚠️</div>
            <h3 style={{fontSize:14,fontWeight:800,color:th.tx,margin:"0 0 4px"}}>{delConfirm==="__ALL__"?"Clear all?":"Delete?"}</h3>
            <p style={{fontSize:11,color:th.t2,margin:"0 0 14px"}}>Cannot be undone.</p>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>
              <button onClick={confirmDelete} style={{padding:"8px 18px",borderRadius:G.rXs,background:th.er,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Delete</button>
              <button onClick={()=>setDelConfirm(null)} style={{padding:"8px 18px",borderRadius:G.rXs,background:th.gbg,border:`1px solid ${th.bd}`,color:th.t2,fontSize:12,cursor:"pointer",fontFamily:F}}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Share modal */}
      {showShare&&(
        <Modal th={th} onClose={()=>setShowShare(false)}>
          <h3 style={{fontSize:14,fontWeight:800,color:th.tx,margin:"0 0 12px",textAlign:"center"}}>Share Group</h3>
          <div style={{textAlign:"center",marginBottom:12}}><QRCode data={shareUrl} size={130}/></div>
          <div style={{marginBottom:8}}>
            <label style={{fontSize:8,fontWeight:700,color:th.t3,textTransform:"uppercase" as const}}>Code</label>
            <div style={{display:"flex",gap:4,marginTop:2}}>
              <input readOnly value={groupId||""} style={{flex:1,padding:"6px 8px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontSize:12,fontFamily:F}}/>
              <button onClick={()=>{navigator.clipboard?.writeText(groupId||"");setToast("Copied!");setTimeout(()=>setToast(""),1500);}} style={{padding:"6px 10px",borderRadius:G.rXs,background:th.acG,color:"#fff",border:"none",fontSize:10,cursor:"pointer",fontFamily:F}}>Copy</button>
            </div>
          </div>
          <div>
            <label style={{fontSize:8,fontWeight:700,color:th.t3,textTransform:"uppercase" as const}}>Link</label>
            <div style={{display:"flex",gap:4,marginTop:2}}>
              <input readOnly value={shareUrl} style={{flex:1,padding:"6px 8px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:"transparent",color:th.tx,fontSize:10,fontFamily:F,overflow:"hidden",textOverflow:"ellipsis"}}/>
              <button onClick={()=>{navigator.clipboard?.writeText(shareUrl);setToast("Copied!");setTimeout(()=>setToast(""),1500);}} style={{padding:"6px 10px",borderRadius:G.rXs,background:th.acG,color:"#fff",border:"none",fontSize:10,cursor:"pointer",fontFamily:F}}>Copy</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
