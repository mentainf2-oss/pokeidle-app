// PokeIdle App — lado do app de PC (processo principal).
// O nosso userscript roda DENTRO de cada conta (vai junto no preload: tools/montar-preload.js). Daqui:
//  · rede do script: só a API do Claude e o precificador (o resto é recusado);
//  · leitura de cada conta a cada 30 s (window.__PKAPP_PONTE.resumoConta) para a aba Lucro;
//  · contas irmãs: cada conta sabe quem são as outras, e nunca compra nem rebaixa anúncio de uma conta sua;
//  · papel de cada conta (tudo, boss, casas, mercado) e a sugestão de onde cada uma rende mais;
//  · avisos (PC, celular pelo ntfy, Discord) das vendas, drops raros, disjuntor e vetos.
const LIBERADOS = new Set(['api.anthropic.com', 'briaoale.github.io']);
const PAPEIS = ['tudo', 'boss', 'casas', 'mercado'];

module.exports = function pkappMain({ ipcMain, views, config, send, ctx, app, path, fs, accounts }) {
  const arq = () => path.join(app.getPath('userData'), 'pkapp.json');
  let cfg = { githubToken: '', papeis: {}, avisos: true, painelNoJogo: false, parecerAvisado: {} };
  try { cfg = { ...cfg, ...JSON.parse(fs.readFileSync(arq(), 'utf8')) }; } catch {}
  const salvar = () => { try { fs.writeFileSync(arq(), JSON.stringify(cfg, null, 2)); } catch {} };

  const resumos = new Map();      // accId -> { em, r }
  const vistos = new Map();       // accId -> último log visto (texto + hora)

  // ---------- rede do script (no lugar do GM_xmlhttpRequest do Tampermonkey) ----------
  ipcMain.handle('poke:pkapp:xhr', async (e, o) => {
    let u; try { u = new URL(String(o && o.url)); } catch { return { erro: 'endereço inválido' }; }
    if (u.protocol !== 'https:' || !LIBERADOS.has(u.hostname)) return { erro: `site não liberado: ${u.hostname}` };
    let origem = ''; try { origem = new URL(e.sender.getURL()).hostname; } catch {}
    if (!/(^|\.)pokeidle\.io$/.test(origem)) return { erro: 'pedido fora de uma conta do PokeIdle' };
    const metodo = String(o.method || 'GET').toUpperCase();
    if (!['GET', 'POST'].includes(metodo)) return { erro: 'método não liberado' };
    try {
      const r = await fetch(u.href, { method: metodo, headers: o.headers || {}, body: metodo === 'POST' ? o.data : undefined, signal: AbortSignal.timeout(Math.min(180000, Number(o.timeout) || 60000)) });
      return { status: r.status, text: await r.text() };
    } catch (err) {
      return err && (err.name === 'TimeoutError' || err.name === 'AbortError') ? { timeout: true } : { erro: String(err && err.message || err) };
    }
  });

  // ---------- leitura das contas ----------
  async function lerConta(id) {
    const v = views.get(id);
    if (!v || v.webContents.isDestroyed()) return null;
    const r = await v.webContents.executeJavaScript('window.__PKAPP_PONTE ? window.__PKAPP_PONTE.resumoConta() : null').catch(() => null);
    if (r) resumos.set(id, { em: Date.now(), r });
    return r;
  }
  const nomeDa = (id) => ((accounts().find((a) => a.id === id) || {}).name || id);

  // avisos: só o que importa, sem repetir
  const AVISOS = [
    [/^💰 vendido/, 'Vendido'], [/Mega Shiny|Shiny Stone Fragment/, 'Drop raro'], [/^⚡ disjuntor/, 'Disjuntor'],
    [/^🧠 Claude vetou/, 'Claude vetou uma compra'], [/^👑 série encerrada|^👑 rotação virou/, 'Boss'],
  ];
  function avisar(id, r) {
    if (!cfg.avisos || !ctx.alert || !Array.isArray(r.log)) return;
    const ult = vistos.get(id);
    const novos = [];
    for (const l of r.log) { const k = `${l.t}|${l.msg}`; if (k === ult) break; novos.push(l); }
    if (r.log.length) vistos.set(id, `${r.log[0].t}|${r.log[0].msg}`);
    if (ult === undefined) return;                       // primeira leitura: só marca onde parou
    for (const l of novos.reverse()) for (const [re, titulo] of AVISOS) if (re.test(l.msg)) { ctx.alert('pkapp', `${titulo} — ${r.nick || nomeDa(id)}`, l.msg.slice(0, 300), `${id}|${l.msg.slice(0, 60)}`); break; }
  }

  // parecer do dia: avisa uma vez por conta e por dia (PC, celular e Discord, pelos canais de Ajustes → Avisos)
  function avisarParecer(id, r) {
    const p = r.parecer; if (!p || !ctx.alert) return;
    cfg.parecerAvisado = cfg.parecerAvisado || {};
    if (cfg.parecerAvisado[id] === p.dia) return;
    cfg.parecerAvisado[id] = p.dia; salvar();
    if (!cfg.avisos || Date.now() - (p.em || 0) > 12 * 3600_000) return;      // parecer antigo: só marca
    const dia = String(p.dia).split('-').reverse().slice(0, 2).join('/');
    ctx.alert('pkapp', `Parecer do dia ${dia} — ${r.nick || nomeDa(id)}`, (p.linhas || []).join('\n').slice(0, 1800), `${id}|parecer|${p.dia}`);
  }
  // painel dentro do jogo: escondido por padrão (a página do app mostra tudo); dá para mostrar em Controle
  async function aplicarPainel(id, r) {
    if (!!r.painelOculto !== !cfg.painelNoJogo) return;
    await ponte(id, 'controle', 'painel', !!cfg.painelNoJogo);
  }
  async function ponte(id, metodo, ...args) {
    const v = views.get(id); if (!v || v.webContents.isDestroyed()) return null;
    return v.webContents.executeJavaScript(`window.__PKAPP_PONTE ? window.__PKAPP_PONTE[${JSON.stringify(metodo)}](...${JSON.stringify(args)}) : null`).catch(() => null);
  }

  // contas irmãs: cada conta recebe a lista das OUTRAS (id de vendedor e nick)
  async function avisarIrmas() {
    const todas = [...resumos.entries()].map(([id, x]) => ({ id, vendedorId: x.r.vendedorId, nick: x.r.nick })).filter((x) => x.vendedorId != null || x.nick);
    for (const [id] of resumos) {
      const v = views.get(id); if (!v || v.webContents.isDestroyed()) continue;
      const outras = todas.filter((x) => x.id !== id).map(({ vendedorId, nick }) => ({ vendedorId, nick }));
      await v.webContents.executeJavaScript(`window.__PKAPP_PONTE && window.__PKAPP_PONTE.definirIrmas(${JSON.stringify(outras)})`).catch(() => {});
    }
  }

  // papel escolhido no app: aplica na conta quando ela estiver diferente
  async function aplicarPapeis() {
    for (const [id, x] of resumos) {
      const quer = cfg.papeis[id];
      if (!quer || quer === x.r.papel) continue;
      const v = views.get(id); if (!v || v.webContents.isDestroyed()) continue;
      await v.webContents.executeJavaScript(`window.__PKAPP_PONTE && window.__PKAPP_PONTE.aplicarPapel(${JSON.stringify(quer)})`).catch(() => {});
    }
  }

  // ---------- onde cada conta rende mais (sugestão de papéis) ----------
  // Boss vai para a conta com mais tokens (o boss rende por token); casas para quem tem vitrine sobrando; o resto, mercado.
  function sugerir() {
    const L = [...resumos.entries()].map(([id, x]) => ({ id, r: x.r }));
    const out = {}, porque = {};
    if (!L.length) return { papeis: out, porque };
    const boss = L.slice().sort((a, z) => (z.r.tokens || 0) - (a.r.tokens || 0))[0];
    if ((boss.r.tokens || 0) >= 200) { out[boss.id] = 'boss'; porque[boss.id] = `${boss.r.tokens} tokens: o boss rende por token`; }
    for (const x of L) {
      if (out[x.id]) continue;
      const v = x.r.vitrine || {};
      if ((v.fila || 0) >= 8) { out[x.id] = 'mercado'; porque[x.id] = `fila de venda com ${v.fila}: casas produzem mais do que a vitrine vende`; }
      else { out[x.id] = 'casas'; porque[x.id] = `vitrine com folga (${v.livres || 0} livres, fila ${v.fila || 0})`; }
    }
    return { papeis: out, porque };
  }

  function estado() {
    const contas = accounts().map((a) => { const x = resumos.get(a.id); return { id: a.id, nome: a.name, em: x ? x.em : null, r: x ? x.r : null, papel: cfg.papeis[a.id] || (x && x.r && x.r.papel) || 'tudo' }; });
    const soma = (f) => contas.reduce((s, c) => s + (c.r ? Number(f(c.r)) || 0 : 0), 0);
    const total = {
      coins: soma((r) => r.coins), gemas: soma((r) => r.gemas), tokens: soma((r) => r.tokens), gemasHoje: soma((r) => r.gemasHoje),
      d1: { recC: soma((r) => r.real && r.real.d1.gold.recebido), gasC: soma((r) => r.real && r.real.d1.gold.gasto), recG: soma((r) => r.real && r.real.d1.orb.recebido), gasG: soma((r) => r.real && r.real.d1.orb.gasto) },
      d7: { recC: soma((r) => r.real && r.real.d7.gold.recebido), gasC: soma((r) => r.real && r.real.d7.gold.gasto), recG: soma((r) => r.real && r.real.d7.orb.recebido), gasG: soma((r) => r.real && r.real.d7.orb.gasto) },
      revendasC: soma((r) => r.revendas7 && r.revendas7.lucroC), bossG: soma((r) => r.boss && r.boss.lucro), cambio: (contas.find((c) => c.r && c.r.cambio) || { r: {} }).r.cambio || null,
    };
    total.hoje = { lucroG: soma((r) => r.hoje && r.hoje.lucroG), caixaG: soma((r) => r.hoje && r.hoje.caixaG), vendas: soma((r) => r.hoje && r.hoje.vendas), compras: soma((r) => r.hoje && r.hoje.compras),
      revendas: soma((r) => r.hoje && r.hoje.revendas), prejuizos: soma((r) => r.hoje && r.hoje.prejuizos), decisoes: soma((r) => r.hoje && r.hoje.decisoes), erros: soma((r) => r.hoje && r.hoje.erros), apiUsd: soma((r) => r.api && r.api.usd) };
    return { contas, total, sugestao: sugerir(), papeis: PAPEIS, temToken: !!cfg.githubToken, avisos: !!cfg.avisos, painelNoJogo: !!cfg.painelNoJogo };
  }

  ipcMain.handle('poke:pkapp:estado', () => estado());
  ipcMain.handle('poke:pkapp:papel', async (_e, id, papel) => {
    if (!PAPEIS.includes(papel)) return estado();
    cfg.papeis[id] = papel; salvar(); await aplicarPapeis(); await lerConta(id); return estado();
  });
  ipcMain.handle('poke:pkapp:aplicarSugestao', async () => {
    const s = sugerir(); Object.assign(cfg.papeis, s.papeis); salvar(); await aplicarPapeis(); return estado();
  });
  ipcMain.handle('poke:pkapp:token', (_e, tok) => { cfg.githubToken = String(tok || '').trim().slice(0, 200); salvar(); return estado(); });
  ipcMain.handle('poke:pkapp:avisos', (_e, on) => { cfg.avisos = !!on; salvar(); return estado(); });
  ipcMain.handle('poke:pkapp:painel', async (_e, on) => { cfg.painelNoJogo = !!on; salvar(); for (const [id, x] of resumos) await aplicarPainel(id, x.r); return estado(); });
  const CONTROLES = new Set(['ligar', 'simulacao', 'mod', 'fecharDia']);
  ipcMain.handle('poke:pkapp:controle', async (_e, id, acao, valor) => {
    if (!CONTROLES.has(acao)) return estado();
    if (acao === 'mod' && !(valor && typeof valor.k === 'string')) return estado();
    await ponte(id, 'controle', acao, valor); await lerConta(id); return estado();
  });
  // parecer: os dias fechados de cada conta e o dia de hoje até agora
  ipcMain.handle('poke:pkapp:relatorios', async () => {
    const out = [];
    for (const a of accounts()) {
      const rels = await ponte(a.id, 'relatorios'), hojeP = await ponte(a.id, 'parecerHoje'), x = resumos.get(a.id);
      out.push({ id: a.id, nome: (x && x.r && x.r.nick) || a.name, relatorios: rels || [], hoje: hojeP, aprendizado: x && x.r && x.r.aprendizado });
    }
    return out;
  });
  ipcMain.handle('poke:pkapp:decisoes', async (_e, cat) => {
    const out = [];
    for (const a of accounts()) { const L = await ponte(a.id, 'decisoes', cat || null), x = resumos.get(a.id); for (const d of L || []) out.push({ conta: (x && x.r && x.r.nick) || a.name, ...d }); }
    return out.sort((a, z) => z.em - a.em).slice(0, 600);
  });

  async function tick() {
    for (const a of accounts()) { const r = await lerConta(a.id); if (r) { avisar(a.id, r); avisarParecer(a.id, r); await aplicarPainel(a.id, r); } }
    await avisarIrmas();
    await aplicarPapeis();
    send('pkapp:estado', estado());
  }
  return { tick };
};
