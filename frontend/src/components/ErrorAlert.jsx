import { toFriendlyError } from "../errors.js";

const ICONS = {
  danger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 2.5 20h19z" />
      <line x1="12" y1="10" x2="12" y2="14.5" />
      <circle cx="12" cy="17.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.5" r="0.5" fill="currentColor" />
    </svg>
  ),
};

export default function ErrorAlert({ error, action, onDismiss }) {
  const { kind, title, message, hint } = toFriendlyError(error);
  const variant = kind === "info" ? "info" : kind === "warn" || kind === "network" ? "warn" : "danger";
  const icon = ICONS[variant] || ICONS.danger;

  return (
    <div className={`alert alert--${variant}`} role="alert">
      <span className="alert__icon">{icon}</span>
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {message && <p className="alert__msg">{message}</p>}
        {hint && <p className="alert__hint">{hint}</p>}
        {action && <div className="alert__actions">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" className="alert__close" onClick={onDismiss} aria-label="Fechar">
          ×
        </button>
      )}
    </div>
  );
}
