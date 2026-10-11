import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiRequest } from "../../lib/api.js";
import PageContainer from "../layout/PageContainer.jsx";

function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePictureUrl: "",
    college: "",
    subjects: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (isRegister && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isRegister
              ? {
                  ...form,
                  subjects: form.subjects
                    .split(/[,\n]/)
                    .map((subject) => subject.trim())
                    .filter(Boolean),
                }
              : { email: form.email, password: form.password },
          ),
        },
      );
      setUser(result.user);
      const destination = location.state?.from;
      navigate(
        destination
          ? `${destination.pathname}${destination.search}${destination.hash}`
          : "/feed",
        { replace: true },
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer className="auth-page">
      <section className="auth-card">
        <div className="auth-card-heading">
          <span className="auth-spark" aria-hidden="true">✳</span>
          <p className="eyebrow">{isRegister ? "Your study circle starts here" : "Good to have you back"}</p>
          <h1>{isRegister ? "Join AcadLink" : "Welcome back"}</h1>
          <p>
            {isRegister
              ? "Create an account to ask questions and learn with other students."
              : "Sign in to continue learning with your peers."}
          </p>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <form className="auth-form" onSubmit={submit}>
          {isRegister && (
            <label className="problem-field">
              <span>Name</span>
              <input
                autoComplete="name"
                maxLength={80}
                name="name"
                onChange={updateForm}
                required
                value={form.name}
              />
            </label>
          )}
          <label className="problem-field">
            <span>Email</span>
            <input
              autoComplete="email"
              maxLength={254}
              name="email"
              onChange={updateForm}
              required
              type="email"
              value={form.email}
            />
          </label>
          <label className="problem-field">
            <span>Password</span>
            <input
              autoComplete={isRegister ? "new-password" : "current-password"}
              maxLength={72}
              minLength={isRegister ? 8 : undefined}
              name="password"
              onChange={updateForm}
              required
              type="password"
              value={form.password}
            />
            {isRegister && <small>Use at least 8 characters.</small>}
          </label>
          {isRegister && (
            <label className="problem-field">
              <span>Confirm password</span>
              <input
                autoComplete="new-password"
                maxLength={72}
                minLength={8}
                name="confirmPassword"
                onChange={updateForm}
                required
                type="password"
                value={form.confirmPassword}
              />
            </label>
          )}
          {isRegister && (
            <>
              <label className="problem-field">
                <span>College or university <small>Optional</small></span>
                <input
                  autoComplete="organization"
                  maxLength={120}
                  name="college"
                  onChange={updateForm}
                  value={form.college}
                />
              </label>
              <label className="problem-field">
                <span>Profile image URL <small>Optional</small></span>
                <input
                  autoComplete="url"
                  maxLength={2048}
                  name="profilePictureUrl"
                  onChange={updateForm}
                  placeholder="https://…"
                  type="url"
                  value={form.profilePictureUrl}
                />
              </label>
              <label className="problem-field">
                <span>Subjects and interests <small>Optional, comma-separated</small></span>
                <input
                  maxLength={650}
                  name="subjects"
                  onChange={updateForm}
                  placeholder="Mathematics, Biology, Web development"
                  value={form.subjects}
                />
                <small>Add up to 12 interests.</small>
              </label>
            </>
          )}
          <button className="button button-primary auth-submit" disabled={loading} type="submit">
            {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
            {!loading && <span aria-hidden="true">↗</span>}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to AcadLink?"}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {isRegister ? "Log in" : "Create an account"}
          </Link>
        </p>
      </section>
    </PageContainer>
  );
}

export default AuthForm;
