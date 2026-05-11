# SeeUnfollowers

App que mostra quem deixou de te seguir no Instagram, comparando exports do *Download your information*.

🌐 **<http://seeunfollowers.bryansiim.com.br/>**

## Como usar

1. Peça seus dados em [Instagram Accounts Center → Download your information](https://accountscenter.instagram.com/info_and_permissions/dyi/) — formato **JSON**.
2. Quando o e-mail do Instagram chegar, baixe o `.zip` (precisa logar no Instagram pra baixar).
3. Acesse o app e arraste o `.zip` na tela de upload. O snapshot fica salvo no seu navegador.
4. Repita o processo de tempos em tempos (ex.: a cada mês). A partir do segundo snapshot, o app passa a mostrar quem deixou de te seguir.

## O que ele te mostra

- **Quem deixou de te seguir** (precisa de 2+ snapshots): compara `followers` entre o snapshot anterior e o atual. Mostra um badge **"ainda sigo"** pros casos em que a outra pessoa parou de te seguir mas você continua seguindo — esses são os que normalmente importam mais.
- **Você segue mas não te seguem de volta** (com 1 snapshot só): lista ruidosa, inclui famosos/marcas. Útil pra limpeza geral.

## Privacidade

> Seus dados ficam **só na sua máquina**. O backend só parseia o zip e devolve JSON — nada é persistido no servidor. O snapshot é salvo no IndexedDB do seu navegador.

Limitações conhecidas:
- Histórico é por navegador/perfil — não sincroniza entre dispositivos.
- Limpar dados do site apaga os snapshots.
- Modo anônimo: snapshots somem ao fechar a janela.

## Stack

- **Backend:** Python 3.12 + FastAPI — apenas parser de zip, não persiste nada.
- **Frontend:** React 18 + Vite + Dexie (IndexedDB).
- **Storage:** IndexedDB no navegador.

## Contribuindo

```bash
git clone <repo> && cd SeeUnfollowers
# backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000
# frontend (em outro terminal)
cd frontend && npm install && npm run dev
```

Abra <http://localhost:5173>. O Vite faz proxy de `/api/*` pra `127.0.0.1:8000`.

PRs e issues bem-vindos.

## Licença

MIT — veja [LICENSE](LICENSE).
