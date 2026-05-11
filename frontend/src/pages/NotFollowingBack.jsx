import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { computeNotFollowingBack, listSnapshots } from "../db.js";
import UserLink from "../components/UserCard.jsx";
import ErrorAlert from "../components/ErrorAlert.jsx";

export default function NotFollowingBack() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSnapshots, setHasSnapshots] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const all = await listSnapshots();
        if (all.length === 0) {
          setHasSnapshots(false);
          return;
        }
        const latest = all[0];
        const items = await computeNotFollowingBack(latest.id);
        setData({
          snapshot_id: latest.id,
          taken_at: latest.takenAt,
          count: items.length,
          items,
        });
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(() => {
    if (!data) return [];
    if (!filter) return data.items;
    return data.items.filter((i) => i.username.toLowerCase().includes(filter.toLowerCase()));
  }, [data, filter]);

  if (loading) {
    return (
      <div className="card">
        <p className="loading">Carregando </p>
      </div>
    );
  }

  if (!hasSnapshots) {
    return (
      <div className="card card--hero fade-up fade-up--1">
        <div className="empty">
          <span className="empty__mark">+</span>
          <h2 className="empty__title">
            Nenhuma <em>captura</em> ainda
          </h2>
          <p className="empty__desc">
            Suba seu primeiro export do Instagram para começar.
          </p>
          <Link to="/upload" className="btn">
            Subir captura <span className="btn__arrow">→</span>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert error={error} onDismiss={() => setError(null)} />;
  }

  return (
    <>
      <header className="page-header fade-up fade-up--1">
        <h1 className="display">
          Você segue,<br />
          mas <em>não retornam.</em>
        </h1>
        <p className="lede">
          Lista baseada apenas na captura mais recente.{" "}
          <strong>Inclui famosos, marcas e contas grandes</strong> — para detectar
          realmente quem deixou de te seguir, use a aba{" "}
          <Link to="/unfollowers">Quem deixou de seguir</Link>.
        </p>
      </header>

      <div className="card fade-up fade-up--3">
        <div className="toolbar toolbar--embedded">
          <div className="field">
            <input
              type="text"
              placeholder="filtrar por username…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <span className="results-meta">
            captura #{data.snapshot_id}
            <span className="arrow">·</span>
            {new Date(data.taken_at).toLocaleString("pt-BR")}
          </span>
        </div>
        {data.count === 0 ? (
          <div className="empty">
            <span className="empty__mark">✓</span>
            <h2 className="empty__title">
              Todo mundo te <em>retorna.</em>
            </h2>
            <p className="empty__desc">
              Todas as contas que você segue te seguem de volta. Raridade.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty">
            <span className="empty__mark">?</span>
            <h2 className="empty__title">Nada bate com o filtro</h2>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table--compact">
              <thead>
                <tr>
                  <th className="col-shrink">№</th>
                  <th>Username</th>
                  <th className="cell--right">
                    <span className="results-meta">
                      <strong>{items.length}</strong> de {data.count}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((u, i) => (
                  <tr key={u.username}>
                    <td className="cell--num">
                      <span className="cell-row-index">
                        {String(i + 1).padStart(3, "0")}
                      </span>
                    </td>
                    <td>
                      <UserLink username={u.username} />
                    </td>
                    <td className="cell--right">
                      <a
                        href={`https://www.instagram.com/${u.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn--ghost btn--small"
                      >
                        <span className="btn__label">Abrir </span>
                        <span className="btn__arrow">↗</span>
                      </a>
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
