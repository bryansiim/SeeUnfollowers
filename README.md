# SeeUnfollowers

App pessoal pra detectar quem deixou de te seguir no Instagram, comparando exports do "Download your data".

## Como usar

1. Peça seus dados em [Instagram Accounts Center → Download your information](https://accountscenter.instagram.com/info_and_permissions/dyi/) — formato **JSON**.
2. Quando o e-mail do Instagram chegar, baixe o `.zip` (precisa logar no Instagram pra baixar).
3. Suba o `.zip` no app via drag & drop. O backend parseia o zip e o snapshot é salvo no IndexedDB do navegador.
4. Repita o processo de tempos em tempos (ex.: a cada mês). A partir do segundo snapshot, o app passa a mostrar quem deixou de te seguir.

## Verificações

- **Quem deixou de te seguir** (precisa de 2+ snapshots): compara `followers` entre o snapshot anterior e o atual. Mostra um badge **"ainda sigo"** pros casos em que a outra pessoa parou de te seguir mas você continua seguindo — esses são os que normalmente importam mais.
- **Você segue mas não te seguem de volta** (com 1 snapshot só): lista ruidosa, inclui famosos/marcas. Útil pra limpeza geral, mas não é o foco principal.

## Stack

- **Backend:** Python 3.12 + FastAPI — apenas parser de zip, não persiste nada.
- **Frontend:** React 18 + Vite + React Router + react-dropzone + Dexie (IndexedDB).
- **Storage:** IndexedDB no navegador. O histórico fica vinculado ao navegador/perfil — limpar dados do site apaga o histórico.

## Rodando local

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate         # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. O Vite faz proxy de `/api/*` pra `http://127.0.0.1:8000`.

## Rodando com Docker

```bash
docker compose up --build
```

Abra http://localhost:8080.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | health check |
| POST | `/api/parse` | multipart `file=<.zip>` → JSON com `followers`, `following`, `recently_unfollowed` parseados (não persiste) |

## Estrutura

```
backend/
  app/
    main.py            FastAPI + CORS + endpoint /api/parse
    config.py          CORS origins
    parsers.py         lê os JSONs do export do Instagram
frontend/
  src/
    api.js             wrapper de fetch (parseZip)
    db.js              Dexie schema + CRUD + analyzers
    App.jsx            roteamento
    pages/
      Upload.jsx
      Unfollowers.jsx       <- a tela mais importante
      NotFollowingBack.jsx
      Snapshots.jsx
    components/UserCard.jsx
```

## Privacidade

Os dados ficam **só na sua máquina**. O backend só parseia o zip e devolve JSON — nada é persistido no servidor. O snapshot fica no IndexedDB do seu navegador.

**Limitações conhecidas:**
- O histórico é per-origin per-browser. Não sincroniza entre dispositivos ou navegadores diferentes.
- Limpar dados do site (clear site data) apaga os snapshots.
- Modo anônimo: snapshots são descartados ao fechar a janela.
