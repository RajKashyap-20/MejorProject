import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../lib/api.js";
import ImageUploadField from "../ui/ImageUploadField.jsx";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

function SolutionsPanel({ problem, viewerId }) {
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState([]);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [startingId, setStartingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSolutions() {
      setLoading(true);
      setError("");
      try {
        const result = await apiRequest(
          `/api/problems/${encodeURIComponent(problem.id)}/solutions`,
          { signal: controller.signal },
        );
        setSolutions(result.solutions);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadSolutions();
    return () => controller.abort();
  }, [problem.id]);

  async function submitSolution(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await apiRequest(
        `/api/problems/${encodeURIComponent(problem.id)}/solutions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, imageUrl }),
        },
      );
      setSolutions((current) => [...current, result.solution]);
      setContent("");
      setImageUrl("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function decide(solutionId, status) {
    setWorkingId(solutionId);
    setError("");
    try {
      const result = await apiRequest(
        `/api/solutions/${encodeURIComponent(solutionId)}/decision`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      setSolutions((current) => current.map((solution) =>
        solution.id === solutionId ? result.solution : solution,
      ));
    } catch (decisionError) {
      setError(decisionError.message);
    } finally {
      setWorkingId("");
    }
  }

  async function startChat(solutionId) {
    setStartingId(solutionId);
    setError("");
    try {
      const result = await apiRequest("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solutionId }),
      });
      navigate(`/chat/${result.conversationId}`);
    } catch (startError) {
      setError(startError.message);
      setStartingId("");
    }
  }

  const isProblemAuthor = viewerId === problem.author.id;

  return (
    <section className="solutions-section" aria-labelledby="solutions-title">
      <div className="solutions-heading">
        <div>
          <p className="eyebrow">Think it through together</p>
          <h2 id="solutions-title">Peer solutions</h2>
        </div>
        <span className="activity-count">{solutions.length}</span>
      </div>

      {error && <p className="solution-error" role="alert">{error}</p>}

      {viewerId ? (
        <form className="solution-compose" onSubmit={submitSolution}>
          <label htmlFor="solution-content">
            <span>Have an explanation to share?</span>
            <textarea
              id="solution-content"
              maxLength={10000}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Walk through your reasoning and help a peer learn."
              required
              rows={4}
              value={content}
            />
          </label>
          <div className="solution-image-field">
            <span>Optional image</span>
            <ImageUploadField
              onUploaded={(result) => setImageUrl(result.imageUrl)}
              purpose="solution"
              resourceId={problem.id}
            />
            {imageUrl && <img alt="Uploaded solution attachment" src={imageUrl} />}
          </div>
          <div className="solution-compose-footer">
            <small>{content.length}/10,000 characters</small>
            <button
              className="button button-primary"
              disabled={submitting || !content.trim()}
              type="submit"
            >
              {submitting ? "Sharing…" : "Share solution"}
            </button>
          </div>
        </form>
      ) : (
        <p className="solution-signin-note">
          <Link to="/login">Log in</Link> to share a public solution.
        </p>
      )}

      {loading ? (
        <div className="solutions-empty" role="status">Loading solutions…</div>
      ) : solutions.length ? (
        <div className="solutions-list">
          {solutions.map((solution) => {
            const isProvider = viewerId === solution.author.id;
            const canStartChat = Boolean(
              viewerId &&
              solution.status === "APPROVED" &&
              (isProblemAuthor || isProvider),
            );
            return (
              <article className="solution-card" id={`solution-${solution.id}`} key={solution.id}>
                <div className="solution-card-header">
                  <Link className="problem-author" to={`/profile/${solution.author.id}`}>
                    <span className="problem-author-avatar">
                      {solution.author.profilePictureUrl ? (
                        <img alt="" src={solution.author.profilePictureUrl} />
                      ) : initials(solution.author.name)}
                    </span>
                    <span>{solution.author.name}</span>
                    {isProvider && <span className="solution-you-label">You</span>}
                  </Link>
                  <span className={`solution-status solution-status-${solution.status.toLowerCase()}`}>
                    {solution.status}
                  </span>
                </div>
                <p className="solution-content">{solution.content}</p>
                {solution.imageUrl && (
                  <a href={solution.imageUrl} rel="noreferrer" target="_blank">
                    <img
                      className="solution-image"
                      alt="Image attached to this solution"
                      loading="lazy"
                      src={solution.imageUrl}
                    />
                  </a>
                )}
                <div className="solution-card-footer">
                  {solution.status === "WAITING" && isProblemAuthor && (
                    <p>Waiting for your review</p>
                  )}
                  {solution.status === "WAITING" && !isProblemAuthor && (
                    <p>Waiting for author’s approval</p>
                  )}
                  {solution.status === "REJECTED" && (
                    <p>Not approved by the author</p>
                  )}
                  {solution.status === "APPROVED" && (
                    <p>Chat available with this solution’s participants</p>
                  )}
                  <div className="solution-actions">
                    {isProblemAuthor && solution.status === "WAITING" && (
                      <>
                        <button
                          className="button button-approve"
                          disabled={workingId === solution.id}
                          onClick={() => decide(solution.id, "APPROVED")}
                          type="button"
                        >
                          Approve
                        </button>
                        <button
                          className="button button-reject"
                          disabled={workingId === solution.id}
                          onClick={() => decide(solution.id, "REJECTED")}
                          type="button"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {canStartChat && (
                      <button
                        className="button button-primary button-small"
                        disabled={startingId === solution.id}
                        onClick={() => startChat(solution.id)}
                        type="button"
                      >
                        {startingId === solution.id ? "Opening…" : "Start chat"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="solutions-empty">
          <span className="empty-state-mark" aria-hidden="true">✳</span>
          <p>No solutions yet. Share a thoughtful explanation to get started.</p>
        </div>
      )}
    </section>
  );
}

export default SolutionsPanel;
