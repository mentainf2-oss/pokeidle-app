// PokeIdle App — a página do nosso app dentro do layout do Idleterino.
// Uma conta por vez (troca no topo): estado e controles grandes, os 4 números do dia e as abas Resumo, Decisões, Parecer, Farm e Ajustes.
// Os números vêm do app que roda dentro de cada conta (lido a cada 30 s pelo pkapp-main.js).
let pkEstado = null;
let pkTab = (() => { try { const t = localStorage.getItem('pkTab'); return ['hoje', 'parecer', 'decisoes', 'mercado', 'farm', 'controle', 'compras', 'casasA', 'lucro', 'bossA', 'analise', 'claude'].includes(t) ? t : 'hoje'; } catch { return 'hoje'; } })();
let pkFarm = null, pkFarmConta = null, pkFarmCarregando = false;
// ícones de traço (mesmo estilo da barra lateral)
const PK_ICO = {
  hoje: '<path d="M4 14a8 8 0 0 1 16 0"/><path d="M12 14l4.2-4.2"/><path d="M3 18h18"/>',
  parecer: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/>',
  decisoes: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  mercado: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
  compras: '<path d="M3 4h2l2.4 11h10.4l2.2-8H6.3"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/>',
  casasA: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  lucro: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  bossA: '<path d="M4 8l4.2 4L12 5.5 15.8 12 20 8l-2 10H6z"/><path d="M6 21h12"/>',
  analise: '<path d="M4 20h16"/><path d="M7 17v-6"/><path d="M12 17V6"/><path d="M17 17v-9"/>',
  claude: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  farm: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  controle: '<path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/>',
  compra: '<path d="M3 4h2l2.4 11h10.4l2.2-8H6.3"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/>',
  venda: '<path d="M12 3v18"/><path d="M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.7 5 3.2 5 1.3 5 3.3-2.2 3-5 3-5-1.1-5-3"/>',
  'preço': '<path d="M3 12l9-9h8v8l-9 9z"/><circle cx="16" cy="8" r="1.5"/>',
  casa: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  boss: '<path d="M4 8l4.2 4L12 5.5 15.8 12 20 8l-2 10H6z"/><path d="M6 21h12"/>',
  'negociação': '<path d="M4 5h16v10H9l-5 4z"/>',
  pulou: '<circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/>',
  hunt: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  pedido: '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  'evolução': '<path d="M12 20V9"/><path d="M7 13l5-5 5 5"/><path d="M5 4h14"/>',
  claude: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  auditoria: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  aprendizado: '<path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"/>',
  ajuste: '<path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/>',
  erro: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  base: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
};
function pkIco(k) { const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'pk-ico'); svg.innerHTML = PK_ICO[k] || ''; return svg; }
function pkBotao(ico, rot, cls, onclick) { const b = el('button', cls); b.append(pkIco(ico), el('span', null, rot)); b.onclick = onclick; return b; }
let pkRel = null, pkRelCarregando = false, pkDec = null, pkDecEm = 0, pkDecCat = '', pkDecConta = '';
const pkFmt = (n) => (n == null || !isFinite(n) ? '—' : Math.abs(n) >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.abs(n) >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n)));
const pkG = (n) => (n == null || !isFinite(n) ? '—' : `${Math.round(n).toLocaleString('pt-BR')} 🔮`);
const pkSG = (n) => (n == null || !isFinite(n) ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n)).toLocaleString('pt-BR')} 🔮`);
const pkCls = (n) => (n > 0 ? 'ok' : n < 0 ? 'bad' : '');
const pkDia = (d) => { const [a, m, dd] = String(d).split('-'); const sem = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][new Date(`${d}T12:00:00-03:00`).getDay()]; return `${sem}, ${dd}/${m}`; };
const pkHora = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const pkNomePapel = { tudo: 'Tudo', boss: 'Boss', casas: 'Casas', mercado: 'Mercado' };
const pkDicaPapel = { tudo: 'todos os módulos', boss: 'boss e tokens', casas: 'casas + sniper de pokémon', mercado: 'sniper de pokémon e itens' };
const pkMods = [['compras', 'Lista de compras'], ['sniperPk', 'Sniper de pokémon'], ['sniperIt', 'Sniper de itens'], ['casas', 'Casas'], ['boss', 'Boss'], ['hunt', 'Hunt automática'], ['claude', 'Claude']];
const pkCats = { compra: 'Compra', venda: 'Venda', 'preço': 'Preço', casa: 'Casa', boss: 'Boss', 'negociação': 'Negociação', pulou: 'Não comprou', hunt: 'Hunt', 'evolução': 'Evolução', pedido: 'Pedido', claude: 'Claude', auditoria: 'Auditoria', aprendizado: 'Aprendizado', ajuste: 'Ajuste', erro: 'Erro' };
window.idle.on('poke:pkapp:estado', (s) => { pkEstado = s; if (page === 'trader' && pkTab === 'hoje' && !document.querySelector('#page-trader select:focus, #page-trader input:focus')) renderTrader(); });

function pkKpi(rot, val, sub, cls) {
  const b = el('div', 'stat'); b.append(el('span', null, rot), el('b', cls || null, val)); if (sub) b.append(el('small', 'muted', sub)); return b;
}
function pkLinha(...cels) { const tr = el('tr'); for (const c of cels) { const td = el('td'); if (c instanceof Node) td.append(c); else td.textContent = c == null ? '—' : String(c); tr.append(td); } return tr; }
function pkTabela(cab, linhas) { const t = el('table', 'pk-tab'); const h = el('tr'); for (const c of cab) h.append(el('th', null, c)); t.append(h); for (const l of linhas) t.append(l); return t; }
function pkPill(txt, cls) { return el('span', 'pk-pill' + (cls ? ' ' + cls : ''), txt); }
function pkNome(c) { return (c.r && c.r.nick) || c.nome; }
function pkSwitch(on, rot, onchange, dica) {
  const l = el('label', 'pk-sw' + (on ? ' on' : '')); const i = el('input'); i.type = 'checkbox'; i.checked = !!on; i.onchange = () => onchange(i.checked);
  l.append(i, el('i'), el('span', null, rot)); if (dica) l.title = dica; return l;
}

const pkPedidos = {};
let pkConta = (() => { try { return localStorage.getItem('pkConta') || null; } catch { return null; } })();
const PK_ABAS = [['hoje', 'Resumo'], ['mercado', 'Mercado'], ['compras', 'Compras'], ['casasA', 'Casas'], ['lucro', 'Lucro'], ['bossA', 'Boss'], ['analise', 'Análise'], ['claude', 'Claude'], ['decisoes', 'Decisões'], ['parecer', 'Parecer'], ['farm', 'Farm'], ['controle', 'Ajustes']];
function pkIr(k) { pkTab = k; try { localStorage.setItem('pkTab', k); } catch {} if (k === 'parecer') pkRel = null; if (k === 'decisoes') pkDec = null; if (k === 'mercado') pkLivro = null; if (k === 'farm') pkFarm = null; renderTrader(); }

// Uma página só, de uma conta por vez: troca de conta no topo; embaixo, o estado, os números do dia e as abas.
async function renderTrader() {
  const root = $('#page-trader');
  if (!pkEstado) pkEstado = await window.idle.invoke('poke:pkapp:estado').catch(() => null);
  const rolagem = root.scrollTop;
  root.replaceChildren();
  root.classList.add('pk-pagina');
  const s = pkEstado;
  if (!s || !s.contas.length) { root.append(el('h1', null, 'PokeIdle App'), emptyBox('PokeIdle App', 'Adicione uma conta do PokeIdle na aba PokeIdle. O app entra sozinho em cada conta.')); return; }
  if (!pkConta || !s.contas.some((c) => c.id === pkConta)) pkConta = s.contas[0].id;
  const c = s.contas.find((x) => x.id === pkConta), r = c.r;
  pkFarmConta = c.id;

  // ---- topo: título + troca de conta ----
  const topo = el('div', 'pk-topo');
  topo.append(el('h1', null, 'PokeIdle App'));
  const trocar = el('div', 'pk-contas-sel');
  for (const x of s.contas) {
    const b = el('button', 'pk-conta-bt' + (x.id === c.id ? ' on' : ''));
    const ponto = el('i', 'pk-ponto ' + (!x.r ? 'off' : x.r.ligado ? (x.r.simulacao ? 'sim' : 'ok') : 'off'));
    b.append(ponto, el('span', null, pkNome(x)));
    if (x.r && x.r.hoje) b.append(el('small', pkCls(x.r.hoje.lucroG), pkSG(x.r.hoje.lucroG)));
    b.title = !x.r ? 'carregando' : `${x.r.ligado ? 'ligado' : 'parado'} · ${x.r.simulacao ? 'simulação' : 'modo real'}`;
    b.onclick = () => { pkConta = x.id; try { localStorage.setItem('pkConta', x.id); } catch {} pkFarm = null; pkRel = null; renderTrader(); };
    trocar.append(b);
  }
  topo.append(trocar);
  root.append(topo);

  if (!r) { root.append(emptyBox(pkNome(c), 'O app está entrando nesta conta. Se demorar, abra a conta na aba PokeIdle para ela logar.')); return; }
  const ctl = async (acao, valor, msg) => { pkEstado = await window.idle.invoke('poke:pkapp:controle', c.id, acao, valor); if (msg) toast(msg); renderTrader(); };

  // ---- cartão da conta: estado e os dois controles que importam ----
  const cab = el('div', 'card pk-cab');
  const id = el('div', 'pk-id');
  id.append(el('b', null, pkNome(c)), el('span', 'muted', `app ${r.versao || '?'} · papel ${pkNomePapel[c.papel] || 'Tudo'}${r.emBoss || r.bossAuto ? ' · no boss agora' : ''}`));
  const bts = el('div', 'pk-cab-bts');
  const bLig = el('button', 'pk-grande-bt ' + (r.ligado ? 'on' : 'off'));
  bLig.append(el('i', 'pk-ponto ' + (r.ligado ? 'ok' : 'off')), el('span', null, r.ligado ? 'Ligado' : 'Parado'), el('small', null, r.ligado ? 'clique para parar' : 'clique para ligar'));
  bLig.onclick = () => ctl('ligar', !r.ligado, `${pkNome(c)}: ${!r.ligado ? 'ligado' : 'parado'}`);
  const bModo = el('button', 'pk-grande-bt ' + (r.simulacao ? 'sim' : 'real'));
  bModo.append(el('span', null, r.simulacao ? 'Simulação' : 'Modo real'), el('small', null, r.simulacao ? 'não gasta nada' : 'compra e vende de verdade'));
  bModo.onclick = () => {
    if (r.simulacao && !confirm(`Modo real em ${pkNome(c)}: o app passa a comprar e vender de verdade, com os limites de Coins e Gemas da conta. Continuar?`)) return;
    ctl('simulacao', !r.simulacao, `${pkNome(c)}: ${r.simulacao ? 'modo real' : 'simulação'}`);
  };
  const bJogo = el('button', 'ghost'); bJogo.textContent = 'Abrir no jogo'; bJogo.onclick = async () => { await window.idle.invoke('poke:select', c.id).catch(() => {}); go('poke'); };
  bts.append(bLig, bModo, bJogo);
  cab.append(id, bts);
  root.append(cab);

  // ---- os números do dia: quatro, grandes ----
  const h = r.hoje || {};
  const kp = el('div', 'pk-kpis');
  const kpi = (rot, val, sub, cls) => { const b = el('div', 'pk-kpi'); b.append(el('span', null, rot), el('b', cls || null, val)); if (sub) b.append(el('small', null, sub)); return b; };
  kp.append(
    kpi('Lucro de hoje', pkSG(h.lucroG), `${h.revendas || 0} revendas${h.prejuizos ? ` · ${h.prejuizos} com prejuízo` : ''} · boss ${pkSG(h.partes && h.partes.boss)}`, pkCls(h.lucroG)),
    kpi('Gemas', pkG(r.gemas), `gastas hoje ${pkG(r.gemasHoje)} de ${pkG(r.limiteGemasDia)}`),
    kpi('Coins', pkFmt(r.coins), `gastos hoje ${pkFmt(r.gastoHoje)}`),
    kpi('Boss hoje', r.boss ? pkSG(r.boss.lucro) : '—', r.boss ? `${r.boss.lutas} lutas · ${Math.round(r.boss.porHora || 0)}/h · ${r.tokens ?? '—'} tokens` : `${r.tokens ?? '—'} tokens`, r.boss ? pkCls(r.boss.lucro) : ''),
  );
  root.append(kp);

  // ---- 💬 pedido rápido: uma decisão sua, em português, vira regra com prazo ----
  const chat = el('div', 'card pk-chat');
  const form = el('form', 'pk-chat-f');
  const inp = el('input'); inp.type = 'text'; inp.maxLength = 300; inp.placeholder = 'Peça algo para esta conta — ex.: "enquanto este boost de XP estiver ativo deixe na hunt, depois volte para o boss"';
  const env = el('button', 'primary'); env.type = 'submit'; env.textContent = 'Enviar';
  const resp = el('div', 'pk-chat-r');
  form.append(pkIco('negociação'), inp, env);
  form.onsubmit = async (e) => {
    e.preventDefault(); const t = inp.value.trim(); if (!t) return;
    env.disabled = true; resp.textContent = 'Entendendo o pedido…';
    const r = await window.idle.invoke('poke:pkapp:pedido', c.id, t).catch((er) => ({ ok: false, erro: String(er) }));
    env.disabled = false;
    if (r && r.ok) { inp.value = ''; pkPedidos[c.id] = null; resp.className = 'pk-chat-r ok'; resp.textContent = r.resposta; setTimeout(() => renderTrader(), 1200); }
    else { resp.className = 'pk-chat-r bad'; resp.textContent = (r && r.erro) || 'não deu certo'; }
  };
  chat.append(form, resp);
  if (!pkPedidos[c.id]) pkPedidos[c.id] = await window.idle.invoke('poke:pkapp:pedidos', c.id).catch(() => []);
  const ativos = (Array.isArray(pkPedidos[c.id]) ? pkPedidos[c.id] : []).filter((p) => p.estado === 'ativa');
  for (const p of ativos) {
    const l = el('div', 'pk-chat-l');
    const quando = p.cond && p.cond.tipo === 'ate' ? `até ${new Date(p.cond.ate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'sem prazo';
    l.append(el('span', 'pk-pill ok', 'ativo'), el('span', null, p.resposta || p.texto), el('small', 'muted', quando));
    l.append(button('Cancelar', 'ghost', async () => { pkPedidos[c.id] = await window.idle.invoke('poke:pkapp:cancelarPedido', c.id, p.id, false); renderTrader(); }));
    if (p.depois) l.append(button('Encerrar e já fazer o depois', 'ghost', async () => { pkPedidos[c.id] = await window.idle.invoke('poke:pkapp:cancelarPedido', c.id, p.id, true); renderTrader(); }));
    chat.append(l);
  }
  root.append(chat);

  // ---- abas ----
  const tabs = el('div', 'pvp-tabs pk-tabs');
  for (const [k, l] of PK_ABAS) tabs.append(pkBotao(k === 'controle' ? 'ajuste' : k, l, pkTab === k ? 'on' : '', () => pkIr(k)));
  root.append(tabs);
  if (pkTab === 'hoje') pkHoje(root, s, c);
  if (pkTab === 'parecer') await pkParecer(root, s, c);
  if (pkTab === 'decisoes') await pkDecisoes(root, s, c);
  if (pkTab === 'mercado') await pkMercado(root, s, c);
  if (pkTab === 'bossA') await pkRelBoss(root, c);
  if (PK_ESP[pkTab]) await pkEspelho(root, c, pkTab);
  if (pkTab === 'farm') await pkFarmTela(root, s);
  if (pkTab === 'controle') { await pkControle(root, s, c); const h = el('h2', 'section', 'Ajustes finos e log (o painel que ficava no jogo)'); root.append(h); await pkEspelho(root, c, 'avancado'); }
  root.scrollTop = rolagem;
}

