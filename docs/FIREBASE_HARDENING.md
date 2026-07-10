# Endurecimento do Firebase

## Estado implementado no cliente

- Vitórias, derrotas, compras e evoluções usam transações Firestore.
- Cada partida recebe um identificador de liquidação.
- O cliente está preparado para documentos permanentes e imutáveis de liquidação; a ativação por `BUPPO_ENABLE_SETTLEMENT_LEDGER` permanece desligada até as Rules serem publicadas. A lista recente continua ativa para compatibilidade.
- A criação da partida e a reivindicação dos dois jogadores na fila ocorrem numa única transação.
- O envio da jogada valida participante, turno, mão, carta bloqueada e alvo de Desarmar dentro de uma transação.
- A publicação do turno rejeita snapshots que já foram resolvidos.
- Documentos novos carregam `schemaVersion`, timestamp do servidor e campos de expiração quando aplicável.
- `firestore.rules`, `firestore.indexes.json` e `firebase.json` estão versionados para teste local.

Essas proteções evitam acidentes e condições de corrida, mas um cliente web nunca deve ser considerado autoridade final.

## Importante: o que ainda não está ativo

Os arquivos locais de Rules e índices **não foram publicados**. Eles precisam ser comparados com as regras atualmente ativas e executados no Emulator Suite. As Rules locais são uma etapa de transição: limitam participantes e formatos, mas ainda permitem que o jogador 1 publique a resolução porque o backend autoritativo ainda não existe.

Também não estão ativos:

- App Check;
- políticas TTL para `expiresAt` e `presenceExpiresAt`;
- função autoritativa de resolução e liquidação;
- auditoria remota e alertas de fraude.

A auditoria autenticada encontrou as Rules de produção completamente abertas para leitura e escrita pública. Consulte [FIREBASE_DEPLOYMENT_STATE.md](FIREBASE_DEPLOYMENT_STATE.md). A substituição é prioridade crítica, mas só deve ocorrer depois que a suíte ampliada do emulador passar integralmente.

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

## Como permitir acesso com segurança

A opção recomendada é autenticar o Firebase CLI na própria máquina, sem enviar senha, token ou JSON pelo chat:

1. Instale Node.js com npm e o Firebase CLI.
2. No terminal, execute `firebase login` e conclua o login no navegador.
3. Execute `firebase projects:list` e confirme que `buppo-game` aparece.
4. Avise que o CLI está autenticado. A partir daí, o Codex pode pedir aprovação para comandos específicos de leitura, emulador e implantação.

Alternativamente, use uma service account de escopo mínimo configurada fora do repositório pela variável `GOOGLE_APPLICATION_CREDENTIALS`. Nunca copie a chave para o projeto e nunca a envie na conversa.

Antes de qualquer deploy serão executadas, nesta ordem:

1. leitura e comparação das Rules ativas;
2. testes locais no Emulator Suite;
3. teste com duas contas fictícias;
4. implantação apenas dos índices necessários;
5. implantação das Rules em janela controlada;
6. validação de login, ranking, amigos, fila, PvP, loja e histórico.

## App Check

Será necessário criar um provedor Web App Check no Console Firebase. A chave pública do site pode ser configurada no aplicativo, mas tokens de depuração e credenciais administrativas nunca devem ser versionados. O enforcement só deve ser habilitado depois de web e desktop enviarem tokens válidos.

## Migração para autoridade do servidor

1. Extrair toda a resolução determinística para um módulo compartilhado e ampliar os testes de caracterização.
2. Executar uma função em modo sombra, comparando o resultado do servidor com o cliente sem alterar partidas.
3. Investigar qualquer divergência até obter equivalência total.
4. Fazer o cliente enviar apenas intenção de jogada.
5. Bloquear nas Rules qualquer escrita direta de estado, resultado e economia.
6. Mover liquidação para documento imutável por `partida + jogador`.
