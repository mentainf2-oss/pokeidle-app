// PokeIdle App — a página do nosso app dentro do layout do Idleterino.
// Quatro abas, poucos números e precisos: Hoje (o resultado do dia), Parecer (o fechamento de cada dia e o que o app aprendeu),
// Decisões (o catálogo de tudo o que o app fez, com o motivo) e Controle (ligar, modo, módulos, papel de cada conta).
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
const pkMods = [['compras', 'Lista de compras'], ['sniperPk', 'Sniper de pokémon'], ['sniperIt', 'Sniper de itens'], ['casas', 'Casas'], ['boss', 'Boss'], ['claude', 'Claude']];
const pkCats = { compra: 'Compra', venda: 'Venda', 'preço': 'Preço', casa: 'Casa', boss: 'Boss', 'negociação': 'Negociação', pulou: 'Não comprou', claude: 'Claude', auditoria: 'Auditoria', aprendizado: 'Aprendizado', ajuste: 'Ajuste', erro: 'Erro' };
window.idle.on('poke:pkapp:estado', (s) => { pkEstado = s; if (page === 'trader' && pkTab === 'hoje') renderTrader(); });

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

async function renderTrader() {
  const root = $('#page-trader');
  if (!pkEstado) pkEstado = await window.idle.invoke('poke:pkapp:estado').catch(() => null);
  const rolagem = root.scrollTop;
  root.replaceChildren();
  const head = el('header', 'page-head');
  const t = el('div');
  t.append(el('h1', null, 'PokeIdle App'), el('p', 'sub', 'O resultado do dia, o parecer de cada dia fechado, tudo o que o app decidiu e os controles de cada conta.'));
  head.append(t);
  const tabs = el('div', 'pvp-tabs');
  tabs.classList.add('pk-tabs');
  for (const [k, l] of [['hoje', 'Hoje'], ['parecer', 'Parecer'], ['decisoes', 'Decisões'], ['farm', 'Farm'], ['controle', 'Controle']]) {
    tabs.append(pkBotao(k, l, pkTab === k ? 'on' : '', () => { pkTab = k; try { localStorage.setItem('pkTab', k); } catch {} if (k === 'parecer') pkRel = null; if (k === 'decisoes') pkDec = null; if (k === 'farm') pkFarm = null; renderTrader(); }));
  }
  root.append(head, tabs);
  const s = pkEstado;
  if (!s || !s.contas.length) { root.append(emptyBox('PokeIdle App', 'Adicione uma conta do PokeIdle na aba PokeIdle. O app entra sozinho em cada conta.')); return; }
  if (pkTab === 'hoje') pkHoje(root, s);
  if (pkTab === 'parecer') await pkParecer(root, s);
  if (pkTab === 'decisoes') await pkDecisoes(root, s);
  if (pkTab === 'farm') await pkFarmTela(root, s);
  if (pkTab === 'controle') pkControle(root, s);
  root.scrollTop = rolagem;
}