// ---------- Resumo: vitrine, casas, alertas e o que o app acabou de fazer ----------
function pkHoje(root, s, c) {
  const r = c.r, h = r.hoje || {};
  const grade = el('div', 'pk-grade');
  // vitrine e casas
  const v = el('div', 'card');
  v.append(el('h2', 'section first', 'Vitrine e casas'));
  const vit = el('div', 'pk-linhas');
  const lin = (rot, val, cls) => { const d = el('div', 'pk-lin'); d.append(el('span', null, rot), el('b', cls || null, val)); return d; };
  vit.append(
    lin('Pokémon anunciados', `${r.vitrine.usadas} de 10`),
    lin('Esperando vaga', r.vitrine.fila ? `${r.vitrine.fila} na fila` : 'ninguém', r.vitrine.fila >= 8 ? 'bad' : ''),
    lin('Esperando casa (abaixo do Nv 500)', r.vitrine.filaCasa ? `${r.vitrine.filaCasa}` : 'ninguém'),
    lin('Parados há mais de 48 h', String(h.parados || 0), h.parados ? 'bad' : ''),
    lin('Vendas · compras hoje', `${h.vendas || 0} · ${h.compras || 0}`),
    lin('Giro do evento', r.giro ? 'ligado (vende mais rápido)' : 'desligado'),
  );
  v.append(vit);
  const cs = r.casasDet || [];
  if (cs.length) {
    v.append(el('h3', 'pk-sub', 'Casas'));
    const L = el('div', 'pk-linhas');
    for (const x of cs) L.append(lin(`Casa ${x.id}${x.pct ? ` · ${x.pct}%` : ''}`, x.nome ? `${x.shiny ? '✨ ' : ''}${x.nome} Nv ${x.nv ?? '?'}${x.alvo && x.bot ? ` → ${x.alvo}` : ''}${x.bot ? '' : ' (seu)'}` : 'vazia', x.nome ? '' : 'bad'));
    v.append(L);
  }
  grade.append(v);
  // alertas + agora
  const a = el('div', 'card');
  a.append(el('h2', 'section first', 'Agora'));
  if (r.auditoria && r.auditoria.length) { const al = el('div', 'pk-alertas'); for (const x of r.auditoria) al.append(el('p', 'tip bad', x)); a.append(al); }
  const imp = (r.decisoes || []).filter((d) => ['venda', 'compra', 'preço', 'boss', 'casa', 'erro', 'hunt', 'aprendizado', 'evolução'].includes(d.cat)).slice(0, 12);
  if (!imp.length) a.append(el('p', 'muted', 'Nada ainda.'));
  const lista = el('div', 'pk-feed');
  for (const d of imp) { const row = el('div', 'pk-feed-l'); const t = el('span', 'pk-cat'); t.dataset.cat = d.cat; t.append(pkIco(d.cat)); row.append(el('small', 'muted', pkHora(d.em)), t, el('span', d.cat === 'erro' ? 'bad' : null, d.msg)); lista.append(row); }
  a.append(lista);
  const ver = el('div', 'actions'); ver.append(button('Ver todas as decisões', 'ghost', () => pkIr('decisoes'))); a.append(ver);
  grade.append(a);
  root.append(grade);
  // último parecer
  if (r.parecer) {
    const p = r.parecer, card = el('div', 'card');
    const hh = el('div', 'pcard-head'); hh.append(el('b', null, `Parecer de ${pkDia(p.dia)}`), el('span', 'state ' + pkCls(p.lucroG), pkSG(p.lucroG))); card.append(hh);
    for (const l of (p.linhas || []).slice(0, 4)) card.append(el('p', 'pk-par-l', l));
    const act = el('div', 'actions'); act.append(button('Parecer completo', 'ghost', () => pkIr('parecer'))); card.append(act);
    root.append(card);
  }
  if (s.total.base && s.total.base.lider) root.append(el('p', 'tip pk-base', `Banco de dados único: ${Number(s.total.base.vendas).toLocaleString('pt-BR')} vendas guardadas, coletadas por ${s.total.base.lider} e repassadas às outras contas.`));
}

