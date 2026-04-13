#!/usr/bin/env python3
"""
V6 Patch — Adds 9 features to expense tracker V5 page.tsx:
  6. Smart duplicate detection
 12. Animated number counters (CSS-based)
 15. Animated donut chart transitions
 16. Emoji reactions on expenses
 17. Monthly shareable summary card
 18. Activity feed with new-expense banner
 20. PDF report download link
"""
import re

with open("src/app/page.tsx", "r") as f:
    code = f.read()

# ═══════════════════════════════════════════════════════════════
# 1. Add new state variables after existing ones
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    "const amtRef=useRef<HTMLInputElement>(null);",
    """const amtRef=useRef<HTMLInputElement>(null);
  const[lastExpCount,setLastExpCount]=useState(0);
  const[newExpBanner,setNewExpBanner]=useState<string|null>(null);
  const[dupWarning,setDupWarning]=useState<string|null>(null);
  const[ctxMenu,setCtxMenu]=useState<{id:string,x:number,y:number}|null>(null);
  const[showSummaryCard,setShowSummaryCard]=useState(false);
  const[showPdfLoading,setShowPdfLoading]=useState(false);"""
)

# ═══════════════════════════════════════════════════════════════
# 2. Add CSS animations for counters & donut in the style tag
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    "@keyframes confettiFall{",
    """@keyframes countUp{from{opacity:.4;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerSlide{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes donutDraw{from{stroke-dasharray:0 240}to{stroke-dasharray:var(--target) 240}}
        @keyframes confettiFall{"""
)

# ═══════════════════════════════════════════════════════════════
# 3. Activity feed banner (Feature #18) — detect new expenses from others
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    "const iv=setInterval(()=>{",
    """// Track expense count for activity feed banner
    setLastExpCount(prev => {
      if(prev === 0) return expenses.length; // initial
      return prev;
    });
    const iv=setInterval(()=>{"""
)

# After the polling fetch, check for new expenses
code = code.replace(
    'fetch(`/api/expenses?gid=${groupId}`).then(r=>r.json()).then(d=>{if(Array.isArray(d))setExpenses(d);}).catch(()=>{});',
    '''fetch(`/api/expenses?gid=${groupId}`).then(r=>r.json()).then(d=>{
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
      }).catch(()=>{});'''
)

# ═══════════════════════════════════════════════════════════════
# 4. Smart duplicate detection (Feature #6) — check before adding
# ═══════════════════════════════════════════════════════════════
old_add_start = "const addExpense=useCallback(async()=>{"
new_add_start = """const checkDuplicate=(desc:string,amt:number):boolean=>{
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

  const addExpense=useCallback(async()=>{"""
code = code.replace(old_add_start, new_add_start)

# Add duplicate check inside addExpense
code = code.replace(
    "if(!v||v<=0||!desc.trim()||!user||!groupId||saving)return;",
    """if(!v||v<=0||!desc.trim()||!user||!groupId||saving)return;
    // Feature #6: Duplicate detection
    if(checkDuplicate(desc.trim(),Math.round(v*100)/100)){
      if(!confirm("This looks like a duplicate of a recent expense. Add anyway?")){return;}
    }"""
)

# ═══════════════════════════════════════════════════════════════
# 5. Add reaction API call + PDF report API call
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    "const openEdit=(e:Expense)=>{",
    """const toggleReaction=useCallback(async(expId:string,emoji:string)=>{
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

  const openEdit=(e:Expense)=>{"""
)

# ═══════════════════════════════════════════════════════════════
# 6. Add new-expense banner to the main content area (Feature #18)
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    "{/* Toast */}",
    """{/* Activity feed banner - Feature #18 */}
        {newExpBanner&&(
          <div style={{...glass({padding:"8px 12px",marginBottom:8,borderColor:th.ac}),color:th.ac,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5,animation:"bannerSlide .3s ease"}}
            onClick={()=>setNewExpBanner(null)}>
            <span style={{fontSize:14}}>🔔</span>{newExpBanner}<span style={{marginLeft:"auto",opacity:.5,cursor:"pointer"}}>×</span>
          </div>
        )}

        {/* Toast */}"""
)