// ---------- Hoje: um número que importa, três de apoio e uma linha por conta ----------
function pkHoje(root, s) {
  const h = s.total.hoje || {};
  const hero = el('div', 'card pk-hero');
  const esq = el('div');
  esq.append(el('span', 'pk-rot', 'Lucro realizado hoje · todas as contas'), el('b', 'pk-grande ' + pkCls(h.lucroG), pkSG(h.lucroG)),
    el('small', 'muted', 'revendas fechadas + itens vendidos + boss (drops vendidos e à venda − tokens). Estoque ainda não vendido não entra.'));
  const dir = el('div', 'pk-apoio');
  dir.append(
    pkKpi('Caixa do dia', pkSG(h.caixaG), 'vendido − comprado', pkCls(h.caixaG)),
    pkKpi('Vendas · compras', `${h.vendas || 0} · ${h.compras || 0}`, `${h.revendas || 0} revendas fechadas${h.prejuizos ? ` · ${h.prejuizos} com prejuízo` : ''}`),
    pkKpi('Boss hoje', pkSG(s.total.bossG), null, pkCls(s.total.bossG)),
    pkKpi('API do Claude', `US$ ${(h.apiUsd || 0).toFixed(2)}`, `${h.decisoes || 0} decisões · ${h.erros || 0} erros`),
  );
  hero.append(esq, dir);
  root.append(hero);
  if (s.total.base && s.total.base.lider) root.append(el('p', 'tip pk-base', `Banco de dados único: ${Number(s.total.base.vendas).toLocaleString('pt-BR')} vendas de pokémon e ${Number(s.total.base.itens).toLocaleString('pt-BR')} de itens (30 dias), coletadas por ${s.total.base.lider} e repassadas às outras contas — só ela baixa planilhas.`));

  const lista = el('div', 'card'); lista.append(el('h2', 'section first', 'Contas'));
  const t = el('table', 'pk-tab pk-contas');
  const cab = el('tr'); for (const c of ['Conta', 'Estado', 'Lucro hoje', 'Vitrine', 'Boss', 'Último aviso']) cab.append(el('th', null, c)); t.append(cab);
  for (const c of s.contas) {
    const r = c.r, tr = el('tr');
    const nome = el('td'); nome.append(el('b', null, pkNome(c)), el('small', 'muted', ` ${pkNomePapel[c.papel] || ''}`));
    const est = el('td');
    if (!r) est.append(pkPill('carregando', 'off'));
    else est.append(pkPill(r.ligado ? 'ligado' : 'parado', r.ligado ? 'ok' : 'off'), ' ', pkPill(r.simulacao ? 'simulação' : 'real', r.simulacao ? 'sim' : 'real'));
    const luc = el('td', 'num ' + pkCls(r && r.hoje && r.hoje.lucroG), r && r.hoje ? pkSG(r.hoje.lucroG) : '—');
    const vit = el('td', 'num', r ? `${r.vitrine.usadas}/10${r.vitrine.fila ? ` · fila ${r.vitrine.fila}` : ''}${r.hoje && r.hoje.parados ? ` · ${r.hoje.parados} parados` : ''}` : '—');
    const boss = el('td', 'num', r && r.boss ? `${pkSG(r.boss.lucro)} · ${r.boss.lutas} lutas` : '—');
    const imp = r && (r.decisoes || []).find((d) => ['venda', 'compra', 'erro', 'auditoria', 'aprendizado'].includes(d.cat));
    const ult = el('td', 'pk-msg'); if (imp) ult.append(el('small', 'muted', pkHora(imp.em) + ' '), el('span', imp.cat === 'erro' ? 'bad' : null, imp.msg)); else ult.textContent = '—';
    tr.append(nome, est, luc, vit, boss, ult); t.append(tr);
    if (r && r.auditoria && r.auditoria.length) { const a = el('tr', 'pk-alerta'); const td = el('td'); td.colSpan = 6; td.append(el('span', 'tip bad', '🔎 ' + r.auditoria.join(' · '))); a.append(td); t.append(a); }
  }
  lista.append(t);
  root.append(lista);

  // o último parecer, curto
  const ult = s.contas.map((c) => c.r && c.r.parecer && { conta: pkNome(c), ...c.r.parecer }).filter(Boolean).sort((a, z) => (a.dia < z.dia ? 1 : -1));
  if (ult.length) {
    const dia = ult[0].dia, doDia = ult.filter((x) => x.dia === dia);
    const card = el('div', 'card'); card.append(el('h2', 'section first', `Último parecer · ${pkDia(dia)}`));
    for (const p of doDia) { const b = el('div', 'pk-par'); b.append(el('b', null, `${p.conta} ${pkSG(p.lucroG)}`), el('p', null, (p.linhas || [])[0] || '')); if (p.ajustes && p.ajustes.length) b.append(el('small', 'muted', `Ajustes: ${p.ajustes.map((a) => `${a.rot} ${a.de} → ${a.para}`).join('; ')}`)); card.append(b); }
    const act = el('div', 'actions'); act.append(button('Ver o parecer completo', 'ghost', () => { pkTab = 'parecer'; pkRel = null; try { localStorage.setItem('pkTab', 'parecer'); } catch {} renderTrader(); }));
    card.append(act); root.append(card);
  }
}