// ---------- Parecer: o fechamento de cada dia desta conta e o que o app aprendeu ----------
async function pkParecer(root, s, c) {
  if (pkRel && Date.now() - (pkRel.em || 0) > 5 * 60_000) pkRel = null;
  if (!pkRel && !pkRelCarregando) { pkRelCarregando = true; pkRel = await window.idle.invoke('poke:pkapp:relatorios').catch(() => []); pkRel.em = Date.now(); pkRelCarregando = false; }
  const x = (Array.isArray(pkRel) ? pkRel : []).find((y) => y.id === c.id);
  root.append(el('p', 'sub pk-intro', 'Perto da meia-noite (Brasília) a conta fecha o dia. Com o parecer, o app ajusta os próprios limites dentro de faixas seguras — nunca afrouxa além do que você configurou.'));
  if (!x) { root.append(emptyBox('Parecer', 'Carregando…')); return; }
  if (x.hoje) { const card = el('div', 'card'); const hh = el('div', 'pcard-head'); hh.append(el('b', null, 'Hoje até agora'), el('span', 'state ' + pkCls(x.hoje.lucroG), pkSG(x.hoje.lucroG))); card.append(hh); for (const l of x.hoje.linhas || []) card.append(el('p', 'pk-par-l', l)); root.append(card); }
  for (const rel of x.relatorios || []) {
    const card = el('div', 'card');
    const hh = el('div', 'pcard-head'); hh.append(el('b', null, `${pkDia(rel.dia)}${rel.atrasado ? ' (fechado depois)' : ''}`), el('span', 'state ' + pkCls(rel.lucroG), `${pkSG(rel.lucroG)}${rel.simulacao ? ' · simulação' : ''}`)); card.append(hh);
    for (const l of rel.linhas || []) card.append(el('p', 'pk-par-l', l));
    if (rel.ajustesAnteriores && rel.ajustesAnteriores.length) card.append(el('small', 'muted', `Vindo de ontem: ${rel.ajustesAnteriores.map((a) => `${a.rot} ${a.de} → ${a.para}`).join('; ')}`));
    root.append(card);
  }
  if (!(x.relatorios || []).length) root.append(emptyBox('Parecer', 'O primeiro parecer sai quando o app fechar o dia, perto da meia-noite.'));
  const ap = (x.aprendizado && x.aprendizado.hist) || [], ev = (x.aprendizado && x.aprendizado.itensEvitar) || [];
  if (ap.length || ev.length) {
    const card = el('div', 'card'); card.append(el('h2', 'section first', 'O que o app aprendeu'));
    if (ap.length) card.append(pkTabela(['Quando', 'Mudança', 'Por quê'], ap.map((a) => pkLinha(new Date(a.em).toLocaleDateString('pt-BR'), `${a.rot}: ${a.de} → ${a.para}`, a.porque))));
    if (ev.length) card.append(el('p', 'tip', `Itens fora do flip por prejuízo: ${ev.map((y) => `${y.nome} (até ${new Date(y.ate).toLocaleDateString('pt-BR')})`).join(' · ')}`));
    root.append(card);
  }
}

