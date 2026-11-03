/* Prévia estática do sistema da Kelly (gimfreires.tech/kelly).
   Substitui o Firestore por um banco em memória com dados de demonstração.
   O que for criado na prévia fica guardado só nesta aba (sessionStorage):
   um agendamento feito no site aparece no painel, mas nada sai do navegador. */

const CHAVE = 'kelly-previa-db-v1';
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const diaMais = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

export class Timestamp {
  constructor(seconds, nanoseconds = 0) { this.seconds = seconds; this.nanoseconds = nanoseconds; }
  static fromDate(d) { return new Timestamp(Math.floor(d.getTime() / 1000), (d.getTime() % 1000) * 1e6); }
  static fromMillis(ms) { return Timestamp.fromDate(new Date(ms)); }
  static now() { return Timestamp.fromDate(new Date()); }
  toDate() { return new Date(this.toMillis()); }
  toMillis() { return this.seconds * 1000 + Math.floor(this.nanoseconds / 1e6); }
  valueOf() { return this.toMillis(); }
}

const SENTINELA_TS = { __previa: 'serverTimestamp' };
const SENTINELA_DEL = { __previa: 'deleteField' };
export function serverTimestamp() { return SENTINELA_TS; }
export function deleteField() { return SENTINELA_DEL; }

