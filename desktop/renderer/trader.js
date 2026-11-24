// PokeIdle App — aba Lucro: as contas logadas lado a lado, o total, o boss, a vitrine e o papel de cada conta.
// Os números vêm do nosso app que roda dentro de cada conta (lido a cada 30 s pelo pkapp-main.js).
let pkEstado = null;
let pkTab = (() => { try { return localStorage.getItem('pkTab') || 'contas'; } catch { return 'contas'; } })();
const pkFmt = (n) => (n == null || !isFinite(n) ? '—' : Math.abs(n) >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.abs(n) >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n)));
const pkG = (n) => (n == null || !isFinite(n) ? '—' : `${Math.round(n).toLocaleString('pt-BR')} 🔮`);
const pkNomePapel = { tudo: 'Tudo', boss: 'Boss', casas: 'Casas', mercado: 'Mercado' };
const pkDicaPapel = {
  tudo: 'todos os módulos ligados',
  boss: 'faz boss e compra tokens; sem casas e sem sniper',
  casas: 'casas + sniper de pokémon (revenda)',
  mercado: 'sniper de pokémon e de itens, sem casas',
};
window.idle.on('poke:pkapp:estado', (s) => { pkEstado = s; if (page === 'trader') renderTrader(); });

function pkKpi(rot, val, sub, cls) {
  const b = el('div', 'stat'); const v = el('b', cls || null, val); b.append(el('span', null, rot), v); if (sub) b.append(el('small', 'muted', sub)); return b;
}
function pkLinha(...cels) { const tr = el('tr'); for (const c of cels) { const td = el('td'); if (c instanceof Node) td.append(c); else td.textContent = c == null ? '—' : String(c); tr.append(td); } return tr; }
function pkTabela(cab, linhas) {
  const t = el('table', 'pk-tab'); const h = el('tr'); for (const c of cab) h.append(el('th', null, c)); t.append(h); for (const l of linhas) t.append(l); return t;
}

