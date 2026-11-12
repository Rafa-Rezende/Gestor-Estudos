// Testes do planejador (função pura). Rodar: node --test rota/test/
const test = require('node:test');
const assert = require('node:assert/strict');
require('../src/planejador.js');
const P = globalThis.RotaPlanner;

const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const wd = d => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).getDay(); };

// Situação real de 12/11/2026: DevOps e GP até a aula 5, CO até a 5.2, entrega da Fase 2 em 26/11.
function estado(extra = {}) {
  const ate = (L, Pt) => { const o = {}; for (let l = 1; l <= 10; l++) for (let p = 1; p <= 5; p++) if (l < L || (l === L && p <= Pt)) o[l + '.' + p] = true; return o; };
  return {
    subjects: {
      devops: { id: 'devops', short: 'DevOps', kind: 'puc', lessons: 10, parts: 5, order: 1 },
      gp: { id: 'gp', short: 'GP', kind: 'puc', lessons: 10, parts: 5, order: 2 },
      co: { id: 'co', short: 'CO', kind: 'puc', lessons: 10, parts: 5, order: 3 },
      codigo: { id: 'codigo', name: 'Treino de código', short: 'Código', kind: 'trilha', modules: [], plan: { days: [1, 3, 6], start: '21:00', end: '22:00' }, order: 4 },
    },
    progress: { devops: { parts: ate(5, 5) }, gp: { parts: ate(5, 5) }, co: { parts: ate(5, 2) } },
    sessions: { e2: { id: 'e2', type: 'Entrega', date: '2026-11-26', start: '10:00', end: '10:30', done: false, title: 'ENTREGA Fase 2' } },
    tasks: {
      t1: { id: 't1', subject: 'devops', title: 'Trabalho DevOps', units: 2 },
      t2: { id: 't2', subject: 'gp', title: 'Trabalho GP', units: 3 },
      t3: { id: 't3', subject: 'co', title: 'Trabalho CO', units: 2 },
    },
    days: {},
    settings: {},
    ...extra,
  };
}
const AGORA = { date: '2026-11-12', min: 13 * 60 };
const aulas = plano => plano.create.filter(s => s.type === 'Aula');
const partes = plano => aulas(plano).flatMap(s => { const o = []; for (let p = s.pFrom; p <= s.pTo; p++) o.push(s.subject + ':' + s.lesson + '.' + p); return o; });

test('encaixa todas as partes que faltam e os trabalhos antes da entrega', () => {
  const plano = P.buildPlan(estado(), AGORA);
  const ps = partes(plano);
  assert.equal(ps.length, 78); // 25 + 25 + 28
  assert.equal(new Set(ps).size, 78, 'nenhuma parte repetida');
  const trab = plano.create.filter(s => s.type === 'Trabalho').reduce((a, s) => a + s.units, 0);
  assert.equal(trab, 7);
  assert.equal(plano.unplaced, 0);
  assert.equal(plano.late, false);
  assert.ok(plano.endDate < '2026-11-26');
});

test('não planeja partes já assistidas', () => {
  const ps = partes(P.buildPlan(estado(), AGORA));
  assert.ok(!ps.includes('devops:5.5'));
  assert.ok(!ps.includes('co:5.2'));
  assert.ok(ps.includes('co:5.3'));
});

test('as aulas de cada matéria saem em ordem', () => {
  const plano = P.buildPlan(estado(), AGORA);
  for (const sid of ['devops', 'gp', 'co']) {
    const seq = aulas(plano).filter(s => s.subject === sid).map(s => s.lesson * 10 + s.pFrom);
    assert.deepEqual(seq, [...seq].sort((a, b) => a - b), sid);
  }
});

test('nada começa antes de agora no dia de hoje', () => {
  const plano = P.buildPlan(estado(), AGORA);
  for (const s of plano.create.filter(s => s.date === AGORA.date)) assert.ok(toMin(s.start) >= AGORA.min, s.start);
});

