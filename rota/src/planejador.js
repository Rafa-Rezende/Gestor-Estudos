/* Rota planner: pure function. Turns remaining parts + routine + exceptions into dated sessions. */
(function(root){
"use strict";
const pad = n => String(n).padStart(2,'0');
const iso = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate()+n); return iso(d); };
const toMin = hm => { if(!hm) return null; const [h,m] = hm.split(':').map(Number); return h*60+m; };
const fromMin = m => m>=1440 ? '24:00' : pad(Math.floor(m/60))+':'+pad(m%60);
const STUDY = ['Aula','Trabalho','Estudo','Revisão'];

const DEFAULTS = {
  windows: [['09:00','12:30'],['14:00','19:00']],
  freeWindows: [['09:00','13:00'],['14:00','19:00'],['20:00','22:00']],
  capNormal: 8, capFree: 10, maxRun: 5, restDay: 0, travel: 30, horizon: 42,
  shifts: [{day:2,start:'19:00',end:'24:00'},{day:4,start:'19:00',end:'24:00'},{day:5,start:'16:00',end:'24:00'}]
};
const cfg = s => Object.assign({}, DEFAULTS, s||{});

function sessionParts(s){ const out=[]; if(s.type!=='Aula'||!s.lesson||!s.pFrom) return out; for(let p=s.pFrom;p<=(s.pTo||s.pFrom);p++) out.push(s.lesson+'.'+p); return out; }
function doneOf(s, progress){
  if(s.type==='Aula' && s.lesson && s.pFrom){ const ps=(progress[s.subject]&&progress[s.subject].parts)||{}; return sessionParts(s).every(k=>ps[k]); }
  return !!s.done;
}
function units(s){ if(s.units!=null) return s.units; const a=toMin(s.start), b=toMin(s.end); return (a!=null&&b!=null)?Math.max(1,Math.round((b-a)/30)):1; }

/* What the day looks like: study slots (30-min starts), busy ranges, cap */
function dayModel(date, c, exc, now){
  const wd = parse(date).getDay(); exc = exc || {};
  const free = !!exc.livre;
  const res = {date, free, off:false, slots:[], busy:[], cap: free? c.capFree : c.capNormal, shifts:[]};
  if(exc.sem){ res.off = true; return res; }
  if(!free && c.restDay!==-1 && c.restDay!=null && wd===Number(c.restDay)){ res.off = true; res.rest = true; return res; }
  if(!free) for(const sh of c.shifts||[]) if(Number(sh.day)===wd){ const a=toMin(sh.start), b=toMin(sh.end)||1440; res.shifts.push([a,b]); res.busy.push([a-(c.travel||0), b]); }
  for(const r of exc.ranges||[]) res.busy.push([toMin(r.start), toMin(r.end)||1440]);
  const wins = free? c.freeWindows : c.windows;
  for(const [a,b] of wins){ let m = Math.ceil(toMin(a)/30)*30; const e = toMin(b); for(; m+30<=e; m+=30) res.slots.push(m); }
  if(now && now.date===date){ const lim = Math.ceil(now.min/30)*30; res.slots = res.slots.filter(m=>m>=lim); res.nowLim = lim; }
  return res;
}
const overlaps = (m, ranges) => ranges.some(([a,b]) => m < b && m+30 > a);

