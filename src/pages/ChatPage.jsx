import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";
import ImageUploadField from "../components/ui/ImageUploadField.jsx";

const POLL_INTERVAL_MS = 4000;

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function mergeMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
  );
}

function ChatPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [imageAttachment, setImageAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollTarget = useRef(null);
  const polling = useRef(false);

  const fetchMessages = useCallback(async (after) => {
    const query = after ? `?after=${encodeURIComponent(after)}` : "";
    const result = await apiRequest(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages${query}`,
    );
    setMessages((current) => mergeMessages(current, result.messages));
    return result.messages;
  }, [conversationId]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadConversation() {
      setLoading(true);
      setError("");
      try {
        const result = await apiRequest(
          `/api/conversations/${encodeURIComponent(conversationId)}`,
          { signal: controller.signal },
        );
        if (!active) return;
        setConversation(result.conversation);
        await fetchMessages();
      } catch (loadError) {
        if (active && loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadConversation();
    return () => {
      active = false;
      controller.abort();
    };
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (loading || !conversation) return undefined;
    const timer = window.setInterval(async () => {
      if (polling.current) return;
      polling.current = true;
      try {
        const lastMessage = messages[messages.length - 1];
        await fetchMessages(lastMessage?.createdAt);
      } catch (pollError) {
        setError(pollError.message);
      } finally {
        polling.current = false;
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [conversation, fetchMessages, loading, messages]);

  useEffect(() => {
    scrollTarget.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    if ((!text.trim() && !imageAttachment) || sending) return;
    setSending(true);
    setError("");
    try {
      const result = await apiRequest(
        `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            ...(imageAttachment ? { imagePublicId: imageAttachment.publicId } : {}),
          }),
        },
      );
      setMessages((current) => mergeMessages(current, [result.message]));
      setText("");
      setImageAttachment(null);
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <PageContainer className="chat-page">
        <div className="feed-message" role="status">Opening private chat…</div>
      </PageContainer>
    );
  }

  if (error && !conversation) {
    return (
      <PageContainer className="chat-page">
        <section className="feed-message feed-error" role="alert">
          <h1>Private chat unavailable</h1>
          <p>{error}</p>
          <Link className="button button-secondary" to="/chat">Back to your chats</Link>
        </section>
      </PageContainer>
    );
  }

  const participantMessage = (message) => message.senderId === user?.id;

  return (
    <PageContainer className="chat-page">
      <Link className="back-link" to="/chat">← All chats</Link>
      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Private one-to-one chat</p>
            <h1>{conversation.peer.name}</h1>
            <Link to={`/problems/${conversation.problem.id}`}>
              About: {conversation.problem.title}
            </Link>
          </div>
          <span className="chat-secure-label"><span /> Approved solution</span>
        </header>

        {error && <p className="chat-inline-error" role="alert">{error}</p>}

        <div className="chat-messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-first-message">
              <span aria-hidden="true">✳</span>
              <p>This private chat is just between you and {conversation.peer.name}.</p>
              <small>Say hello or continue working through the problem together.</small>
            </div>
          )}
          {messages.map((message) => (
            <article
              className={`chat-message${participantMessage(message) ? " chat-message-own" : ""}`}
              key={message.id}
            >
              <p>{message.text}</p>
              {message.imageUrl && (
                <a href={message.imageUrl} rel="noreferrer" target="_blank">
                  <img alt="Private chat attachment" className="chat-message-image" src={message.imageUrl} />
                </a>
              )}
              <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            </article>
          ))}
          <div ref={scrollTarget} />
        </div>

        <form className="chat-compose" onSubmit={sendMessage}>
          <div className="chat-compose-inputs">
            <label className="visually-hidden" htmlFor="chat-message">Write a message</label>
            <textarea
              id="chat-message"
              maxLength={5000}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write a thoughtful message…"
              rows={2}
              value={text}
            />
            <ImageUploadField
              onUploaded={setImageAttachment}
              purpose="chat"
              resourceId={conversationId}
            />
            {imageAttachment && (
              <div className="chat-attachment-preview">
                <img alt="Private image attachment preview" src={imageAttachment.imageUrl} />
                <button onClick={() => setImageAttachment(null)} type="button">Remove</button>
              </div>
            )}
          </div>
          <button
            className="button button-primary"
            disabled={sending || (!text.trim() && !imageAttachment)}
            type="submit"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </section>
    </PageContainer>
  );
}

export default ChatPage;
