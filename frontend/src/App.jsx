import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import NotFollowingBack from "./pages/NotFollowingBack.jsx";
import Snapshots from "./pages/Snapshots.jsx";
import Unfollowers from "./pages/Unfollowers.jsx";
import Upload from "./pages/Upload.jsx";

const NAV = [
  { to: "/upload", num: "01", label: "Upload" },
  { to: "/not-following-back", num: "02", label: "Não te seguem de volta" },
  { to: "/unfollowers", num: "03", label: "Unfollowers" },
  { to: "/snapshots", num: "04", label: "Histórico" },
];

export default function App() {
  return (
    <div className="app">
      <nav className="nav">
        <div className="nav__inner">
          <NavLink to="/upload" className="masthead">
            <span className="masthead__name">
              See<em>Un</em>followers
            </span>
          </NavLink>
          <div className="nav__links">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav__link${isActive ? " active" : ""}`}
              >
                <span className="nav__link-num">{item.num}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/unfollowers" element={<Unfollowers />} />
          <Route path="/not-following-back" element={<NotFollowingBack />} />
          <Route path="/snapshots" element={<Snapshots />} />
        </Routes>
      </main>

      <footer className="footer">
        Privado · roda <em>local</em> · seus dados não saem da máquina
      </footer>
    </div>
  );
}
