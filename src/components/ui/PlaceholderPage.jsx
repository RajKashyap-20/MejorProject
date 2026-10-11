import PageContainer from "../layout/PageContainer.jsx";

function PlaceholderPage({ eyebrow, title, description, badge }) {
  return (
    <PageContainer className="placeholder-page">
      <section className="placeholder-card">
        {badge && <span className="status-badge">{badge}</span>}
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="placeholder-description">{description}</p>
        <div className="placeholder-note">
          <span className="note-dot" aria-hidden="true" />
          This page is part of the AcadLink foundation. More is coming in a
          future step.
        </div>
      </section>
    </PageContainer>
  );
}

export default PlaceholderPage;