function buildPlan(st, now){
  const c = cfg(st.settings);
  const subjects = Object.values(st.subjects||{}).sort((a,b)=>(a.order??99)-(b.order??99));
  const progress = st.progress||{}, days = st.days||{}, tasks = Object.values(st.tasks||{});
  const all = Object.values(st.sessions||{});
  const today = now.date;
  const keep = [], dropIds = [];
  for(const s of all){
    const done = doneOf(s, progress);
    const past = s.date < today || (s.date===today && s.end && toMin(s.end) <= now.min);
    if(s.auto && !done){ dropIds.push(s.id); continue; }
    if(!s.auto && !done && past && s.type==='Aula'){ dropIds.push(s.id); continue; }
    keep.push(s);
  }
  const keptIds = new Set(keep.map(s=>s.id));
  // parts already covered by kept future manual Aula sessions
  const reserved = {};
  for(const s of keep) if(s.type==='Aula' && !doneOf(s,progress)) for(const k of sessionParts(s)) reserved[s.subject+'|'+k]=1;
  // remaining work per PUC subject
  const rem = {};
  for(const sub of subjects.filter(s=>s.kind==='puc')){
    const ps = (progress[sub.id]&&progress[sub.id].parts)||{}; const parts=[];
    for(let l=1;l<=(sub.lessons||10);l++) for(let p=1;p<=(sub.parts||5);p++){ const k=l+'.'+p; if(!ps[k] && !reserved[sub.id+'|'+k]) parts.push([l,p]); }
    const tl = tasks.filter(t=>t.subject===sub.id && !t.done).map(t=>{
      const used = keep.filter(s=>s.task===t.id).reduce((a,s)=>a+units(s),0);
      return {id:t.id, title:t.title, phase:t.phase||null, left: Math.max(0,(t.units||1)-used)};
    }).filter(t=>t.left>0);
    rem[sub.id] = {sub, parts, tasks:tl};
  }
  // chunk order: subject with most work left goes next; a chunk is the rest of one lesson or one task
  const left = r => r.parts.length + r.tasks.reduce((a,t)=>a+t.left,0);
  const chunks = [];
  const R = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(rem).map(([k,v])=>[k,{parts:v.parts,tasks:v.tasks}]))));
  for(let guard=0; guard<500; guard++){
    let best=null, bl=0;
    for(const sub of subjects) if(R[sub.id]){ const l=left(R[sub.id]); if(l>bl){ bl=l; best=sub.id; } }
    if(!best) break;
    const r = R[best];
    if(r.parts.length){ const L=r.parts[0][0]; const take=r.parts.filter(x=>x[0]===L); r.parts=r.parts.slice(take.length); chunks.push({sid:best, kind:'aula', lesson:L, parts:take.map(x=>x[1])}); }
    else { const t=r.tasks.shift(); chunks.push({sid:best, kind:'task', task:t.id, title:t.title, phase:t.phase, units:t.left}); }
  }
  // day models
  const model = {}; const horizonEnd = addDays(today, c.horizon);
  const getDay = d => {
    if(model[d]) return model[d];
    const m = dayModel(d, c, days[d], now);
    for(const s of keep) if(s.date===d && s.start && s.end && s.type!=='Descanso' && s.type!=='Reserva'){ m.busy.push([toMin(s.start), toMin(s.end)]); if(STUDY.includes(s.type) && (subjects.find(x=>x.id===s.subject)||{}).kind!=='trilha') m.cap -= units(s); }
    m.slots = m.slots.filter(x=>!overlaps(x, m.busy));
    m.used = 0;
    return model[d]=m;
  };
  const created = []; const perDay = {};
  const mkId = d => { let n = (perDay[d]||0); let id; do { n++; id = 'p_'+d.replace(/-/g,'')+'_'+pad(n); } while(keptIds.has(id)); perDay[d]=n; return id; };
  // 1) trilhas at their own hour (do not consume PUC cap)
  for(const sub of subjects.filter(s=>s.kind==='trilha' && s.plan && (s.plan.days||[]).length)){
    const mods = (sub.modules||[]); const pm = (progress[sub.id]&&progress[sub.id].modules)||{};
    const queue = mods.filter(m=>!pm[m.id]); let qi=0;
    const dur = Math.max(1, Math.round((toMin(sub.plan.end)-toMin(sub.plan.start))/30));
    const tEnd = addDays(today, Math.min(c.horizon, 28));
    for(let d=today; d<=tEnd; d=addDays(d,1)){
      if(!sub.plan.days.includes(parse(d).getDay())) continue;
      const m = getDay(d); if(m.off) continue;
      if(keep.some(s=>s.subject===sub.id && s.date===d)) continue;
      let st = toMin(sub.plan.start); const last = 23*60;
      if(m.nowLim!=null) st = Math.max(st, m.nowLim);
      let placed=false;
      for(; st+dur*30<=Math.max(last, toMin(sub.plan.end)); st+=30){
        let ok=true; for(let k=0;k<dur;k++) if(overlaps(st+k*30, m.busy)) ok=false;
        if(ok){ placed=true; break; }
      }
      if(!placed) continue;
      const mod = queue[qi++];
      created.push({id:mkId(d), auto:true, type:'Estudo', subject:sub.id, date:d, start:fromMin(st), end:fromMin(st+dur*30), units:dur, title:`${sub.short||sub.name} · ${mod? mod.title : 'prática'}`, note:'', done:false});
      m.busy.push([st, st+dur*30]); m.slots = m.slots.filter(x=>!overlaps(x,[[st,st+dur*30]]));
    }
  }
  // 2) PUC chunks in order, filling the earliest free slots under the daily cap
  let d = today, unplaced = 0, endDate = null;
  const lastDayUsed = {};
  for(const ch of chunks){
    let need = ch.kind==='aula' ? ch.parts.length : ch.units; let idx = 0;
    while(need>0){
      if(d>horizonEnd){ unplaced += need; break; }
      const m = getDay(d);
      const capLeft = m.cap - m.used;
      if(m.off || capLeft<=0 || !m.slots.length){ d = addDays(d,1); continue; }
      // run of consecutive free slots from the first free one
      const start = m.slots[0]; let n=1;
      while(n<m.slots.length && m.slots[n]===start+n*30) n++;
      const want = Math.min(need, capLeft, c.maxRun||5);
      // avoid a lone 30-min piece at the end of a window when more is needed: leave it as a breather
      if(n===1 && want>1 && m.slots.length>1){ m.slots = m.slots.slice(1); continue; }
      const take = Math.min(want, n);
      const sid = ch.sid; const s = {id:mkId(d), auto:true, subject:sid, date:d, start:fromMin(start), end:fromMin(start+take*30), units:take, done:false, note:''};
      if(ch.kind==='aula'){ const ps = ch.parts.slice(idx, idx+take); Object.assign(s, {type:'Aula', lesson:ch.lesson, pFrom:ps[0], pTo:ps[ps.length-1], title:''}); if(ps[ps.length-1]===((rem[sid].sub.parts)||5)) s.note='Conclui a aula '+ch.lesson; }
      else Object.assign(s, {type:'Trabalho', task:ch.task, title:ch.title, phase:ch.phase||null});
      for(const k in s) if(s[k]==null) delete s[k];
      created.push(s); idx += take; need -= take; m.used += take;
      m.slots = m.slots.slice(take);
      // a short break after a long run
      if(take>=4 && m.slots[0]===start+take*30) m.slots = m.slots.slice(1);
      endDate = d;
    }
  }
  // deadline: next pending Entrega
  const ent = all.filter(s=>s.type==='Entrega' && !s.done && s.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0] || null;
  const workLeft = chunks.reduce((a,c2)=>a+(c2.kind==='aula'?c2.parts.length:c2.units),0);
  created.sort((a,b)=>a.date===b.date? a.start.localeCompare(b.start) : a.date.localeCompare(b.date));
  return {create:created, dropIds, endDate, unplaced, workLeft, deadline: ent ? {id:ent.id, date:ent.date, title:ent.title} : null,
    late: !!(ent && ((endDate && endDate>=ent.date) || unplaced>0))};
}
root.RotaPlanner = {buildPlan, dayModel, cfg, DEFAULTS};
})(typeof window!=='undefined'? window : globalThis);