async function renderTrader() {
  const root = $('#page-trader');
  if (!pkEstado) pkEstado = await window.idle.invoke('poke:pkapp:estado').catch(() => null);
  root.replaceChildren();
  const head = el('header', 'page-head');
  const t = el('div');
  t.append(el('h1', null, 'Lucro'), el('p', 'sub', 'O PokeIdle App rodando em cada conta: lucro real, boss, vitrine e o papel de cada uma. Atualiza a cada 30 s.'));
  head.append(t);
  const tabs = el('div', 'pvp-tabs');
  for (const [k, l] of [['contas', '👥 Contas'], ['investir', '📈 Onde cada conta rende mais'], ['log', '📜 Atividade'], ['ajustes', '⚙️ Ajustes do app']]) {
    tabs.append(button(l, pkTab === k ? 'on' : '', () => { pkTab = k; try { localStorage.setItem('pkTab', k); } catch {} renderTrader(); }));
  }
  root.append(head, tabs);
  const s = pkEstado;
  if (!s || !s.contas.length) { root.append(emptyBox('Lucro', 'Adicione uma conta do PokeIdle na aba PokeIdle. O app de mercado entra sozinho em cada conta.')); return; }
  const cb = s.total.cambio;

  if (pkTab === 'contas') {
    // total das contas
    const tot = el('div', 'card'); tot.append(el('h2', 'section', 'Todas as contas'));
    const g = el('div', 'grid-4 pk-kpis');
    const s1 = s.total.d1, s7 = s.total.d7;
    g.append(
      pkKpi('Coins (todas)', pkFmt(s.total.coins)), pkKpi('Gemas (todas)', pkG(s.total.gemas)), pkKpi('Tokens', pkFmt(s.total.tokens)),
      pkKpi('Saldo 24 h em Coins', pkFmt(s1.recC - s1.gasC), `recebido ${pkFmt(s1.recC)} · gasto ${pkFmt(s1.gasC)}`, s1.recC - s1.gasC >= 0 ? 'ok' : 'bad'),
      pkKpi('Saldo 24 h em Gemas', pkG(s1.recG - s1.gasG), `recebido ${pkG(s1.recG)} · gasto ${pkG(s1.gasG)}`, s1.recG - s1.gasG >= 0 ? 'ok' : 'bad'),
      pkKpi('Saldo 7 dias', `${pkFmt(s7.recC - s7.gasC)} · ${pkG(s7.recG - s7.gasG)}`),
      pkKpi('Revendas (7 d)', pkFmt(s.total.revendasC), 'lucro das revendas já concluídas'),
      pkKpi('Boss hoje', pkG(s.total.bossG), 'drops vendidos + à venda − tokens', s.total.bossG >= 0 ? 'ok' : 'bad'),
    );
    tot.append(g, el('p', 'tip', 'Saldo = vendido − comprado no histórico do jogo. Compras para guardar (tokens, pokémon nas casas) contam como gasto até serem vendidas.'));
    root.append(tot);
    // uma carta por conta
    const grid = el('div', 'grid-2'); grid.style.marginTop = '16px';
    for (const c of s.contas) {
      const r = c.r, card = el('div', 'card');
      const h = el('div', 'pcard-head'); h.append(el('b', null, (r && r.nick) || c.nome), el('span', 'state', r ? `${r.versao ? 'app ' + r.versao : ''}${r.simulacao ? ' · simulação' : ' · real'}${r.ligado ? '' : ' · parado'}` : 'carregando o app…'));
      card.append(h);
      if (!r) { card.append(el('p', 'tip', 'A conta ainda não abriu o PokeIdle App (precisa estar logada).')); grid.append(card); continue; }
      const k = el('div', 'grid-4 pk-kpis');
      const d1 = r.real && r.real.d1;
      k.append(pkKpi('Coins', pkFmt(r.coins)), pkKpi('Gemas', pkG(r.gemas), `hoje ${pkG(r.gemasHoje)} de ${pkG(r.limiteGemasDia)}`), pkKpi('Tokens', pkFmt(r.tokens)),
        pkKpi('Vitrine', `${r.vitrine.usadas}/10`, `fila ${r.vitrine.fila}${r.giro ? ' · 🌀 giro' : ''}`),
        pkKpi('24 h (Coins)', d1 ? pkFmt(d1.gold.recebido - d1.gold.gasto) : '—', d1 ? `${d1.gold.nV} vendas · ${d1.gold.nC} compras` : ''),
        pkKpi('24 h (Gemas)', d1 ? pkG(d1.orb.recebido - d1.orb.gasto) : '—'),
        pkKpi('Boss hoje', r.boss ? pkG(r.boss.lucro) : '—', r.boss ? `${r.boss.lutas} lutas · ~${Math.round(r.boss.porHora)}/h` : (r.bossAuto ? 'série ligada' : '')),
        pkKpi('Revendas 7 d', pkFmt(r.revendas7 && r.revendas7.lucroC), r.revendas7 ? `${r.revendas7.n} revendas` : ''));
      card.append(k);
      const sel = el('select'); for (const p of s.papeis) { const o = el('option', null, `${pkNomePapel[p]} — ${pkDicaPapel[p]}`); o.value = p; sel.append(o); }
      sel.value = c.papel || 'tudo';
      sel.onchange = async () => { pkEstado = await window.idle.invoke('poke:pkapp:papel', c.id, sel.value); toast(`Papel de ${(r && r.nick) || c.nome}: ${pkNomePapel[sel.value]}`); renderTrader(); };
      const lin = el('div', 'actions'); lin.append(el('span', 'muted', 'Papel desta conta:'), sel, button('Abrir no jogo', 'ghost', async () => { await window.idle.invoke('poke:select', c.id).catch(() => {}); go('poke'); }));
      card.append(lin);
      if (r.casas && r.casas.length) card.append(el('p', 'tip', `🏠 ${r.casas.map((x) => `${x.nome}${x.shiny ? ' ✨' : ''} Nv ${x.nv ?? '?'}${x.bot ? '' : ' (seu)'}`).join(' · ')}`));
      grid.append(card);
    }
    root.append(grid);
  }

  if (pkTab === 'investir') {
    const card = el('div', 'card');
    card.append(el('h2', 'section', 'Onde cada conta rende mais'),
      el('p', 'sub', 'O boss rende por token: vai para a conta com mais tokens. Casas só ajudam se a vitrine estiver vendendo; com a fila cheia, a conta rende mais no mercado (sniper e revenda). As contas nunca compram nem rebaixam anúncio uma da outra.'));
    const linhas = s.contas.map((c) => pkLinha((c.r && c.r.nick) || c.nome, pkNomePapel[c.papel] || '—', pkNomePapel[s.sugestao.papeis[c.id]] || '—', s.sugestao.porque[c.id] || '—'));
    card.append(pkTabela(['Conta', 'Papel agora', 'Sugerido', 'Por quê'], linhas));
    const act = el('div', 'actions'); act.append(button('Aplicar a sugestão', 'primary', async () => { pkEstado = await window.idle.invoke('poke:pkapp:aplicarSugestao'); toast('Papéis aplicados nas contas'); renderTrader(); }));
    card.append(act);
    const ideias = [...new Set(s.contas.flatMap((c) => (c.r && c.r.ideias) || []))];
    if (ideias.length) { const box = el('div', 'card'); box.style.marginTop = '16px'; box.append(el('h2', 'section', 'O que o estudo de mercado concluiu')); const ul = el('ul'); for (const i of ideias) ul.append(el('li', null, i)); box.append(ul); root.append(card, box); }
    else root.append(card);
  }

  if (pkTab === 'log') {
    const card = el('div', 'card');
    const linhas = [];
    for (const c of s.contas) for (const l of ((c.r && c.r.log) || [])) linhas.push({ conta: (c.r && c.r.nick) || c.nome, ...l });
    card.append(el('h2', 'section', 'Atividade recente (todas as contas)'));
    card.append(pkTabela(['Conta', 'Hora', 'O quê'], linhas.slice(0, 80).map((l) => pkLinha(l.conta, l.t, l.msg))));
    root.append(card);
  }

  if (pkTab === 'ajustes') {
    const card = el('div', 'card');
    card.append(el('h2', 'section', 'Atualização automática'),
      el('p', 'sub', 'O app confere versões novas a cada 15 min e se instala sozinho quando o PC fica 2 min sem uso. Enquanto o repositório for público, não precisa de nada. Se você deixar o repositório privado, cole aqui um token do GitHub só de leitura (Settings → Developer settings → Fine-grained tokens → só o repositório pokeidle-app, permissão Contents: Read-only). Ele fica só neste PC.'));
    const inp = el('input'); inp.type = 'password'; inp.placeholder = s.temToken ? 'token salvo — cole outro para trocar' : 'github_pat_…'; inp.style.width = '420px';
    const act = el('div', 'actions'); act.append(inp, button('Salvar token', 'primary', async () => { pkEstado = await window.idle.invoke('poke:pkapp:token', inp.value); inp.value = ''; toast('Token salvo. O app confere versões novas de hora em hora.'); renderTrader(); }));
    card.append(act);
    card.append(el('h2', 'section', 'Avisos'));
    const av = el('label', 'switch-line'); const cbx = el('input'); cbx.type = 'checkbox'; cbx.checked = !!s.avisos;
    cbx.onchange = async () => { pkEstado = await window.idle.invoke('poke:pkapp:avisos', cbx.checked); };
    av.append(cbx, el('span', null, ' Avisar vendas, drops raros, disjuntor e vetos do Claude (PC, celular pelo ntfy e Discord — configure os canais em Ajustes → Avisos).'));
    card.append(av);
    card.append(el('p', 'tip', 'Baseado no Idleterino, de VinniiSaantos (licença MIT). O PokeIdle App roda dentro de cada conta como no Tampermonkey, com os mesmos limites e a conferência do Claude.'));
    root.append(card);
  }
}
