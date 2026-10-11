import { Link } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer.jsx";

const highlights = [
  {
    number: "01",
    title: "Ask with confidence",
    description: "Put a tricky question into words and find a fresh perspective.",
    tone: "highlight-blue",
  },
  {
    number: "02",
    title: "Learn out loud",
    description: "Share the steps behind your thinking, not just the answer.",
    tone: "highlight-green",
  },
  {
    number: "03",
    title: "Grow together",
    description: "Make progress with a community that enjoys figuring it out.",
    tone: "highlight-purple",
  },
];

function HomePage() {
  return (
    <PageContainer className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="kicker-star" aria-hidden="true">✳</span>
            A little help goes a long way
          </div>
          <h1>
            Ask. Share. Solve.
            <span>Together.</span>
          </h1>
          <p className="hero-description">
            Learning gets better when we do it together. Bring your questions,
            share what you know, and help someone else have their aha moment.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/register">
              Find your study circle <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button button-secondary" to="/feed">
              Explore questions
            </Link>
          </div>
          <p className="hero-footnote">
            <span className="footnote-check" aria-hidden="true">✓</span>
            A friendly space to learn at your own pace
          </p>
        </div>

        <div className="hero-art" aria-label="Illustration of shared learning">
          <div className="art-doodle doodle-star" aria-hidden="true">✳</div>
          <div className="art-doodle doodle-spark" aria-hidden="true">✦</div>
          <div className="art-paper">
            <div className="paper-topline">
              <span className="paper-dot" />
              <span className="paper-dot" />
              <span className="paper-dot" />
              <span className="paper-label">a good question</span>
            </div>
            <div className="paper-content">
              <span className="formula formula-one">x² + y²</span>
              <span className="formula-line formula-line-one" />
              <span className="formula-line formula-line-two" />
              <span className="formula formula-two">∴ keep going</span>
            </div>
            <div className="paper-sticker" aria-hidden="true">aha!</div>
          </div>
          <div className="floating-note note-question">
            <span className="note-icon note-icon-blue" aria-hidden="true">?</span>
            <span><strong>Curiosity</strong><small>starts here</small></span>
          </div>
          <div className="floating-note note-answer">
            <span className="note-icon note-icon-green" aria-hidden="true">✓</span>
            <span><strong>Progress</strong><small>made together</small></span>
          </div>
          <span className="art-caption">every question is a start</span>
        </div>
      </section>

      <section className="how-section" aria-labelledby="how-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your next aha moment</p>
            <h2 id="how-title">Learning is better together.</h2>
          </div>
          <p className="section-aside">
            No question is too small when it helps you move forward.
          </p>
        </div>
        <div className="highlight-grid">
          {highlights.map((item) => (
            <article className={`highlight-card ${item.tone}`} key={item.number}>
              <span className="highlight-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="highlight-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <span className="cta-scribble" aria-hidden="true">✳</span>
        <div>
          <p className="eyebrow">Ready when you are</p>
          <h2>Bring a question. Leave with a new idea.</h2>
        </div>
        <Link className="button button-light" to="/feed">
          Take a look around <span aria-hidden="true">→</span>
        </Link>
      </section>
    </PageContainer>
  );
}

export default HomePage;
