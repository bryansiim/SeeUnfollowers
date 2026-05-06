import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { computeUnfollowers, listSnapshots } from "../db.js";
import UserLink from "../components/UserCard.jsx";
import ErrorAlert from "../components/ErrorAlert.jsx";

export default function Unfollowers() {
  const [snapshots, setSnapshots] = useState([]);
  const [since, setSince] = useState("");
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("");
  const [onlyStillFollowing, setOnlyStillFollowing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSnapshots().then(setSnapshots).catch(setError);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const all = await listSnapshots();
        if (all.length < 2) {
          if (!cancelled) {
            setData(null);
            setLoading(false);
          }
          return;
        }
        const latestId = all[0].id;
        const fromId = since ? Number(since) : all[1].id;
        const items = await computeUnfollowers(fromId, latestId);
        if (cancelled) return;
        setData({
          from_snapshot_id: fromId,
          to_snapshot_id: latestId,
          count: items.length,
          items,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [since]);

  const items = useMemo(() => {
    if (!data) return [];
    return data.items.filter((it) => {
      if (onlyStillFollowing && !it.still_following) return false;
      if (filter && !it.username.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [data, filter, onlyStillFollowing]);

  if (snapshots.length < 2) {
    return (
      <div className="card card--hero fade-up fade-up--1">
        <div className="empty">
          <span className="empty__mark">+</span>
          <h2 className="empty__title">
            Você precisa de <em>duas</em> capturas
          </h2>
          <p className="empty__desc">
            Esta verificação compara dois exports do Instagram em momentos diferentes.
            Suba mais um <code>.zip</code> para começar a detectar unfollows.
          </p>
          <Link to="/upload" className="btn">
            Subir captura <span className="btn__arrow">→</span>
          </Link>
        </div>
      </div>
    );
  }

  const stillFollowingCount = data?.items.filter((i) => i.still_following).length ?? 0;

  return (
    <>
      <header className="page-header fade-up fade-up--1">
        <h1 className="display">
          Quem deixou<br />
          <em>de te seguir.</em>
        </h1>
        <p className="lede">
          Compara seguidores entre duas capturas. A coluna{" "}
          <strong>Você ainda segue?</strong> destaca os casos em que a outra pessoa parou
          de te seguir mas você continua seguindo — esses são os que normalmente importam mais.
        </p>
      </header>

      <div className="toolbar fade-up fade-up--2">
        <div className="field">
          <span className="field__label">Comparar com</span>
          <select value={since} onChange={(e) => setSince(e.target.value)}>
            <option value="">Captura anterior</option>
            {snapshots.slice(1).map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} · {new Date(s.takenAt).toLocaleString("pt-BR")}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar__divider" />
        <div className="field">
          <input
            type="text"
            placeholder="filtrar por username…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={onlyStillFollowing}
            onChange={(e) => setOnlyStillFollowing(e.target.checked)}
          />
          Só os que ainda sigo
        </label>
        {data && (
          <span className="results-meta">
            <strong>{items.length}</strong> de {data.count}
            <span className="arrow">·</span>
            #{data.from_snapshot_id}<span className="arrow">→</span>#{data.to_snapshot_id}
          </span>
        )}
      </div>

      {data && data.count > 0 && (
        <div className="stats fade-up fade-up--3" style={{ marginTop: 0 }}>
          <div className="stat stat--accent">
            <div className="stat__label">Total de unfollows</div>
            <div className="stat__value">{data.count}</div>
          </div>
          <div className="stat">
            <div className="stat__label">Que você ainda segue</div>
            <div className="stat__value">{stillFollowingCount}</div>
          </div>
          <div className="stat">
            <div className="stat__label">Mostrando agora</div>
            <div className="stat__value">{items.length}</div>
          </div>
        </div>
      )}

      {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

      <div className="card fade-up fade-up--3">
        {loading ? (
          <p className="loading">Carregando </p>
        ) : !data || data.count === 0 ? (
          <div className="empty">
            <span className="empty__mark">✓</span>
            <h2 className="empty__title">
              Ninguém deixou de te <em>seguir.</em>
            </h2>
            <p className="empty__desc">
              Não foi detectado nenhum unfollow entre estas capturas.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty">
            <span className="empty__mark">?</span>
            <h2 className="empty__title">Nada bate com o filtro</h2>
            <p className="empty__desc">
              Tente afrouxar o filtro ou desmarcar a opção “só os que ainda sigo”.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "1%" }}>№</th>
                  <th>Username</th>
                  <th>Status</th>
                  <th></th>
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
                    <td>
                      {u.still_following ? (
                        <span className="badge badge--accent">Ainda sigo</span>
                      ) : (
                        <span className="badge badge--muted">Não sigo mais</span>
                      )}
                    </td>
                    <td className="cell--right">
                      <a
                        href={`https://www.instagram.com/${u.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn--ghost btn--small"
                      >
                        Abrir <span className="btn__arrow">↗</span>
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