test('nenhuma sessão de aula cai no turno da pizzaria nem nos 30 min antes', () => {
  const plano = P.buildPlan(estado(), AGORA);
  for (const s of aulas(plano)) {
    const dia = wd(s.date); const a = toMin(s.start), b = toMin(s.end);
    if (dia === 2 || dia === 4) assert.ok(b <= toMin('18:30'), `${s.date} ${s.start}`);
    if (dia === 5) assert.ok(b <= toMin('15:30'), `${s.date} ${s.start}`);
    assert.ok(a < b);
  }
});

test('dia marcado sem estudo fica vazio e empurra o fim do plano', () => {
  const normal = P.buildPlan(estado(), AGORA);
  const sem = P.buildPlan(estado({ days: { '2026-11-13': { sem: true } } }), AGORA);
  assert.equal(sem.create.filter(s => s.date === '2026-11-13').length, 0);
  assert.ok(sem.endDate >= normal.endDate);
});

test('dia livre ignora o turno e aceita mais horas', () => {
  // 17/11 é terça (turno 19h-00h): livre usa a janela das 20h-22h e o limite maior
  const normal = P.buildPlan(estado(), AGORA);
  const livre = P.buildPlan(estado({ days: { '2026-11-17': { livre: true } } }), AGORA);
  const horas = pl => pl.create.filter(s => s.date === '2026-11-17' && s.type !== 'Estudo').reduce((a, s) => a + s.units, 0);
  assert.ok(horas(normal) <= 8, 'dia normal: até 8 partes (4h)');
  assert.equal(horas(livre), 10, 'dia livre: 10 partes (5h)');
});

test('horário ocupado não recebe sessão', () => {
  const plano = P.buildPlan(estado({ days: { '2026-11-16': { ranges: [{ start: '09:00', end: '12:00' }] } } }), AGORA);
  for (const s of plano.create.filter(s => s.date === '2026-11-16' && s.type !== 'Estudo')) assert.ok(toMin(s.start) >= toMin('12:00'), s.start);
});

test('domingo é descanso por padrão', () => {
  const plano = P.buildPlan(estado(), AGORA);
  assert.equal(plano.create.filter(s => wd(s.date) === 0).length, 0);
});

test('treino de código fica no horário próprio e não come o limite das aulas', () => {
  const plano = P.buildPlan(estado(), AGORA);
  const treinos = plano.create.filter(s => s.subject === 'codigo');
  assert.ok(treinos.length > 0);
  for (const s of treinos) { assert.ok([1, 3, 6].includes(wd(s.date))); assert.equal(s.start, '21:00'); }
});

test('sessões automáticas que passaram sem conclusão são descartadas e as partes voltam ao plano', () => {
  const st = estado();
  st.sessions.velha = { id: 'velha', auto: true, type: 'Aula', subject: 'co', lesson: 5, pFrom: 3, pTo: 5, date: '2026-11-11', start: '09:00', end: '10:30', done: false };
  const plano = P.buildPlan(st, AGORA);
  assert.ok(plano.dropIds.includes('velha'));
  assert.ok(partes(plano).includes('co:5.3'));
});

test('sessão manual futura reserva as partes dela', () => {
  const st = estado();
  st.sessions.minha = { id: 'minha', type: 'Aula', subject: 'devops', lesson: 6, pFrom: 1, pTo: 2, date: '2026-11-14', start: '16:00', end: '17:00', done: false };
  const ps = partes(P.buildPlan(st, AGORA));
  assert.ok(!ps.includes('devops:6.1'));
  assert.ok(ps.includes('devops:6.3'));
});

test('sem tempo até a entrega, o plano avisa que está atrasado', () => {
  const dias = {}; for (let d = 12; d <= 25; d++) dias[`2026-11-${d}`] = { sem: true };
  const plano = P.buildPlan(estado({ days: dias }), AGORA);
  assert.equal(plano.late, true);
});

test('ids das sessões são estáveis para o mesmo estado', () => {
  const a = P.buildPlan(estado(), AGORA).create.map(s => s.id);
  const b = P.buildPlan(estado(), AGORA).create.map(s => s.id);
  assert.deepEqual(a, b);
});
