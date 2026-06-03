# Max Stack — erro após atualizar (porta 3847)

## Por que `http://127.0.0.1:3847/` não abre?

O Max Stack **não é só um atalho no navegador**. Essa URL só funciona quando o **servidor Node** está rodando na porta **3847**.

Depois de `git pull` ou atualizar arquivos:

1. O processo antigo na 3847 **foi encerrado** (ou ficou com API antiga).
2. O atalho / link abre o navegador **antes** do `npm start` terminar o build da UI (`prestart` → `build:web`).
3. Falta `npm install` se mudaram dependências no `package.json`.

## Sintomas na tela

- Navegador: *não é possível acessar* / conexão recusada.
- UI: **Offline — rode npm start** ou **API desatualizada ou offline**.

## Solução (Windows)

```bat
cd c:\_PROJETOS\max-coding
Atualizar-e-Iniciar-Max.bat
```

Ou manualmente:

```bat
Parar-Max.bat
npm install
npm start
```

Espere no terminal: `Max Stack: http://127.0.0.1:3847 (React build)`  
Depois abra o link.

## Atalho na área de trabalho

O `.lnk` só abre a URL. Sempre use **`MaxStack.cmd`** ou **`Atualizar-e-Iniciar-Max.bat`** após atualizar o repositório.

## Conferir se está online

```powershell
Invoke-WebRequest http://127.0.0.1:3847/api/status
```

Deve retornar JSON com `"ok": true` e `"version": "0.31.0"`.
