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
  let cfg = { githubToken: '', papeis: {}, avisos: true };
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
    return { contas, total, sugestao: sugerir(), papeis: PAPEIS, temToken: !!cfg.githubToken, avisos: !!cfg.avisos };
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

  async function tick() {
    for (const a of accounts()) { const r = await lerConta(a.id); if (r) avisar(a.id, r); }
    await avisarIrmas();
    await aplicarPapeis();
    send('pkapp:estado', estado());
  }
  return { tick };
};