// ---------- Decisões desta conta, com filtro por tipo ----------
async function pkDecisoes(root, s, c) {
  if (!pkDec || Date.now() - pkDecEm > 60_000) { pkDec = await window.idle.invoke('poke:pkapp:decisoes', null).catch(() => []); pkDecEm = Date.now(); }
  const L = (pkDec || []).filter((d) => d.conta === pkNome(c));
  const card = el('div', 'card');
  const filtros = el('div', 'pk-chips');
  const cont = {}; for (const d of L) cont[d.cat] = (cont[d.cat] || 0) + 1;
  const chip = (k, rot, n) => { const b = pkBotao(k || 'decisoes', `${rot}${n != null ? ` · ${n}` : ''}`, 'pk-chip' + (pkDecCat === k ? ' on' : ''), () => { pkDecCat = k; renderTrader(); }); b.dataset.cat = k; return b; };
  filtros.append(chip('', 'Todas', L.length));
  for (const [k, rot] of Object.entries(pkCats)) if (cont[k]) filtros.append(chip(k, rot, cont[k]));
  const top = el('div', 'pk-barra'); top.append(filtros, button('Atualizar', 'ghost', () => { pkDec = null; renderTrader(); }));
  card.append(top);
  const F = L.filter((d) => !pkDecCat || d.cat === pkDecCat).slice(0, 250);
  card.append(F.length ? pkTabela(['Quando', 'Tipo', 'Decisão e motivo'], F.map((d) => {
    const msg = el('span', d.cat === 'erro' ? 'bad' : null, d.msg + (d.sim ? '  (simulação)' : ''));
    const tipo = el('span', 'pk-cat'); tipo.dataset.cat = d.cat; tipo.append(pkIco(d.cat), el('span', null, pkCats[d.cat] || d.cat));
    return pkLinha(`${new Date(d.em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${pkHora(d.em)}`, tipo, msg);
  })) : el('p', 'tip', 'Nada nesse filtro ainda. O catálogo guarda 4 dias de decisões.'));
  root.append(card);
}

