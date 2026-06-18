# BUPPO Desktop

Este pacote usa Electron para gerar uma versão Windows do BUPPO.

## Rodar em modo desktop

```powershell
npm install
npm run desktop
```

## Gerar executavel Windows portatil

```powershell
npm install
npm run dist:win
```

O executavel final sera gerado em:

```text
dist-desktop/BUPPO-0.1.0-Windows.exe
```

## Gerar instalador Windows

```powershell
npm install
npm run dist:win:installer
```

Observacao: o build desktop nao altera a versao PWA nem o pacote Android.
