(function(){
"use strict";
const P = window.RotaPlanner;
/* ---------- icons ---------- */
const I = {
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  book:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>',
  flag:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  code:'<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  phone:'<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play:'<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
  fire:'<path d="M12 22c4 0 7-2.7 7-6.6 0-3.7-2.6-5.8-4.3-8.4-.5 2-1.6 3.1-2.9 3.6C12.4 7 11 4.3 8.6 2.5 8.7 6.3 5 8.9 5 15.4 5 19.3 8 22 12 22z"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  left:'<path d="M15 6l-6 6 6 6"/>', right:'<path d="M9 6l6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  shuffle:'<path d="M3 7h4l10 10h4M17 3l4 4-4 4M3 17h4l3-3M14 10l3-3h4"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>',
  sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  pizza:'<path d="M12 3l9 16H3z"/><circle cx="10" cy="13" r="1"/><circle cx="14" cy="15" r="1"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>'
};
const svg = (n, extra='') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${I[n]}</svg>`;

/* ---------- utils ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const iso = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate()+n); return iso(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const today = () => iso(new Date());
const nowMin = () => { const d=new Date(); return d.getHours()*60+d.getMinutes(); };
const nowHM = () => { const d = new Date(); return pad(d.getHours())+':'+pad(d.getMinutes()); };
const WD = ['dom','seg','ter','qua','qui','sex','sáb'];
const WDL = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
const MON = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MONL = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const fmtDay = s => { const d = parse(s); return `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`; };
const toMin = hm => { if(!hm) return null; const [h,m] = hm.split(':').map(Number); return h*60+m; };
const showHM = hm => hm==='24:00' ? '00:00' : hm;
const hours = units => { const h = units/2; return (Number.isInteger(h) ? h : h.toFixed(1).replace('.',','))+'h'; };
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const stable = o => JSON.stringify(o, Object.keys(o).sort());

/* ---------- theme (per device) ---------- */
const THEME_KEY='rota-theme';
function getTheme(){ try{ return localStorage.getItem(THEME_KEY)||'light'; }catch(_){ return 'light'; } }
function applyTheme(t){ if(t==='system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
function setTheme(t){ try{ localStorage.setItem(THEME_KEY,t); }catch(_){} applyTheme(t); renderThemeBtn(); }
function isDarkNow(){ const t=getTheme(); return t==='dark' || (t==='system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
function renderThemeBtn(){ const b=document.getElementById('themebtn'); if(!b) return; const dark=isDarkNow();
  b.innerHTML = dark ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>Usar papel claro' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>Usar caderno escuro'; }
applyTheme(getTheme());

/* ---------- state ---------- */
const S = {
  db:null, subjects:{}, sessions:{}, progress:{}, settings:{}, tasks:{}, days:{},
  got:{subjects:false, sessions:false, progress:false, settings:false, tasks:false, days:false},
  view:'inicio', sel:today(), calMode:'semana', monthAnchor:today().slice(0,7)+'-01',
  error:null, stale:false, busy:false
};
const ready = () => S.got.subjects && S.got.sessions && S.got.progress;
const allReady = () => Object.values(S.got).every(Boolean);
const conf = () => P.cfg(S.settings.main);
const subjList = () => Object.values(S.subjects).sort((a,b)=>(a.order??99)-(b.order??99));
const sessList = () => Object.values(S.sessions).sort((a,b)=> a.date===b.date ? (a.start||'00').localeCompare(b.start||'00') : a.date.localeCompare(b.date));
const subjColor = id => S.subjects[id] ? `var(--s-${S.subjects[id].color||'t3'})` : 'var(--s-t3)';
const partsOf = sid => (S.progress[sid] && S.progress[sid].parts) || {};
const STUDY_TYPES = ['Aula','Trabalho','Entrega','Estudo','Revisão'];

function sessionParts(s){ const out=[]; if(s.type!=='Aula'||!s.lesson||!s.pFrom) return out; for(let p=s.pFrom;p<=(s.pTo||s.pFrom);p++) out.push(s.lesson+'.'+p); return out; }
function isDone(s){ if(s.type==='Aula' && s.lesson && s.pFrom){ const ps = partsOf(s.subject); return sessionParts(s).every(k=>ps[k]); } return !!s.done; }
function unitsOf(s){ if(s.units!=null) return s.units; const a=toMin(s.start), b=toMin(s.end); return (a!=null&&b!=null)? Math.max(1,Math.round((b-a)/30)) : 1; }
function isPast(s){ const t=today(); return s.date<t || (s.date===t && s.end && toMin(s.end)<=nowMin()); }
function autoTitle(s){
  const sub = S.subjects[s.subject]; const short = sub ? (sub.short||sub.name) : '';
  if(s.type==='Aula' && s.lesson){ const p = s.pFrom ? (s.pTo && s.pTo!==s.pFrom ? `partes ${s.pFrom}–${s.pTo}` : `parte ${s.pFrom}`) : ''; return `${short} · Aula ${s.lesson}${p?' · '+p:''}`; }
  return s.title || (short ? `${s.type} · ${short}` : s.type);
}
const titleOf = s => s.title || autoTitle(s);

/* ---------- toast ---------- */
let toastT;
function toast(msg, ms=2800){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,ms); }
function errMsg(e){
  const c = e && e.code;
  if(c==='invalid_argument') return 'Você não tem permissão para salvar aqui (abra como dono do painel).';
  if(c==='quota_exceeded') return 'Limite de armazenamento do painel atingido. Apague sessões antigas.';
  if(c==='resource_exhausted') return 'Muitas alterações seguidas. Espere um instante e tente de novo.';
  return 'Não consegui salvar agora. Verifique a conexão e tente de novo.';
}

/* ---------- writes ---------- */
const queues = {};
function write(path, fn){
  if(!S.db){ toast('Sem conexão com o banco do painel.'); return Promise.resolve(); }
  const p = (queues[path]||Promise.resolve()).then(fn).catch(e=>{ toast(errMsg(e)); throw e; }).catch(()=>{});
  queues[path] = p; return p;
}
const setDoc = (col,id,data) => write(col+'/'+id, ()=>S.db.collection(col).doc(id).set(data));
const delDoc = (col,id) => write(col+'/'+id, ()=>S.db.collection(col).doc(id).delete());
async function pool(jobs, n=4){ let i=0; const run = async()=>{ while(i<jobs.length){ const j=jobs[i++]; await j(); } }; await Promise.all([...Array(Math.min(n,jobs.length))].map(run)); }

function setParts(sid, mutate){
  const cur = Object.assign({}, partsOf(sid)); mutate(cur);
  S.progress[sid] = Object.assign({}, S.progress[sid]||{}, {parts:cur}); render();
  const doc = {parts:cur}; if(S.progress[sid].modules) doc.modules = S.progress[sid].modules;
  return setDoc('progress', sid, doc);
}
function toggleSession(id){
  const s = S.sessions[id]; if(!s) return;
  const done = isDone(s); const t = today();
  if(s.type==='Aula' && s.lesson && s.pFrom){ setParts(s.subject, m => { for(const k of sessionParts(s)){ if(done) delete m[k]; else if(!m[k]) m[k]=t; } }); }
  else { const next = Object.assign({}, s, {done:!done, doneAt: done? null : t}); S.sessions[id]=next; render(); setDoc('sessions', id, next); }
  if(!done) toast('Concluído. Boa!');
}
function togglePart(sid, key){ setParts(sid, m => { if(m[key]) delete m[key]; else m[key]=today(); }); }

/* ---------- planner glue ---------- */
async function replan(reason){
  if(!allReady()){ toast('Espere o plano terminar de carregar.'); return; }
  if(S.busy) return;
  const plan = P.buildPlan({subjects:S.subjects, sessions:S.sessions, progress:S.progress, tasks:S.tasks, days:S.days, settings:S.settings.main}, {date:today(), min:nowMin()});
  const newIds = new Set(plan.create.map(s=>s.id));
  const dels = plan.dropIds.filter(id=>!newIds.has(id));
  const jobs = [];
  for(const s of plan.create){ const old = S.sessions[s.id]; if(old && stable(old)===stable(s)) continue; S.sessions[s.id]=s; jobs.push(()=>setDoc('sessions', s.id, s)); }
  for(const id of dels){ delete S.sessions[id]; jobs.push(()=>delDoc('sessions', id)); }
  S.busy = true; render();
  await pool(jobs, 4);
  S.busy = false; render();
  const end = plan.endDate ? fmtDay(plan.endDate) : null;
  let msg = `${reason? reason+' ':''}Plano refeito`;
  if(plan.late && plan.deadline) msg += `. Atenção: não cabe antes de ${titleOf(S.sessions[plan.deadline.id]||plan.deadline)}.`;
  else if(end) msg += `: aulas e trabalhos terminam ${end}.`;
  toast(msg, 4200);
  return plan;
}
function planStatus(){
  const t=today(); const pend = sessList().filter(s=>(s.type==='Aula'||s.type==='Trabalho') && !isDone(s) && !isPast(s));
  const end = pend.length ? pend[pend.length-1].date : null;
  // parts still without a slot
  let missing = 0;
  for(const sub of subjList().filter(s=>s.kind==='puc')){ const ps=partsOf(sub.id); const sched={}; for(const s of pend) if(s.subject===sub.id) for(const k of sessionParts(s)) sched[k]=1;
    for(let l=1;l<=(sub.lessons||10);l++) for(let p=1;p<=(sub.parts||5);p++){ const k=l+'.'+p; if(!ps[k] && !sched[k]) missing++; } }
  for(const tk of Object.values(S.tasks)) if(!tk.done){ const used = Object.values(S.sessions).filter(s=>s.task===tk.id && (s.done || !isPast(s))).reduce((a,s)=>a+unitsOf(s),0); missing += Math.max(0,(tk.units||1)-used); }
  const ent = sessList().find(s=>s.type==='Entrega' && !s.done && s.date>=t) || null;
  const late = !!(ent && end && end>=ent.date);
  const slack = ent && end ? diffDays(end, ent.date)-1 : null;
  return {end, missing, ent, late, slack};
}

/* ---------- metrics ---------- */
function pucSubjects(){ return subjList().filter(s=>s.kind==='puc'); }
function subjStats(sub){
  const ps = partsOf(sub.id); const total = (sub.lessons||10)*(sub.parts||5);
  const done = Object.keys(ps).filter(k=>/^\d+\.\d+$/.test(k)).length;
  let lessonsDone=0; for(let l=1;l<=(sub.lessons||10);l++){ let all=true; for(let p=1;p<=(sub.parts||5);p++) if(!ps[l+'.'+p]) all=false; if(all) lessonsDone++; }
  let next=null; outer: for(let l=1;l<=(sub.lessons||10);l++) for(let p=1;p<=(sub.parts||5);p++) if(!ps[l+'.'+p]){ next={l,p}; break outer; }
  const fut = sessList().filter(s=>s.subject===sub.id && s.type==='Aula' && !isDone(s) && !isPast(s));
  const end = fut.length ? fut[fut.length-1].date : null;
  return {total, done, lessonsDone, next, end, pct: total? Math.round(done/total*100):0};
}
function activityByDay(){
  const m = {};
  for(const sid in S.progress){ const ps = partsOf(sid); for(const k in ps){ const d=ps[k]; if(typeof d==='string') m[d]=(m[d]||0)+1; } }
  for(const s of Object.values(S.sessions)) if(s.type!=='Aula' && s.done && typeof s.doneAt==='string') m[s.doneAt]=(m[s.doneAt]||0)+unitsOf(s);
  return m;
}
function streak(){ const m = activityByDay(); let d = today(); if(!m[d]) d = addDays(d,-1); let n=0; while(m[d]){ n++; d=addDays(d,-1); } return n; }
function missedList(){ return sessList().filter(s=> isPast(s) && ['Aula','Trabalho','Estudo','Revisão'].includes(s.type) && !isDone(s)); }
function deadlines(){ return sessList().filter(s=>s.type==='Entrega'); }
function dayExtras(d){
  const exc = S.days[d]||{}; const c = conf(); const wd = parse(d).getDay(); const out=[];
  if(exc.sem) out.push({label:'Sem estudo', note: exc.note||'Imprevisto'});
  if(exc.livre) out.push({label:'Dia livre', note: exc.note||'Folga da pizzaria, mais tempo de estudo'});
  if(!exc.livre && !exc.sem) for(const sh of c.shifts||[]) if(Number(sh.day)===wd) out.push({label:'Pizzaria', start:sh.start, end:sh.end, shift:true});
  for(const r of exc.ranges||[]) out.push({label:r.note||'Ocupado', start:r.start, end:r.end, busy:true});
  if(!exc.livre && !exc.sem && c.restDay!==-1 && Number(c.restDay)===wd) out.push({label:'Descanso semanal', note:'Sem aulas planejadas'});
  return out;
}

/* ---------- views ---------- */
const VIEWS = [
  {id:'inicio', label:'Início', icon:'home'},
  {id:'agenda', label:'Agenda', icon:'cal'},
  {id:'materias', label:'Matérias', icon:'book'},
  {id:'prazos', label:'Prazos', icon:'flag'},
  {id:'trilhas', label:'Trilhas', icon:'code'},
  {id:'rotina', label:'Rotina', icon:'sliders'},
  {id:'iphone', label:'iPhone', icon:'phone'}
];
function renderNav(){
  $('#nav').innerHTML = VIEWS.map(v=>`<a href="#${v.id}" ${S.view===v.id?'aria-current="page"':''}>${svg(v.icon)}${v.label}</a>`).join('');
  $('#tabs').innerHTML = VIEWS.filter(v=>!['iphone','rotina'].includes(v.id)).map(v=>`<a href="#${v.id}" ${S.view===v.id?'aria-current="page"':''}>${svg(v.icon)}${v.label}</a>`).join('');
  const dl = deadlines().find(s=>!s.done && s.date>=today());
  $('#sidefoot').innerHTML = dl ? `<strong>${esc(titleOf(dl))}</strong>${dl.date===today()?'É hoje':'em '+diffDays(today(),dl.date)+' dias'} · ${esc(fmtDay(dl.date))}` : `<strong>Sem entregas pendentes</strong>Tudo em dia.`;
}
function header(title, sub, actions=''){
  const h = new Date().getHours(); const greet = h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const name = (S.settings.main && S.settings.main.name) || '';
  return `<div class="top"><div><div class="hello">${greet}${name?', '+esc(name):''} · ${esc(fmtDay(today()))}</div><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="top-actions">${actions}</div></div>`;
}
function rowHTML(s, opts={}){
  const done = isDone(s); const sub = S.subjects[s.subject];
  const late = !done && isPast(s) && ['Aula','Trabalho','Estudo','Revisão'].includes(s.type);
  const typeCls = {Aula:'aula',Trabalho:'trabalho',Entrega:'entrega',Estudo:'estudo','Revisão':'estudo'}[s.type]||'';
  const time = s.start ? `<b class="num">${esc(s.start)}</b><span class="num">${esc(showHM(s.end||''))}</span>` : `<b>Dia</b><span>todo</span>`;
  const checkable = s.type!=='Descanso' && s.type!=='Reserva';
  return `<div class="row ${done?'done':''}">
    <div class="time">${opts.showDate?`<b>${esc(fmtDay(s.date).split(',')[1])}</b><span class="num">${esc(s.start||'')}</span>`:time}</div>
    <span class="dot" style="--c:${s.type==='Entrega'?'var(--bad)':subjColor(s.subject)}"></span>
    <div class="what" data-act="edit" data-id="${esc(s.id)}" role="button" tabindex="0"><div class="t">${esc(titleOf(s))}</div>
      <div class="m"><span class="pill ${typeCls}">${esc(s.type==='Trabalho'?'Trabalho PUC':s.type)}</span>${sub && s.type!=='Estudo'?`<span>${esc(sub.name)}</span>`:''}${s.units?`<span class="num">${hours(unitsOf(s))}</span>`:''}${late?'<span class="pill late">Passou</span>':''}${s.note?`<span>${esc(s.note)}</span>`:''}</div></div>
    ${checkable?`<button class="check ${done?'on':''}" data-act="toggle" data-id="${esc(s.id)}" aria-label="${done?'Desmarcar':'Marcar como feito'}: ${esc(titleOf(s))}" aria-pressed="${done}">${svg('check','stroke-width="3"')}</button>`:'<span></span>'}
  </div>`;
}
function extraRows(d){
  return dayExtras(d).map(x=>`<div class="row virtual"><div class="time">${x.start?`<b class="num">${esc(x.start)}</b><span class="num">${esc(showHM(x.end))}</span>`:'<b>Dia</b><span>todo</span>'}</div><span class="dot" style="--c:${x.shift?'var(--warn)':'var(--faint)'}"></span><div class="what-static"><div class="t">${x.shift?svg('pizza','class="inline"'):''}${esc(x.label)}</div>${x.note?`<div class="m">${esc(x.note)}</div>`:''}</div><span></span></div>`).join('');
}
function mergedDay(d){
  const rows = sessList().filter(s=>s.date===d).map(s=>({k:s.start||'00:00', h:rowHTML(s)}));
  for(const x of dayExtras(d)) rows.push({k:x.start||'00:00', h:`<div class="row virtual"><div class="time">${x.start?`<b class="num">${esc(x.start)}</b><span class="num">${esc(showHM(x.end))}</span>`:'<b>Dia</b><span>todo</span>'}</div><span class="dot" style="--c:${x.shift?'var(--warn)':'var(--faint)'}"></span><div class="what-static"><div class="t">${esc(x.label)}</div>${x.note?`<div class="m">${esc(x.note)}</div>`:''}</div><span></span></div>`});
  rows.sort((a,b)=>a.k.localeCompare(b.k));
  return rows.map(r=>r.h).join('');
}

function viewInicio(){
  const t = today(); const puc = pucSubjects(); const st = puc.map(subjStats);
  const doneParts = st.reduce((a,b)=>a+b.done,0), totalParts = st.reduce((a,b)=>a+b.total,0)||1;
  const lessonsDone = st.reduce((a,b)=>a+b.lessonsDone,0), lessonsTotal = puc.reduce((a,b)=>a+(b.lessons||10),0);
  const todays = sessList().filter(s=>s.date===t);
  const todayUnits = todays.filter(s=>STUDY_TYPES.includes(s.type)).reduce((a,s)=>a+unitsOf(s),0);
  const nextDl = deadlines().find(s=>!s.done && s.date>=t);
  const missed = missedList(); const ps = planStatus();
  const pct = Math.round(doneParts/totalParts*100); const stk = streak();
  const exc = S.days[t];

  let html = header('Seu painel de estudos', exc&&exc.livre? 'Hoje é dia livre: o plano usa mais horas.' : exc&&exc.sem ? 'Hoje está marcado sem estudo.' : 'Aulas da PUC, prazos e treino de código no mesmo lugar.',
    `<a class="btn" href="#rotina">${svg('sliders')}Rotina</a><a class="btn" href="#iphone">${svg('phone')}iPhone</a><button class="btn primary" data-act="imprevisto">${svg('bolt')}Mudou o dia?</button>`);
  if(S.busy) html += `<div class="alert info"><div class="txt"><b>Refazendo o plano…</b><span>Salvando as sessões novas.</span></div><div class="spin"></div></div>`;
  if(nextDl && nextDl.date===t) html += `<div class="alert"><div class="txt"><b>${esc(titleOf(nextDl))} é hoje</b><span>${esc(nextDl.note||'Entregue antes do prazo.')}</span></div><button class="btn primary" data-act="toggle" data-id="${esc(nextDl.id)}">${svg('check')}Marcar como entregue</button></div>`;
  if(missed.length) html += `<div class="alert warn"><div class="txt"><b>${missed.length} ${missed.length===1?'sessão passou':'sessões passaram'} sem ser marcada${missed.length===1?'':'s'}</b><span>Se fez, marque como feita. O que não deu, o replanejamento joga para os próximos horários livres.</span></div><div class="top-actions"><button class="btn primary" data-act="replan">${svg('shuffle')}Replanejar o que faltou</button></div></div>`;
  else if(ps.missing>0) html += `<div class="alert warn"><div class="txt"><b>${ps.missing} partes ainda sem horário (${hours(ps.missing)})</b><span>Refaça o plano para encaixar tudo nos horários livres.</span></div><button class="btn primary" data-act="replan">${svg('shuffle')}Replanejar</button></div>`;
  if(ps.late && ps.ent) html += `<div class="alert"><div class="txt"><b>O plano passa da ${esc(titleOf(ps.ent))} (${esc(fmtDay(ps.ent.date))})</b><span>Marque dias livres, aumente o limite diário em Rotina ou tire o descanso semanal.</span></div><div class="top-actions"><a class="btn" href="#rotina">Ajustar rotina</a><button class="btn primary" data-act="imprevisto" data-kind="livre">Marcar dia livre</button></div></div>`;

  html += `<div class="grid stats">
    ${statCard('Partes assistidas', `${doneParts}<small> / ${totalParts}</small>`, `${lessonsDone} de ${lessonsTotal} aulas completas`, 'play','v')}
    ${statCard('Hoje', `${todays.filter(s=>STUDY_TYPES.includes(s.type)).length}<small> sessões</small>`, todayUnits? `${hours(todayUnits)} de estudo` : 'Nada de estudo hoje', 'clock','o')}
    ${statCard('Próxima entrega', nextDl? (nextDl.date===t?'Hoje':`${diffDays(t,nextDl.date)}<small> dias</small>`) : '—', nextDl? esc(titleOf(nextDl))+' · '+esc(fmtDay(nextDl.date)) : 'Nada pendente', 'flag', nextDl && diffDays(t,nextDl.date)<=2 ? 'r':'g')}
    ${statCard('Plano', ps.end? (ps.late? 'Apertado' : `${ps.slack}<small> ${ps.slack===1?'dia':'dias'} de folga</small>`) : '—', ps.end? `Aulas e trabalhos terminam ${esc(fmtDay(ps.end))}` : 'Sem aulas pendentes', 'target', ps.late?'r':'g')}
  </div>`;

  html += `<div class="grid dash" style="margin-top:16px">
    <section class="card"><div class="card-h"><h2>${svg('cal')}Hoje · ${esc(fmtDay(t))}</h2><a href="#agenda">Ver agenda</a></div>
      <div class="list">${todays.length || dayExtras(t).length ? mergedDay(t) : `<div class="empty"><b>Nada marcado para hoje</b>Use “Mudou o dia?” se ganhou tempo livre.</div>`}</div>
      ${nextSessionsHTML()}
    </section>
    <section class="card"><div class="card-h"><h2>${svg('chart')}Progresso das aulas</h2><span class="note">PUC · ${puc.length} matérias</span></div>
      <div class="ringwrap">${ring(pct, 'concluído')}
        <div class="legend">
          <div><span><i style="--c:var(--accent-2)"></i>Assistidas</span><b class="num">${doneParts}</b></div>
          <div><span><i style="--c:var(--line)"></i>Faltam</span><b class="num">${totalParts-doneParts}</b></div>
          <div><span><i style="--c:var(--warn)"></i>Tempo restante</span><b class="num">${hours(totalParts-doneParts)}</b></div>
          <div class="note">1 parte ≈ 30 min de aula</div>
        </div>
      </div>
      <div class="bars" style="margin-top:18px">${puc.map((s,i)=>barHTML(s, st[i])).join('')}${trilhaBars()}</div>
    </section>
  </div>`;
  html += `<div class="grid dash2" style="margin-top:16px">
    <section class="card streak"><div class="h">Sequência</div><div class="flame">${svg('fire')}</div><b class="num">${stk}</b><div class="h">${stk===1?'dia':'dias'}</div><small>${stk? 'Estude hoje para manter.' : 'Conclua uma parte hoje para começar.'}</small></section>
    <section class="card chart-card"><div class="card-h"><h2>${svg('chart')}Ritmo · últimos 14 dias</h2><span class="note">horas concluídas</span></div>${areaChart()}</section>
  </div>`;
  return html;
}
function nextSessionsHTML(){
  const t = today(); const up = sessList().filter(s=>s.date>t && STUDY_TYPES.includes(s.type) && !isDone(s)).slice(0,4);
  if(!up.length) return '';
  return `<div class="section-title" style="margin-top:16px">Próximas</div><div class="list">${up.map(s=>rowHTML(s,{showDate:true})).join('')}</div>`;
}
function statCard(lbl, val, foot, icon, tone){ return `<div class="card stat"><div style="min-width:0"><div class="lbl">${lbl}</div><div class="val num">${val}</div><div class="foot">${foot}</div></div><div class="ico ${tone}">${svg(icon)}</div></div>`; }
function ring(pct, label){
  const r=52, c=2*Math.PI*r;
  return `<div class="ring" role="img" aria-label="${pct}% ${label}"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="12"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--accent-2)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(c*pct/100).toFixed(1)} ${c.toFixed(1)}"/></svg><div class="c"><div><b class="num">${pct}%</b><span>${label}</span></div></div></div>`;
}
function barHTML(sub, st){
  return `<div><div class="bar-h"><b>${esc(sub.name)}</b><span class="num">${st.pct}%${st.next?` · aula ${st.next.l}.${st.next.p}`:''}${st.end?` · até ${esc(fmtDay(st.end).split(', ')[1])}`:''}</span></div><div class="track" style="--c:${subjColor(sub.id)}"><i style="width:${st.pct}%"></i></div></div>`;
}
function trilhaBars(){
  return subjList().filter(s=>s.kind==='trilha').map(sub=>{
    const ss = Object.values(S.sessions).filter(s=>s.subject===sub.id); const d = ss.filter(s=>s.done).length;
    const wk = ss.filter(s=>s.date>=today() && s.date<=addDays(today(),6)).length;
    return `<div><div class="bar-h"><b>${esc(sub.name)}</b><span class="num">${d} feitas · ${wk} nesta semana</span></div><div class="track" style="--c:${subjColor(sub.id)}"><i style="width:${ss.length? Math.round(d/ss.length*100):0}%"></i></div></div>`;
  }).join('');
}
function areaChart(){
  const m = activityByDay(); const days=[]; for(let i=13;i>=0;i--) days.push(addDays(today(),-i));
  const vals = days.map(d=>(m[d]||0)/2); const max = Math.max(2, Math.ceil(Math.max(...vals)));
  const W=640,H=200,L=26,R=10,T=12,B=24; const iw=W-L-R, ih=H-T-B;
  const x = i => L + iw*i/(days.length-1); const y = v => T + ih - ih*v/max;
  const pts = vals.map((v,i)=>[x(i),y(v)]);
  const line = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area = line+` L${x(days.length-1)} ${T+ih} L${L} ${T+ih} Z`;
  const last = pts[pts.length-1]; const total = vals.reduce((a,b)=>a+b,0);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Horas concluídas por dia nos últimos 14 dias, total ${total} horas">
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    ${[0,max/2,max].map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${y(v)+3}" text-anchor="end">${Number.isInteger(v)?v:v.toFixed(1)}</text>`).join('')}
    <path d="${area}" fill="url(#ag)"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round"/>
    ${pts.map((p,i)=>vals[i]?`<circle cx="${p[0]}" cy="${p[1]}" r="2.6" fill="var(--accent)"/>`:'').join('')}
    <circle cx="${last[0]}" cy="${last[1]}" r="4.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="2.2"/>
    ${days.map((d,i)=> i%3===1||i===13 ? `<text x="${x(i)}" y="${H-6}" text-anchor="middle">${parse(d).getDate()}/${parse(d).getMonth()+1}</text>`:'').join('')}
  </svg><div class="note">${total? `${String(total).replace('.',',')}h registradas em 14 dias. Partes marcadas sem data (atualizações em lote) não entram aqui.` : 'Ainda sem registros nos últimos 14 dias. Marque partes e sessões para ver seu ritmo.'}</div></div>`;
}

function viewAgenda(){
  const sel = S.sel;
  let html = header('Agenda', 'O plano se ajusta à sua rotina e aos imprevistos.', `<div class="seg" role="group" aria-label="Modo"><button data-act="mode" data-mode="semana" aria-pressed="${S.calMode==='semana'}">Semana</button><button data-act="mode" data-mode="mes" aria-pressed="${S.calMode==='mes'}">Mês</button></div><button class="btn" data-act="new" data-date="${sel}">${svg('plus')}Sessão</button><button class="btn primary" data-act="imprevisto" data-date="${sel}">${svg('bolt')}Mudou o dia?</button>`);
  const byDay = {}; for(const s of sessList()) (byDay[s.date] = byDay[s.date]||[]).push(s);
  const dots = d => (byDay[d]||[]).filter(s=>s.type!=='Descanso'&&s.type!=='Reserva').slice(0,5).map(s=>`<i style="--c:${s.type==='Entrega'?'var(--bad)':subjColor(s.subject)}"></i>`).join('');
  const tag = d => { const e=S.days[d]; return e&&e.livre?'<em class="tag ok">livre</em>': e&&e.sem?'<em class="tag bad">off</em>': e&&(e.ranges||[]).length?'<em class="tag warn">ocup.</em>':''; };
  html += `<section class="card">`;
  if(S.calMode==='semana'){
    const d0 = parse(sel); const mon = addDays(sel, -((d0.getDay()+6)%7)); const days = [...Array(7)].map((_,i)=>addDays(mon,i));
    html += `<div class="card-h"><h2>${esc(MONL[parse(mon).getMonth()])} ${parse(mon).getFullYear()}</h2><button class="link" data-act="go" data-date="${today()}">Hoje</button></div>
    <div class="week"><button class="nav-arrow" data-act="go" data-date="${addDays(sel,-7)}" aria-label="Semana anterior">${svg('left')}</button>
    ${days.map(d=>`<button class="wd ${d===today()?'today':''}" data-act="go" data-date="${d}" aria-pressed="${d===sel}"><small>${WD[parse(d).getDay()]}</small><b class="num">${parse(d).getDate()}</b><span class="dots">${dots(d)}</span>${tag(d)}</button>`).join('')}
    <button class="nav-arrow" data-act="go" data-date="${addDays(sel,7)}" aria-label="Próxima semana">${svg('right')}</button></div>`;
  } else {
    const a = parse(S.monthAnchor); const first = new Date(a.getFullYear(), a.getMonth(), 1); const start = addDays(iso(first), -((first.getDay()+6)%7));
    const prev = iso(new Date(a.getFullYear(), a.getMonth()-1, 1)), next = iso(new Date(a.getFullYear(), a.getMonth()+1, 1));
    html += `<div class="card-h"><h2>${esc(MONL[a.getMonth()])} ${a.getFullYear()}</h2><div class="top-actions"><button class="nav-arrow" data-act="month" data-date="${prev}" aria-label="Mês anterior">${svg('left')}</button><button class="nav-arrow" data-act="month" data-date="${next}" aria-label="Próximo mês">${svg('right')}</button></div></div>
    <div class="month">${['seg','ter','qua','qui','sex','sáb','dom'].map(d=>`<div class="hd">${d}</div>`).join('')}
    ${[...Array(42)].map((_,i)=>{ const d=addDays(start,i); const inM = parse(d).getMonth()===a.getMonth(); const hasE=(byDay[d]||[]).some(s=>s.type==='Entrega');
      return `<button class="md ${inM?'':'out'} ${d===today()?'today':''}" data-act="go" data-date="${d}" aria-pressed="${d===sel}"><b class="num">${parse(d).getDate()}</b><span class="dots">${dots(d)}${hasE?'<i class="e">ENTREGA</i>':''}</span>${tag(d)}</button>`; }).join('')}</div>`;
  }
  html += `</section>`;
  const list = byDay[sel]||[]; const u = list.filter(s=>STUDY_TYPES.includes(s.type)).reduce((a,s)=>a+unitsOf(s),0);
  const body = mergedDay(sel);
  html += `<section class="card" style="margin-top:16px"><div class="card-h"><h2>${svg('clock')}${esc(fmtDay(sel))}</h2><span class="note num">${u? hours(u)+' de estudo':''}</span></div>
    <div class="list">${body || `<div class="empty"><b>Dia sem nada planejado</b>Se este dia ficou livre, marque em “Mudou o dia?” e o plano usa ele.</div>`}</div></section>`;
  return html;
}

function viewMaterias(){
  let html = header('Matérias', 'Toque numa parte para marcar como assistida. Depois de marcar várias, use Replanejar para o plano acompanhar.', `<button class="btn" data-act="newsubj">${svg('plus')}Nova matéria</button><button class="btn primary" data-act="replan">${svg('shuffle')}Replanejar</button>`);
  const puc = pucSubjects();
  html += `<div class="grid subj-grid">${puc.map(sub=>{
    const st = subjStats(sub); const ps = partsOf(sub.id); const t = today();
    const sched = {}; for(const s of sessList()) if(s.subject===sub.id && s.type==='Aula' && !isPast(s)) for(const k of sessionParts(s)) if(!sched[k]) sched[k]=s.date;
    const nextS = sessList().find(s=>s.subject===sub.id && !isPast(s) && !isDone(s) && STUDY_TYPES.includes(s.type));
    let cells = `<span></span>${[...Array(sub.parts||5)].map((_,i)=>`<span class="ph">P${i+1}</span>`).join('')}`;
    for(let l=1;l<=(sub.lessons||10);l++){ cells += `<span class="ln">Aula ${l}</span>`; for(let p=1;p<=(sub.parts||5);p++){ const k=l+'.'+p; const on=!!ps[k]; const when = typeof ps[k]==='string'? ps[k] : '';
      cells += `<button class="cell ${on?'on':''}" data-act="part" data-sid="${esc(sub.id)}" data-key="${k}" aria-pressed="${on}" aria-label="Aula ${l}, parte ${p}${on?', assistida'+(when?' em '+esc(when):''):sched[k]?', planejada para '+esc(fmtDay(sched[k])):''}" title="Aula ${l} · parte ${p}${on?(when?' · '+esc(when):' · assistida'):sched[k]?' · '+esc(fmtDay(sched[k])):''}"></button>`; } }
    return `<section class="card" style="--c:${subjColor(sub.id)}"><div class="subj-h"><div class="sw">${esc((sub.short||sub.name).slice(0,2).toUpperCase())}</div><div style="min-width:0"><h3>${esc(sub.name)}</h3><p class="num">${st.done}/${st.total} partes · ${st.lessonsDone}/${sub.lessons||10} aulas</p></div><div class="pct num">${st.pct}%</div></div>
      <div class="track"><i style="width:${st.pct}%"></i></div>
      <div class="parts">${cells}</div>
      <div class="subj-meta">${st.next?`<span class="pill aula">Continua na aula ${st.next.l}, parte ${st.next.p}</span>`:'<span class="pill ok">Todas as aulas assistidas</span>'}${st.end?`<span>Termina ${esc(fmtDay(st.end))}</span>`:''}${nextS?`<span>Próxima: ${esc(fmtDay(nextS.date))}${nextS.start?' '+esc(nextS.start):''}</span>`:''}</div>
    </section>`; }).join('')}</div>`;
  return html;
}

function viewPrazos(){
  const t = today();
  let html = header('Prazos', 'Entregas e os trabalhos que o plano encaixa antes delas.', `<button class="btn" data-act="newtask">${svg('plus')}Novo trabalho</button><button class="btn primary" data-act="new" data-type="Entrega">${svg('flag')}Novo prazo</button>`);
  const dls = deadlines(); const tasks = Object.values(S.tasks).sort((a,b)=>(a.phase||'').localeCompare(b.phase||'')||(S.subjects[a.subject]?.order||9)-(S.subjects[b.subject]?.order||9));
  html += `<div class="grid dash">`;
  html += `<section class="card"><div class="card-h"><h2>${svg('flag')}Entregas</h2></div><div class="list">${dls.length? dls.map(s=>{
    const d = parse(s.date); const n = diffDays(t, s.date); const done = !!s.done;
    const chip = done? '<span class="pill ok">Entregue</span>' : n<0? '<span class="pill late">Atrasada</span>' : n===0? '<span class="pill late">Hoje</span>' : n<=3? `<span class="pill soon">em ${n} dias</span>` : `<span class="pill">em ${n} dias</span>`;
    const ph = tasks.filter(x=>x.phase===s.phase); const phDone = ph.filter(x=>x.done).length;
    return `<div class="dl"><div class="cal-chip"><small>${MON[d.getMonth()]}</small><b class="num">${d.getDate()}</b></div>
      <div style="min-width:0" data-act="edit" data-id="${esc(s.id)}" role="button" tabindex="0"><div class="t">${esc(titleOf(s))}</div><div class="m">${esc(s.note||'')}</div>${ph.length?`<div class="m num" style="margin-top:4px">Trabalhos da ${esc(s.phase)}: ${phDone}/${ph.length} prontos</div>`:''}</div>
      <div style="display:flex;gap:8px;align-items:center">${chip}<button class="check ${done?'on':''}" data-act="toggle" data-id="${esc(s.id)}" aria-pressed="${done}" aria-label="Marcar entrega">${svg('check','stroke-width="3"')}</button></div></div>`; }).join('') : '<div class="empty"><b>Nenhum prazo</b>Adicione entregas para acompanhar a contagem.</div>'}</div></section>`;
  html += `<section class="card"><div class="card-h"><h2>${svg('book')}Trabalhos</h2><span class="note">em partes de 30 min</span></div><div class="list">${tasks.length? tasks.map(tk=>{
    const ss = Object.values(S.sessions).filter(s=>s.task===tk.id); const doneU = ss.filter(s=>s.done).reduce((a,s)=>a+unitsOf(s),0);
    const next = ss.filter(s=>!s.done && !isPast(s)).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start))[0];
    return `<div class="row"><div class="time"><b>${esc(tk.phase||'')}</b><span class="num">${doneU}/${tk.units}</span></div><span class="dot" style="--c:${subjColor(tk.subject)}"></span>
      <div class="what" data-act="edittask" data-id="${esc(tk.id)}" role="button" tabindex="0"><div class="t">${esc(tk.title)}</div><div class="m"><span class="num">${hours(tk.units)} no total</span>${tk.done?'<span class="pill ok">Pronto</span>': next?`<span>Próxima sessão: ${esc(fmtDay(next.date))} ${esc(next.start)}</span>`:'<span>Entra no plano depois das aulas</span>'}</div></div>
      <button class="check ${tk.done?'on':''}" data-act="taskdone" data-id="${esc(tk.id)}" aria-pressed="${!!tk.done}" aria-label="Trabalho pronto">${svg('check','stroke-width="3"')}</button></div>`; }).join('') : '<div class="empty">Nenhum trabalho cadastrado.</div>'}</div></section>`;
  html += `</div>`;
  return html;
}

function viewTrilhas(){
  let html = header('Trilhas', 'Treino de código e outros estudos fora da PUC, em horários fixos da semana que desviam da pizzaria e dos imprevistos.', `<button class="btn primary" data-act="newtrilha">${svg('plus')}Nova trilha</button>`);
  const tr = subjList().filter(s=>s.kind==='trilha');
  if(!tr.length){ html += `<section class="card empty" style="padding:32px 16px"><b>Nenhuma trilha ainda</b><p style="max-width:52ch;margin:6px auto 14px">Crie a trilha com módulos (um por linha), dias e horário.</p><button class="btn primary" data-act="newtrilha">${svg('code')}Criar trilha</button></section>`; return html; }
  html += `<div class="grid subj-grid">${tr.map(sub=>{
    const mods = sub.modules||[]; const pm = (S.progress[sub.id]&&S.progress[sub.id].modules)||{};
    const done = mods.filter(m=>pm[m.id]).length;
    const ss = sessList().filter(s=>s.subject===sub.id); const sDone = ss.filter(s=>s.done).length;
    const up = ss.filter(s=>!isPast(s) && !s.done).slice(0,4);
    const pl = sub.plan||{}; const sched = (pl.days||[]).length ? `${pl.days.map(d=>WD[d]).join(', ')} · ${esc(pl.start)}–${esc(pl.end)}` : 'sem horário';
    return `<section class="card" style="--c:${subjColor(sub.id)}"><div class="subj-h"><div class="sw">${esc((sub.short||sub.name).slice(0,2).toUpperCase())}</div><div style="min-width:0"><h3>${esc(sub.name)}</h3><p>${sched}</p></div><div class="pct num">${mods.length? Math.round(done/mods.length*100)+'%':''}</div></div>
      ${sub.desc?`<p class="note" style="margin:0 0 10px">${esc(sub.desc)}</p>`:''}
      <div class="subj-meta" style="margin-top:0"><span class="num">${sDone} sessões feitas</span>${mods.length?`<span class="num">${done}/${mods.length} módulos</span>`:'<span class="pill soon">Sem módulos: cole o esquema em Editar</span>'}</div>
      ${up.length?`<div class="section-title">Próximas</div><div class="list">${up.map(s=>rowHTML(s,{showDate:true})).join('')}</div>`:''}
      ${mods.length?`<div class="section-title">Módulos</div><div class="mods">${mods.map(m=>`<div class="mod ${pm[m.id]?'on':''}"><button class="check ${pm[m.id]?'on':''}" data-act="mod" data-sid="${esc(sub.id)}" data-mid="${esc(m.id)}" aria-pressed="${!!pm[m.id]}" aria-label="Módulo ${esc(m.title)}">${svg('check','stroke-width="3"')}</button><span>${esc(m.title)}</span></div>`).join('')}</div>`:''}
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn" data-act="newtrilha" data-sid="${esc(sub.id)}">Editar</button><button class="btn danger" data-act="deltrilha" data-sid="${esc(sub.id)}">Apagar trilha</button></div>
    </section>`; }).join('')}</div>`;
  return html;
}

function winText(w){ return (w||[]).map(([a,b])=>`${a}-${b}`).join(', '); }
function parseWins(txt){ const out=[]; const re=/(\d{1,2}):(\d{2})\s*[-–a]+\s*(\d{1,2}):(\d{2})/g; let m; while((m=re.exec(txt))) { const a=pad(m[1])+':'+m[2], b=pad(m[3])+':'+m[4]; if(b>a) out.push([a,b]); } return out; }
function viewRotina(){
  const c = conf(); const t = today();
  const upcoming = Object.entries(S.days).filter(([d])=>d>=t).sort((a,b)=>a[0].localeCompare(b[0]));
  const th=getTheme();
  let html = header('Rotina', 'O que o planejador usa para encaixar as aulas. Salvar refaz o plano.', `<div class="seg" role="group" aria-label="Tema neste aparelho">${[['light','Papel claro'],['dark','Caderno escuro'],['system','Igual ao sistema']].map(([v,l])=>`<button data-act="themeset" data-t="${v}" aria-pressed="${th===v}">${l}</button>`).join('')}</div><button class="btn primary" data-act="imprevisto">${svg('bolt')}Mudou o dia?</button>`);
  html += `<div class="grid dash">
  <section class="card"><div class="card-h"><h2>${svg('sliders')}Horários de estudo</h2></div>
    <form id="f-rot" class="fgrid">
      <div class="field full"><label for="ro-win">Janelas num dia normal</label><input id="ro-win" value="${esc(winText(c.windows))}"><span class="note">Ex.: 09:00-12:30, 14:00-19:00</span></div>
      <div class="field full"><label for="ro-free">Janelas num dia livre</label><input id="ro-free" value="${esc(winText(c.freeWindows))}"></div>
      <div class="field"><label for="ro-cap">Limite num dia normal</label><select id="ro-cap">${[4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${n===Number(c.capNormal)?'selected':''}>${n} partes (${hours(n)})</option>`).join('')}</select></div>
      <div class="field"><label for="ro-capf">Limite num dia livre</label><select id="ro-capf">${[6,8,10,12,14].map(n=>`<option value="${n}" ${n===Number(c.capFree)?'selected':''}>${n} partes (${hours(n)})</option>`).join('')}</select></div>
      <div class="field"><label for="ro-rest">Descanso semanal</label><select id="ro-rest"><option value="-1" ${Number(c.restDay)===-1?'selected':''}>Nenhum</option>${WDL.map((d,i)=>`<option value="${i}" ${Number(c.restDay)===i?'selected':''}>${d}</option>`).join('')}</select></div>
      <div class="field"><label for="ro-run">Sessão mais longa</label><select id="ro-run">${[2,3,4,5,6].map(n=>`<option value="${n}" ${n===Number(c.maxRun)?'selected':''}>${n} partes seguidas (${hours(n)})</option>`).join('')}</select></div>
      <div class="field full"><span class="flabel">Turnos na pizzaria</span>
        <div id="ro-shifts" class="shifts">${(c.shifts||[]).map((sh,i)=>shiftRow(sh,i)).join('')}</div>
        <button type="button" class="btn ghost" data-act="addshift" style="align-self:flex-start">${svg('plus')}Adicionar turno</button></div>
      <div class="field"><label for="ro-trav">Folga antes do turno</label><select id="ro-trav">${[0,15,30,45,60,90].map(n=>`<option value="${n}" ${n===Number(c.travel)?'selected':''}>${n} min</option>`).join('')}</select></div>
      <div class="field"><label for="ro-name">Seu nome</label><input id="ro-name" value="${esc((S.settings.main||{}).name||'')}"></div>
    </form>
    <div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn primary" data-act="saverotina">Salvar e replanejar</button></div>
  </section>
  <section class="card"><div class="card-h"><h2>${svg('bolt')}Imprevistos e dias livres</h2></div>
    <div class="list">${upcoming.length? upcoming.map(([d,e])=>`<div class="row"><div class="time"><b>${esc(fmtDay(d).split(', ')[1])}</b><span>${esc(WD[parse(d).getDay()])}</span></div><span class="dot" style="--c:${e.livre?'var(--ok)':e.sem?'var(--bad)':'var(--warn)'}"></span>
      <div class="what-static"><div class="t">${e.livre?'Dia livre':e.sem?'Sem estudo':'Ocupado'}</div><div class="m">${(e.ranges||[]).map(r=>`${esc(r.start)}–${esc(showHM(r.end))}${r.note?' '+esc(r.note):''}`).join(' · ')}${e.note?' '+esc(e.note):''}</div></div>
      <button class="check" data-act="delday" data-date="${esc(d)}" aria-label="Remover mudança de ${esc(fmtDay(d))}">${svg('x')}</button></div>`).join('') : '<div class="empty"><b>Nenhuma mudança marcada</b>Use “Mudou o dia?” quando ganhar folga ou tiver um imprevisto.</div>'}</div>
  </section></div>`;
  return html;
}
function shiftRow(sh,i){ return `<div class="shift"><select aria-label="Dia do turno ${i+1}" data-k="day">${WDL.map((d,j)=>`<option value="${j}" ${Number(sh.day)===j?'selected':''}>${d}</option>`).join('')}</select><input type="time" aria-label="Início" data-k="start" value="${esc(sh.start)}"><span>às</span><input type="time" aria-label="Fim" data-k="end" value="${esc(sh.end==='24:00'?'00:00':sh.end)}"><button type="button" class="nav-arrow" data-act="rmshift" aria-label="Remover turno">${svg('x')}</button></div>`; }
function readShifts(){ return [...document.querySelectorAll('#ro-shifts .shift')].map(r=>{ const g=k=>r.querySelector(`[data-k="${k}"]`).value; let end=g('end'); if(end==='00:00'||end<g('start')) end='24:00'; return {day:Number(g('day')), start:g('start'), end}; }).filter(s=>s.start); }
async function saveRotina(){
  const win = parseWins($('#ro-win').value), fw = parseWins($('#ro-free').value);
  if(!win.length || !fw.length){ toast('Escreva as janelas assim: 09:00-12:30, 14:00-19:00'); return; }
  const cur = Object.assign({}, S.settings.main||{}, {windows:win, freeWindows:fw, capNormal:Number($('#ro-cap').value), capFree:Number($('#ro-capf').value), restDay:Number($('#ro-rest').value), maxRun:Number($('#ro-run').value), travel:Number($('#ro-trav').value), shifts:readShifts(), name:$('#ro-name').value.trim()});
  delete cur.id; S.settings.main = cur; render();
  await setDoc('settings','main',cur);
  replan('Rotina salva.');
}

function syncPayload(){
  const set = S.settings.main||{}; const days = Number(set.syncDays || 60); const incR = !!set.syncReserva;
  const t = today(), lim = addDays(t, days), nm = nowHM();
  const evs = sessList().filter(s=> s.start && s.end && s.date<=lim && (s.date>t || (s.date===t && s.start>nm)) && !isDone(s) && s.type!=='Descanso' && (incR || s.type!=='Reserva'))
    .map(s=>({titulo: titleOf(s), inicio: `${s.date} ${s.start}`, fim: s.end==='24:00'? `${addDays(s.date,1)} 00:00` : `${s.date} ${s.end}`, notas: [S.subjects[s.subject]?S.subjects[s.subject].name:'', s.note||''].filter(Boolean).join(' · ')}));
  return {calendario:'Estudos', geradoEm:`${t} ${nm}`, eventos:evs};
}
function viewIphone(){
  const set = S.settings.main||{}; const p = syncPayload(); const json = JSON.stringify(p);
  let html = header('Calendário do iPhone', 'Envie suas sessões para um calendário “Estudos” no app Calendário. Sincronize de novo sempre que o plano mudar.');
  html += `<div class="grid dash">
  <section class="card"><div class="card-h"><h2>${svg('phone')}Sincronizar agora</h2><span class="note num">${p.eventos.length} eventos</span></div>
    <div class="fgrid"><div class="field"><label for="syncDays">Período</label><select id="syncDays" data-act="syncset">${[14,30,60,120].map(n=>`<option value="${n}" ${Number(set.syncDays||60)===n?'selected':''}>Próximos ${n} dias</option>`).join('')}</select></div>
    <div class="field"><label for="syncRes">Horários de reserva</label><select id="syncRes" data-act="syncset"><option value="0" ${!set.syncReserva?'selected':''}>Não enviar</option><option value="1" ${set.syncReserva?'selected':''}>Enviar também</option></select></div></div>
    <p class="note">Vão só as sessões futuras e não concluídas. Cada sincronização apaga os eventos futuros do calendário “Estudos” e recria a partir daqui.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><button class="btn primary" data-act="copy">${svg('copy')}Copiar agenda</button><span class="note" style="align-self:center">Depois rode o atalho <b>Sincronizar Estudos</b>.</span></div>
    <label class="note" for="payload">Se o botão não copiar, selecione o texto abaixo e copie:</label>
    <textarea class="payload" id="payload" readonly>${esc(json)}</textarea>
  </section>
  <section class="card"><div class="card-h"><h2>${svg('code')}Montar o atalho (uma vez)</h2></div>
    <ol class="steps">
      <li><div><b>Crie o calendário</b><p class="note">No app Calendário: Calendários → Adicionar Calendário → nome <b>Estudos</b> (no iCloud).</p></div></li>
      <li><div><b>Crie o atalho “Sincronizar Estudos”</b> no app Atalhos, com estas ações em ordem:
        <ol>
          <li><b>Obter Área de Transferência</b></li>
          <li><b>Obter Dicionário da Entrada</b> (entrada: Área de Transferência)</li>
          <li><b>Obter Valor do Dicionário</b>: chave <code>eventos</code></li>
          <li><b>Encontrar Eventos do Calendário</b> onde <i>Calendário</i> é <b>Estudos</b> e <i>Data de Início</i> é depois de <b>Data Atual</b></li>
          <li><b>Remover Eventos</b> (os encontrados acima)</li>
          <li><b>Repetir com Cada</b> item em <i>Valor do Dicionário</i>: <b>Adicionar Novo Evento</b> no calendário <b>Estudos</b>, com Título = <i>Item de Repetição</i> chave <code>titulo</code>, Início = chave <code>inicio</code>, Fim = chave <code>fim</code>, Notas = chave <code>notas</code>, Alerta 15 min antes.</li>
        </ol></div></li>
      <li><div><b>Use</b><p class="note">Aqui: <b>Copiar agenda</b>. No iPhone: rode o atalho (ou “E aí Siri, Sincronizar Estudos”).</p></div></li>
    </ol>
  </section></div>`;
  return html;
}

/* ---------- modals ---------- */
let M = null;
function closeModal(){ M=null; $('#modal-root').innerHTML=''; }
function openModal(html){ $('#modal-root').innerHTML = `<div class="scrim" data-act="scrim"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`; const f=$('#modal-root input, #modal-root select'); if(f) f.focus(); }
function subjOptions(sel, filter){ return `<option value="">Sem matéria</option>`+subjList().filter(filter||(()=>true)).map(s=>`<option value="${esc(s.id)}" ${s.id===sel?'selected':''}>${esc(s.name)}</option>`).join(''); }

function openImprevisto(date, kind){
  const d = date || today(); const e = S.days[d]||{};
  M = {kind:'imprevisto'};
  const k = kind || (e.livre?'livre': e.sem?'sem':'livre');
  openModal(`<h2>Mudou o dia?</h2>
    <p class="note" style="margin-top:-8px">Marque o que aconteceu e o plano refaz as próximas sessões sozinho.</p>
    <form id="f-imp" class="fgrid">
      <div class="field full"><label for="im-date">Dia</label><input id="im-date" type="date" value="${esc(d)}"></div>
      <div class="field full"><span class="flabel">O que mudou</span><div class="opts">
        ${[['livre','Ganhei o dia livre','Sem pizzaria e mais horas para estudar'],['sem','Não vou conseguir estudar','Cobrir turno, imprevisto, cansaço'],['ocupado','Fico ocupado num horário','O resto do dia segue normal'],['normal','Voltar ao normal','Apaga a mudança deste dia']].map(([v,l,s])=>`<label class="opt"><input type="radio" name="im-kind" value="${v}" ${v===k?'checked':''}><span><b>${l}</b><small>${s}</small></span></label>`).join('')}
      </div></div>
      <div class="field im-oc"><label for="im-a">Das</label><input id="im-a" type="time" value="16:00"></div>
      <div class="field im-oc"><label for="im-b">Até</label><input id="im-b" type="time" value="00:00"></div>
      <div class="field full"><label for="im-note">Nota</label><input id="im-note" value="${esc(e.note||'')}" placeholder="Ex.: cobrir férias na pizzaria"></div>
    </form>
    <div class="acts"><span></span><div><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="saveimp">Salvar e replanejar</button></div></div>`);
  const sync = ()=>{ const v = document.querySelector('input[name="im-kind"]:checked').value; document.querySelectorAll('.im-oc').forEach(x=>x.hidden = v!=='ocupado'); };
  document.querySelectorAll('input[name="im-kind"]').forEach(r=>r.addEventListener('change', sync)); sync();
}
async function saveImprevisto(){
  const d = $('#im-date').value; if(!d){ toast('Escolha o dia.'); return; }
  const k = document.querySelector('input[name="im-kind"]:checked').value; const note = $('#im-note').value.trim();
  const cur = Object.assign({ranges:[]}, S.days[d]||{}); delete cur.id;
  let doc;
  if(k==='livre') doc = {date:d, livre:true, sem:false, ranges:cur.ranges||[], note};
  else if(k==='sem') doc = {date:d, livre:false, sem:true, ranges:[], note};
  else if(k==='ocupado'){ let a=$('#im-a').value, b=$('#im-b').value; if(!a||!b){ toast('Informe o horário.'); return; } if(b==='00:00'||b<a) b='24:00'; doc = {date:d, livre:!!cur.livre, sem:false, ranges:[...(cur.ranges||[]), {start:a, end:b, note}], note:cur.note||''}; }
  closeModal();
  if(k==='normal'){ delete S.days[d]; render(); await delDoc('days', d); }
  else { S.days[d] = Object.assign({id:d}, doc); render(); await setDoc('days', d, doc); }
  replan('Dia atualizado.');
}

function openEditor(id, preset={}){
  const s = id ? Object.assign({}, S.sessions[id]) : Object.assign({type:'Aula', date:S.view==='agenda'?S.sel:today(), start:'', end:'', subject: pucSubjects()[0]?pucSubjects()[0].id:''}, preset);
  M = {kind:'session', id};
  openModal(`<h2>${id?'Editar sessão':'Nova sessão'}</h2>
  ${s.auto?'<p class="note" style="margin-top:-8px">Sessão criada pelo planejador. Se você mudar algo aqui, ela vira fixa e o planejador passa a respeitar este horário.</p>':''}
  <form id="f-sess" class="fgrid">
    <div class="field"><label for="fs-type">Tipo</label><select id="fs-type">${['Aula','Trabalho','Entrega','Estudo','Revisão','Reserva','Descanso'].map(t=>`<option ${t===s.type?'selected':''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label for="fs-subj">Matéria / trilha</label><select id="fs-subj">${subjOptions(s.subject)}</select></div>
    <div class="field"><label for="fs-date">Data</label><input id="fs-date" type="date" value="${esc(s.date)}" required></div>
    <div class="fgrid" style="gap:8px"><div class="field"><label for="fs-start">Início</label><input id="fs-start" type="time" value="${esc(s.start||'')}"></div><div class="field"><label for="fs-end">Fim</label><input id="fs-end" type="time" value="${esc(s.end==='24:00'?'00:00':(s.end||''))}"></div></div>
    <div class="field aula-only"><label for="fs-lesson">Aula nº</label><input id="fs-lesson" type="number" min="1" max="40" value="${esc(s.lesson||'')}"></div>
    <div class="fgrid aula-only" style="gap:8px"><div class="field"><label for="fs-pf">Da parte</label><input id="fs-pf" type="number" min="1" max="10" value="${esc(s.pFrom||'')}"></div><div class="field"><label for="fs-pt">Até a parte</label><input id="fs-pt" type="number" min="1" max="10" value="${esc(s.pTo||'')}"></div></div>
    <div class="field full"><label for="fs-title">Título <span class="note">(vazio = automático)</span></label><input id="fs-title" value="${esc(s.title||'')}" placeholder="${esc(autoTitle(s))}"></div>
    <div class="field"><label for="fs-phase">Fase</label><select id="fs-phase"><option value="">—</option>${['Fase 1','Fase 2'].map(p=>`<option ${p===s.phase?'selected':''}>${p}</option>`).join('')}</select></div>
    <div class="field"><label for="fs-units">Partes de 30 min</label><input id="fs-units" type="number" min="0" max="20" value="${esc(s.units??'')}" placeholder="pela duração"></div>
    <div class="field full"><label for="fs-note">Observação</label><textarea id="fs-note">${esc(s.note||'')}</textarea></div>
  </form>
  <div class="acts">${id?`<button class="btn danger" data-act="delsess" data-id="${esc(id)}">Apagar</button>`:'<span></span>'}<div><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="savesess">Salvar</button></div></div>`);
  const sync = ()=>{ const a = $('#fs-type').value==='Aula'; document.querySelectorAll('.aula-only').forEach(e=>e.hidden=!a); };
  $('#fs-type').addEventListener('change', sync); sync();
}
function saveSession(){
  const g = id => $(id).value.trim();
  const type = g('#fs-type'); const date = g('#fs-date'); if(!date){ toast('Escolha uma data.'); return; }
  const n = v => v===''? null : Number(v);
  let end = g('#fs-end'); const start = g('#fs-start'); if(end==='00:00' && start) end='24:00';
  const s = { type, subject: g('#fs-subj')||null, date, start, end, title: g('#fs-title'), phase: g('#fs-phase')||null, note: g('#fs-note'), units: n(g('#fs-units')) };
  if(type==='Aula'){ s.lesson=n(g('#fs-lesson')); s.pFrom=n(g('#fs-pf')); s.pTo=n(g('#fs-pt'))||s.pFrom; if(s.pFrom && s.units==null) s.units = s.pTo-s.pFrom+1; }
  if(s.start && s.end && s.end<=s.start){ toast('O fim precisa ser depois do início.'); return; }
  const wasEdit = !!M.id; const id = M.id || ('s_'+uid());
  const prev = M.id ? S.sessions[M.id] : {};
  const doc = Object.assign({}, prev, s, {id}); delete doc.auto; if(doc.done==null) doc.done=false;
  for(const k in doc) if(doc[k]===undefined || doc[k]===null) delete doc[k];
  S.sessions[id] = doc; closeModal(); render(); setDoc('sessions', id, doc); toast(wasEdit?'Sessão atualizada.':'Sessão salva.');
}

function openTask(id){
  const tk = id ? S.tasks[id] : {title:'', subject: pucSubjects()[0]?.id, units:2, phase:'Fase 2'};
  M = {kind:'task', id};
  openModal(`<h2>${id?'Editar trabalho':'Novo trabalho'}</h2><form class="fgrid">
    <div class="field full"><label for="tk-title">Título</label><input id="tk-title" value="${esc(tk.title)}" placeholder="Ex.: Trabalho Fase 2 · DevOps"></div>
    <div class="field"><label for="tk-subj">Matéria</label><select id="tk-subj">${subjOptions(tk.subject, s=>s.kind==='puc')}</select></div>
    <div class="field"><label for="tk-phase">Fase</label><select id="tk-phase"><option value="">—</option>${['Fase 1','Fase 2'].map(p=>`<option ${p===tk.phase?'selected':''}>${p}</option>`).join('')}</select></div>
    <div class="field"><label for="tk-units">Tempo estimado</label><select id="tk-units">${[1,2,3,4,5,6,8,10].map(n=>`<option value="${n}" ${n===Number(tk.units)?'selected':''}>${n} partes (${hours(n)})</option>`).join('')}</select></div>
  </form><p class="note">O planejador encaixa o trabalho depois das aulas dessa matéria.</p>
  <div class="acts">${id?`<button class="btn danger" data-act="deltask" data-id="${esc(id)}">Apagar</button>`:'<span></span>'}<div><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="savetask">Salvar e replanejar</button></div></div>`);
}
async function saveTask(){
  const title=$('#tk-title').value.trim(); if(!title){ toast('Dê um título.'); return; }
  const id = M.id || 'k_'+uid(); const prev = (M.id && S.tasks[M.id]) || {};
  const doc = Object.assign({}, prev, {title, subject:$('#tk-subj').value, phase:$('#tk-phase').value||null, units:Number($('#tk-units').value), done:!!prev.done}); delete doc.id;
  closeModal(); S.tasks[id]=Object.assign({id},doc); render(); await setDoc('tasks', id, doc); replan('Trabalho salvo.');
}

function openSubject(){
  M = {kind:'subject'};
  openModal(`<h2>Nova matéria</h2><form class="fgrid">
    <div class="field full"><label for="fj-name">Nome</label><input id="fj-name" placeholder="Ex.: Banco de Dados" required></div>
    <div class="field"><label for="fj-short">Abreviação</label><input id="fj-short" placeholder="Ex.: BD"></div>
    <div class="field"><label for="fj-color">Cor</label><select id="fj-color">${[['devops','Violeta'],['gp','Verde'],['co','Rosa'],['t1','Âmbar'],['t2','Azul'],['t3','Grafite']].map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
    <div class="field"><label for="fj-l">Aulas</label><input id="fj-l" type="number" min="1" max="40" value="10"></div>
    <div class="field"><label for="fj-p">Partes por aula</label><input id="fj-p" type="number" min="1" max="10" value="5"></div>
  </form><div class="acts"><span></span><div><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="savesubj">Criar e replanejar</button></div></div>`);
}
async function saveSubject(){
  const name = $('#fj-name').value.trim(); if(!name){ toast('Dê um nome para a matéria.'); return; }
  const id = 'm_'+uid();
  const doc = {name, short: $('#fj-short').value.trim()||name.slice(0,12), color:$('#fj-color').value, kind:'puc', lessons:Number($('#fj-l').value)||10, parts:Number($('#fj-p').value)||5, order: subjList().length+1};
  S.subjects[id]=Object.assign({id},doc); closeModal(); render(); await setDoc('subjects', id, doc); replan('Matéria criada.');
}

function openTrilha(sid){
  const sub = sid ? S.subjects[sid] : {name:'Treino de código', short:'Código', color:'t2', modules:[], plan:{days:[1,3,6], start:'21:00', end:'22:00'}, desc:''};
  M = {kind:'trilha', id:sid};
  const pl = sub.plan||{days:[],start:'21:00',end:'22:00'};
  openModal(`<h2>${sid?'Editar trilha':'Nova trilha'}</h2><form class="fgrid">
    <div class="field full"><label for="ft-name">Nome</label><input id="ft-name" value="${esc(sub.name)}"></div>
    <div class="field"><label for="ft-short">Abreviação</label><input id="ft-short" value="${esc(sub.short||'')}"></div>
    <div class="field"><label for="ft-color">Cor</label><select id="ft-color">${[['t2','Azul'],['t1','Âmbar'],['t3','Grafite'],['devops','Violeta'],['gp','Verde'],['co','Rosa']].map(([v,l])=>`<option value="${v}" ${v===sub.color?'selected':''}>${l}</option>`).join('')}</select></div>
    <div class="field full"><label for="ft-mods">Módulos ou etapas (um por linha, na ordem)</label><textarea id="ft-mods" rows="7" placeholder="Cole aqui as etapas do seu esquema de treino">${esc((sub.modules||[]).map(m=>m.title).join('\n'))}</textarea></div>
    <div class="field full"><span class="flabel">Dias da semana</span><div class="days">${[1,2,3,4,5,6,0].map(d=>`<label><input type="checkbox" value="${d}" ${(pl.days||[]).includes(d)?'checked':''}><span>${WD[d]}</span></label>`).join('')}</div></div>
    <div class="field"><label for="ft-start">Início</label><input id="ft-start" type="time" value="${esc(pl.start)}"></div>
    <div class="field"><label for="ft-end">Fim</label><input id="ft-end" type="time" value="${esc(pl.end)}"></div>
    <div class="field full"><label for="ft-desc">Objetivo</label><input id="ft-desc" value="${esc(sub.desc||'')}" placeholder="Ex.: ganhar ritmo em Python e APIs"></div>
    <p class="note full" style="margin:0">Nos dias marcados a sessão fica nesse horário. Se o horário bater com turno ou imprevisto, ela vai para o próximo horário livre do mesmo dia; se não houver, o dia é pulado.</p>
  </form><div class="acts"><span></span><div><button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="savetrilha">Salvar e replanejar</button></div></div>`);
}
async function saveTrilha(){
  const name = $('#ft-name').value.trim(); if(!name){ toast('Dê um nome para a trilha.'); return; }
  const days = [...document.querySelectorAll('.days input:checked')].map(i=>Number(i.value));
  const start=$('#ft-start').value, end=$('#ft-end').value;
  if(!days.length || !start || !end || end<=start){ toast('Confira os dias e o horário.'); return; }
  const prev = (M.id && S.subjects[M.id]) || {};
  const old = {}; for(const m of prev.modules||[]) old[m.title]=m.id;
  let n = (prev.modules||[]).length;
  const mods = $('#ft-mods').value.split('\n').map(x=>x.trim()).filter(Boolean).map(title=>({id: old[title] || ('k'+(++n)+'_'+uid().slice(-4)), title}));
  const id = M.id || 't_'+uid();
  const doc = Object.assign({}, prev, {name, short:$('#ft-short').value.trim()||name.slice(0,10), color:$('#ft-color').value, kind:'trilha', modules:mods, desc:$('#ft-desc').value.trim(), plan:{days,start,end}, order: prev.order || subjList().length+1}); delete doc.id; delete doc.schedule;
  closeModal(); S.subjects[id]=Object.assign({id},doc); render(); await setDoc('subjects', id, doc); replan('Trilha salva.');
}
async function deleteTrilha(sid){
  const ss = Object.values(S.sessions).filter(s=>s.subject===sid && !s.done);
  delete S.subjects[sid]; for(const s of ss) delete S.sessions[s.id]; render();
  await delDoc('subjects', sid); await pool(ss.map(s=>()=>delDoc('sessions', s.id)), 4);
  toast('Trilha apagada.');
}

/* ---------- render ---------- */
function render(){
  renderNav();
  const main = $('#main');
  if(S.error){ main.innerHTML = `<div class="card empty" style="margin-top:20px"><b>Não consegui abrir o plano</b>${esc(S.error)}</div>`; return; }
  if(!ready()){ main.innerHTML = `<div class="loading"><div class="spin"></div>${S.stale?'O banco do painel ainda não respondeu. Verifique a conexão; os dados aparecem assim que ele responder.':'Carregando seu plano de estudos…'}</div>`; return; }
  const scrollY = window.scrollY;
  const v = {inicio:viewInicio, agenda:viewAgenda, materias:viewMaterias, prazos:viewPrazos, trilhas:viewTrilhas, rotina:viewRotina, iphone:viewIphone}[S.view] || viewInicio;
  main.innerHTML = v();
  window.scrollTo(0, scrollY);
}
function route(){ const h = (location.hash||'').slice(1); const nv = VIEWS.some(v=>v.id===h) ? h : 'inicio'; if(nv!==S.view){ S.view=nv; render(); window.scrollTo(0,0); } else render(); }

/* ---------- events ---------- */
let armed = null;
document.addEventListener('click', e=>{
  const el = e.target.closest('[data-act]'); if(!el) return;
  const a = el.dataset.act;
  if(a==='scrim'){ if(e.target===el) closeModal(); return; }
  if(!['delsess','deltrilha','deltask'].includes(a) && armed){ armed.classList.remove('armed'); armed.textContent = armed.dataset.label; armed=null; }
  switch(a){
    case 'toggle': toggleSession(el.dataset.id); break;
    case 'edit': openEditor(el.dataset.id); break;
    case 'new': openEditor(null, Object.assign({}, el.dataset.date?{date:el.dataset.date}:{}, el.dataset.type?{type:el.dataset.type}:{}, el.dataset.subject?{subject:el.dataset.subject}:{} )); break;
    case 'close': closeModal(); break;
    case 'savesess': saveSession(); break;
    case 'delsess': case 'deltrilha': case 'deltask':
      if(armed!==el){ if(armed){ armed.classList.remove('armed'); armed.textContent=armed.dataset.label; } el.dataset.label=el.textContent; el.classList.add('armed'); el.textContent='Toque de novo para apagar'; armed=el; return; }
      armed=null;
      if(a==='delsess'){ const id=el.dataset.id; delete S.sessions[id]; closeModal(); render(); delDoc('sessions', id); toast('Sessão apagada.'); }
      else if(a==='deltask'){ const id=el.dataset.id; delete S.tasks[id]; closeModal(); render(); delDoc('tasks', id).then(()=>replan('Trabalho apagado.')); }
      else deleteTrilha(el.dataset.sid);
      break;
    case 'part': togglePart(el.dataset.sid, el.dataset.key); break;
    case 'mod': { const sid=el.dataset.sid, mid=el.dataset.mid; const cur=Object.assign({}, (S.progress[sid]&&S.progress[sid].modules)||{}); if(cur[mid]) delete cur[mid]; else cur[mid]=today(); const doc={modules:cur}; S.progress[sid]=Object.assign({id:sid}, S.progress[sid]||{}, doc); render(); setDoc('progress', sid, {modules:cur, ...(S.progress[sid].parts?{parts:S.progress[sid].parts}:{})}); break; }
    case 'go': S.sel = el.dataset.date; S.monthAnchor = S.sel.slice(0,7)+'-01'; render(); break;
    case 'month': S.monthAnchor = el.dataset.date; render(); break;
    case 'mode': S.calMode = el.dataset.mode; render(); break;
    case 'newsubj': openSubject(); break;
    case 'savesubj': saveSubject(); break;
    case 'newtrilha': openTrilha(el.dataset.sid); break;
    case 'savetrilha': saveTrilha(); break;
    case 'newtask': openTask(); break;
    case 'edittask': openTask(el.dataset.id); break;
    case 'savetask': saveTask(); break;
    case 'taskdone': { const tk=S.tasks[el.dataset.id]; if(!tk) break; const doc=Object.assign({}, tk, {done:!tk.done}); delete doc.id; S.tasks[tk.id]=Object.assign({id:tk.id},doc); render(); setDoc('tasks', tk.id, doc).then(()=>replan(doc.done?'Trabalho pronto.':'')); break; }
    case 'imprevisto': openImprevisto(el.dataset.date, el.dataset.kind); break;
    case 'saveimp': saveImprevisto(); break;
    case 'replan': replan(''); break;
    case 'theme': setTheme(isDarkNow()?'light':'dark'); break;
    case 'themeset': setTheme(el.dataset.t); render(); break;
    case 'saverotina': saveRotina(); break;
    case 'addshift': { const box=$('#ro-shifts'); box.insertAdjacentHTML('beforeend', shiftRow({day:5,start:'16:00',end:'24:00'}, box.children.length)); break; }
    case 'rmshift': el.closest('.shift').remove(); break;
    case 'delday': { const d=el.dataset.date; delete S.days[d]; render(); delDoc('days', d).then(()=>replan('Mudança removida.')); break; }
    case 'copy': { const ta=$('#payload'); const txt = JSON.stringify(syncPayload()); ta.value = txt;
      const fb = ()=>{ ta.focus(); ta.select(); toast('Texto selecionado. Toque em Copiar.'); };
      try{ navigator.clipboard.writeText(txt).then(()=>toast('Agenda copiada. Rode o atalho Sincronizar Estudos.'), fb); }catch(_){ fb(); }
      break; }
  }
});
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && M) closeModal();
  if((e.key==='Enter'||e.key===' ') && e.target.matches('[role="button"][data-act]')){ e.preventDefault(); e.target.click(); }
});
document.addEventListener('change', e=>{
  if(e.target.dataset.act==='syncset'){
    const cur = Object.assign({}, S.settings.main||{}, {syncDays:Number($('#syncDays').value), syncReserva: $('#syncRes').value==='1'}); delete cur.id;
    S.settings.main = cur; render(); setDoc('settings','main',cur);
  }
});
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
async function boot(){
  renderThemeBtn();
  route();
  if(!window.claude || !window.claude.use){ S.error='Abra esta página no claude.ai, com sua conta, para carregar e salvar o plano.'; render(); return; }
  const db = await window.claude.use('db');
  if(!db){ S.error='O armazenamento do painel não está disponível nesta visualização. Abra pelo claude.ai com sua conta.'; render(); return; }
  S.db = db;
  const timer = setTimeout(()=>{ S.stale=true; render(); }, 10000);
  const sub = (col) => db.collection(col).onSnapshot(snap=>{
    const m = {}; for(const d of snap.docs){ const v=d.data(); if(v) m[d.id]=Object.assign({id:d.id}, v); }
    S[col]=m; S.got[col]=true; if(ready()){ clearTimeout(timer); S.stale=false; }
    if(S.busy) return;
    if(!M) render(); else renderNav();
  }, err=>{ clearTimeout(timer); S.error = err && err.code==='revoked' ? 'O acesso a este painel mudou.' : 'Não consegui ler o plano agora. Recarregue a página em instantes.'; render(); });
  ['subjects','sessions','progress','settings','tasks','days'].forEach(sub);
}
boot();
})();