// ---------- Parecer: o fechamento de cada dia (perto da meia-noite) e o dia de hoje até agora ----------
async function pkParecer(root, s) {
  if (pkRel && Date.now() - (pkRel.em || 0) > 5 * 60_000) pkRel = null;
  if (!pkRel && !pkRelCarregando) { pkRelCarregando = true; pkRel = await window.idle.invoke('poke:pkapp:relatorios').catch(() => []); pkRel.em = Date.now(); pkRelCarregando = false; }
  const R = pkRel || [];
  const intro = el('div', 'pk-barra');
  intro.append(el('p', 'sub', 'Perto da meia-noite (Brasília) cada conta fecha o dia. Com o parecer, o app ajusta os próprios limites dentro de faixas seguras — nunca afrouxa além do que você configurou.'),
    button('Atualizar', 'ghost', () => { pkRel = null; renderTrader(); }));
  root.append(intro);

  // hoje até agora, por conta
  const hoje = R.filter((x) => x.hoje);
  if (hoje.length) {
    const card = el('div', 'card'); card.append(el('h2', 'section first', 'Hoje até agora'));
    for (const x of hoje) { const b = el('div', 'pk-par'); b.append(el('b', null, `${x.nome} ${pkSG(x.hoje.lucroG)}`)); for (const l of x.hoje.linhas || []) b.append(el('p', null, l)); card.append(b); }
    root.append(card);
  }
  // dias fechados (todas as contas juntas por dia)
  const dias = {};
  for (const x of R) for (const r of x.relatorios || []) (dias[r.dia] ??= []).push({ conta: x.nome, ...r });
  const ordem = Object.keys(dias).sort().reverse();
  if (!ordem.length) { root.append(emptyBox('Parecer', 'O primeiro parecer sai quando o app fechar o dia (perto da meia-noite) ou, se houver histórico de ontem, alguns minutos depois de abrir.')); }
  for (const d of ordem) {
    const L = dias[d], tot = L.reduce((t, r) => t + (r.lucroG || 0), 0);
    const card = el('div', 'card');
    const h = el('div', 'pcard-head'); h.append(el('b', null, pkDia(d)), el('span', 'state ' + pkCls(tot), `${pkSG(tot)}${L.some((r) => r.simulacao) ? ' · simulação' : ''}`)); card.append(h);
    for (const r of L) {
      const b = el('div', 'pk-par');
      b.append(el('b', null, `${r.conta} ${pkSG(r.lucroG)}${r.atrasado ? ' (fechado depois)' : ''}`));
      for (const l of r.linhas || []) b.append(el('p', null, l));
      if (r.ajustesAnteriores && r.ajustesAnteriores.length) b.append(el('small', 'muted', `Vindo de ontem: ${r.ajustesAnteriores.map((a) => `${a.rot} ${a.de} → ${a.para}`).join('; ')}`));
      card.append(b);
    }
    root.append(card);
  }
  // o que o app aprendeu (vale para todas as contas)
  const ap = R.flatMap((x) => ((x.aprendizado && x.aprendizado.hist) || []).map((a) => ({ conta: x.nome, ...a }))).sort((a, z) => z.em - a.em).slice(0, 15);
  const ev = R.flatMap((x) => ((x.aprendizado && x.aprendizado.itensEvitar) || []).map((a) => ({ conta: x.nome, ...a })));
  if (ap.length || ev.length) {
    const card = el('div', 'card'); card.append(el('h2', 'section first', 'O que o app aprendeu'));
    if (ap.length) card.append(pkTabela(['Quando', 'Conta', 'Mudança', 'Por quê'], ap.map((a) => pkLinha(new Date(a.em).toLocaleDateString('pt-BR'), a.conta, `${a.rot}: ${a.de} → ${a.para}`, a.porque))));
    if (ev.length) card.append(el('p', 'tip', `Itens fora do flip por prejuízo: ${ev.map((x) => `${x.nome} (até ${new Date(x.ate).toLocaleDateString('pt-BR')})`).join(' · ')}`));
    root.append(card);
  }
}

