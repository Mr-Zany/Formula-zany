import { useNotifications } from "./NotificationContext";
import "./ToastStack.css";

export default function ToastStack() {
  const { toasts, dismissNotification } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.color}`} role="status">
          <div className="toast__lines">
            {toast.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <button
            type="button"
            className="toast__close"
            aria-label="Dismiss notification"
            onClick={() => dismissNotification(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
