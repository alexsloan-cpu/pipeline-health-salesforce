// Usage view. Used by dmUsage. Rendered into lwc:dom="manual" containers.
export const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function dealPrompts(r,u){
  const base=(u.prompts||[]).filter(p=>p[1]!=='Fold into renewal?'&&p[1]!=='If this goes stale');
  if(r.acctView)return base;
  const st=u.status,top=String(u.top||'').toLowerCase(),over=st==='Over'||st==='Approaching',out=[];
  if(r.rt==='Renewal'){
    if(over)out.push(['info','Growth block on','Account is '+st.toLowerCase()+' on '+top+'. Renewal Outcome Call defaults to Growth. Owner can change it, with a reason.']);
    if(st==='Underused')out.push(['warn','Check the outcome call','Under 30% within 6 months of renewal. Confirm or reset the Renewal Outcome Call.']);
    if(st==='No usage yet')out.push(['warn','No usage yet','Almost nothing used on this contract so far. Worth asking why before this renewal gets close.']);
  }else{
    if(r.rt==='Midterm')out.push([over?'good':'warn','Entry check '+(over?'passed':'failed'),'Increase Usage needs the account Over or Approaching. Today it is '+st+'.']);
    if(u.d2t<=120)out.push(['warn','Fold into renewal?','Contract ends in '+u.d2t+' days. Decide whether this runs as a midterm or inside the renewal.']);
  }
  return out.concat(base);
}
const US_COL=['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4','#008300'];
const usN=n=>n==null?'':n>=1e9?(n/1e9).toFixed(n>=1e10?0:1).replace(/\.0$/,'')+'B':n>=1e6?(n/1e6).toFixed(n>=1e8?0:1).replace(/\.0$/,'')+'M':n>=1e3?Math.round(n/1e3)+'K':String(n);
export const usM=n=>'$'+Number(n).toLocaleString('en-US');
function usLine(h){
  const W=640,H=230,L=40,R=h.s.length<=4?108:14,T=14,B=26,pw=W-L-R,ph=H-T-B,all=h.s.flatMap(s=>s.v.filter(v=>v!=null)).concat((h.py||[]).filter(v=>v!=null));
  const top=Math.max(120,Math.ceil(Math.max(...all)/20)*20),n=h.m.length;
  const X=i=>L+(n>1?i/(n-1)*pw:pw/2),Y=v=>T+ph-v/top*ph,tk=[];for(let v=0;v<=top;v+=top>200?100:top>120?40:20)if(v!==100)tk.push(v);
  const grid=tk.map(v=>`<line x1="${L}" x2="${L+pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ecebea"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="#5c5c5c">${v}%</text>`).join('');
  const lim=`<line x1="${L}" x2="${L+pw}" y1="${Y(100)}" y2="${Y(100)}" stroke="#444" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${L-6}" y="${Y(100)+4}" text-anchor="end" font-size="11" font-weight="700" fill="#181818">100%</text>`;
  const xl=h.m.map((m,i)=>`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="11" fill="#5c5c5c">${m}</text>`).join('');
  const lines=h.s.map(s=>{const segs=[];let c=[];s.v.forEach((v,i)=>{if(v==null){if(c.length)segs.push(c);c=[]}else c.push(X(i)+','+Y(v))});if(c.length)segs.push(c);
    const lastI=s.v.length-1;return segs.map(p=>`<polyline points="${p.join(' ')}" fill="none" stroke="${US_COL[s.c]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`).join('')+`<circle cx="${X(lastI)}" cy="${Y(s.v[lastI])}" r="4" fill="${US_COL[s.c]}" stroke="#fff" stroke-width="2"/>`}).join('');
  const pv=(h.py||[]).map((v,i)=>v==null?null:X(i)+','+Y(v)).filter(Boolean);const prior=pv.length>1?`<polyline points="${pv.join(' ')}" fill="none" stroke="#2a78d6" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round"/>`:'';
  let lab='';
  if(h.s.length<=4){const it=h.s.map(s=>({n:s.n,y:Y(s.v[s.v.length-1])+4,v:s.v[s.v.length-1]})).sort((a,b)=>a.y-b.y);for(let i=1;i<it.length;i++)if(it[i].y-it[i-1].y<14)it[i].y=it[i-1].y+14;
    const over=it.length?it[it.length-1].y-(H-B):0;if(over>0)it.forEach(x=>x.y-=over);
    lab=it.map(x=>`<text x="${L+pw+9}" y="${x.y}" font-size="11" fill="#181818">${esc(x.n)} ${x.v}%</text>`).join('')}
  const lg=h.s.map(s=>`<span><i style="background:${US_COL[s.c]}"></i>${esc(s.n)}</span>`).join('')+(pv.length>1?'<span><i style="background:#2a78d6;opacity:.55"></i>Email, same month last year</span>':'')+'<span><i style="background:#444"></i>Contract limit</span>';
  return `<div class="us-ch"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Percent of contract limit used by month, by channel">${grid}${lim}${xl}${prior}<line class="us-cross" x1="0" x2="0" y1="${T}" y2="${T+ph}" stroke="#706e6b" visibility="hidden"/>${lines}${lab}</svg></div><div class="us-lg">${lg}</div>`;
}
function usBars(h){
  const W=420,H=230,L=46,R=8,T=20,B=26,pw=W-L-R,ph=H-T-B,mx=Math.max(...h.o),n=h.o.length,step=Math.pow(10,Math.floor(Math.log10(mx))),top=Math.ceil(mx/step)*step,slot=pw/n,bw=Math.min(24,slot-2);
  const Y=v=>T+ph-v/top*ph;
  const grid=[0,top/2,top].map(v=>`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ecebea"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="#5c5c5c">$${v>=1000?(v/1000)+'K':v}</text>`).join('');
  const bars=h.o.map((v,i)=>{const x=L+i*slot+(slot-bw)/2,y=Y(v),b=T+ph;const r=Math.min(4,b-y);return (v?`<path d="M${x},${b}V${y+r}Q${x},${y} ${x+r},${y}H${x+bw-r}Q${x+bw},${y} ${x+bw},${y+r}V${b}Z" fill="#2a78d6"><title>${h.m[i]}: ${usM(v)} estimated</title></path>`:'')+`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle" font-size="11" fill="#5c5c5c">${h.m[i]}</text>`+((i===n-1&&v)?`<text x="${x+bw/2}" y="${y-5}" text-anchor="end" font-size="11" font-weight="700" fill="#181818">${usM(v)}</text>`:'')}).join('');
  return `<div class="us-ch"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated Overage Cost to Date by month">${grid}${bars}</svg></div>`;
}
export function usageHtml(r){
  const u=r.u;if(!u)return '';
  const tone={Over:'bad',Approaching:'warn',Underused:'warn',Healthy:'good','No usage yet':'none'}[u.status];
  const t=(l,v,s)=>`<div class="us-t"><span>${esc(l)}</span><b>${esc(v)}</b>${s?`<small>${esc(s)}</small>`:''}</div>`;
  const tiles=t('Overage Status',u.status)+t('Usage Percent of Contract',u.topPct+'%',u.top+' is the tightest channel')+t('Usage Pace',u.pace,u.elapsed+'% of contract year gone, email at '+u.emailPct+'%')+t(u.est?'Estimated Overage':'Projected Overage Date',u.est?usM(u.est):(u.cross||'None at this pace'),u.est?'Estimate, not billed':(u.cross?'Email, straight line':''))+t(u.first?'Overage Start Date':'Contract ends',u.first||u.te,u.first?'Contract ends '+u.te:u.d2t+' days away')+(u.pyo?t('Projected Year-End Overage',usM(u.pyo),'Current pace times overage rate'):'');
  const ren=r.rt==='Renewal';const rows=u.ch.map(c=>{const nolim=c.l==null;const w=nolim?0:Math.min(100,c.p);const cl=c.p>100?'b':c.p>=90?'w':'';
    return `<tr><td>${esc(c.n)}${c.un?' <span class="us-tag us-warn" style="font-size:11px;padding:0 7px">Unused</span>':''}</td><td class="r">${usN(c.u)}</td><td class="r">${nolim?'No limit':usN(c.l)}</td><td class="us-bc"><span class="us-track" style="display:block"><i class="${cl}" style="width:${w}%"></i></span></td><td class="r"><b>${nolim?'':c.p+'%'}</b></td><td class="r">${c.r!=null&&c.r?'$'+c.r.toFixed(c.r<.1?3:2)+' per 1K':''}</td><td class="r">${c.e?usM(c.e):''}</td><td class="r">${c.py?usN(c.py):''}</td>${ren?`<td class="r">${c.sg?usN(c.sg):''}</td>`:''}</tr>`}).join('');
  const table=`<div class="us-tw"><table class="us-tb"><thead><tr><th>Channel</th><th class="r">Used</th><th class="r">Contract limit</th><th>Consumption</th><th class="r">%</th><th class="r">Overage rate</th><th class="r">Est. overage</th><th class="r">Projected year end</th>${ren?'<th class="r">Suggested renewal volume</th>':''}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const plist=dealPrompts(r,u);const pr=plist.length?plist.map(p=>`<div class="us-p us-${p[0]}"><b>${esc(p[1])}</b><span>${esc(p[2])}</span></div>`).join(''):'<p class="muted">Nothing to act on from usage right now.</p>';
  const h=u.hist;let charts;
  if(h.m.length<2||!h.s.length)charts='<p class="muted">No monthly usage to chart yet this contract year.</p>';
  else{const anyO=h.o.some(v=>v>0);
    const nums=`<details class="us-num"><summary>See the numbers</summary><div class="us-tw"><table class="us-tb"><thead><tr><th>Month</th>${h.s.map(s=>`<th class="r">${esc(s.n)}</th>`).join('')}${h.py&&h.py.some(v=>v!=null)?'<th class="r">Email last year</th>':''}<th class="r">Est. overage</th></tr></thead><tbody>${h.m.map((m,i)=>`<tr><td>${m}</td>${h.s.map(s=>`<td class="r">${s.v[i]==null?'No data':s.v[i]+'%'}</td>`).join('')}${h.py&&h.py.some(v=>v!=null)?`<td class="r">${h.py[i]==null?'':h.py[i]+'%'}</td>`:''}<td class="r">${h.o[i]?usM(h.o[i]):'$0'}</td></tr>`).join('')}</tbody></table></div></details>`;
    charts=`<div class="us-cols"><div style="flex:1.6 1 380px"><p class="us-ttlr">Usage by Month, This Contract Year</p><p class="us-sub">Percent of contract limit at the end of each month. Sends build through the year and contacts show the level that day. Each year is against that year's limit.</p>${usLine(h)}</div><div><p class="us-ttlr">Estimated Overage Cost to Date</p><p class="us-sub">Running total for the contract year, not monthly charges.</p>${anyO?usBars(h):'<p class="muted" style="margin-top:10px">No overage cost so far this contract year.</p>'}</div></div>${nums}`}
  return `<div class="tile"><div class="head"><h2 class="ttl">Usage</h2><span class="grow"></span><span class="us-tag us-${tone}">${esc(u.status)}</span></div><div class="us-grid">${tiles}</div><div><p class="lab" style="margin-bottom:6px">${r.acctView?'What usage says about this account':'What usage changes on this record'}</p>${pr}</div><div><p class="lab" style="margin-bottom:6px">Contract vs actual</p>${table}</div>${charts}<p class="us-src">From Sigma. Dollars are estimates, not billed amounts.</p></div>`;
}

