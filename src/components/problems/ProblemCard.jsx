import { Link } from "react-router-dom";
import HelpfulButton from "./HelpfulButton.jsx";

function displayDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function ProblemCard({ problem, viewerId }) {
  return (
    <article className="problem-card">
      <div className="problem-card-topline">
        <span className="problem-subject">{problem.subject}</span>
        {problem.category && <span className="problem-category">{problem.category}</span>}
        <span className={`problem-status ${problem.status === "OPEN" ? "problem-status-open" : ""}`}>
          {problem.status === "OPEN" ? "Open" : "Closed"}
        </span>
      </div>
      <h2>
        <Link to={`/problems/${problem.id}`}>{problem.title}</Link>
      </h2>
      <p className="problem-card-description">{problem.description}</p>
      {problem.imageUrl && (
        <Link className="problem-image-preview" to={`/problems/${problem.id}`}>
          <img alt={`Image attached to ${problem.title}`} loading="lazy" src={problem.imageUrl} />
        </Link>
      )}
      <div className="problem-card-footer">
        <Link className="problem-author" to={`/profile/${problem.author.id}`}>
          <span className="problem-author-avatar">
            {problem.author.profilePictureUrl ? (
              <img alt="" loading="lazy" src={problem.author.profilePictureUrl} />
            ) : initials(problem.author.name)}
          </span>
          <span>{problem.author.name}</span>
        </Link>
        <time dateTime={problem.createdAt}>{displayDate(problem.createdAt)}</time>
      </div>
      <div className="problem-card-actions">
        <HelpfulButton
          authenticated={Boolean(viewerId)}
          count={problem.reactionCount}
          problemId={problem.id}
          reacted={problem.viewerReacted}
        />
      </div>
    </article>
  );
}

export default ProblemCard;