/* ---------- dados de demonstração ---------- */
function semente() {
  const ts = (n, h = 10) => { const d = diaMais(n); d.setHours(h, 0, 0, 0); return { __ts: d.getTime() }; };
  const reservas = {};
  const ag = (n, hora, nome, sobrenome, servico, valor, forma, extra = {}) => {
    const data = ymd(diaMais(n));
    reservas[`${data}_${hora}`] = {
      data, hora, clienteNome: nome, clienteSobrenome: sobrenome,
      clienteNomeCompleto: `${nome} ${sobrenome}`, clienteTelefone: '5545999110000',
      servicoNome: servico, servicoValor: valor, valor, servicoTempoMin: 60,
      pagamentoForma: forma, profissional: 'kelly', profissionalNome: 'Kelly',
      raclub: { status: extra.membro ? 'membro' : 'nao' }, createdAt: ts(n - 2), ...extra
    };
  };
  // semana passada (para os relatórios)
  ag(-6, '10:00', 'Marcos', 'O.', 'Nuru', 500, 'pix');
  ag(-5, '15:00', 'Fernanda', 'L.', 'Relaxante com Lingan/Yoni', 400, 'cartao');
  ag(-4, '19:00', 'Ricardo', 'A.', 'Nuru Mútua', 700, 'pix', { membro: true });
  ag(-3, '11:00', 'João', 'P.', 'Tântrica', 500, 'dinheiro');
  ag(-2, '16:00', 'Aline', 'C.', 'Terapêutica com Lingan/Yoni', 400, 'pix');
  ag(-1, '14:00', 'Paulo', 'S.', 'Tântrica com Nuru', 500, 'pix', { membro: true });
  // hoje e próximos dias
  ag(0, '10:00', 'Carlos', 'M.', 'Nuru', 500, 'pix');
  ag(0, '14:00', 'Juliana', 'R.', 'Relaxante com Lingan/Yoni', 400, '');
  ag(0, '18:00', 'Rafael', 'T.', 'Nuru Mútua', 700, '', { membro: true });
  ag(1, '11:00', 'André', 'B.', 'Tântrica', 500, '');
  ag(1, '16:00', 'Bruno', 'F.', 'Tântrica com Nuru', 500, '');
  ag(2, '15:00', 'Diego', 'N.', 'Nuru', 500, '');
  const hoje = ymd(diaMais(0));
  reservas[`${hoje}_12:00`] = { data: hoje, hora: '12:00', bloqueado: true, motivo: 'Almoço', profissional: 'kelly' };

  const servicos = {};
  [['nuru', 'Nuru', 500], ['tantrica', 'Tântrica', 500], ['tantrica-nuru', 'Tântrica com Nuru', 500],
   ['nuru-mutua', 'Nuru Mútua', 700], ['relaxante', 'Relaxante com Lingan/Yoni', 400],
   ['terapeutica', 'Terapêutica com Lingan/Yoni', 400]]
    .forEach(([id, nome, valor]) => { servicos[id] = { nome, valor, tempoMin: 60, ativo: true }; });

  const clientes = {};
  [['c1', 'Ricardo', 'A.', 'membro'], ['c2', 'Paulo', 'S.', 'membro'], ['c3', 'Rafael', 'T.', 'membro'],
   ['c4', 'Fernanda', 'L.', 'nao'], ['c5', 'João', 'P.', 'nao']]
    .forEach(([id, nome, sobrenome, raclub], i) => {
      const nomeCompleto = `${nome} ${sobrenome}`;
      const membro = raclub === 'membro';
      clientes[id] = {
        nome, sobrenome, nomeCompleto, telefone: `554599911000${i + 1}`, raclub,
        status: membro ? 'ativo' : 'nao_membro', situacao: membro ? 'ativo' : 'nao_membro',
        name: nomeCompleto, phone: `554599911000${i + 1}`, type: membro ? 'plano_jc' : 'cliente',
        plano: membro ? 'ra_club' : 'cliente', isPlan: membro, valorMensal: membro ? 900 : 0,
        diaPagamento: membro ? 10 : null, createdAt: ts(-30)
      };
    });

  const pagamentos = {
    p1: { clientId: 'c1', clienteNome: 'Ricardo A.', valor: 900, amount: 900, date: ts(-8), dataPagamento: ts(-8), forma: 'pix', method: 'pix' },
    p2: { clientId: 'c2', clienteNome: 'Paulo S.', valor: 900, amount: 900, date: ts(-3), dataPagamento: ts(-3), forma: 'pix', method: 'pix' }
  };

  const produtos = {
    pr1: { nome: 'Óleo de massagem aromático 120 ml', preco: 59.9, estoque: 8, ativo: true, createdAt: ts(-20) },
    pr2: { nome: 'Vela de massagem', preco: 79.9, estoque: 5, ativo: true, createdAt: ts(-20) },
    pr3: { nome: 'Vale-presente (1 sessão)', preco: 500, estoque: 20, ativo: true, createdAt: ts(-20) },
    pr4: { nome: 'Kit mimo: óleo + vela', preco: 129.9, estoque: 4, ativo: true, createdAt: ts(-20) }
  };
  const vendas = {
    v1: { productId: 'pr1', productName: 'Óleo de massagem aromático 120 ml', unitPrice: 59.9, qty: 1, total: 59.9, method: 'pix', profColecao: 'reservas_kelly', profNome: 'Kelly', createdAt: ts(-4), dateYmd: ymd(diaMais(-4)) },
    v2: { productId: 'pr3', productName: 'Vale-presente (1 sessão)', unitPrice: 500, qty: 1, total: 500, method: 'cartao', profColecao: 'reservas_kelly', profNome: 'Kelly', createdAt: ts(-2), dateYmd: ymd(diaMais(-2)) }
  };

  const contas = {};
  const conta = (id, fornecedor, descricao, categoria, valor, n, status) => {
    const venc = ymd(diaMais(n));
    contas[id] = {
      groupId: id, fornecedor, descricao, categoria, valorTotal: valor, valorParcela: valor,
      parcelas: 1, parcelaAtual: 1, formaPagamento: 'pix', dataPrimeiroVencimento: venc,
      dataVencimento: venc, status, pagoEm: status === 'pago' ? ts(n) : null, createdAt: ts(-15), updatedAt: ts(-15)
    };
  };
  conta('k1', 'Imobiliária Centro', 'Aluguel da sala', 'Aluguel', 1800, -2, 'pago');
  conta('k2', 'Lavanderia Bem Lavado', 'Toalhas e lençóis', 'Serviços', 240, 3, 'pendente');
  conta('k3', 'Casa dos Óleos', 'Óleos e cremes', 'Produtos', 380, 8, 'pendente');

  return {
    profissionais: { kelly: { nome: 'Kelly', colecao: 'reservas_kelly', whatsapp: '554599065842', fotoUrl: '../assets/logo-kelly.png', ativo: true, fimExpediente: '20:00', diasFolga: [0] } },
    servicos,
    config: { horarios: { inicio: '09:00', fim: '20:00' }, semana: { weekdays: [1, 2, 3, 4, 5, 6], dayStart: '09:00', dayEnd: '20:00' } },
    reservas_kelly: reservas,
    raclub_clients: clientes,
    raclub_payments: pagamentos,
    produtos,
    pdv_sales: vendas,
    contas_apagar: contas,
    rabarbearia_expenses: {
      e1: { descricao: 'Óleos e cremes', categoria: 'Produtos', valor: 380, data: ymd(diaMais(-10)), createdAt: ts(-10) }
    }
  };
}