const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const fmt=iso=>{if(!iso)return null;const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso);return m?MO[+m[2]-1]+' '+(+m[3])+', '+m[1]:null};
const fmtShort=iso=>{const f=fmt(iso);return f?f.replace(/, \d{4}$/,''):''};
export const todayIso=()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')};
const daysBetween=(a,b)=>{const x=/^(\d{4})-(\d{2})-(\d{2})/.exec(a||''),y=/^(\d{4})-(\d{2})-(\d{2})/.exec(b||'');if(!x||!y)return null;const d=Math.round((Date.UTC(+y[1],+y[2]-1,+y[3])-Date.UTC(+x[1],+x[2]-1,+x[3]))/864e5);return d<0?null:d};
const SENIOR=['C-level','VP','Director'];
// r: {isNB,rt,combo,act,acct,ownerName,stage,support}. Post-sales reads the whole account, New Business reads the opp.
export function usContact(r){
  const a=r.isNB?r.act:(r.acct||r.act),asOf=todayIso(),src=[a.lastMeeting,a.lastMomentum,a.lastEmailIn].filter(Boolean).sort().pop();
  const days=src?daysBetween(src,asOf):null,np=r.rt==='Midterm_New_Product'||r.rt==='Midterm_Other',g=r.isNB?7:np?30:14,y=r.isNB?30:45;
  const band=days==null?'Red':days<=g?'Green':days<=y?'Yellow':'Red';
  const within=x=>x&&daysBetween(x,asOf)!=null&&daysBetween(x,asOf)<=90;
  const ppl=(a.people||[]).filter(p=>within(p.lastTouch)),sr=ppl.filter(p=>SENIOR.includes(p.level));
  const t3=(r.isNB||r.rt==='Renewal'||r.rt==='Midterm_New_Product')&&!r.combo,tOW=r.isNB||r.rt==='Midterm';
  const flags=[];if(t3&&ppl.length===1)flags.push(['bad','Single threaded','Only 1 person active in 90 days.']);
  if(!ppl.length)flags.push(src&&daysBetween(src,asOf)<=90?['warn','Contacts not linked','Data cleanup: conversations are logged, but none are tied to a contact, so we cannot tell who is engaged.']:['bad','Nobody engaged','No contact active in 90 days.']);
  if(t3&&ppl.length&&!sr.length)flags.push(['warn','No senior contact','No Director, VP or C-level touched in 90 days.']);
  if(tOW&&a.lastEmailOut&&(!a.lastEmailIn||a.lastEmailOut>a.lastEmailIn)&&(!src||a.lastEmailOut>src)&&(!a.lastEmailIn||daysBetween(a.lastEmailIn,a.lastEmailOut)>=14))flags.push(['warn','One-way email',a.lastEmailIn?'Last reply '+fmt(a.lastEmailIn)+'. Outbound has continued to '+fmt(a.lastEmailOut)+'.':'Emails going out with no reply logged.']);
  return {isNB:r.isNB,src,days,band,g,y,tone:{Green:'good',Yellow:'warn',Red:'bad'}[band],ppl:ppl.length,sr:sr.length,flags,a,asOf};
}
const BAND_GUIDE={
 nb:{why:'New Business runs on momentum. Win rate halves after 7 days without a customer conversation, then falls again after 30.',unit:'of deals won',rates:['22%','10%','4%'],
  act:['Keep it going. Book the next meeting before this one ends, with a named outcome.','Get a live conversation this week, tied to the next open milestone. A check-in email will not reset this.','Go around the silence. Reach a second contact or the exec sponsor. If nobody engages in two weeks, challenge the close date.']},
 renewal:{why:'Green and Yellow churn about the same. The real break is at 45 days, where churn roughly triples. Measured 60 days before renewal. Contact does not predict downsell.',unit:'of renewals churned',rates:['6%','7%','20%'],
  act:['Keep the cadence. Use the next conversation to clear the next renewal gate.','Book a call before the next renewal gate, and agree who owns it between the CAM and CSM.','Treat as at risk. CAM and CSM agree who reaches out this week, try a second contact, and raise it on the forecast call if nobody answers.']},
 iu:{why:'Increase Usage deals close on their own need more than most, but win rate still falls from 64% to 45% as contact fades.',unit:'of deals won',rates:['64%','51%','45%'],
  act:['Keep the deal moving while the conversation is live.','Book a usage review and bring the overage numbers as the reason to talk.','Send the buyer the usage numbers and ask the CSM who else on the account is engaged. If the account is back under its limit, recycle it.']},
 ap:{why:'New products need a live use case. Win rate halves once a deal goes past 30 days without a conversation.',unit:'of deals won',rates:['25%','12%','9%'],
  act:['Keep the use case moving and get the next technical or demo step on the calendar.','Reconnect on the use case and the goal behind it. Confirm this is still a priority before spending more time.','Reset or close. Win rate here is about a third of Green, so get a new commitment or take it out of the plan.']},
 other:{why:'Midterm Other borrows the Additional Product bands. We have not analyzed this type on its own.',unit:'',rates:['','',''],
  act:['Keep the next step on the calendar.','Reconnect and confirm this is still a priority.','Get a new commitment or close it out.']}};
