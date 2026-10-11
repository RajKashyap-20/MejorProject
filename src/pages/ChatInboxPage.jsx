import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer.jsx";
import { apiRequest } from "../lib/api.js";

function ChatInboxPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadConversations() {
      try {
        const result = await apiRequest("/api/conversations", {
          signal: controller.signal,
        });
        setConversations(result.conversations);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadConversations();
    return () => controller.abort();
  }, []);

  return (
    <PageContainer className="chat-page">
      <header className="feed-heading">
        <div>
          <p className="eyebrow">Private conversations</p>
          <h1>Your chats</h1>
          <p>One-to-one chats open only after the problem author approves a solution.</p>
        </div>
      </header>

      {loading && <div className="feed-message" role="status">Loading chats…</div>}
      {error && (
        <div className="feed-message feed-error" role="alert">
          <h2>We couldn’t load your chats</h2>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && conversations.length === 0 && (
        <div className="feed-empty">
          <span className="empty-state-mark empty-state-green" aria-hidden="true">↗</span>
          <h2>No conversations yet</h2>
          <p>When a solution is approved, its author and provider can start a private chat.</p>
          <Link className="button button-secondary" to="/feed">Explore questions</Link>
        </div>
      )}
      {conversations.length > 0 && (
        <div className="chat-inbox-list">
          {conversations.map((conversation) => (
            <Link
              className="chat-inbox-card"
              key={conversation.id}
              to={`/chat/${conversation.id}`}
            >
              <span className="chat-peer-avatar">
                {conversation.peer.profilePictureUrl ? (
                  <img alt="" src={conversation.peer.profilePictureUrl} />
                ) : conversation.peer.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="chat-inbox-copy">
                <strong>{conversation.peer.name}</strong>
                <span>{conversation.problem.title}</span>
                <small>{conversation.problem.subject}</small>
              </span>
              {conversation.unreadCount > 0 && (
                <span className="chat-unread-count">
                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                </span>
              )}
              <span className="chat-inbox-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default ChatInboxPage;
