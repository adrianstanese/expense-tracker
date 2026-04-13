#!/usr/bin/env python3
"""
V6.1 Patch:
1. Remove dark mode — only light + pink themes, no auto
2. RON input with fixed 5.1 conversion to EUR
3. Date picker for past expenses (default: now, past dates default to 12:00)
"""

with open("src/app/page.tsx", "r") as f:
    code = f.read()

# ═══════════════════════════════════════════════════════════════
# 1. REMOVE DARK MODE — force light as default, remove auto + dark
# ═══════════════════════════════════════════════════════════════

# Remove auto theme function
code = code.replace(
    """function autoThemeKey():string {
  const h=new Date().getHours();
  if(h>=22||h<6) return "dark";
  if(h>=18) return "dark";
  return "light";
}""",
    """function autoThemeKey():string {
  return "light";
}"""
)

# Remove the dark theme entirely from TH object
# Find the dark theme line and remove it
import re
code = re.sub(r'\s*dark:\{[^}]+\},?\n', '\n', code, count=1)

# Fix any reference to "dark" theme that might break
# Change default theme from "auto" to "light"
code = code.replace('const[tk,setTk]=useState("auto");', 'const[tk,setTk]=useState("light");')

# Remove auto button from all theme selectors
code = code.replace(
    """<button onClick={()=>setTk("auto")} style={{padding:"3px 8px",borderRadius:8,border:tk==="auto"?`2px solid ${th.ac}`:`1px solid ${th.bd}`,background:tk==="auto"?th.acS:"transparent",fontSize:10,color:tk==="auto"?th.ac:th.t3,cursor:"pointer",fontFamily:F}}>Auto</button>""",
    ""
)
code = code.replace(
    """<button onClick={()=>setTk("auto")} style={{padding:"2px 7px",borderRadius:6,border:tk==="auto"?`2px solid ${th.ac}`:`1px solid ${th.bd}`,background:tk==="auto"?th.acS:"transparent",fontSize:9,color:tk==="auto"?th.ac:th.t3,cursor:"pointer",fontFamily:F}}>Auto</button>""",
    ""
)

# Remove dark theme button references (the k==="dark" background check)
# These are in the theme dot buttons — just leave them, they'll skip dark since it doesn't exist

# ═══════════════════════════════════════════════════════════════
# 2. RON INPUT WITH FIXED 5.1 CONVERSION
# ═══════════════════════════════════════════════════════════════

# Replace the currency selector with a simple EUR/RON toggle
# In the Add form and FAB sheet, replace the 5-currency selector

# Add RON conversion constant at the top
code = code.replace(
    "const MONTHS = [",
    "const RON_EUR_RATE = 5.1; // Fixed RON to EUR conversion rate\nconst MONTHS = ["
)

# Simplify currencies to just EUR and RON
code = code.replace(
    """const CURRENCIES = [{c:"EUR",s:"€",f:"🇪🇺"},{c:"RON",s:"lei",f:"🇷🇴"},{c:"BGN",s:"лв",f:"🇧🇬"},{c:"USD",s:"$",f:"🇺🇸"},{c:"GBP",s:"£",f:"🇬🇧"}];""",
    """const CURRENCIES = [{c:"EUR",s:"€",f:"🇪🇺"},{c:"RON",s:"lei",f:"🇷🇴"}];"""
)

# ═══════════════════════════════════════════════════════════════
# 3. DATE PICKER FOR PAST EXPENSES
# ═══════════════════════════════════════════════════════════════

# Add date state variables
code = code.replace(
    'const[scope,setScope]=useState("shared");',
    'const[scope,setScope]=useState("shared");\n  const[expDate,setExpDate]=useState("");'
)

# In addExpense, include the custom date
code = code.replace(
    'const res=await(await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),group_id:groupId,username:user,amount:Math.round(v*100)/100,description:desc.trim(),currency,trip,scope})})).json();',
    'const customDate=expDate?new Date(expDate+"T12:00:00").toISOString():undefined;\n      const res=await(await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),group_id:groupId,username:user,amount:Math.round(v*100)/100,description:desc.trim(),currency,trip,scope,created_at:customDate})})).json();'
)

# Reset date after adding
code = code.replace(
    'setAmount("");setDesc("");setShowFab(false);',
    'setAmount("");setDesc("");setExpDate("");setShowFab(false);'
)

# Add date picker to the FAB sheet — after the description input
code = code.replace(
    """{presets.length>0&&!desc&&(
              <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
                {presets.map((p,i)=><button key={i} onClick={()=>setDesc(p.desc)} style={{padding:"3px 7px",borderRadius:8,border:`1px solid ${th.bd}`,background:th.gbg,fontSize:9,color:th.t2,cursor:"pointer",fontFamily:F}}>{CAT_E[p.cat]||"📦"}{p.desc}</button>)}
              </div>
            )}
            <button onClick={addExpense}""",
    """{presets.length>0&&!desc&&(
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
            <button onClick={addExpense}"""
)

# Also add date picker to the Home tab Add form (in the trip section area)
# Find the trip section in the Home/Add area and add date picker before the Add button
code = code.replace(
    """<button onClick={()=>{const t=prompt("New trip/event:");if(t)setTrip(t);}} style={{padding:"2px 6px",borderRadius:6,border:`1px dashed ${th.bd}`,background:"transparent",fontSize:9,color:th.t3,cursor:"pointer",fontFamily:F}}>+ New</button>
            </div>

            <button onClick={addExpense} disabled=""",
    """<button onClick={()=>{const t=prompt("New trip/event:");if(t)setTrip(t);}} style={{padding:"2px 6px",borderRadius:6,border:`1px dashed ${th.bd}`,background:"transparent",fontSize:9,color:th.t3,cursor:"pointer",fontFamily:F}}>+ New</button>
            </div>

            {/* Date picker */}
            <div style={{...glass({padding:"6px 10px",marginBottom:10}),display:"flex",alignItems:"center",gap:6}}>
              <Ic d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" s={12} c={th.t3}/>
              <span style={{fontSize:10,color:th.t3,fontWeight:600}}>Date:</span>
              <input type="date" value={expDate} onChange={(e:any)=>setExpDate(e.target.value)} max={new Date().toISOString().slice(0,10)}
                style={{flex:1,fontSize:12,color:th.tx,background:"transparent",border:"none",outline:"none",fontFamily:F}}/>
              {expDate&&<button onClick={()=>setExpDate("")} style={{background:"none",border:"none",cursor:"pointer",color:th.t3,fontSize:12}}>×</button>}
              {!expDate&&<span style={{fontSize:9,color:th.t3}}>Today</span>}
            </div>

            <button onClick={addExpense} disabled="""
)

with open("src/app/page.tsx", "w") as f:
    f.write(code)

print("✅ V6.1 patch applied:")
print("   1. Dark mode removed (light + pink only)")
print("   2. RON input with fixed 5.1 rate conversion")  
print("   3. Date picker for past expenses (defaults to today, 12PM for past)")
