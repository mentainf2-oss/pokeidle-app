// PokeIdle App — a página do nosso app dentro do layout do Idleterino.
// Uma conta por vez (troca no topo): estado e controles grandes, os 4 números do dia e as abas Resumo, Decisões, Parecer, Farm e Ajustes.
// Os números vêm do app que roda dentro de cada conta (lido a cada 30 s pelo pkapp-main.js).
let pkEstado = null;
let pkTab = (() => { try { const t = localStorage.getItem('pkTab'); return ['hoje', 'parecer', 'decisoes', 'farm', 'controle'].includes(t) ? t : 'hoje'; } catch { return 'hoje'; } })();
let pkFarm = null, pkFarmConta = null, pkFarmCarregando = false;
// ícones de traço (mesmo estilo da barra lateral)
const PK_ICO = {
  hoje: '<path d="M4 14a8 8 0 0 1 16 0"/><path d="M12 14l4.2-4.2"/><path d="M3 18h18"/>',
  parecer: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/>',
  decisoes: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
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
const PK_ABAS = [['hoje', 'Resumo'], ['decisoes', 'Decisões'], ['parecer', 'Parecer'], ['farm', 'Farm'], ['controle', 'Ajustes']];
function pkIr(k) { pkTab = k; try { localStorage.setItem('pkTab', k); } catch {} if (k === 'parecer') pkRel = null; if (k === 'decisoes') pkDec = null; if (k === 'farm') pkFarm = null; renderTrader(); }

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
  if (pkTab === 'farm') await pkFarmTela(root, s);
  if (pkTab === 'controle') await pkControle(root, s, c);
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
    pkSwitch(s.painelNoJogo, 'Mostrar o painel antigo dentro do jogo', async (on) => { pkEstado = await window.idle.invoke('poke:pkapp:painel', on); renderTrader(); }, 'O painel completo de antes, com os ajustes finos.'),
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
