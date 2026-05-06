import { AppError } from "./api.js";

export function toFriendlyError(err) {
  if (err instanceof AppError) {
    return {
      kind: err.kind || "danger",
      title: err.title,
      message: err.message,
      hint: err.hint,
    };
  }

  const raw = err?.message || String(err);

  if (/snapshot not found/i.test(raw) || /^no snapshot$/i.test(raw)) {
    return {
      kind: "info",
      title: "Nenhuma captura ainda",
      message: "Suba seu primeiro export do Instagram para começar.",
    };
  }

  if (/quotaexceeded|quota/i.test(raw)) {
    return {
      kind: "warn",
      title: "Sem espaço no navegador",
      message: "O IndexedDB do navegador está cheio. Apague capturas antigas em /snapshots e tenta de novo.",
    };
  }

  if (/networkerror|failed to fetch|load failed/i.test(raw)) {
    return {
      kind: "warn",
      title: "Sem conexão com o servidor",
      message: "Não conseguimos falar com o backend. Verifica sua conexão e se o servidor está no ar.",
    };
  }

  return {
    kind: "danger",
    title: "Algo deu errado",
    message: raw,
  };
}
