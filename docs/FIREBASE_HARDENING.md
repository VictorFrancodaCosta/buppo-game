# Endurecimento do Firebase

## Estado implementado no cliente

- Vitórias, derrotas, compras e evoluções usam transações Firestore.
- Cada partida recebe um identificador de liquidação.
- Liquidações recentes ficam registradas no perfil para impedir processamento duplicado.
- A criação da partida e a reivindicação dos dois jogadores na fila ocorrem numa única transação.

Essas proteções evitam acidentes e condições de corrida, mas um cliente web nunca deve ser considerado autoridade final.

## Etapa externa necessária antes de competição pública

1. Habilitar Firebase App Check para web e desktop.
2. Versionar e testar Firestore Rules no emulador.
3. Impedir escrita direta do cliente em `goldCoins`, `totalWins`, `profileXp` e resultados encerrados.
4. Mover a liquidação para uma callable Cloud Function ou serviço equivalente.
5. Fazer a função receber apenas o ID da partida, nunca o valor desejado de ouro.
6. Recalcular o resultado a partir do documento autoritativo e preservar os mesmos valores definidos pelo jogo.
7. Registrar auditoria com `settlementId`, jogador, partida, valor anterior, delta e valor final.
8. Executar testes das Rules no Firebase Emulator Suite antes de publicar.

Nenhuma regra remota deve ser publicada sem conhecer as Rules atualmente ativas e sem executar o conjunto completo de testes no emulador.