/* ---------- armazenamento ---------- */
function reviver(v) {
  if (Array.isArray(v)) return v.map(reviver);
  if (v && typeof v === 'object') {
    if (typeof v.__ts === 'number') return Timestamp.fromMillis(v.__ts);
    const o = {}; for (const k in v) o[k] = reviver(v[k]); return o;
  }
  return v;
}
function plano(v) {
  if (v instanceof Timestamp) return { __ts: v.toMillis() };
  if (v instanceof Date) return { __ts: v.getTime() };
  if (Array.isArray(v)) return v.map(plano);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = plano(v[k]); return o; }
  return v;
}
let BANCO;
try { const s = sessionStorage.getItem(CHAVE); if (s) BANCO = JSON.parse(s); } catch (e) {}
if (!BANCO) BANCO = semente();
function salvar() { try { sessionStorage.setItem(CHAVE, JSON.stringify(BANCO)); } catch (e) {} }
salvar();

/* caminho "a/b/c/d" -> coleção "a/b/c", id "d" */
function colecaoDe(path) { if (!BANCO[path]) BANCO[path] = {}; return BANCO[path]; }

/* ---------- referências ---------- */
class CollectionReference { constructor(path) { this.type = 'collection'; this.path = path; this.id = path.split('/').pop(); } }
class DocumentReference {
  constructor(path) {
    this.type = 'document'; this.path = path;
    const p = path.split('/'); this.id = p.pop(); this.colPath = p.join('/');
    this.parent = new CollectionReference(this.colPath);
  }
}
let seq = 0;
const novoId = () => 'previa' + Date.now().toString(36) + (seq++).toString(36);

export function getFirestore() { return { previa: true }; }
export function initializeFirestore() { return { previa: true }; }
export function collection(base, ...segs) {
  const parts = (base && base.path ? [base.path] : []).concat(segs).join('/');
  return new CollectionReference(parts);
}
export function doc(base, ...segs) {
  if (base instanceof CollectionReference) return new DocumentReference(base.path + '/' + (segs[0] || novoId()));
  if (base instanceof DocumentReference) return new DocumentReference([base.path].concat(segs).join('/'));
  return new DocumentReference(segs.join('/'));
}

/* ---------- consultas ---------- */
export function where(campo, op, valor) { return { tipo: 'where', campo, op, valor }; }
export function orderBy(campo, dir = 'asc') { return { tipo: 'orderBy', campo, dir }; }
export function limit(n) { return { tipo: 'limit', n }; }
export function query(col, ...regras) { return { type: 'query', col, path: col.path, regras: [...(col.regras || []), ...regras.filter(Boolean)] }; }

const comparavel = (v) => (v instanceof Timestamp ? v.toMillis() : (v && typeof v.__ts === 'number') ? v.__ts : v);
function passa(dado, r) {
  const a = comparavel(dado[r.campo]); const b = comparavel(r.valor);
  switch (r.op) {
    case '==': return a === b;
    case '!=': return a !== b;
    case '>': return a > b;
    case '>=': return a >= b;
    case '<': return a < b;
    case '<=': return a <= b;
    case 'in': return Array.isArray(b) && b.includes(a);
    case 'array-contains': return Array.isArray(dado[r.campo]) && dado[r.campo].includes(r.valor);
    default: return true;
  }
}

class DocumentSnapshot {
  constructor(ref, bruto) { this.ref = ref; this.id = ref.id; this._d = bruto; this.metadata = { hasPendingWrites: false, fromCache: false }; }
  exists() { return this._d !== undefined; }
  data() { return this._d === undefined ? undefined : reviver(JSON.parse(JSON.stringify(this._d))); }
  get(campo) { const d = this.data(); return d ? d[campo] : undefined; }
}
class QuerySnapshot {
  constructor(docs) { this.docs = docs; this.size = docs.length; this.empty = docs.length === 0; }
  forEach(fn) { this.docs.forEach(fn); }
  docChanges() { return this.docs.map((d) => ({ type: 'added', doc: d })); }
}

function executar(alvo) {
  const path = alvo.path;
  const regras = alvo.regras || [];
  const col = colecaoDe(path);
  let docs = Object.keys(col).map((id) => new DocumentSnapshot(new DocumentReference(path + '/' + id), col[id]));
  regras.filter((r) => r.tipo === 'where').forEach((r) => { docs = docs.filter((d) => passa(col[d.id], r)); });
  regras.filter((r) => r.tipo === 'orderBy').reverse().forEach((r) => {
    docs.sort((x, y) => {
      const a = comparavel(col[x.id][r.campo]); const b = comparavel(col[y.id][r.campo]);
      const c = a == null ? -1 : b == null ? 1 : a < b ? -1 : a > b ? 1 : 0;
      return r.dir === 'desc' ? -c : c;
    });
  });
  const lim = regras.find((r) => r.tipo === 'limit');
  if (lim) docs = docs.slice(0, lim.n);
  return new QuerySnapshot(docs);
}

