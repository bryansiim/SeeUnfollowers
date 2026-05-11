import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useNavigate } from "react-router-dom";

import { parseZip } from "../api.js";
import { createSnapshot, listSnapshots } from "../db.js";
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
  const navigate = useNavigate();

  const onDrop = useCallback(
    async (files) => {
      if (!files.length) return;
      setBusy(true);
      setError(null);
      try {
        const parsed = await parseZip(files[0]);
        const snap = await createSnapshot(parsed);
        const all = await listSnapshots();
        const hasPrevious = all.some((s) => s.id !== snap.id);
        navigate(hasPrevious ? "/unfollowers" : "/not-following-back");
      } catch (e) {
        setError(e);
      } finally {
        setBusy(false);
      }
    },
    [navigate],
  );

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

      {/* ──────── COMO FUNCIONA ──────── */}
      <section
        id="como-funciona"
        className="section section--viewport fade-up fade-up--3"
      >
        <div className="section__head">
          <h2 className="section__title">
            Como <em>funciona</em>
          </h2>
        </div>

        <p className="section__intro">
          O SeeUnfollowers analisa o export oficial do seu Instagram e cruza
          duas informações: quem você segue e quem te segue. A partir disso ele
          faz <strong>duas análises complementares</strong> — uma{" "}
          <strong>precisa</strong>, que detecta unfollows reais ao longo do
          tempo, e outra <strong>ampla</strong>, que mostra todo mundo que não
          te segue de volta — incluindo famosos, marcas e contas grandes que
          nunca te seguiram.
        </p>

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
              Compara duas capturas tiradas em momentos diferentes e mostra{" "}
              <strong>exatamente</strong> quem parou de te seguir entre elas.
              É a verificação principal e o diferencial do app: nenhuma tool no
              navegador consegue fazer isso porque elas só veem o estado atual.
              Aqui você vê o histórico real.
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
              que nunca te seguiram — então é uma lista ampla, com bastante
              ruído. Útil pra limpeza geral, não pra detectar unfollows.
            </p>
            <Link to="/not-following-back" className="check__cta">
              Abrir verificação <span>→</span>
            </Link>
          </article>
        </div>

        <div className="section__scroll-cta-wrap">
          <a href="#tutorial" className="hero__scroll-cta">
            <span className="hero__scroll-label">Tutorial completo</span>
            <span className="hero__scroll-arrow" aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      {/* ──────── TUTORIAL ──────── */}
      <section id="tutorial" className="section fade-up fade-up--3">
        <div className="section__head">
          <h2 className="section__title">
            Tutorial <em>completo</em>
          </h2>
        </div>

        <div className="steps">
          <article className="step">
            <span className="step__num">1</span>
            <div className="step__kicker">No Instagram</div>
            <h3 className="step__title">Solicite seus dados</h3>
            <p className="step__body">
              Acesse{" "}
              <a
                href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
                target="_blank"
                rel="noreferrer"
              >
                Accounts Center → Your information → Download your information
              </a>
              . Escolha <strong>Some of your information</strong> e marque
              apenas <strong>Followers and following</strong> — o app só
              precisa desses dois. Selecione o formato <code>JSON</code> e
              confirme o pedido.
            </p>
          </article>

          <article className="step">
            <span className="step__num">2</span>
            <div className="step__kicker">No e-mail</div>
            <h3 className="step__title">Aguarde o link</h3>
            <p className="step__body">
              O Instagram leva de algumas horas até cerca de um dia pra liberar
              o export. Quando ficar pronto, chega um e-mail com o link de
              download — baixe o <strong>.zip</strong> direto pra sua máquina.
            </p>
          </article>

          <article className="step">
            <span className="step__num">3</span>
            <div className="step__kicker">Aqui no app</div>
            <h3 className="step__title">Solte o .zip</h3>
            <p className="step__body">
              Arraste o arquivo pra cima do dropzone no topo da página. O
              parsing roda localmente, e o app cria uma{" "}
              <strong>captura</strong> dos seus seguidores e seguindo naquele
              momento — guardada no seu navegador.
            </p>
          </article>

          <article className="step">
            <span className="step__num">4</span>
            <div className="step__kicker">Daqui 2–4 semanas</div>
            <h3 className="step__title">Repita pra comparar</h3>
            <p className="step__body">
              Faça uma nova captura a cada 2–4 semanas. A partir da{" "}
              <strong>segunda</strong>, o app passa a mostrar exatamente quem
              deixou de te seguir entre uma captura e outra — essa é a
              verificação precisa.
            </p>
          </article>
        </div>
      </section>

      {/* ──────── POR QUE É SEGURO ──────── */}
      <section className="section fade-up fade-up--3">
        <div className="section__head">
          <h2 className="section__title">
            Por que é <em>seguro</em>
          </h2>
        </div>

        <div className="compare-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th>Critério</th>
                <th>
                  <span className="col-name">Outras ferramentas</span>
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
                  <span className="compare__yes">✓</span>
                </td>
                <td className="col-ours">
                  <span className="compare__no">✕</span> nunca
                </td>
              </tr>
              <tr>
                <td>Onde os dados ficam</td>
                <td>servidor deles</td>
                <td className="col-ours">sua máquina</td>
              </tr>
              <tr>
                <td>Histórico cronológico de capturas</td>
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
                <td className="col-ours">nenhum</td>
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
