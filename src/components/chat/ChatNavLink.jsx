import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiRequest } from "../../lib/api.js";

function ChatNavLink() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function refreshCount() {
      try {
        const result = await apiRequest("/api/conversations");
        if (active) {
          setUnreadCount(result.unreadCount);
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      }
    }

    refreshCount();
    const timer = window.setInterval(refreshCount, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <NavLink
      aria-label={error ? `Messages unavailable: ${error}` : `Messages${unreadCount ? `, ${unreadCount} unread` : ""}`}
      className="nav-login nav-messages-link"
      to="/chat"
    >
      Messages
      {unreadCount > 0 && (
        <span className="nav-unread-count">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </NavLink>
  );
}

export default ChatNavLink;