// ---------- Decisões: o catálogo, com filtro por tipo e conta ----------
async function pkDecisoes(root, s) {
  if (!pkDec || Date.now() - pkDecEm > 60_000) { pkDec = await window.idle.invoke('poke:pkapp:decisoes', null).catch(() => []); pkDecEm = Date.now(); }
  const L = pkDec || [];
  const card = el('div', 'card');
  const filtros = el('div', 'pk-chips');
  const cont = {}; for (const d of L) cont[d.cat] = (cont[d.cat] || 0) + 1;
  const chip = (k, rot, n) => { const b = pkBotao(k || 'decisoes', `${rot}${n != null ? ` · ${n}` : ''}`, 'pk-chip' + (pkDecCat === k ? ' on' : ''), () => { pkDecCat = k; renderTrader(); }); b.dataset.cat = k; return b; };
  filtros.append(chip('', 'Todas', L.length));
  for (const [k, rot] of Object.entries(pkCats)) if (cont[k]) filtros.append(chip(k, rot, cont[k]));
  const contas = [...new Set(L.map((d) => d.conta))];
  const sel = el('select'); const o0 = el('option', null, 'Todas as contas'); o0.value = ''; sel.append(o0);
  for (const c of contas) { const o = el('option', null, c); o.value = c; sel.append(o); }
  sel.value = pkDecConta; sel.onchange = () => { pkDecConta = sel.value; renderTrader(); };
  const top = el('div', 'pk-barra');
  const dir = el('div', 'pk-chips'); dir.append(sel, button('Atualizar', 'ghost', () => { pkDec = null; renderTrader(); }));
  top.append(filtros, dir);
  card.append(top);
  const F = L.filter((d) => (!pkDecCat || d.cat === pkDecCat) && (!pkDecConta || d.conta === pkDecConta)).slice(0, 250);
  card.append(F.length ? pkTabela(['Quando', 'Conta', 'Tipo', 'Decisão e motivo'], F.map((d) => {
    const msg = el('span', d.cat === 'erro' ? 'bad' : null, d.msg + (d.sim ? '  (simulação)' : ''));
    const tipo = el('span', 'pk-cat'); tipo.dataset.cat = d.cat; tipo.append(pkIco(d.cat), el('span', null, pkCats[d.cat] || d.cat));
    return pkLinha(`${new Date(d.em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${pkHora(d.em)}`, d.conta, tipo, msg);
  })) : el('p', 'tip', 'Nada nesse filtro ainda. O catálogo guarda 4 dias de decisões de cada conta.'));
  root.append(card);
}

