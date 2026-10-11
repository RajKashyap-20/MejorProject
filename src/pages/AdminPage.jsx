import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "problems", label: "Problems" },
  { id: "solutions", label: "Solutions" },
];

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function AdminPage() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  async function loadDashboard({ signal } = {}) {
    setLoading(true);
    setError("");
    try {
      if (tab === "overview") {
        const result = await apiRequest("/api/admin/stats", { signal });
        setStats(result.stats);
        setRecords([]);
      } else {
        const query = new URLSearchParams({ page: String(page) });
        let endpoint = `/api/admin/${tab}?${query}`;
        if (tab === "users" && search) {
          query.set("search", search);
          endpoint = `/api/admin/users?${query}`;
        }
        const result = await apiRequest(endpoint, { signal });
        setRecords(result[tab] ?? []);
        setTotalPages(result.pagination.totalPages || 1);
      }
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard({ signal: controller.signal });
    return () => controller.abort();
  }, [tab, page, search]);

  async function removeRecord(kind, id, title) {
    if (!window.confirm(`Remove ${title}? This cannot be undone.`)) return;
    setActionId(id);
    setError("");
    try {
      await apiRequest(`/api/admin/${kind}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActionId("");
    }
  }

  async function updateUserSuspension(user, suspended) {
    const action = suspended ? "suspend" : "restore";
    if (!window.confirm(`${action === "suspend" ? "Suspend" : "Restore"} ${user.name}'s account?`)) return;
    setActionId(user.id);
    setError("");
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        body: { suspended },
      });
      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActionId("");
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link className="admin-brand" to="/">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          AcadLink <span>admin</span>
        </Link>
        <Link className="admin-exit" to="/">Return to AcadLink ↗</Link>
      </header>
      <main className="admin-content">
        <div className="admin-title">
          <div>
            <p className="eyebrow">Platform operations</p>
            <h1>Admin dashboard</h1>
            <p>Review community activity and moderate reported content.</p>
          </div>
          <span className="admin-secure-badge">Administrator access</span>
        </div>

        <nav className="admin-tabs" aria-label="Admin sections">
          {tabs.map((item) => (
            <button
              aria-current={tab === item.id ? "page" : undefined}
              className={tab === item.id ? "admin-tab admin-tab-active" : "admin-tab"}
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setPage(1);
                setError("");
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "users" && (
          <form className="admin-search" onSubmit={submitSearch}>
            <input
              maxLength={120}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Find a user by name or email"
              value={searchInput}
            />
            <button className="button button-secondary" type="submit">Search</button>
          </form>
        )}

        {error && (
          <section className="admin-error" role="alert">
            <h2>Dashboard unavailable</h2>
            <p>{error}</p>
            <button className="button button-secondary" onClick={() => loadDashboard()} type="button">
              Try again
            </button>
          </section>
        )}
        {loading && !error && <div className="admin-loading" role="status">Loading dashboard…</div>}

        {!loading && !error && tab === "overview" && stats && (
          <div className="admin-stats-grid">
            {[
              ["Students", stats.users],
              ["Problems", stats.problems],
              ["Solutions", stats.solutions],
              ["Private conversations", stats.conversations],
            ].map(([label, value]) => (
              <article className="admin-stat-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && tab === "users" && (
          <section className="admin-record-list">
            {records.length ? records.map((user) => (
              <article className="admin-record-card" key={user.id}>
                <div className="admin-record-avatar">
                  {user.profilePictureUrl
                    ? <img alt="" src={user.profilePictureUrl} />
                    : user.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="admin-record-copy">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <small>Joined {formatDate(user.createdAt)}</small>
                </div>
                <span className={user.role === "ADMIN" ? "admin-role admin-role-admin" : "admin-role"}>
                  {user.role}
                </span>
                {user.isSuspended && (
                  <span className="admin-role admin-role-suspended">Suspended</span>
                )}
                {user.role !== "ADMIN" && (
                  <button
                    className={user.isSuspended ? "button button-secondary" : "button button-danger"}
                    disabled={actionId === user.id}
                    onClick={() => updateUserSuspension(user, !user.isSuspended)}
                    type="button"
                  >
                    {actionId === user.id
                      ? "Updating…"
                      : user.isSuspended
                        ? "Restore account"
                        : "Suspend"}
                  </button>
                )}
              </article>
            )) : <div className="admin-empty">No users found.</div>}
          </section>
        )}

        {!loading && !error && tab === "problems" && (
          <section className="admin-record-list">
            {records.length ? records.map((problem) => (
              <article className="admin-moderation-card" key={problem.id}>
                <div>
                  <div className="admin-record-meta">
                    <span>{problem.subject}</span>
                    <span>By {problem.author.name}</span>
                  </div>
                  <h2><Link to={`/problems/${problem.id}`}>{problem.title}</Link></h2>
                  <p>{problem.description}</p>
                  <small>{formatDate(problem.createdAt)}</small>
                </div>
                <button
                  className="button button-danger"
                  disabled={actionId === problem.id}
                  onClick={() => removeRecord("problems", problem.id, "this problem")}
                  type="button"
                >
                  {actionId === problem.id ? "Removing…" : "Remove"}
                </button>
              </article>
            )) : <div className="admin-empty">No problems found.</div>}
          </section>
        )}

        {!loading && !error && tab === "solutions" && (
          <section className="admin-record-list">
            {records.length ? records.map((solution) => (
              <article className="admin-moderation-card" key={solution.id}>
                <div>
                  <div className="admin-record-meta">
                    <span>{solution.status}</span>
                    <span>By {solution.author?.name || "Unavailable account"}</span>
                  </div>
                  <h2>{solution.problem?.title || "Problem no longer available"}</h2>
                  <p>{solution.content}</p>
                  <small>{formatDate(solution.createdAt)}</small>
                </div>
                <button
                  className="button button-danger"
                  disabled={actionId === solution.id}
                  onClick={() => removeRecord("solutions", solution.id, "this solution")}
                  type="button"
                >
                  {actionId === solution.id ? "Removing…" : "Remove"}
                </button>
              </article>
            )) : <div className="admin-empty">No solutions found.</div>}
          </section>
        )}

        {!loading && !error && tab !== "overview" && totalPages > 1 && (
          <nav className="feed-pagination" aria-label="Admin result pages">
            <button
              className="button button-secondary"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              type="button"
            >
              ← Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              className="button button-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Next →
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}

export default AdminPage;