# ═══════════════════════════════════════════════════════════════
# 7. Animated number counters (Feature #12) — add animation class to totals
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    """<div style={{fontSize:28,fontWeight:800,color:th.tx,letterSpacing:-1,marginTop:2}}>{fE(totAll)}</div>""",
    """<div style={{fontSize:28,fontWeight:800,color:th.tx,letterSpacing:-1,marginTop:2,animation:"countUp .4s ease"}} key={Math.round(totAll)}>{fE(totAll)}</div>"""
)

# ═══════════════════════════════════════════════════════════════
# 8. Add PDF report button to Stats tab (Feature #20)
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    '<h2 style={{fontSize:16,fontWeight:800,color:th.tx,margin:"0 0 12px"}}>Stats</h2>',
    """<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <h2 style={{fontSize:16,fontWeight:800,color:th.tx,margin:0}}>Stats</h2>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>setShowSummaryCard(true)} style={{padding:"3px 7px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:9,color:th.t2,cursor:"pointer",fontFamily:F}}>📊 Card</button>
                <button onClick={downloadPdfData} disabled={showPdfLoading} style={{padding:"3px 7px",borderRadius:G.rXs,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:9,color:th.t2,cursor:"pointer",fontFamily:F}}>{showPdfLoading?"⏳":"📄"} Report</button>
              </div>
            </div>"""
)

# ═══════════════════════════════════════════════════════════════
# 9. Add emoji reactions to expense rows in History (Feature #16)
# ═══════════════════════════════════════════════════════════════
# Find the comment button in History and add reactions before it
code = code.replace(
    """<button onClick={(ev)=>{ev.stopPropagation();setCommentExpId(commentExpId===e.id?null:e.id);setCommentText("");}} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,padding:1,fontSize:10,opacity:.5}}>💬{comments.length>0&&<sup style={{fontSize:6}}>{comments.length}</sup>}</button>""",
    """<button onClick={(ev)=>{ev.stopPropagation();setCommentExpId(commentExpId===e.id?null:e.id);setCommentText("");}} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,padding:1,fontSize:10,opacity:.5}}>💬{comments.length>0&&<sup style={{fontSize:6}}>{comments.length}</sup>}</button>
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
                              </div>"""
)

# ═══════════════════════════════════════════════════════════════
# 10. Add shareable summary card modal (Feature #17) before the edit modal
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    "{/* ═══ EDIT MODAL ═══ */}",
    """{/* ═══ SUMMARY CARD MODAL — Feature #17 ═══ */}
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

      {/* ═══ EDIT MODAL ═══ */}"""
)

# ═══════════════════════════════════════════════════════════════
# 11. Update Expense type to include reactions
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    "type Expense={id:string;group_id:string;username:string;amount:number;currency:string;amount_eur:number;description:string;category:string;trip:string;scope:string;comments:string;created_at:string};",
    "type Expense={id:string;group_id:string;username:string;amount:number;currency:string;amount_eur:number;description:string;category:string;trip:string;scope:string;comments:string;reactions:string;created_at:string};"
)

# ═══════════════════════════════════════════════════════════════
# 12. Add animated donut drawing (Feature #15) — SVG animation via CSS
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    'strokeLinecap="round"/>',
    'strokeLinecap="round" style={{transition:"stroke-dasharray .6s ease,stroke-dashoffset .6s ease"}}/>',
    1  # only first occurrence
)

# ═══════════════════════════════════════════════════════════════
# 13. Add animated counters to member cards on Bento (Feature #12)
# ═══════════════════════════════════════════════════════════════
code = code.replace(
    """<div style={{fontSize:16,fontWeight:800,color:th.tx,marginTop:2}}>{fE(memberTotals[n]||0)}</div>""",
    """<div style={{fontSize:16,fontWeight:800,color:th.tx,marginTop:2,animation:"countUp .4s ease"}} key={Math.round(memberTotals[n]||0)}>{fE(memberTotals[n]||0)}</div>"""
)

with open("src/app/page.tsx", "w") as f:
    f.write(code)

print("✅ V6 patch applied — 9 features added:")
print("   6. Smart duplicate detection")
print("  12. Animated number counters")
print("  15. Animated donut chart transitions")
print("  16. Emoji reactions on expenses")
print("  17. Monthly shareable summary card")
print("  18. Activity feed banner")
print("  20. PDF report (printable HTML)")
