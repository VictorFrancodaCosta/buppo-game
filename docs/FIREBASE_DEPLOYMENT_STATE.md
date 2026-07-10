# Estado de implantação do Firebase

Auditoria realizada em 10 de julho de 2026 no projeto `buppo-game` (`950871979140`).

## Produção encontrada

- Projeto ativo: `buppo-game`.
- Índices compostos: nenhum.
- Release Firestore: `projects/buppo-game/releases/cloud.firestore`.
- Ruleset ativo antes do endurecimento: `projects/buppo-game/rulesets/ed167b9a-4dfa-41b2-a5a9-bc4b9a303616`.
- Hash SHA-256 remoto: `9b8c04446f4d7fe4b19f36807c79a56fc2a8882467e92752ffffe83f335fd0a9`.

As Rules ativas encontradas permitem leitura e escrita pública, inclusive sem autenticação:

```text
match /{document=**} {
  allow read, write: if true;
}
```

Isso é uma vulnerabilidade crítica. O ruleset acima deve ser mantido somente como referência de rollback emergencial, não como configuração aceitável.

## Validações locais

- Compilação pelo endpoint oficial Firebase Rules: aprovada.
- Primeira suíte Firestore Emulator: 10/10 testes aprovados.
- Suíte ampliada adicionada ao projeto e ao CI.
- A repetição local da suíte ampliada ficou pendente por limite temporário de aprovação da ferramenta, não por erro de código.

## Condição para deploy

Não publicar até que `npm run test:rules` seja executado novamente com toda a suíte ampliada e termine sem falhas. Depois disso, implantar primeiro Rules, validar os fluxos autenticados e somente então considerar índices, TTL, App Check e ledger permanente.
