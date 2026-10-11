import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api.js";

function HelpfulButton({ problemId, count, reacted, authenticated }) {
  const [reaction, setReaction] = useState({ count, reacted });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggleReaction() {
    if (saving) return;
    setSaving(true);
    setError("");

    const previous = reaction;
    const shouldReact = !reaction.reacted;
    setReaction({
      count: Math.max(0, reaction.count + (shouldReact ? 1 : -1)),
      reacted: shouldReact,
    });

    try {
      const result = await apiRequest(
        `/api/problems/${encodeURIComponent(problemId)}/reaction`,
        { method: shouldReact ? "POST" : "DELETE" },
      );
      setReaction(result);
    } catch (requestError) {
      setReaction(previous);
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="helpful-control">
      {authenticated ? (
        <button
          aria-pressed={reaction.reacted}
          className={`helpful-button${reaction.reacted ? " helpful-button-active" : ""}`}
          disabled={saving}
          onClick={toggleReaction}
          type="button"
        >
          <span aria-hidden="true">♡</span>
          Helpful
          <span className="helpful-count">{reaction.count}</span>
        </button>
      ) : (
        <Link className="helpful-button" to="/login">
          <span aria-hidden="true">♡</span>
          Helpful
          <span className="helpful-count">{reaction.count}</span>
        </Link>
      )}
      {error && <span className="helpful-error" role="alert">{error}</span>}
    </div>
  );
}

export default HelpfulButton;