function bandGuide(r,c){
  const k=c.isNB?'nb':r.rt==='Renewal'?'renewal':r.rt==='Midterm'?'iu':r.rt==='Midterm_Other'?'other':'ap',combo=r.combo,G=combo?{...BAND_GUIDE.ap,why:'Combined deals borrow the Additional Product bands. Too few closed deals to test them on their own.',rates:['','','']}:BAND_GUIDE[k],names=['Green','Yellow','Red'],i=names.indexOf(c.band);
  const rng=['0 to '+c.g+' days',(c.g+1)+' to '+c.y+' days',(c.y+1)+'+ days'],tone=['good','warn','bad'];
  const rows=names.map((n,j)=>`<tr${j===i?' class="us-cur"':''}><td><span class="us-tag us-${tone[j]}">${n}</span></td><td>${rng[j]}</td><td>${G.rates[j]?esc(G.rates[j])+' '+esc(G.unit):'Not tested'}</td><td style="white-space:normal">${esc(G.act[j])}</td></tr>`).join('');
  const addD=(iso,n)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
  const pool=(c.a.people||[]).concat((r.act||{}).people||[]),seen={},ppl=pool.filter(p=>p.name&&!seen[p.id]&&(seen[p.id]=1)).sort((x,y)=>String(y.lastTouch||'').localeCompare(String(x.lastTouch||'')));
  const who=ppl[0],snr=ppl.find(p=>p!==who&&['C-level','VP','Director'].includes(p.level))||ppl[1];
  const nm=who?who.name:'your main contact',nm2=snr?snr.name:'a second contact';
  const DO={nb:['Book the next meeting with '+nm,'Get a live call with '+nm,'Call '+nm+' and reach out to '+nm2],
   renewal:['Book the next renewal check-in with '+nm,'Book a renewal call with '+nm,'Call '+nm+' and reach out to '+nm2],
   iu:[(parseInt(r.stage)>=3?'Send commercials to ':'Book the next step with ')+nm,'Book a usage review with '+nm,'Send '+nm+' the usage numbers and ask for a call'],
   ap:['Book the next technical or demo step with '+nm,'Confirm with '+nm+' that this is still a priority','Ask '+nm+' for a new commitment, or close this out'],
   other:['Book the next step with '+nm,'Confirm with '+nm+' that this is still a priority','Ask '+nm+' for a new commitment, or close this out']}[k][i];
  const flip=c.src&&c.band!=='Red'?addD(c.src,(c.band==='Green'?c.g:c.y)+1):null;
  const by=c.band==='Red'?addD(c.asOf,2):c.band==='Yellow'?(flip&&flip<addD(c.asOf,7)?flip:addD(c.asOf,7)):flip;
  const why=(c.days==null?'No customer conversation logged.':c.days+' days since the last customer conversation.')+(flip?' Turns '+names[i+1]+' on '+fmtShort(flip)+'.':'');
  const row=(l,v)=>`<div class="us-nm"><span>${l}</span><span>${esc(v)}</span></div>`;
  return `<div class="us-p us-${tone[i]}"><b>Next Move</b><span class="us-nd">${esc(DO)}</span>${row('Owner',r.ownerName||'Record owner')}${row('By',by?fmt(by):'This week')}${row('Why',why)}</div>`+`<div><p class="lab" style="margin-bottom:4px">What the bands mean</p><p class="us-sub" style="margin-bottom:6px">${esc(G.why)}</p><div class="us-tw"><table class="us-tb"><thead><tr><th>Band</th><th>Since last conversation</th><th>History</th><th>What to do</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
export function contactHtml(r){const c=usContact(r),t=(l,v,s)=>`<div class="us-t"><span>${esc(l)}</span><b>${esc(v)}</b>${s?`<small>${esc(s)}</small>`:''}</div>`,su=r.support;
  const tiles=t('Contact Band',c.band,'Green to '+c.g+' days, Yellow to '+c.y+', Red '+(c.y+1)+'+')+t('Days Since Conversation',c.days==null?'None logged':String(c.days),c.src?'Last on '+fmt(c.src):'')+t('People Engaged 90',String(c.ppl),c.isNB?'On this opportunity':'Across the whole account')+t('Senior People Engaged 90',String(c.sr),'Director and up')+(!r.isNB&&su?t('Support Tickets 90',String(su.n),'Context only. '+su.o+' open, '+su.h+' high priority'):'');
  const fl=c.flags.length?`<div>${c.flags.map(p=>`<div class="us-p us-${p[0]}"><b>${esc(p[1])}</b><span>${esc(p[2])}</span></div>`).join('')}</div>`:'';
  return `<div class="tile"><div class="head"><h2 class="ttl">Customer Contact</h2><span class="grow"></span><span class="us-tag us-${c.tone}">${c.band}</span></div><div class="us-grid">${tiles}</div>${fl}${bandGuide(r,c)}<p class="us-src">A customer conversation is a meeting, a recorded call or a reply. ${c.isNB?'New Business reads this opportunity.':'Post-sales reads the whole account, because anyone on the team talking to the customer counts.'} History shows what happened on closed deals, not what caused it.</p></div>`}