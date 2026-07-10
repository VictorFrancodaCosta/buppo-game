# BUPPO

BUPPO é um jogo de duelo de cartas com PvE, PvP, cinco classes temáticas, progressão visual, arsenal, amigos, ranking e histórico de partidas.

## Princípios do projeto

- As regras e os valores da economia ficam separados da apresentação.
- Toda liquidação de ouro deve ser transacional e idempotente.
- Uma falha visual ou sonora não deve encerrar uma partida.
- Atualizações nunca devem recarregar o jogo durante um duelo ativo.
- Interfaces devem funcionar com mouse, toque e teclado.

## Estrutura

- `index.html`: estrutura principal das telas.
- `js/game_logic.js`: funções puras da base de jogo e IA PvE.
- `js/main.js`: orquestração dos fluxos atuais.
- `js/matchmaking.js`: fila e criação atômica de partidas PvP.
- `js/firebase_network.js`: autenticação, histórico e liquidação transacional.
- `js/app_shell.js`: acessibilidade, tutorial e estados de conectividade.
- `js/pwa.js` e `sw.js`: instalação, cache versionado e atualizações seguras.
- `desktop/`: empacotamento Electron para Windows.
- `tests/`: testes automatizados que não alteram dados remotos.

## Desenvolvimento

Sirva a raiz por HTTP. Módulos ES não devem ser abertos diretamente por `file://`.

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4173/index.html`.

## Verificações obrigatórias

```powershell
npm run check
```

O comando valida todas as referências estáticas de assets e executa os testes unitários da lógica isolada.

## Windows

```powershell
npm run desktop
npm run dist:win:installer
```

O atualizador baixa novas versões em segundo plano e aplica a instalação apenas quando o aplicativo for encerrado.

## Firebase

As chaves de configuração do SDK web identificam o projeto, mas a proteção real depende de Authentication, App Check, Firestore Rules e de um serviço autoritativo para resultados competitivos. Consulte [docs/FIREBASE_HARDENING.md](docs/FIREBASE_HARDENING.md).

## Publicação

Antes de publicar, siga [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md). A pasta Android permanece fora do fluxo de melhorias atual.
