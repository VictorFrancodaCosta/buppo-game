# Arquitetura segura do BUPPO

## Estado atual

- `game_logic.js`: operações puras já testáveis.
- `match_protocol.js`: valida intenção de jogada e concorrência de turno.
- `security.js`: normalização de identificadores, números e texto remoto.
- `main.js`: ainda concentra orquestração, batalha, lobby, loja, amigos e histórico.
- `firebase_network.js`: acesso a histórico e economia transacional.
- `matchmaking.js`: fila e criação atômica da partida.

## Fronteiras desejadas

1. `domain/`: estado e resolução determinística, sem DOM ou Firebase.
2. `application/`: casos de uso como iniciar partida, enviar jogada e comprar item.
3. `infrastructure/`: Firebase, armazenamento, áudio e atualizador.
4. `ui/`: telas, componentes, animações e acessibilidade.

## Regra de migração

Nenhuma função de combate deve ser movida sem um teste que registre seu resultado anterior. A migração deve preservar entradas, saídas, ordem de efeitos, recompensas e todos os valores do jogo.

## Protocolo PvP

- Cada jogada pertence a um `turn` conhecido.
- A carta precisa existir na mão armazenada e não pode estar bloqueada.
- Desarmar precisa apontar para uma ação oficial.
- Uma jogada não pode sobrescrever outra já enviada.
- A resolução precisa comparar o snapshot esperado antes de publicar.
- No estágio final, somente o servidor poderá avançar o turno.