// ---------- Controle: ligar, modo, módulos e papel de cada conta ----------
function pkControle(root, s) {
  const grid = el('div', 'grid-2');
  for (const c of s.contas) {
    const r = c.r, card = el('div', 'card');
    const h = el('div', 'pcard-head'); h.append(el('b', null, pkNome(c)), el('span', 'state', r ? `app ${r.versao || '?'}` : 'carregando o app…')); card.append(h);
    if (!r) { card.append(el('p', 'tip', 'A conta precisa estar logada para o app entrar.')); grid.append(card); continue; }
    const ctl = async (acao, valor, msg) => { pkEstado = await window.idle.invoke('poke:pkapp:controle', c.id, acao, valor); if (msg) toast(msg); renderTrader(); };
    const linha1 = el('div', 'pk-ctl');
    linha1.append(
      pkSwitch(r.ligado, r.ligado ? 'Ligado' : 'Parado', (on) => ctl('ligar', on, `${pkNome(c)}: ${on ? 'ligado' : 'parado'}`)),
      pkSwitch(!r.simulacao, r.simulacao ? 'Simulação' : 'Modo real', (real) => {
        if (real && !confirm(`Modo real em ${pkNome(c)}: o app passa a comprar e vender de verdade, com os limites de Coins e Gemas da conta. Continuar?`)) return renderTrader();
        ctl('simulacao', !real, `${pkNome(c)}: ${real ? 'modo real' : 'simulação'}`);
      }, 'Simulação: só registra o que faria, sem gastar.'),
    );
    card.append(linha1);
    const mods = el('div', 'pk-mods');
    for (const [k, rot] of pkMods) mods.append(pkSwitch(r.mod && r.mod[k], rot, (on) => ctl('mod', { k, on })));
    card.append(mods);
    const sel = el('select'); for (const p of s.papeis) { const o = el('option', null, `${pkNomePapel[p]} — ${pkDicaPapel[p]}`); o.value = p; sel.append(o); }
    sel.value = c.papel || 'tudo';
    sel.onchange = async () => { pkEstado = await window.idle.invoke('poke:pkapp:papel', c.id, sel.value); toast(`Papel de ${pkNome(c)}: ${pkNomePapel[sel.value]}`); renderTrader(); };
    const sug = s.sugestao.papeis[c.id];
    const lin = el('div', 'actions'); lin.append(el('span', 'muted', 'Papel'), sel, button('Abrir no jogo', 'ghost', async () => { await window.idle.invoke('poke:select', c.id).catch(() => {}); go('poke'); }));
    card.append(lin);
    if (sug && sug !== c.papel) card.append(el('p', 'tip', `Sugerido: ${pkNomePapel[sug]} — ${s.sugestao.porque[c.id] || ''}`));
    const outras = s.contas.filter((o) => o.id !== c.id && o.r);
    if (outras.length) {
      const so = el('select'); for (const o of outras) { const op = el('option', null, pkNome(o)); op.value = o.id; so.append(op); }
      const cp = el('div', 'actions');
      cp.append(el('span', 'muted', 'Copiar ajustes de'), so, button('Copiar', 'ghost', async () => {
        const de = s.contas.find((o) => o.id === so.value);
        if (!confirm(`Copiar os ajustes de ${pkNome(de)} para ${pkNome(c)}? Casas e papel continuam os desta conta, e ela fica em simulação até você ligar o modo real.`)) return;
        const r = await window.idle.invoke('poke:pkapp:copiarAjustes', so.value, c.id);
        toast(r && r.ok ? `Ajustes de ${pkNome(de)} copiados para ${pkNome(c)} (em simulação)` : `Não copiou: ${(r && r.erro) || 'erro'}`);
        pkEstado = await window.idle.invoke('poke:pkapp:estado'); renderTrader();
      }));
      card.append(cp);
    }
    grid.append(card);
  }
  root.append(grid);
  if (Object.entries(s.sugestao.papeis).some(([id, p]) => (s.contas.find((c) => c.id === id) || {}).papel !== p)) {
    const act = el('div', 'actions'); act.append(button('Aplicar as sugestões de papel', 'primary', async () => { pkEstado = await window.idle.invoke('poke:pkapp:aplicarSugestao'); toast('Papéis aplicados'); renderTrader(); }));
    root.append(act);
  }

  const card = el('div', 'card'); card.style.marginTop = '16px';
  card.append(el('h2', 'section first', 'App'));
  const op = el('div', 'pk-mods');
  op.append(
    pkSwitch(s.painelNoJogo, 'Mostrar o painel dentro do jogo', async (on) => { pkEstado = await window.idle.invoke('poke:pkapp:painel', on); renderTrader(); }, 'O painel completo de antes, com todas as abas e ajustes finos.'),
    pkSwitch(s.avisos, 'Avisos de vendas, drops raros e parecer do dia', async (on) => { pkEstado = await window.idle.invoke('poke:pkapp:avisos', on); renderTrader(); }, 'PC, celular (ntfy) e Discord — canais em Ajustes → Avisos.'),
  );
  card.append(op);
  card.append(el('h2', 'section', 'Atualização automática'),
    el('p', 'sub', 'Confere versões novas a cada 15 min e instala sozinho quando o PC fica 2 min sem uso. Com o repositório privado, cole um token do GitHub só de leitura (Contents: Read-only, só o pokeidle-app). Fica só neste PC.'));
  const inp = el('input'); inp.type = 'password'; inp.placeholder = s.temToken ? 'token salvo — cole outro para trocar' : 'github_pat_…'; inp.style.width = '360px';
  const act = el('div', 'actions'); act.append(inp, button('Salvar token', 'primary', async () => { pkEstado = await window.idle.invoke('poke:pkapp:token', inp.value); inp.value = ''; toast('Token salvo.'); renderTrader(); }));
  card.append(act);
  card.append(el('p', 'tip', 'Baseado no Idleterino, de VinniiSaantos (licença MIT).'));
  root.append(card);
}

