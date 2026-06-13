# BUPPO Android (TWA)

Este projeto Android cria um APK/AAB do BUPPO usando Trusted Web Activity.

Por que TWA:
- abre o jogo como app instalado
- continua carregando o conteudo da web, entao o jogo se atualiza sem novo APK para cada mudanca
- preserva melhor login Google do que um WebView embutido simples

## URL atual

O app esta configurado para abrir:

`https://victorfrancodacosta.github.io/buppo-game/`

## Antes de gerar o APK

Para o TWA ficar realmente estavel, voce precisa publicar um arquivo `assetlinks.json`
no dominio de origem do jogo.

Como o jogo hoje esta em um caminho de GitHub Pages (`/buppo-game/`), o arquivo precisa existir na raiz do dominio:

`https://victorfrancodacosta.github.io/.well-known/assetlinks.json`

Se isso nao for possivel no seu setup atual, o melhor caminho e usar um dominio proprio para o BUPPO.

## Build

1. Abra a pasta `android-twa` no Android Studio.
2. Espere o Gradle sincronizar.
3. Ajuste `applicationId` se quiser outro nome de pacote.
4. Gere sua keystore de release.
5. Pegue o SHA-256 da keystore.
6. Publique o `assetlinks.json` final no dominio.
7. Gere:
   - `Build > Build Bundle(s) / APK(s) > Build APK(s)` para APK
   - ou `Build Bundle(s) / APK(s) > Build Bundle(s)` para Play Store

## Observacao importante

Sem Android SDK/Gradle instalados nesta maquina do workspace, este repositório foi preparado,
mas o APK final precisa ser compilado no Android Studio.
