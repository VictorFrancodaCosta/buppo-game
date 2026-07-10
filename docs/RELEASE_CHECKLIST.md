# Checklist de release

## Qualidade

- [ ] `npm run check` concluído sem erros.
- [ ] Console sem erros na entrada, saguão, arsenal, PvE e PvP.
- [ ] Tutorial navegável por mouse, toque e teclado.
- [ ] Modais fecham com `Esc` e mantêm o foco.
- [ ] Preferência de animações reduzidas validada.
- [ ] Nenhum asset retorna 404.
- [ ] CSP não bloqueia Firebase, fontes, áudio ou imagens legítimas.
- [ ] `npm run validate:security` e `npm run validate:version` concluídos.

## Partidas

- [ ] PvE: vitória, derrota e empate.
- [ ] PvP: dois clientes tentando se parear simultaneamente.
- [ ] PvP: recarga, perda e retorno de rede.
- [ ] Abandono e revanche.
- [ ] Uma partida não concede recompensa duas vezes.
- [ ] Recarregar um cliente mantém mão, deck, turno e cartas bloqueadas consistentes.
- [ ] Uma jogada atrasada não sobrescreve o turno seguinte.

## Economia

- [ ] Compra com saldo exato.
- [ ] Compra com saldo insuficiente.
- [ ] Duplo clique na compra.
- [ ] Duas abas tentando comprar ao mesmo tempo.
- [ ] Evolução de deck concorrente.
- [ ] Replay de uma liquidação antiga não concede saldo novamente.

## Firebase

- [ ] Rules atuais exportadas e comparadas com `firestore.rules`.
- [ ] Rules e índices aprovados no Emulator Suite.
- [ ] Testes com dois usuários confirmam isolamento entre documentos.
- [ ] App Check validado antes de habilitar enforcement.
- [ ] TTL habilitado somente após verificar `expiresAt` e `presenceExpiresAt`.
- [ ] Nenhuma credencial administrativa está no repositório.

## Web/PWA

- [ ] Primeira abertura online.
- [ ] Reabertura com cache.
- [ ] Tela offline.
- [ ] Atualização aguardando o fim de uma partida.
- [ ] Manifesto e ícones validados.

## Windows

- [ ] Login Google abre somente em janela autorizada.
- [ ] Links externos abrem no navegador padrão.
- [ ] Atualização baixa sem encerrar uma partida.
- [ ] Nova versão é aplicada ao sair e reabrir.
- [ ] Instalador assinado e assinatura verificada pelo Windows.
- [ ] Navegação bloqueia esquemas e janelas não autorizados.
