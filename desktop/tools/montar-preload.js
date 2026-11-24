// Monta o preload das contas com o PokeIdle App dentro (roda antes do jogo, como o Tampermonkey fazia com
// @run-at document-start). Junta o poke-preload.js do Idleterino com o nosso userscript num arquivo só:
// o preload das contas roda em sandbox e não pode ler arquivos, então o script tem que ir dentro dele.
// Uso: node tools/montar-preload.js  (o build do GitHub roda isso antes do electron-builder)
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const fontes = [path.join(raiz, '..', 'pokeidle-app.user.js'), path.join(raiz, 'pokeidle-app.user.js')];
const fonte = fontes.find((f) => fs.existsSync(f));
if (!fonte) { console.error('não achei o pokeidle-app.user.js'); process.exit(1); }
const script = fs.readFileSync(fonte, 'utf8');
if (fonte !== fontes[1]) fs.writeFileSync(fontes[1], script);       // cópia dentro do app (vai no instalador)
const versao = (/@version\s+([\d.]+)/.exec(script) || [])[1] || '?';
const base = fs.readFileSync(path.join(raiz, 'poke-preload.js'), 'utf8');
const bloco = `

// ===================== PokeIdle App ${versao} (gerado por tools/montar-preload.js — não edite aqui) =====================
;(() => {
  const { contextBridge: pontePk, ipcRenderer: ipcPk } = require('electron');
  // o que o script pede ao app: rede só para os sites liberados (API do Claude e precificador) e avisos
  const ponte = {
    xhr: (o) => ipcPk.invoke('poke:pkapp:xhr', o),
  };
  try {
    pontePk.executeInMainWorld({
      func: function (ponte) {
        if (!/(^|\\.)pokeidle\\.io$/.test(location.hostname) || !location.pathname.startsWith('/app')) return;
        if (window.__PKAPP_DESKTOP) return;
        Object.defineProperty(window, '__PKAPP_DESKTOP', { value: true });
        const unsafeWindow = window;
        // o mesmo jeito do Tampermonkey: callbacks onload / onerror / ontimeout
        const GM_xmlhttpRequest = function (o) {
          const req = { method: o.method || 'GET', url: String(o.url), headers: o.headers || {}, data: o.data == null ? null : (typeof o.data === 'string' ? o.data : JSON.stringify(o.data)), timeout: o.timeout || 60000 };
          ponte.xhr(req).then((r) => {
            if (r && r.timeout) { if (o.ontimeout) o.ontimeout(); return; }
            if (!r || r.status == null) { if (o.onerror) o.onerror({ error: r && r.erro }); return; }
            if (o.onload) o.onload({ status: r.status, responseText: r.text, response: r.text });
          }, (e) => { if (o.onerror) o.onerror({ error: String(e && e.message || e) }); });
        };
${script}
      },
      args: [ponte],
    });
  } catch (e) { console.error('[PokeIdle App] não consegui carregar o app nesta conta:', e); }
})();
`;
fs.writeFileSync(path.join(raiz, 'poke-preload.gerado.js'), base + bloco);
console.log(`poke-preload.gerado.js montado com o PokeIdle App ${versao} (${Math.round((base.length + bloco.length) / 1024)} KB)`);
