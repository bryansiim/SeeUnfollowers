import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link } from "react-router-dom";

import { parseZip } from "../api.js";
import {
  computeUnfollowers,
  createSnapshot,
  listSnapshots,
} from "../db.js";
import UserLink from "../components/UserCard.jsx";
import ErrorAlert from "../components/ErrorAlert.jsx";

const FAQ = [
  {
    q: "Qual a diferença entre 'Unfollowers' e 'Não te seguem de volta'?",
    a: (
      <>
        <strong>Unfollowers</strong> compara duas capturas e mostra exatamente
        quem parou de te seguir entre elas — é a verificação principal e
        precisa.{" "}
        <strong>Não te seguem de volta</strong> usa só a captura mais recente e
        lista todo mundo que você segue mas não te segue (inclui famosos,
        marcas, contas grandes que nunca seguiram você). Útil pra limpeza
        geral, mas tem muito ruído.
      </>
    ),
  },
  {
    q: "Por que preciso de duas capturas para ver quem deixou de me seguir?",
    a: (
      <>
        A primeira captura é só uma <strong>foto inicial</strong> dos seus
        seguidores. Pra detectar que alguém deixou de te seguir, o app precisa
        comparar essa foto com outra mais recente — e aí olhar quem sumiu da
        lista. É por isso que essa verificação só fica disponível a partir da
        segunda captura.
      </>
    ),
  },
  {
    q: "Funciona com conta grande (10k+ seguidores)?",
    a: (
      <>
        Sim. O parsing roda localmente e o histórico fica no IndexedDB do seu
        navegador — aguenta tranquilo dezenas de milhares de seguidores. A principal
        limitação é o tempo que o Instagram leva pra te enviar o export — pode
        demorar mais pra contas maiores.
      </>
    ),
  },
  {
    q: "Quanto tempo eu devo esperar entre uma captura e outra?",
    a: (
      <>
        Entre <strong>2 e 4 semanas</strong> costuma ser o intervalo ideal. Tempo
        suficiente pra acumular movimentações reais, sem deixar muita coisa
        passar. O Instagram demora algumas horas pra liberar o export depois que
        você pede — então não dá pra fazer duas capturas no mesmo dia.
      </>
    ),
  },
  {
    q: "Meus dados saem da minha máquina?",
    a: (
      <>
        <strong>Não.</strong> O SeeUnfollowers roda 100% local — o backend
        Python só parseia o zip e o histórico fica no IndexedDB do seu próprio
        navegador. Nada é enviado pra nenhum servidor externo. Você é dono do
        processo de ponta a ponta.
      </>
    ),
  },
  {
    q: "Por que JSON e não HTML no export do Instagram?",
    a: (
      <>
        Quando você pede o export, o Instagram pergunta o formato. Escolha{" "}
        <strong>JSON</strong> — é mais rápido de parsear, mais preciso e tem
        menos ambiguidade que o HTML. O app só aceita JSON.
      </>
    ),
  },
];

