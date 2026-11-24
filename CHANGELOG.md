# Histórico de versões

| Versão | Data | O que mudou |
| --- | --- | --- |
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
