import { useState } from "react";
import { Link } from "react-router-dom";
import ImageUploadField from "../ui/ImageUploadField.jsx";

export const problemSubjects = [
  "Java",
  "DSA",
  "Web Development",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Mathematics",
  "Other",
];

const initialProblem = {
  title: "",
  description: "",
  subject: "",
  category: "",
  imageUrl: "",
};

function ProblemForm({
  initialValues = initialProblem,
  submitLabel = "Share problem",
  uploadResourceId,
  onSubmit,
}) {
  const [form, setForm] = useState(() => ({
    ...initialProblem,
    ...initialValues,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        category: form.category.trim(),
        imageUrl: form.imageUrl.trim(),
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="problem-form-card" onSubmit={handleSubmit}>
      <div className="problem-form-intro">
        <p className="eyebrow">A question is a great place to start</p>
        <h2>Share what you’re working through.</h2>
        <p>Give other students enough context to understand where you’re stuck.</p>
      </div>

      {error && (
        <div className="problem-form-error" role="alert">
          <p>{error}</p>
          {error.toLowerCase().includes("sign in") && (
            <Link to="/login">Go to log in</Link>
          )}
        </div>
      )}

      <div className="problem-form-grid">
        <label className="problem-field problem-field-full">
          <span>Title <b aria-hidden="true">*</b></span>
          <input
            maxLength={160}
            name="title"
            onChange={updateField}
            placeholder="What are you trying to figure out?"
            required
            value={form.title}
          />
          <small>Keep it clear and specific.</small>
        </label>

        <label className="problem-field">
          <span>Subject <b aria-hidden="true">*</b></span>
          <select name="subject" onChange={updateField} required value={form.subject}>
            <option value="" disabled>Select a subject</option>
            {problemSubjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </label>

        <label className="problem-field">
          <span>Category <small>(optional)</small></span>
          <input
            maxLength={80}
            name="category"
            onChange={updateField}
            placeholder="e.g. Recursion, lab work"
            value={form.category}
          />
        </label>

        <label className="problem-field problem-field-full">
          <span>Description <b aria-hidden="true">*</b></span>
          <textarea
            maxLength={10000}
            name="description"
            onChange={updateField}
            placeholder="Share what you’ve tried so far, what you expected, and where you got stuck."
            required
            rows={7}
            value={form.description}
          />
          <small>{form.description.length}/10,000 characters</small>
        </label>

        <label className="problem-field problem-field-full">
          <span>Image URL <small>(optional)</small></span>
          <ImageUploadField
            onUploaded={(result) => setForm((current) => ({
              ...current,
              imageUrl: result.imageUrl,
            }))}
            purpose="problem"
            resourceId={uploadResourceId}
          />
          <input
            maxLength={2048}
            name="imageUrl"
            onChange={updateField}
            placeholder="https://example.com/diagram.png"
            type="url"
            value={form.imageUrl}
          />
          <small>Upload an image or add a public HTTP or HTTPS image URL.</small>
        </label>
      </div>

      <div className="problem-form-actions">
        <button className="button button-primary" disabled={submitting} type="submit">
          {submitting ? "Saving…" : submitLabel}
          {!submitting && <span aria-hidden="true">↗</span>}
        </button>
      </div>
    </form>
  );
}

export default ProblemForm;
