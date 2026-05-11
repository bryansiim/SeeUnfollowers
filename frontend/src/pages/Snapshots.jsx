import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { deleteSnapshot, listSnapshots } from "../db.js";
import ErrorAlert from "../components/ErrorAlert.jsx";

export default function Snapshots() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    listSnapshots()
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(snap) {
    const when = new Date(snap.takenAt).toLocaleString("pt-BR");
    if (!window.confirm(`Apagar a captura #${snap.id} (${when})?\n\nOs dados desta captura serão removidos do seu navegador.`)) {
      return;
    }
    setDeletingId(snap.id);
    try {
      await deleteSnapshot(snap.id);
      setItems((prev) => prev.filter((s) => s.id !== snap.id));
    } catch (e) {
      setError(e);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p className="loading">Carregando </p>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert error={error} onDismiss={() => setError(null)} />;
  }

  const fmt = (n) => (n ?? 0).toLocaleString("pt-BR");

  return (
    <>
      <header className="page-header fade-up fade-up--1">
        <h1 className="display">
          Capturas em<br />
          <em>ordem cronológica.</em>
        </h1>
        <p className="lede">
          Cada captura é o resultado de um upload. Suba mais uma a cada poucas semanas
          para acumular pontos de comparação.
        </p>
      </header>

      <div className="fade-up fade-up--2 row--end">
        <Link to="/upload" className="btn">
          Subir nova <span className="btn__arrow">→</span>
        </Link>
      </div>

      <div className="card fade-up fade-up--3">
        {items.length === 0 ? (
          <div className="empty">
            <span className="empty__mark">+</span>
            <h2 className="empty__title">
              Nenhuma captura <em>ainda</em>
            </h2>
            <p className="empty__desc">
              Comece subindo seu primeiro export do Instagram.
            </p>
            <Link to="/upload" className="btn">
              Subir nova captura <span className="btn__arrow">→</span>
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table--stack-mobile">
              <thead>
                <tr>
                  <th className="col-shrink">№</th>
                  <th>Data</th>
                  <th>Arquivo</th>
                  <th className="cell--right">Seguidores</th>
                  <th className="cell--right">Seguindo</th>
                  <th className="col-shrink"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="cell--num">
                      <span className="cell-row-index">#{s.id}</span>
                    </td>
                    <td data-label="data">
                      <span className="mono col-meta">
                        {new Date(s.takenAt).toLocaleString("pt-BR")}
                      </span>
                    </td>
                    <td className="muted mono col-meta--xs" data-label="arquivo">
                      {s.sourceZipName}
                    </td>
                    <td className="cell--right mono" data-label="seguidores">{fmt(s.followersCount)}</td>
                    <td className="cell--right mono" data-label="seguindo">{fmt(s.followingCount)}</td>
                    <td className="cell--right" data-label="ação">
                      <button
                        type="button"
                        className="btn btn--ghost btn--icon btn--danger"
                        onClick={() => handleDelete(s)}
                        disabled={deletingId === s.id}
                        aria-label={`Apagar captura #${s.id}`}
                        title="Apagar esta captura"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
