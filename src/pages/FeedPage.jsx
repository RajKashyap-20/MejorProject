import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer.jsx";
import ProblemCard from "../components/problems/ProblemCard.jsx";
import { problemSubjects } from "../components/problems/ProblemForm.jsx";
import { apiRequest } from "../lib/api.js";

function FeedPage() {
  const [searchInput, setSearchInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [filters, setFilters] = useState({ search: "", subject: "" });
  const [page, setPage] = useState(1);
  const [feed, setFeed] = useState({ problems: [], pagination: null, viewerId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page) });
    if (filters.search) query.set("search", filters.search);
    if (filters.subject) query.set("subject", filters.subject);

    async function loadProblems() {
      setLoading(true);
      setError("");
      try {
        const result = await apiRequest(`/api/problems?${query.toString()}`, {
          signal: controller.signal,
        });
        setFeed(result);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProblems();
    return () => controller.abort();
  }, [filters, page, refresh]);

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setFilters({ search: searchInput.trim(), subject: subjectInput });
  }

  return (
    <PageContainer className="feed-page">
      <header className="feed-heading">
        <div>
          <p className="eyebrow">Learn alongside your peers</p>
          <h1>Community questions</h1>
          <p>Explore what students are working through and share a helpful perspective.</p>
        </div>
        <Link className="button button-primary" to="/problems/new">
          Ask a question <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <form className="feed-filters" onSubmit={applyFilters}>
        <label className="feed-search-field">
          <span className="visually-hidden">Search problems</span>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            maxLength={120}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search questions, topics, or keywords"
            value={searchInput}
          />
        </label>
        <label className="feed-subject-field">
          <span className="visually-hidden">Filter by subject</span>
          <select
            onChange={(event) => setSubjectInput(event.target.value)}
            value={subjectInput}
          >
            <option value="">All subjects</option>
            {problemSubjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </label>
        <button className="button button-secondary feed-filter-button" type="submit">
          Search
        </button>
      </form>

      {error && (
        <section className="feed-message feed-error" role="alert">
          <h2>We couldn’t load the feed</h2>
          <p>{error}</p>
          <button className="button button-secondary" onClick={() => setRefresh((value) => value + 1)} type="button">
            Try again
          </button>
        </section>
      )}

      {loading && !error && (
        <div className="feed-message" role="status">Finding questions…</div>
      )}

      {!loading && !error && feed.problems.length === 0 && (
        <section className="feed-empty">
          <span className="empty-state-mark" aria-hidden="true">✳</span>
          <h2>No questions found</h2>
          <p>
            {filters.search || filters.subject
              ? "Try a different search or clear a filter."
              : "Be the first to start a conversation."}
          </p>
          {(filters.search || filters.subject) && (
            <button
              className="button button-secondary"
              onClick={() => {
                setSearchInput("");
                setSubjectInput("");
                setFilters({ search: "", subject: "" });
                setPage(1);
              }}
              type="button"
            >
              Clear filters
            </button>
          )}
        </section>
      )}

      {feed.problems.length > 0 && (
        <>
          <div className="feed-results-heading">
            <p>
              {feed.pagination.total} {feed.pagination.total === 1 ? "question" : "questions"}
              {filters.subject ? ` in ${filters.subject}` : ""}
            </p>
            <span>Newest first</span>
          </div>
          <div className="problem-feed-list">
            {feed.problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} viewerId={feed.viewerId} />
            ))}
          </div>
          {feed.pagination.totalPages > 1 && (
            <nav className="feed-pagination" aria-label="Problem pages">
              <button
                className="button button-secondary"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                type="button"
              >
                ← Previous
              </button>
              <span>Page {page} of {feed.pagination.totalPages}</span>
              <button
                className="button button-secondary"
                disabled={page >= feed.pagination.totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </PageContainer>
  );
}

export default FeedPage;
