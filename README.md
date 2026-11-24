# PokeIdle App

Userscript do Tampermonkey para o [PokeIdle](https://pokeidle.io): lista de compras com faixas de preço, sniper de pokémon e de itens (Coins e Gemas), casas para upar e revender, boss e tokens, Prey, análise de mercado e decisões com a API do Claude.

## Instalar

1. Instale a extensão Tampermonkey no navegador.
2. Abra [pokeidle-app.user.js (raw)](https://raw.githubusercontent.com/mentainf2-oss/pokeidle-app/main/pokeidle-app.user.js). O Tampermonkey mostra a tela de instalação: clique em **Instalar**.
3. Abra o jogo em https://pokeidle.io/app. O painel aparece no canto da tela, em **simulação**: nada é comprado até você trocar para o modo real.

O Tampermonkey busca as versões novas sozinho neste mesmo endereço. Para buscar na hora: painel do Tampermonkey → **Procurar atualizações de scripts**.

## Segurança

- A chave da API do Claude fica só no seu navegador; ela não está neste repositório.
- Gastar Gemas exige ligar "Operar em Gemas" em Config. Há limites por compra, por dia (dia de Brasília), reserva mínima e um disjuntor que pausa as compras se o gasto disparar em 10 minutos.
- Com a conferência ligada, o Claude revisa cada compra antes de ela ser enviada; se a API falhar, o app não compra.
- O jogo permite automações (Termos de Uso); manipulação de mercado não. O app compra e vende a preço de mercado, sem combinar preços.

## Créditos

O preço em Gemas usa o motor do [Precificador de Pokémon](https://github.com/briaoale/precificador-pokemon), © 2026 briaoAle, licença MIT, copiado e adaptado dentro do script. Os dados de vendas vêm do site dele (`precos.json`), lidos como JSON.

## Histórico

Veja [CHANGELOG.md](CHANGELOG.md).