// ---------- 📗 Mercado: livro de compras e vendas de pokémon desta conta ----------
let pkLivro = null, pkLivroEm = 0, pkLivroFiltro = 'vendidos';
const pkM = (v, moeda) => (v == null || !isFinite(v) ? '—' : moeda === 'orb' ? pkG(v) : pkFmt(v));
const pkQuando = (ms) => ms ? `${new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${pkHora(ms)}` : '—';
const pkDur = (ms) => { const h = ms / 3600_000; return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${h.toFixed(h < 10 ? 1 : 0)} h` : `${Math.round(h / 24)} d`; };
async function pkMercado(root, s, c) {
  if (!pkLivro || Date.now() - pkLivroEm > 60_000) { pkLivro = await window.idle.invoke('poke:pkapp:livro', null).catch(() => []); pkLivroEm = Date.now(); }
  const L = (pkLivro || []).filter((x) => x.contaId === c.id || x.conta === pkNome(c));
  const vendidos = L.filter((x) => x.venda), abertos = L.filter((x) => !x.venda), prej = vendidos.filter((x) => x.lucro != null && x.lucro < 0);
  const soma = (arr, moeda, f) => arr.filter((x) => (x.venda ? x.venda.moeda : x.moeda) === moeda).reduce((t, x) => t + (f(x) || 0), 0);
  const kp = el('div', 'pk-kpis');
  const kpi = (rot, val, sub, cls) => { const b = el('div', 'pk-kpi'); b.append(el('span', null, rot), el('b', cls || null, val)); if (sub) b.append(el('small', null, sub)); return b; };
  const lG = soma(vendidos, 'orb', (x) => x.lucro), lC = soma(vendidos, 'gold', (x) => x.lucro);
  kp.append(
    kpi('Comprados', String(L.length), `${abertos.length} em estoque · ${vendidos.length} vendidos`),
    kpi('Lucro em Gemas', pkSG(lG), `${vendidos.filter((x) => x.venda.moeda === 'orb').length} vendas em Gemas`, pkCls(lG)),
    kpi('Lucro em Coins', `${lC > 0 ? '+' : lC < 0 ? '−' : ''}${pkFmt(Math.abs(lC))}`, `${vendidos.filter((x) => x.venda.moeda === 'gold').length} vendas em Coins`, pkCls(lC)),
    kpi('Vendas com prejuízo', String(prej.length), prej.length ? 'veja no filtro Prejuízo' : 'nenhuma — a trava do livro segura o preço', prej.length ? 'bad' : 'ok'),
  );
  root.append(kp);
  const origem = { sniper: 'sniper (revenda)', casa: 'comprado para a casa', 'histórico': 'histórico do jogo', app: 'app' };
  const nomeDe = (x) => { const n = el('span'); n.append(el('b', null, `${x.shiny ? '✨ ' : ''}${x.nome}`), el('small', 'muted', `  ${origem[x.origem] || x.origem || ''}`)); return n; };
  const quandoV = (v, moeda, ms) => { const sp = el('span'); sp.append(el('b', null, pkM(v, moeda)), el('small', 'muted', `  ${pkQuando(ms)}`)); return sp; };
  // ---- esperando venda ----
  const c1 = el('div', 'card');
  const t1 = el('div', 'pk-barra'); t1.append(el('h2', 'section first', `Esperando venda · ${abertos.length}`));
  const bts = el('div', 'actions'); bts.style.gap = '8px';
  bts.append(button('Buscar preço de compra no histórico do jogo', 'ghost', async (ev) => { const bt = ev.currentTarget; bt.disabled = true; bt.textContent = 'Lendo o histórico…'; const n = await window.idle.invoke('poke:pkapp:livroColecao', c.id).catch(() => null); toast(n == null ? 'Não consegui ler agora.' : n ? `${n} pokémon ganharam o preço de compra.` : 'Nenhum pokémon novo achado no histórico.'); pkLivro = null; renderTrader(); }),
    button('Atualizar', 'ghost', () => { pkLivro = null; renderTrader(); }));
  t1.append(bts); c1.append(t1);
  c1.append(abertos.length ? pkTabela(['Pokémon', 'Comprado por', 'Nv na compra', 'Onde está', 'Desde a compra'], abertos.slice(0, 400).map((x) => pkLinha(nomeDe(x), quandoV(x.custo, x.moeda, x.em), x.nv ?? '—', x.onde ? pkPill(x.onde, x.onde === 'vitrine' ? 'ok' : x.onde === 'casa' ? 'info' : '') : '—', pkDur(Date.now() - x.em))))
    : el('p', 'tip', 'Nenhum pokémon comprado esperando venda.'));
  root.append(c1);
  // ---- vendidos ----
  const c2 = el('div', 'card');
  const chips = el('div', 'pk-chips');
  const chip = (k, rot, n) => pkBotao(k === 'vendidos' ? 'venda' : 'pulou', `${rot} · ${n}`, 'pk-chip' + ((pkLivroFiltro === 'prejuizo') === (k === 'prejuizo') ? ' on' : ''), () => { pkLivroFiltro = k; renderTrader(); });
  chips.append(chip('vendidos', 'Todos', vendidos.length), chip('prejuizo', 'Com prejuízo', prej.length));
  const t2 = el('div', 'pk-barra'); t2.append(el('h2', 'section first', `Vendidos · ${vendidos.length}`), chips); c2.append(t2);
  const F = (pkLivroFiltro === 'prejuizo' ? prej : vendidos).slice().sort((a, z) => z.venda.em - a.venda.em).slice(0, 400);
  c2.append(F.length ? pkTabela(['Pokémon', 'Compra', 'Nv compra', 'Venda', 'Nv venda', 'Recebido', 'Lucro', 'Tempo'], F.map((x) => {
    const v = x.venda;
    const lucro = x.lucro != null ? el('b', pkCls(x.lucro), `${x.lucro > 0 ? '+' : x.lucro < 0 ? '−' : ''}${pkM(Math.abs(x.lucro), v.moeda)}${x.moeda !== v.moeda ? ' *' : ''}`) : '—';
    return pkLinha(nomeDe(x), quandoV(x.custo, x.moeda, x.em), x.nv ?? '—', v.bruto == null ? el('span', 'muted', `conferindo no histórico… ${pkQuando(v.em)}`) : quandoV(v.bruto, v.moeda, v.em), v.nv ?? '—', v.recebe == null ? '—' : pkM(v.recebe, v.moeda) + (v.conf ? ' ✓' : ' ·'), lucro, pkDur(v.em - x.em));
  })) : el('p', 'tip', 'Nada vendido ainda.'));
  c2.append(el('p', 'tip', 'Recebido já sem a comissão de 15%. O preço da venda é conferido com o histórico do jogo (✓ = conferido, · = ainda não). * = comprado numa moeda e vendido na outra (lucro pelo câmbio do dia). Guardado na conta e num arquivo do PC (pkapp-livro); nenhum pokémon anotado é anunciado abaixo do custo + comissão.'));
  root.append(c2);
}

// ---------- 👑 Boss pelo histórico completo (tokens comprados, preço médio, drops vendidos, lucro) ----------
let pkRelTimer = null;
async function pkRelBoss(root, c) {
  const card = el('div', 'card');
  const topo = el('div', 'pk-barra'); topo.append(el('h2', 'section first', 'Boss pelo histórico completo da conta'));
  const corpo = el('div');
  const bt = button('Calcular agora (lê todo o histórico)', 'ghost', async () => { await window.idle.invoke('poke:pkapp:relBoss', c.id, true).catch(() => null); setTimeout(atualizar, 1500); });
  topo.append(bt); card.append(topo, corpo); root.append(card);
  const G = (v) => (v == null ? '—' : pkG(v)), C = (v) => (v == null ? '—' : pkFmt(v));
  async function atualizar() {
    const x = await window.idle.invoke('poke:pkapp:relBoss', c.id, false).catch(() => null);
    if (!document.body.contains(corpo)) { clearInterval(pkRelTimer); return; }
    corpo.replaceChildren();
    if (x && x.rodando) { const p = x.rodando; corpo.append(el('p', 'tip', `Lendo o histórico de ${p.fase === 'compras' ? 'compras' : 'vendas'}… página ${p.pagina || 0} (${p.linhas || 0} linhas${p.ate ? `, até ${pkQuando(p.ate)}` : ''}). Pode levar alguns minutos: o app respeita o limite de pedidos do jogo.`)); bt.disabled = true; return; }
    bt.disabled = false;
    const r = x && x.ultimo;
    if (!r) { corpo.append(el('p', 'tip', 'Ainda não calculado. Clique em "Calcular agora": o app lê todas as páginas do seu histórico de compras e vendas.')); return; }
    const t = r.tokens, D = r.desdeComeco;
    if (D) {
      const kd = el('div', 'pk-kpis');
      const kpi0 = (rot, val, sub, cls) => { const b = el('div', 'pk-kpi'); b.append(el('span', null, rot), el('b', cls || null, val)); if (sub) b.append(el('small', null, sub)); return b; };
      kd.append(
        kpi0('Desde o começo: lutas', pkFmt(D.lutas), `${pkFmt(D.vitorias)} vitórias · 1 token por luta`),
        kpi0('Drops (preço de agora)', G(D.valorDrops), D.drops.map((d) => `${d.qtd} ${d.nome}`).join(' · ')),
        kpi0('Tokens usados', G(D.custoTokens), `${pkFmt(D.lutas)} × ${D.precoToken} 🔮 (preço médio)`),
        kpi0('Lucro do boss desde o começo', `${D.lucro >= 0 ? '+' : '−'}${pkG(Math.abs(D.lucro))}`, D.porToken != null ? `${D.porToken} 🔮 por token` : '', pkCls(D.lucro)),
      );
      corpo.append(el('h3', 'section', 'Desde o começo (contador do app: cada luta e cada drop)'), kd, el('h3', 'section', `Pelo histórico do jogo${r.historicoCurto ? ' — o jogo só guarda os registros mais recentes' : ''}`));
    }
    const kp = el('div', 'pk-kpis');
    const kpi = (rot, val, sub, cls) => { const b = el('div', 'pk-kpi'); b.append(el('span', null, rot), el('b', cls || null, val)); if (sub) b.append(el('small', null, sub)); return b; };
    kp.append(
      kpi('Tokens comprados', pkFmt(t.total), `${pkFmt(t.compradosGemas)} em Gemas · ${pkFmt(t.compradosCoins)} em Coins`),
      kpi('Preço médio do token', `${t.medioEmGemas} 🔮`, `${t.medioGemas != null ? t.medioGemas + ' 🔮 (Gemas)' : ''}${t.medioCoins != null ? ' · ' + C(t.medioCoins) + ' (Coins)' : ''}`),
      kpi('Drops renderam', G(r.recebidoGemas + r.estoqueGemas), `${G(r.recebidoGemas)} vendidos + ${G(r.estoqueGemas)} em estoque`),
      kpi('Lucro do boss', `${r.lucroGemas >= 0 ? '+' : '−'}${pkG(Math.abs(r.lucroGemas))}`, `${r.lucroPorToken != null ? r.lucroPorToken + ' 🔮 por token · ' : ''}${pkFmt(t.usados)} tokens usados (${G(r.custoTokensUsadosGemas)})`, pkCls(r.lucroGemas)),
    );
    corpo.append(kp);
    corpo.append(pkTabela(['Drop', 'Vendidos', 'Recebido em Gemas', 'Recebido em Coins', 'Em estoque', 'Vale (preço de agora)'], r.drops.sort((a, z) => (z.orb.liquido + z.gold.liquido / (r.cambio || 1e9)) - (a.orb.liquido + a.gold.liquido / (r.cambio || 1e9))).map((d) =>
      pkLinha(el('b', null, d.nome), pkFmt(d.qtd), d.orb.liquido ? G(d.orb.liquido) : '—', d.gold.liquido ? C(d.gold.liquido) : '—', pkFmt(d.estoque || 0), d.estoqueValor ? G(d.estoqueValor) : '—'))));
    corpo.append(el('p', 'tip', `Histórico do jogo desde ${pkQuando(r.desde)}${r.historicoCurto ? ' (é o que o jogo guarda)' : ''} · calculado ${pkQuando(r.em)}. Recebido já sem a comissão de 15%; Coins convertidos pelo câmbio de ${r.cambio ? pkFmt(Math.round(r.cambio)) : '?'} por Gema. Tokens usados = comprados − revendidos − ${pkFmt(t.noInventario)} no inventário; o custo deles vai pelo preço médio. Drops que você tirou antes do primeiro token comprado também entram.`));
  }
  await atualizar();
  clearInterval(pkRelTimer); pkRelTimer = setInterval(atualizar, 4000);
}

// ---------- 🪞 Abas do painel antigo (Compras, Casas, Lucro, Boss, Análise, Claude, e Config/Início em Ajustes) ----------
// O painel antigo saiu do jogo: cada aba aqui mostra a mesma tela dele, lida da conta, e cada clique ou campo mudado volta para a
// conta e vale de verdade. Confirmações (ex.: sair da simulação, ativar Gemas) aparecem aqui antes de valer.
const PK_ESP = {
  compras: [['compras', 'Lista de compras'], ['sniperPk', 'Sniper pokémon'], ['sniperIt', 'Sniper itens']],
  casasA: [['casas', 'Casas']], lucro: [['opPk', 'Pokémon'], ['opIt', 'Itens']], bossA: [['boss', 'Boss'], ['prey', 'Prey']],
  analise: [['analise', 'Mercado'], ['estudo', 'Estudo'], ['avaliar', 'Avaliar'], ['investir', 'Investir']], claude: [['claude', 'Claude']],
  avancado: [['config', 'Config'], ['inicio', 'Início e log']],
};
const pkEspSub = (() => { try { return JSON.parse(localStorage.getItem('pkEspSub') || '{}'); } catch { return {}; } })();
let pkEspCss = null, pkEspTimer = null;
function pkEspLimpo(html) {   // o HTML vem da nossa conta, mas nada de script nem atributos on*
  const d = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  d.querySelectorAll('script,iframe,object,embed,link,meta').forEach((x) => x.remove());
  d.querySelectorAll('*').forEach((x) => { for (const a of [...x.attributes]) if (/^on/i.test(a.name) || (/^(href|src|xlink:href)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) x.removeAttribute(a.name); });
  return d.body.firstChild;
}
function pkConfirmar(msg) {
  return new Promise((ok) => {
    const fundo = el('div', 'pk-modal'); const cx = el('div', 'card');
    cx.append(el('p', null, msg)); const bts = el('div', 'actions');
    bts.append(button('Cancelar', 'ghost', () => { fundo.remove(); ok(false); }), button('Confirmar', null, () => { fundo.remove(); ok(true); }));
    cx.append(bts); fundo.append(cx); document.body.append(fundo);
  });
}
async function pkEspelho(root, c, grupo) {
  const subs = PK_ESP[grupo], sub = subs.some(([k]) => k === pkEspSub[grupo]) ? pkEspSub[grupo] : subs[0][0];
  if (!pkEspCss) { const css = await window.idle.invoke('poke:pkapp:espelhoCss', c.id).catch(() => null); if (css) { pkEspCss = el('style'); pkEspCss.textContent = String(css).replace(/#pka\{[^}]*\}/, '').replace(/#pka/g, '.pk-esp') + '\n.pk-esp{--bg:#11141a;--sf:#171b23;--sf2:#1e232d;--sf3:#262c38;--bd:#2c3340;--tx:#e8ecf3;--mu:#9aa4b5;--ac:#f39ac7;--vd:#7fd6a0;--vm:#ff9494;--am:#ffd27a;--az:#8ec9ff;color:var(--tx);font-size:13px}'; document.head.append(pkEspCss); } }
  const card = el('div', 'card');
  if (subs.length > 1) { const ch = el('div', 'pk-chips'); for (const [k, rot] of subs) { const b = el('button', 'pk-chip' + (k === sub ? ' on' : ''), rot); b.onclick = () => { pkEspSub[grupo] = k; try { localStorage.setItem('pkEspSub', JSON.stringify(pkEspSub)); } catch {} renderTrader(); }; ch.append(b); } card.append(ch); }
  const corpo = el('div', 'pk-esp'); card.append(corpo); root.append(card);
  const pintarEsp = (r) => {
    if (!r || r.html == null) { corpo.replaceChildren(el('p', 'tip', 'A conta ainda não carregou o app. Abra o jogo dela um instante.')); return; }
    corpo.replaceChildren(pkEspLimpo(r.html));
    for (const m of r.avisos || []) toast(m);
  };
  const evento = async (pkx, tipo, valor, confirmado) => {
    let r = await window.idle.invoke('poke:pkapp:espelhoEvento', c.id, sub, pkx, tipo, valor, confirmado).catch(() => null);
    if (r && r.confirmar && !confirmado) { if (await pkConfirmar(r.confirmar)) r = await window.idle.invoke('poke:pkapp:espelhoEvento', c.id, sub, pkx, tipo, valor, true).catch(() => null); }
    if (r && r.aba && r.aba !== sub) { const g = Object.keys(PK_ESP).find((k) => PK_ESP[k].some(([x]) => x === r.aba)); if (g) { pkEspSub[g] = r.aba; if (g !== 'avancado' && g !== pkTab) { pkIr(g); return; } } }
    pintarEsp(r);
  };
  corpo.addEventListener('click', (ev) => {
    const alvo = ev.target.closest('[data-pkx]'); if (!alvo || !corpo.contains(alvo)) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(alvo.tagName) && !/^(checkbox|radio|button|submit)$/.test(alvo.type)) return;
    if (/^(checkbox|radio)$/.test(alvo.type)) return;     // vai pelo change
    ev.preventDefault(); evento(alvo.dataset.pkx, 'clique');
  });
  corpo.addEventListener('change', (ev) => {
    const alvo = ev.target.closest('[data-pkx]'); if (!alvo) return;
    evento(alvo.dataset.pkx, 'valor', /^(checkbox|radio)$/.test(alvo.type) ? alvo.checked : alvo.value);
  });
  corpo.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.matches('input[data-pkx]')) { ev.target.blur(); } });
  pintarEsp(await window.idle.invoke('poke:pkapp:espelho', c.id, sub).catch(() => null));
  // atualiza sozinho a cada 5 s enquanto ninguém está digitando
  clearInterval(pkEspTimer);
  pkEspTimer = setInterval(async () => {
    if (!document.body.contains(corpo)) { clearInterval(pkEspTimer); return; }
    if (corpo.contains(document.activeElement) && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    const r = await window.idle.invoke('poke:pkapp:espelho', c.id, sub).catch(() => null); if (r && document.body.contains(corpo)) pintarEsp(r);
  }, 5000);
}

// ---------- Ajustes desta conta (módulos, papel, copiar) e do app ----------
async function pkControle(root, s, c) {
  const r = c.r;
  const ctl = async (acao, valor, msg) => { pkEstado = await window.idle.invoke('poke:pkapp:controle', c.id, acao, valor); if (msg) toast(msg); renderTrader(); };
  const card = el('div', 'card');
  card.append(el('h2', 'section first', `O que a ${pkNome(c)} faz`));
  const mods = el('div', 'pk-mods');
  for (const [k, rot] of pkMods) mods.append(pkSwitch(r.mod && r.mod[k], rot, (on) => ctl('mod', { k, on }, `${rot}: ${on ? 'ligado' : 'desligado'}`)));
  card.append(mods);
  const sel = el('select'); for (const p of s.papeis) { const o = el('option', null, `${pkNomePapel[p]} — ${pkDicaPapel[p]}`); o.value = p; sel.append(o); }
  sel.value = c.papel || 'tudo';
  sel.onchange = async () => { pkEstado = await window.idle.invoke('poke:pkapp:papel', c.id, sel.value); toast(`Papel: ${pkNomePapel[sel.value]}`); renderTrader(); };
  const lin = el('div', 'actions'); lin.append(el('span', 'muted', 'Papel da conta'), sel); card.append(lin);
  const sug = s.sugestao.papeis[c.id];
  if (sug && sug !== c.papel) { const t = el('p', 'tip'); t.append(`Sugerido: ${pkNomePapel[sug]} — ${s.sugestao.porque[c.id] || ''} `); const b = button('Usar', 'ghost', async () => { pkEstado = await window.idle.invoke('poke:pkapp:papel', c.id, sug); renderTrader(); }); t.append(b); card.append(t); }
  const outras = s.contas.filter((o) => o.id !== c.id && o.r);
  if (outras.length) {
    const so = el('select'); for (const o of outras) { const op = el('option', null, pkNome(o)); op.value = o.id; so.append(op); }
    const cp = el('div', 'actions');
    cp.append(el('span', 'muted', 'Copiar ajustes de'), so, button('Copiar', 'ghost', async () => {
      const de = s.contas.find((o) => o.id === so.value);
      if (!confirm(`Copiar os ajustes de ${pkNome(de)} para ${pkNome(c)}? Casas, papel e boss continuam os desta conta, e ela fica em simulação até você ligar o modo real.`)) return;
      const rr = await window.idle.invoke('poke:pkapp:copiarAjustes', so.value, c.id);
      toast(rr && rr.ok ? `Ajustes copiados (em simulação)` : `Não copiou: ${(rr && rr.erro) || 'erro'}`);
      pkEstado = await window.idle.invoke('poke:pkapp:estado'); renderTrader();
    }));
    card.append(cp);
  }
  root.append(card);

  const app = el('div', 'card');
  app.append(el('h2', 'section first', 'App (todas as contas)'));
  const op = el('div', 'pk-mods');
  op.append(
    pkSwitch(s.avisos, 'Avisos de vendas, drops raros e parecer do dia', async (on) => { pkEstado = await window.idle.invoke('poke:pkapp:avisos', on); renderTrader(); }, 'PC, celular (ntfy) e Discord — canais em Ajustes → Avisos.'),
  );
  app.append(op);
  app.append(el('p', 'sub', 'Atualização automática: confere a cada 15 min e instala quando o PC fica 2 min sem uso; depois de reiniciar, cada conta volta ligada como estava.'));
  const det = el('details', 'pk-det'); det.append(el('summary', null, 'Avançado: token do GitHub e o que o app já viu no jogo'));
  const inp = el('input'); inp.type = 'password'; inp.placeholder = s.temToken ? 'token salvo — cole outro para trocar' : 'github_pat_… (só se o repositório for privado)'; inp.style.width = '360px';
  const act = el('div', 'actions'); act.append(inp, button('Salvar token', 'ghost', async () => { pkEstado = await window.idle.invoke('poke:pkapp:token', inp.value); inp.value = ''; toast('Token salvo.'); renderTrader(); }));
  det.append(act);
  const ex = await window.idle.invoke('poke:pkapp:explorador').catch(() => []);
  const saida = new Map(); for (const x of (Array.isArray(ex) ? ex : [])) for (const y of x.saida || []) { const z = saida.get(y.t); if (!z || y.ult > z.ult) saida.set(y.t, { ...y, n: (z ? z.n : 0) + y.n }); }
  const LL = [...saida.values()].sort((a2, z) => z.ult - a2.ult).slice(0, 40);
  if (LL.length) det.append(pkTabela(['Ação do jogo', 'Vezes', 'Última', 'Exemplo'], LL.map((y) => pkLinha(y.t, String(y.n), new Date(y.ult).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), el('code', 'pk-ex', y.ex || '')))));
  app.append(det);
  app.append(el('p', 'tip', 'Baseado no Idleterino, de VinniiSaantos (licença MIT).'));
  root.append(app);
}

// ---------- Farm: os melhores pokémon para as hunts de cada conta (tipos + Z-Move, AoE, ×4) ----------
const pkTipoPt = (t) => (typeof TIPO_PT !== 'undefined' && TIPO_PT[t]) || t;
function pkTipo(t) { if (typeof tipoChip === 'function') return tipoChip(t); return el('span', 'tchip', t); }
function pkMult(m) { const e = el('b', 'pk-mult ' + (m >= 4.5 ? 'x4' : m >= 2.2 ? 'x2' : m >= 1 ? 'x1' : 'x0'), `×${(m >= 4.5 ? 4 : m >= 2.2 ? 2 : m >= 1 ? 1 : 0.5).toString().replace('.', ',')}`); e.title = `na hunt ×${m.toFixed(1).replace('.', ',')}`; return e; }
async function pkFarmTela(root, s) {
  const contas = s.contas.filter((c) => c.r);
  if (!contas.length) { root.append(emptyBox('Farm', 'Nenhuma conta logada.')); return; }
  if (!pkFarmConta || !contas.some((c) => c.id === pkFarmConta)) pkFarmConta = contas[0].id;
  const barra = el('div', 'pk-barra'); barra.append(el('span', 'muted', 'Pokémon, hunts e investimentos desta conta'), button('Atualizar', 'ghost', () => { pkFarm = null; renderTrader(); }));
  root.append(barra);
  if (!pkFarm && !pkFarmCarregando) { pkFarmCarregando = true; pkFarm = await window.idle.invoke('poke:pve', pkFarmConta, 'farm', null).catch(() => null); pkFarmCarregando = false; }
  const F = pkFarm;
  if (!F || !F.pronto) { root.append(emptyBox('Farm', 'A conta ainda não carregou as hunts e a tabela de tipos. Abra o jogo dela um instante e clique em Atualizar.')); return; }
  const nomeConta = pkNome(contas.find((c) => c.id === pkFarmConta));
  // resumo em uma linha
  const em4 = F.meus.filter((m) => m.x4 >= Math.ceil(F.hunts.length / 2));
  const resumo = el('div', 'card pk-farm-top');
  resumo.append(el('span', 'pk-rot', `${nomeConta} · treinador Nv ${Number(F.L).toLocaleString('pt-BR')} · ${F.hunts.length} hunts do topo`),
    el('p', null, em4.length ? `${em4.length === 1 ? '1 pokémon seu dá' : em4.length + ' pokémon seus dão'} ×4 em metade ou mais dessas hunts. O melhor agora: ${F.meus[0].nome} (Nv ${F.meus[0].level}).`
      : 'Nenhum pokémon seu dá ×4 em metade dessas hunts. Veja abaixo o Z-Move que resolve e as espécies que valem comprar.'));
  root.append(resumo);
  // seus pokémon
  const c1 = el('div', 'card'); c1.append(el('h2', 'section first', 'Seus pokémon para estas hunts'));
  c1.append(pkTabela(['Pokémon', 'Tipos + Z', '×4 em', 'Média', 'Z-Move'], F.meus.map((m) => {
    const nome = el('div', 'pk-pk'); nome.append(el('b', null, m.nome), el('small', 'muted', ` Nv ${m.level}`));
    const tags = el('div', 'pk-tags');
    if (m.emCampo) tags.append(pkPill('em campo', 'ok')); if (m.shiny) tags.append(pkPill('shiny', 'real')); if (m.mega) tags.append(pkPill('mega', 'sim')); if (m.aoe) tags.append(pkPill('AoE', 'ok'));
    nome.append(tags);
    const tp = el('div', 'pk-tags'); for (const t of m.tipos) tp.append(pkTipo(t)); if (m.z) { tp.append(el('small', 'muted', ' Z ')); tp.append(pkTipo(m.z)); } else tp.append(el('small', 'muted', ' sem Z'));
    const x4 = el('span', m.x4 >= Math.ceil(F.hunts.length / 2) ? 'ok' : m.x4 ? '' : 'bad', `${m.x4}/${F.hunts.length}`);
    const zm = el('div', 'pk-tags');
    if (m.zMelhor) { zm.append(el('small', 'muted', m.z ? 'trocar para ' : 'fazer um de '), pkTipo(m.zMelhor.t), el('small', 'muted', ` (×4 em ${m.zMelhor.x4}/${F.hunts.length})`)); }
    else zm.append(el('small', 'muted', m.z ? 'o atual já é o melhor' : '—'));
    return pkLinha(nome, tp, x4, pkMult(m.media), zm);
  })));
  c1.append(el('p', 'tip', 'Só entram os que podem ir a campo: até o nível do treinador + 5 e pelo menos metade dele. ×4 = efetividade 4× no tipo do selvagem (×5,5 na hunt). Z-Move: sempre de um dos tipos do próprio pokémon (poder 2800, área 3×3, a cada 60 s) — não muda a cobertura, aumenta o dano e pega a onda; sai com 10 peças de boss. A ordem pesa o ataque, o AoE e o Z.'));
  root.append(c1);
  // por hunt
  const c2 = el('div', 'card'); c2.append(el('h2', 'section first', 'Hunt por hunt'));
  c2.append(pkTabela(['Hunt', 'Selvagens', 'Seu melhor', 'Tipos que dão ×4'], F.hunts.map((h) => {
    const nm = el('div'); nm.append(el('b', null, h.nome), el('small', 'muted', ` Nv ${Number(h.nivel).toLocaleString('pt-BR')} · ${h.regiao}`));
    const mb = el('div', 'pk-tags'); if (h.melhor) mb.append(el('span', null, `${h.melhor.nome} Nv ${h.melhor.level} `), pkMult(h.melhor.m)); else mb.append(el('small', 'muted', '—'));
    const tx = el('div', 'pk-tags'); for (const t of h.x4) tx.append(pkTipo(t)); if (!h.x4.length) tx.append(el('small', 'muted', 'nenhum tipo dá ×4 em todos'));
    return pkLinha(nm, h.especies.join(', '), mb, tx);
  })));
  root.append(c2);
  // investimentos que aceleram o farm desta conta (casas, 5ª casa, craft, sacrifício), pelo retorno em dias
  const cc = s.contas.find((c) => c.id === pkFarmConta), inv = (cc && cc.r && cc.r.investir) || [];
  if (inv.length) {
    const c4 = el('div', 'card'); c4.append(el('h2', 'section first', 'Investimentos que aceleram esta conta'));
    c4.append(pkTabela(['O quê', 'Custo', 'Ganho por hora', 'Se paga em'], inv.map((l) => {
      const o = el('div'); o.append(el('b', null, l.acao)); if (l.nota || l.moeda) o.append(el('small', 'muted', ` ${[l.nota, l.moeda].filter(Boolean).join(' · ')}`));
      const pb = el('span', l.payback != null && l.payback <= 7 ? 'ok' : '', l.payback != null ? `${String(l.payback).replace('.', ',')} dias` : '—');
      return pkLinha(o, pkFmt(l.custo), `+${pkFmt(l.ganhoH)}`, pb);
    })));
    c4.append(el('p', 'tip', 'Ganho medido pelo lucro das casas (XP Share) no ritmo atual da conta. Verde = se paga em até 7 dias. O app não compra isso sozinho: a decisão é sua.'));
    root.append(c4);
  }
  // bicicleta: quanto cada raridade renderia na melhor hunt desta conta
  const bk = await window.idle.invoke('poke:pve', pkFarmConta, 'bike', null).catch(() => null);
  if (bk && bk.pronto && bk.linhas && bk.linhas.length) {
    const nomeR = { comum: 'Comum', incomum: 'Incomum', rara: 'Rara', mitica: 'Mítica', lendaria: 'Lendária' };
    const atual = bk.linhas.find((l) => l.rar === bk.atual) || bk.linhas[0];
    const c5 = el('div', 'card'); c5.append(el('h2', 'section first', 'Bicicleta'));
    c5.append(pkTabela(['Bicicleta', 'Melhor hunt', 'Abates/h', 'XP/h', 'Ganho'], bk.linhas.map((l) => {
      const g = atual && atual.xpH ? l.xpH / atual.xpH - 1 : 0;
      const nm = el('span', l.rar === bk.atual ? 'ok' : null, `${l.rar ? nomeR[l.rar] || l.rar : 'Sem bicicleta'}${l.rar === bk.atual ? ' (a sua)' : ''}`);
      return pkLinha(nm, l.hunt || '—', Number(l.kph || 0).toLocaleString('pt-BR'), pkFmt(l.xpH), el('span', g > 0.005 ? 'ok' : g < -0.005 ? 'bad' : 'muted', g ? `${g > 0 ? '+' : ''}${Math.round(g * 100)}%` : '—'));
    })));
    c5.append(el('p', 'tip', 'A bicicleta só encurta a caminhada entre selvagens (o mesmo cálculo do Melhor hunt, com o seu pokémon em campo). Os fragmentos caem só no Outland; 5 de uma raridade viram 1 da seguinte até Rara. Compare o ganho com o preço no Mercado → Bicicletas.'));
    root.append(c5);
  }
  // comprar
  if (F.comprar && F.comprar.length) {
    const c3 = el('div', 'card'); c3.append(el('h2', 'section first', 'Espécies que valem comprar para estas hunts'));
    c3.append(pkTabela(['Espécie', 'Tipos · Z de', '×4 em', 'Status base'], F.comprar.map((x) => {
      const nm = el('div', 'pk-pk'); nm.append(el('b', null, x.nome)); if (x.mega) nm.append(pkPill('mega', 'sim'));
      const tp = el('div', 'pk-tags'); for (const t of x.tipos) tp.append(pkTipo(t)); tp.append(el('small', 'muted', ' Z ')); tp.append(pkTipo(x.z));
      return pkLinha(nm, tp, `${x.x4}/${F.hunts.length}`, String(x.bst));
    })));
    const act = el('div', 'actions'); act.append(button('Procurar no Market (aba PvE → Comprar para farm)', 'ghost', () => go('pve')));
    c3.append(el('p', 'tip', 'Na faixa de nível da conta, com AoE de preferência. Shiny e Mega rendem mais status no mesmo nível.'), act);
    root.append(c3);
  }
}
