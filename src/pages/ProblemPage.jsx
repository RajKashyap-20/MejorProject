import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer.jsx";
import ProblemForm from "../components/problems/ProblemForm.jsx";
import HelpfulButton from "../components/problems/HelpfulButton.jsx";
import SolutionsPanel from "../components/problems/SolutionsPanel.jsx";
import { apiRequest } from "../lib/api.js";

function displayDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

function ProblemPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [viewerId, setViewerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProblem() {
      setLoading(true);
      setError("");
      try {
        const result = await apiRequest(
          `/api/problems/${encodeURIComponent(problemId)}`,
          { signal: controller.signal },
        );
        setProblem(result.problem);
        setViewerId(result.viewerId);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProblem();
    return () => controller.abort();
  }, [problemId]);

  async function updateProblem(values) {
    const result = await apiRequest(`/api/problems/${encodeURIComponent(problemId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setProblem(result.problem);
    setEditing(false);
    setActionError("");
  }

  async function deleteProblem() {
    if (!window.confirm("Delete this problem? This action cannot be undone.")) return;
    setDeleting(true);
    setActionError("");
    try {
      await apiRequest(`/api/problems/${encodeURIComponent(problemId)}`, {
        method: "DELETE",
      });
      navigate("/feed", { replace: true });
    } catch (deleteError) {
      setActionError(deleteError.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <PageContainer className="problem-page">
        <div className="feed-message" role="status">Loading question…</div>
      </PageContainer>
    );
  }

  if (error || !problem) {
    return (
      <PageContainer className="problem-page">
        <section className="feed-message feed-error" role="alert">
          <h1>We couldn’t open this question</h1>
          <p>{error || "Problem not found."}</p>
          <Link className="button button-secondary" to="/feed">Back to the feed</Link>
        </section>
      </PageContainer>
    );
  }

  const isAuthor = viewerId === problem.author.id;
  const formValues = {
    title: problem.title,
    description: problem.description,
    subject: problem.subject,
    category: problem.category,
    imageUrl: problem.imageUrl,
  };

  return (
    <PageContainer className="problem-page problem-detail-page">
      <Link className="back-link" to="/feed">← Back to questions</Link>

      {editing ? (
        <ProblemForm
          initialValues={formValues}
          onSubmit={updateProblem}
          uploadResourceId={problem.id}
          submitLabel="Save changes"
        />
      ) : (
        <>
        <article className="problem-detail-card">
          <div className="problem-detail-topline">
            <div className="problem-detail-tags">
              <span className="problem-subject">{problem.subject}</span>
              {problem.category && <span className="problem-category">{problem.category}</span>}
              <span className={`problem-status ${problem.status === "OPEN" ? "problem-status-open" : ""}`}>
                {problem.status === "OPEN" ? "Open" : "Closed"}
              </span>
            </div>
            {isAuthor && (
              <div className="problem-owner-actions">
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setActionError("");
                    setEditing(true);
                  }}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="button button-danger"
                  disabled={deleting}
                  onClick={deleteProblem}
                  type="button"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            )}
          </div>

          {actionError && <p className="problem-form-error" role="alert">{actionError}</p>}

          <h1>{problem.title}</h1>
          <div className="problem-detail-author">
            <Link className="problem-author" to={`/profile/${problem.author.id}`}>
              <span className="problem-author-avatar">
                {problem.author.profilePictureUrl ? (
                  <img alt="" src={problem.author.profilePictureUrl} />
                ) : initials(problem.author.name)}
              </span>
              <span>{problem.author.name}</span>
            </Link>
            <span>·</span>
            <time dateTime={problem.createdAt}>{displayDate(problem.createdAt)}</time>
            {problem.updatedAt !== problem.createdAt && (
              <span className="problem-edited-mark">Edited</span>
            )}
          </div>
          <div className="problem-detail-description">{problem.description}</div>
          {problem.imageUrl && (
            <a
              className="problem-detail-image"
              href={problem.imageUrl}
              rel="noreferrer"
              target="_blank"
            >
              <img alt={`Image attached to ${problem.title}`} src={problem.imageUrl} />
            </a>
          )}
          <div className="problem-detail-actions">
            <HelpfulButton
              authenticated={Boolean(viewerId)}
              count={problem.reactionCount}
              problemId={problem.id}
              reacted={problem.viewerReacted}
            />
          </div>
        </article>
        <SolutionsPanel problem={problem} viewerId={viewerId} />
        </>
      )}
    </PageContainer>
  );
}

export default ProblemPage;
