# Histórico de versões

| Versão | Data | O que mudou |
| --- | --- | --- |
| 5.18 | 2026-11-24 | Casas não param: pokémon pronto com a vitrine cheia vai para a fila de venda (até 8) e entra outro na casa (da coleção ou comprado; até 12 compras/dia). Sniper compra para a fila quando a vitrine está cheia, com o dobro do lucro mínimo. Pokémon seu (sem custo) também entra na venda rápida. |
| 5.17 | 2026-11-24 | Aba Sniper pokémon: revendas do app nos últimos 7 dias, casando cada venda do histórico com a compra (lucro em Coins pelo câmbio, tempo até vender, origem sniper/casa). |
| 5.16 | 2026-11-24 | Orçamento do dia acertado pelo histórico da conta a cada 10 min: conta só o que foi comprado de verdade (o sorteio de 3 s perdido não custa nada) mais o que está em andamento. Antes, 9.999 💠 contados contra 687 💠 gastos de fato travavam as compras. |
| 5.15 | 2026-11-24 | Casa vazia: o app coloca primeiro um pokémon da sua coleção (fora da equipe, vendável, abaixo do nível-alvo), o que mais ganha valor até o alvo; só compra se não houver. Conferência do Claude: recebe as contas já feitas (lucro, margem, vendas de referência) e só veta por critérios claros; resposta em JSON com o número que decidiu. |
| 5.13 | 2026-11-23 | Aba Claude: histórico das conferências de compra (aprovadas, vetadas e o motivo de cada uma), com o resumo das últimas 24 h. |
| 5.12 | 2026-11-23 | Negociação: quando um comprador manda mensagem (Comércio) num anúncio seu, o Claude responde e pode baixar o preço para fechar na hora. O código garante o piso (custo + 3%; sem custo, 90% do justo), só baixa, respeita os 30 min entre mudanças e a compra é sempre pelo anúncio. Até 8 respostas por conversa. Liga/desliga em Config. |
| 5.11 | 2026-11-23 | Vender rápido, sempre com lucro: pokémon em 💠 pelo "vender rápido" do precificador, em Coins a 90% do mercado, itens um degrau abaixo do menor anúncio. O app ajusta todos os seus anúncios a cada 30 min (os seus também), nunca abaixo do custo + 3%; sem custo conhecido, pokémon não desce de 95% do justo. |
| 5.10 | 2026-11-23 | Boss Token: compra sempre até o preço que você define (Coins e 💠), sem margem de lucro e sem passar pela conferência do Claude. Sem preço definido, o automático é o ponto de equilíbrio do boss. |
| 5.9 | 2026-11-23 | Lucro real: o app lê o histórico de compras e vendas da sua conta no jogo (24 h e 7 dias, por moeda) a cada 30 min e mostra na aba Análise. |
| 5.8 | 2026-11-23 | Visual novo: 7 abas com ícones e sub-abas (Mercado, Boss, Análise), chips de estado no topo, módulos como interruptores, botão de largura. Logs mostram quantidade e preço unitário ("30× a 5 💠 = 150 💠"). Calculadora "Quantos tokens dá" na aba Boss. Atualização automática pelo GitHub. |
| 5.7 | 2026-11-23 | Conferência do Claude pede resposta direta (1.024 tokens); resposta confusa não fica em cache. |
| 5.6 | 2026-11-23 | Conferência lê SIM/NÃO com formatação, mostra o motivo e recebe os limites de gasto. |
| 5.5 | 2026-11-23 | Limite diário vira à meia-noite de Brasília (antes, 21:00 / dia UTC). |
| 5.4 | 2026-11-23 | O Claude confere cada compra antes de enviar; disjuntor de gasto em 10 min. |
| 5.3 | 2026-11-23 | Custo em Gemas convertido certo no piso de venda; sniper em Gemas só com o precificador e abaixo do "vender rápido". |
| 5.2 | 2026-11-23 | Drops do boss pelo preço de agora; compra de tokens enquanto der ≥ 2 💠 de lucro por boss. |
| 5.1 | 2026-11-23 | Compra agendada conta na quantidade da regra; confirmação de item pelo nome. |
| 5.0 | 2026-11-23 | Confirmação de compra pelo nome; casas e revenda corrigidas; precificador 3–5× mais rápido. |
| 4.9 | 2026-11-23 | Teto do token por moeda, valendo para todas as compras; nunca compra Outland. |
| 4.8 | 2026-11-23 | Precificador em Gemas (30 dias de vendas); aba Avaliar lê a ficha colada. |
| 4.7 | 2026-11-23 | Vitrine de 10 pokémon com fila e reserva para as casas; compra para casa só com muito lucro; menos pedidos ao servidor. |
| 4.6 | 2026-11-23 | Venda na moeda que rende mais; boss levando em conta o evento de XP. |
