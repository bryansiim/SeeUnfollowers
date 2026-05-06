import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listSnapshots } from "../db.js";
import ErrorAlert from "../components/ErrorAlert.jsx";

export default function Snapshots() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSnapshots()
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

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

      <div className="toolbar fade-up fade-up--2" style={{ justifyContent: "flex-end" }}>
        <Link to="/upload" className="btn">
          Subir novo <span className="btn__arrow">→</span>
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
              Subir primeira captura <span className="btn__arrow">→</span>
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "1%" }}>№</th>
                  <th>Data</th>
                  <th>Arquivo</th>
                  <th style={{ textAlign: "right" }}>Seguidores</th>
                  <th style={{ textAlign: "right" }}>Seguindo</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="cell--num">
                      <span className="cell-row-index">#{s.id}</span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: "0.86rem" }}>
                        {new Date(s.takenAt).toLocaleString("pt-BR")}
                      </span>
                    </td>
                    <td className="muted mono" style={{ fontSize: "0.8rem" }}>
                      {s.sourceZipName}
                    </td>
                    <td className="cell--right mono">{fmt(s.followersCount)}</td>
                    <td className="cell--right mono">{fmt(s.followingCount)}</td>
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