export default function Upload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const parsed = await parseZip(files[0]);
      const snap = await createSnapshot(parsed);
      const all = await listSnapshots();
      const previous = all.find((s) => s.id !== snap.id);
      const newUnfollowers = previous
        ? await computeUnfollowers(previous.id, snap.id)
        : [];
      setResult({
        snapshot_id: snap.id,
        followers: snap.followersCount,
        following: snap.followingCount,
        previous_snapshot_id: previous?.id ?? null,
        new_unfollowers: newUnfollowers,
      });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/zip": [".zip"], "application/x-zip-compressed": [".zip"] },
    multiple: false,
    disabled: busy,
  });

  const dropzoneClass = [
    "dropzone",
    isDragActive && "dropzone--active",
    busy && "dropzone--busy",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <section className="hero">
        <header className="page-header fade-up fade-up--1">
          <h1 className="display">
            Descubra quem<br /><em>deixou de te seguir.</em>
          </h1>
          <p className="lede">
            Baixe seus dados em{" "}
            <a
              href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
              target="_blank"
              rel="noreferrer"
            >
              Accounts Center → Your information → Download your information
            </a>
            . Quando o e-mail chegar com o <strong>.zip</strong>, arraste aqui — o app
            parseia e cria uma <strong>captura</strong> dos seus seguidores naquele
            momento.
          </p>
        </header>

        <div className="card card--featured fade-up fade-up--2">
          <div className="card__kicker">
            <span className="num">○</span> Drop · <span>.zip</span>
          </div>

          <div {...getRootProps()} className={dropzoneClass}>
            <input {...getInputProps()} />
            {busy ? (
              <>
                <span className="dropzone__mark">⌁</span>
                <p className="dropzone__pulse">Processando captura</p>
              </>
            ) : isDragActive ? (
              <>
                <span className="dropzone__mark">↓</span>
                <p className="dropzone__title">
                  Solte para <em>capturar</em>
                </p>
                <p className="dropzone__hint">arquivo zip do instagram</p>
              </>
            ) : (
              <>
                <span className="dropzone__mark">+</span>
                <p className="dropzone__title">
                  Arraste o <em>.zip</em> aqui
                </p>
                <p className="dropzone__hint">
                  ou clique para selecionar &nbsp;·&nbsp; <code>instagram-export.zip</code>
                </p>
              </>
            )}
          </div>
        </div>

        <a href="#como-funciona" className="hero__scroll-cta fade-up fade-up--3">
          <span className="hero__scroll-label">Como funciona</span>
          <span className="hero__scroll-arrow" aria-hidden="true">↓</span>
        </a>
      </section>

      {error && (
        <div className="fade-in">
          <ErrorAlert error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {result && (
        <div className="card card--hero fade-in">
          <div className="row row--spread row--baseline" style={{ marginBottom: "0.25rem" }}>
            <div>
              <div className="card__kicker">
                <span className="num">#{result.snapshot_id}</span> Captura criada
              </div>
              <h2 className="card__title">
                Registro feito com <em>sucesso</em>.
              </h2>
            </div>
            <Link to="/unfollowers" className="btn btn--ghost">
              Ver unfollowers <span className="btn__arrow">→</span>
            </Link>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat__label">Seguidores</div>
              <div className="stat__value">{result.followers.toLocaleString("pt-BR")}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Seguindo</div>
              <div className="stat__value">{result.following.toLocaleString("pt-BR")}</div>
            </div>
            <div className={`stat${result.new_unfollowers.length > 0 ? " stat--accent" : ""}`}>
              <div className="stat__label">Novos unfollowers</div>
              <div className="stat__value">{result.new_unfollowers.length}</div>
            </div>
          </div>

          {result.previous_snapshot_id == null ? (
            <p className="muted" style={{ maxWidth: "60ch" }}>
              Essa é sua primeira captura. Suba outra daqui a alguns dias ou semanas
              para começar a detectar quem deixou de te seguir.
            </p>
          ) : result.new_unfollowers.length === 0 ? (
            <p className="muted">
              Ninguém deixou de te seguir desde a captura anterior.
            </p>
          ) : (
            <div className="table-wrap" style={{ marginTop: "0.5rem" }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "1%" }}>№</th>
                    <th>Username</th>
                    <th>Você ainda segue?</th>
                  </tr>
                </thead>
                <tbody>
                  {result.new_unfollowers.map((u, i) => (
                    <tr key={u.username}>
                      <td className="cell--num">
                        <span className="cell-row-index">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <UserLink username={u.username} />
                      </td>
                      <td>
                        {u.still_following ? (
                          <span className="badge badge--good">Ainda sigo</span>
                        ) : (
                          <span className="badge badge--muted">Não</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──────── COMO FUNCIONA ──────── */}
      <section id="como-funciona" className="section fade-up fade-up--3">
        <div className="section__head">
          <h2 className="section__title">
            Como <em>funciona</em>
          </h2>
          <span className="section__sub">3 passos · ~10 minutos</span>
        </div>

        <div className="steps">
          <article className="step">
            <span className="step__num">1</span>
            <div className="step__kicker">No Instagram</div>
            <h3 className="step__title">Peça seus dados</h3>
            <p className="step__body">
              Vá em{" "}
              <a
                href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
                target="_blank"
                rel="noreferrer"
              >
                Accounts Center
              </a>{" "}
              e peça o download do seu information no formato{" "}
              <code>JSON</code>. O e-mail demora algumas horas pra chegar.
            </p>
          </article>

          <article className="step">
            <span className="step__num">2</span>
            <div className="step__kicker">Aqui no app</div>
            <h3 className="step__title">Solte o .zip</h3>
            <p className="step__body">
              Quando o e-mail chegar, baixe o zip e arraste pra cima do
              dropzone. O app parseia tudo localmente e salva como uma{" "}
              <strong>captura</strong>.
            </p>
          </article>

          <article className="step">
            <span className="step__num">3</span>
            <div className="step__kicker">Daqui ~30 dias</div>
            <h3 className="step__title">Repita o processo</h3>
            <p className="step__body">
              Faça uma nova captura a cada 2–4 semanas. A partir da{" "}
              <strong>segunda</strong>, o app passa a mostrar exatamente quem
              deixou de te seguir entre uma e outra.
            </p>
          </article>
        </div>
      </section>

      {/* ──────── DUAS VERIFICAÇÕES ──────── */}
      <section className="section fade-up fade-up--3">
        <div className="section__head">
          <h2 className="section__title">
            Duas <em>verificações</em>, finalidades diferentes
          </h2>
          <span className="section__sub">precisão × abrangência</span>
        </div>

        <div className="checks">
          <article className="check check--primary">
            <div className="check__head">
              <span className="check__badge check__badge--precise">Preciso</span>
              <span className="check__req">2+ capturas</span>
            </div>
            <h3 className="check__title">
              Quem deixou de <em>te seguir</em>
            </h3>
            <p className="check__desc">
              Compara duas capturas e mostra <strong>exatamente</strong> quem
              parou de te seguir entre elas. É a verificação principal e a razão
              de existir do app. Destaca quem você ainda segue mas não te segue
              de volta — esses costumam ser os casos que importam.
            </p>
            <Link to="/unfollowers" className="check__cta">
              Abrir unfollowers <span>→</span>
            </Link>
          </article>

          <article className="check">
            <div className="check__head">
              <span className="check__badge check__badge--rough">Aproximado</span>
              <span className="check__req">1 captura basta</span>
            </div>
            <h3 className="check__title">
              Não te <em>seguem de volta</em>
            </h3>
            <p className="check__desc">
              Olha a captura mais recente e lista todo mundo que você segue mas
              não te segue. <strong>Inclui famosos, marcas e contas grandes</strong>{" "}
              que nunca te seguiram — então é uma lista ruidosa. Útil pra
              limpeza geral, mas não detecta unfollows.
            </p>
            <Link to="/not-following-back" className="check__cta">
              Abrir verificação <span>→</span>
            </Link>
          </article>
        </div>
      </section>

      {/* ──────── POR QUE É SEGURO ──────── */}
      <section className="section fade-up fade-up--3">
        <div className="section__head">
          <h2 className="section__title">
            Por que é <em>seguro</em>
          </h2>
          <span className="section__sub">comparativo com outras tools</span>
        </div>

        <div className="compare-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th>Critério</th>
                <th>
                  <span className="col-name">Apps com login</span>
                </th>
                <th>
                  <span className="col-name">Tools no navegador</span>
                </th>
                <th className="col-ours">
                  <span className="col-name">SeeUnfollowers</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pede seu login do Instagram</td>
                <td>
                  <span className="compare__no">✕</span>
                </td>
                <td>
                  <span className="compare__yes">✓</span>
                </td>
                <td className="col-ours">
                  <span className="compare__yes">✓</span> nunca
                </td>
              </tr>
              <tr>
                <td>Onde os dados ficam</td>
                <td>servidor deles</td>
                <td>navegador deles</td>
                <td className="col-ours">sua máquina</td>
              </tr>
              <tr>
                <td>Detecta unfollows ao longo do tempo</td>
                <td>
                  <span className="compare__yes">✓</span>
                </td>
                <td>
                  <span className="compare__no">✕</span>
                </td>
                <td className="col-ours">
                  <span className="compare__yes">✓</span>
                </td>
              </tr>
              <tr>
                <td>Histórico cronológico de capturas</td>
                <td>
                  <span className="compare__no">✕</span>
                </td>
                <td>
                  <span className="compare__no">✕</span>
                </td>
                <td className="col-ours">
                  <span className="compare__yes">✓</span>
                </td>
              </tr>
              <tr>
                <td>Risco de ban por uso de API</td>
                <td>alto</td>
                <td>nenhum</td>
                <td className="col-ours">nenhum</td>
              </tr>
              <tr>
                <td>Custo</td>
                <td>grátis ou pago</td>
                <td>grátis</td>
                <td className="col-ours">grátis e open</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ──────── FAQ ──────── */}
      <section className="section fade-up fade-up--3">
        <div className="section__head">
          <h2 className="section__title">
            Perguntas <em>frequentes</em>
          </h2>
          <span className="section__sub">{FAQ.length} perguntas</span>
        </div>

        <div className="faq">
          {FAQ.map((item, i) => (
            <details key={i} className="faq__item">
              <summary>
                <span className="faq__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="faq__q">{item.q}</span>
                <span className="faq__chev">+</span>
              </summary>
              <div className="faq__a">{item.a}</div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