// ---------- Farm: os melhores pokémon para as hunts de cada conta (tipos + Z-Move, AoE, ×4) ----------
const pkTipoPt = (t) => (typeof TIPO_PT !== 'undefined' && TIPO_PT[t]) || t;
function pkTipo(t) { if (typeof tipoChip === 'function') return tipoChip(t); return el('span', 'tchip', t); }
function pkMult(m) { const e = el('b', 'pk-mult ' + (m >= 4.5 ? 'x4' : m >= 2.2 ? 'x2' : m >= 1 ? 'x1' : 'x0'), `×${(m >= 4.5 ? 4 : m >= 2.2 ? 2 : m >= 1 ? 1 : 0.5).toString().replace('.', ',')}`); e.title = `na hunt ×${m.toFixed(1).replace('.', ',')}`; return e; }
async function pkFarmTela(root, s) {
  const contas = s.contas.filter((c) => c.r);
  if (!contas.length) { root.append(emptyBox('Farm', 'Nenhuma conta logada.')); return; }
  if (!pkFarmConta || !contas.some((c) => c.id === pkFarmConta)) pkFarmConta = contas[0].id;
  const barra = el('div', 'pk-barra');
  const sel = el('div', 'pk-chips');
  for (const c of contas) sel.append(button(pkNome(c), 'pk-chip' + (c.id === pkFarmConta ? ' on' : ''), () => { pkFarmConta = c.id; pkFarm = null; renderTrader(); }));
  barra.append(sel, button('Atualizar', 'ghost', () => { pkFarm = null; renderTrader(); }));
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
  c1.append(pkTabela(['Pokémon', 'Tipos + Z', '×4 em', 'Média', 'Melhor Z-Move'], F.meus.map((m) => {
    const nome = el('div', 'pk-pk'); nome.append(el('b', null, m.nome), el('small', 'muted', ` Nv ${m.level}`));
    const tags = el('div', 'pk-tags');
    if (m.emCampo) tags.append(pkPill('em campo', 'ok')); if (m.shiny) tags.append(pkPill('shiny', 'real')); if (m.mega) tags.append(pkPill('mega', 'sim')); if (m.aoe) tags.append(pkPill('AoE', 'ok'));
    nome.append(tags);
    const tp = el('div', 'pk-tags'); for (const t of m.tipos) tp.append(pkTipo(t)); if (m.z) { tp.append(el('small', 'muted', ' Z ')); tp.append(pkTipo(m.z)); } else tp.append(el('small', 'muted', ' sem Z'));
    const x4 = el('span', m.x4 >= Math.ceil(F.hunts.length / 2) ? 'ok' : m.x4 ? '' : 'bad', `${m.x4}/${F.hunts.length}`);
    const zm = el('div', 'pk-tags'); if (m.zMelhor) { zm.append(pkTipo(m.zMelhor.t), el('small', 'muted', ` → ×4 em ${m.zMelhor.x4}/${F.hunts.length}`)); } else zm.append(el('small', 'muted', m.z ? 'o atual já é o melhor' : '—'));
    return pkLinha(nome, tp, x4, pkMult(m.media), zm);
  })));
  c1.append(el('p', 'tip', 'Só entram os que podem ir a campo: até o nível do treinador + 5 e pelo menos metade dele. ×4 = efetividade 4× no tipo do selvagem (×5,5 na hunt). A ordem pesa o ataque do pokémon e o AoE (pega a onda inteira).'));
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
  // comprar
  if (F.comprar && F.comprar.length) {
    const c3 = el('div', 'card'); c3.append(el('h2', 'section first', 'Espécies que valem comprar para estas hunts'));
    c3.append(pkTabela(['Espécie', 'Tipos + Z sugerido', '×4 em', 'Status base'], F.comprar.map((x) => {
      const nm = el('div', 'pk-pk'); nm.append(el('b', null, x.nome)); if (x.mega) nm.append(pkPill('mega', 'sim'));
      const tp = el('div', 'pk-tags'); for (const t of x.tipos) tp.append(pkTipo(t)); tp.append(el('small', 'muted', ' Z ')); tp.append(pkTipo(x.z));
      return pkLinha(nm, tp, `${x.x4}/${F.hunts.length}`, String(x.bst));
    })));
    const act = el('div', 'actions'); act.append(button('Procurar no Market (aba PvE → Comprar para farm)', 'ghost', () => go('pve')));
    c3.append(el('p', 'tip', 'Na faixa de nível da conta, com AoE de preferência. Shiny e Mega rendem mais status no mesmo nível.'), act);
    root.append(c3);
  }
}
