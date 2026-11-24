# PokeIdle App — PC

O app de PC do PokeIdle App: o nosso app de mercado (lista de compras, sniper, casas, boss, estudo de mercado e Claude) rodando **dentro de cada conta**, sem Tampermonkey, em até 4 contas ao mesmo tempo.

Feito a partir do [Idleterino](https://github.com/ViinniSantoos/idleterino), de VinniiSaantos (licença MIT): contas do PokeIdle, Twitch e Kick, avisos no celular, PvE, PvP e atualização automática vêm de lá. O Trader pago do Idleterino não está aqui; no lugar dele entra o PokeIdle App.

## O que tem a mais

- **PokeIdle App em cada conta**: o mesmo script do Tampermonkey, embutido no app (`tools/montar-preload.js`). Cada conta tem o seu painel, configuração e limites.
- **Aba Lucro**: as contas lado a lado e o total — Coins, Gemas, tokens, saldo de 24 h e 7 dias pelo histórico do jogo, boss do dia, vitrine e fila.
- **Contas irmãs**: uma conta sua nunca compra nem rebaixa anúncio de outra conta sua.
- **Papel de cada conta** (Tudo, Boss, Casas, Mercado) e a sugestão de onde cada uma rende mais.
- **Avisos** de vendas, drops raros, disjuntor e vetos do Claude (PC, celular pelo ntfy, Discord).

## Instalar

Baixe o instalador na página de Releases do repositório (Windows: `PokeIdleApp-Setup.exe`; Linux: AppImage ou .deb). Como o instalador não é assinado, o Windows pode mostrar "O Windows protegeu o computador": clique em **Mais informações → Executar assim mesmo**.

O repositório é privado. Para o app se atualizar sozinho, crie um token do GitHub só de leitura (Settings → Developer settings → Fine-grained tokens → repositório `pokeidle-app` → Contents: Read-only) e cole na aba **Lucro → Ajustes do app**.

## Montar

O GitHub monta e publica sozinho a cada mudança (`.github/workflows/desktop.yml`). Na mão: `npm install`, `node tools/montar-preload.js`, `npm start`.