/* ---------- escrita ---------- */
function resolver(v) {
  if (v === SENTINELA_TS) return { __ts: Date.now() };
  if (v instanceof Timestamp || v instanceof Date) return plano(v);
  if (Array.isArray(v)) return v.map(resolver);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) { if (v[k] !== SENTINELA_DEL && v[k] !== undefined) o[k] = resolver(v[k]); } return o; }
  return v;
}
function gravar(ref, dados, merge) {
  const col = colecaoDe(ref.colPath);
  const atual = merge && col[ref.id] ? col[ref.id] : {};
  const novo = { ...atual };
  for (const k in dados) {
    if (dados[k] === SENTINELA_DEL) delete novo[k];
    else if (dados[k] !== undefined) novo[k] = resolver(dados[k]);
  }
  col[ref.id] = novo;
}
function apagar(ref) { const col = colecaoDe(ref.colPath); delete col[ref.id]; }

/* ---------- ouvintes ---------- */
const ouvintes = new Set();
function avisar() {
  salvar();
  setTimeout(() => ouvintes.forEach((o) => { try { o.disparar(); } catch (e) { console.error(e); } }), 0);
}

export async function getDoc(ref) { const col = colecaoDe(ref.colPath); return new DocumentSnapshot(ref, col[ref.id]); }
export async function getDocs(alvo) { return executar(alvo); }
export async function getDocFromServer(ref) { return getDoc(ref); }
export async function getDocsFromServer(alvo) { return getDocs(alvo); }
export async function setDoc(ref, dados, opcoes) { gravar(ref, dados, !!(opcoes && opcoes.merge)); avisar(); }
export async function updateDoc(ref, dados) {
  const col = colecaoDe(ref.colPath);
  if (!col[ref.id]) throw Object.assign(new Error('Documento não encontrado (prévia).'), { code: 'not-found' });
  gravar(ref, dados, true); avisar();
}
export async function addDoc(colRef, dados) { const ref = doc(colRef); gravar(ref, dados, false); avisar(); return ref; }
export async function deleteDoc(ref) { apagar(ref); avisar(); }

export function writeBatch() {
  const ops = [];
  return {
    set(ref, d, o) { ops.push(() => gravar(ref, d, !!(o && o.merge))); return this; },
    update(ref, d) { ops.push(() => gravar(ref, d, true)); return this; },
    delete(ref) { ops.push(() => apagar(ref)); return this; },
    async commit() { ops.forEach((f) => f()); avisar(); }
  };
}
export async function runTransaction(db, fn) {
  const ops = [];
  const tx = {
    async get(ref) { return getDoc(ref); },
    set(ref, d, o) { ops.push(() => gravar(ref, d, !!(o && o.merge))); return tx; },
    update(ref, d) { ops.push(() => gravar(ref, d, true)); return tx; },
    delete(ref) { ops.push(() => apagar(ref)); return tx; }
  };
  const r = await fn(tx);
  ops.forEach((f) => f()); avisar();
  return r;
}

export function onSnapshot(alvo, ...args) {
  const opts = args[0] && typeof args[0] === 'object' && !args[0].next && typeof args[0] !== 'function' ? args.shift() : null;
  let next = args[0]; let erro = args[1];
  if (next && typeof next === 'object') { erro = next.error; next = next.next; }
  const o = {
    disparar() {
      if (!next) return;
      if (alvo instanceof DocumentReference) next(new DocumentSnapshot(alvo, colecaoDe(alvo.colPath)[alvo.id]));
      else next(executar(alvo));
    }
  };
  ouvintes.add(o);
  setTimeout(() => o.disparar(), 0);
  return () => ouvintes.delete(o);
}

export function enableIndexedDbPersistence() { return Promise.resolve(); }
export function connectFirestoreEmulator() {}
export function persistentLocalCache() { return {}; }
export function persistentMultipleTabManager() { return {}; }

/* Botão discreto para reiniciar os dados de demonstração */
window.kellyPreviaReiniciar = function () { try { sessionStorage.removeItem(CHAVE); } catch (e) {} location.reload(); };
