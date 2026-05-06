const BASE = "/api";

export class AppError extends Error {
  constructor({ kind, title, message, hint, status }) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.title = title;
    this.hint = hint;
    this.status = status;
  }
}

function friendlyFromDetail(rawDetail, status) {
  const detail = (rawDetail || "").toString();

  if (/no followers_.*\.json/i.test(detail) || /following\.json/i.test(detail)) {
    return {
      title: "Esse zip não parece ser um export do Instagram",
      message:
        "Não encontramos os arquivos de seguidores dentro do arquivo. Confira se você baixou em Accounts Center → Your information → Download your information, no formato JSON.",
      hint: "O arquivo certo costuma se chamar instagram-<usuario>-<data>.zip.",
    };
  }
  if (/badzipfile/i.test(detail) || /not a zip/i.test(detail)) {
    return {
      title: "Arquivo zip inválido",
      message: "O arquivo enviado não é um zip válido ou está corrompido.",
      hint: "Tente baixar o export de novo no Instagram.",
    };
  }
  if (/expected a \.zip/i.test(detail)) {
    return {
      title: "Formato inesperado",
      message: "Só aceitamos arquivos .zip aqui.",
    };
  }
  if (/expected to be a json array/i.test(detail)) {
    return {
      title: "Não consegui ler o conteúdo do export",
      message:
        "Os arquivos JSON dentro do zip estão num formato que não reconhecemos. Pode ser uma versão diferente do export do Instagram.",
    };
  }
  if (status >= 500) {
    return {
      title: "O servidor falhou ao processar",
      message: "Algo deu errado ao parsear seu zip. Tenta de novo em instantes.",
    };
  }
  return {
    title: "Não foi possível processar o arquivo",
    message: detail || "Erro desconhecido ao processar o upload.",
  };
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new AppError({
      kind: "network",
      title: "Sem conexão com o servidor",
      message: "Não conseguimos falar com o backend. Verifica sua conexão e se o servidor está no ar.",
    });
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const friendly = !res.ok
        ? friendlyFromDetail(text.slice(0, 200), res.status)
        : {
            title: "Resposta inesperada do servidor",
            message: "O backend devolveu algo que não conseguimos ler.",
          };
      throw new AppError({
        kind: !res.ok && res.status >= 500 ? "server" : "client",
        status: res.status,
        ...friendly,
      });
    }
  }

  if (!res.ok) {
    const detail = data?.detail ?? res.statusText;
    const detailStr = typeof detail === "string" ? detail : JSON.stringify(detail);
    const friendly = friendlyFromDetail(detailStr, res.status);
    throw new AppError({
      kind: res.status >= 500 ? "server" : "client",
      status: res.status,
      ...friendly,
    });
  }
  return data;
}

export async function parseZip(file) {
  const fd = new FormData();
  fd.append("file", file);
  const data = await request("/parse", { method: "POST", body: fd });
  return {
    sourceZipName: data.source_zip_name,
    takenAt: data.taken_at,
    followers: data.followers,
    following: data.following,
    recentlyUnfollowed: data.recently_unfollowed,
  };
}
