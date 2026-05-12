import { useEffect, useRef } from "react";

const ICONS = {
  danger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  ),
  warn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 2.5 20h19z" />
      <line x1="12" y1="10" x2="12" y2="14.5" />
      <circle cx="12" cy="17.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.5" r="0.5" fill="currentColor" />
    </svg>
  ),
};

export default function ConfirmDialog({
  open,
  title,
  message,
  hint,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    cancelRef.current?.focus();

    function onKey(e) {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        onCancel?.();
      }
      if (e.key === "Tab") {
        const focusables = [cancelRef.current, confirmRef.current].filter(Boolean);
        if (focusables.length < 2) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const icon = ICONS[variant] || ICONS.danger;

  return (
    <div
      className="confirm-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel?.();
      }}
    >
      <div
        className={`confirm confirm--${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={message ? "confirm-msg" : undefined}
      >
        <div className="confirm__head">
          <span className="confirm__icon" aria-hidden="true">{icon}</span>
          <div className="confirm__heading">
            <h2 id="confirm-title" className="confirm__title">{title}</h2>
            {message && <p id="confirm-msg" className="confirm__msg">{message}</p>}
            {hint && <p className="confirm__hint">{hint}</p>}
          </div>
        </div>

        <div className="confirm__actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn confirm__cta confirm__cta--${variant}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Apagando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
