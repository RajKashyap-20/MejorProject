import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../lib/api.js";

function displayTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/api/notifications");
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await apiRequest("/api/notifications");
        if (active) setUnreadCount(result.unreadCount);
        if (active && open) setNotifications(result.notifications);
      } catch {
        if (active) setError("Notifications could not be refreshed.");
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [open]);

  async function toggleOpen() {
    const shouldOpen = !open;
    setOpen(shouldOpen);
    if (shouldOpen) await loadNotifications();
  }

  async function visitNotification(notification) {
    if (!notification.read) {
      try {
        await apiRequest(`/api/notifications/${encodeURIComponent(notification.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        setNotifications((current) => current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (readError) {
        setError(readError.message);
        return;
      }
    }
    setOpen(false);
    navigate(notification.href);
  }

  async function markAllRead() {
    try {
      await apiRequest("/api/notifications/read-all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      setError("");
    } catch (readError) {
      setError(readError.message);
    }
  }

  return (
    <div className="notification-bell-wrap">
      <button
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="notification-bell"
        onClick={toggleOpen}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section className="notification-popover" aria-label="Notifications">
          <header className="notification-popover-header">
            <div>
              <strong>Notifications</strong>
              <span>{unreadCount} unread</span>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} type="button">Mark all read</button>
            )}
          </header>
          {error && <p className="notification-error" role="alert">{error}</p>}
          {loading ? (
            <p className="notification-empty" role="status">Loading notifications…</p>
          ) : notifications.length ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <button
                  className={`notification-item${notification.read ? "" : " notification-item-unread"}`}
                  key={notification.id}
                  onClick={() => visitNotification(notification)}
                  type="button"
                >
                  <span className="notification-dot" aria-hidden="true" />
                  <span className="notification-copy">
                    <span>{notification.message}</span>
                    <small>{displayTime(notification.createdAt)}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="notification-empty">You’re all caught up.</p>
          )}
        </section>
      )}
    </div>
  );
}

export default NotificationBell;
