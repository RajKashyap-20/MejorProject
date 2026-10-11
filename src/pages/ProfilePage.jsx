import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer.jsx";
import ImageUploadField from "../components/ui/ImageUploadField.jsx";

const emptyActivity = { profile: null, problems: [], approvedSolutions: [] };

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "The profile API is unavailable. Start the Vercel development server and configure the database.",
    );
  }
  return response.json();
}

function displayDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
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

function ProfilePage() {
  const { userId } = useParams();
  const isOwnProfile = !userId;
  const [activity, setActivity] = useState(emptyActivity);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subjectsValue = useMemo(
    () => (activity.profile?.subjects ?? []).join(", "),
    [activity.profile?.subjects],
  );

  useEffect(() => {
    const controller = new AbortController();
    const endpoint = isOwnProfile
      ? "/api/profile/me"
      : `/api/profile/${encodeURIComponent(userId)}`;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(endpoint, {
          credentials: "include",
          signal: controller.signal,
        });
        const result = await readApiResponse(response);

        if (!response.ok) {
          throw new Error(result.error || "Unable to load this profile.");
        }

        setActivity({
          profile: result.profile,
          problems: result.problems ?? [],
          approvedSolutions: result.approvedSolutions ?? [],
        });
        setForm({
          name: result.profile.name ?? "",
          profilePictureUrl: result.profile.profilePictureUrl ?? "",
          college: result.profile.college ?? "",
          bio: result.profile.bio ?? "",
          subjects: result.profile.subjects ?? [],
        });
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProfile();
    return () => controller.abort();
  }, [isOwnProfile, userId]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      subjects: typeof form.subjects === "string"
        ? form.subjects.split(",").map((subject) => subject.trim()).filter(Boolean)
        : form.subjects,
    };

    try {
      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(result.error || "Unable to save your profile.");
      }

      setActivity((current) => ({ ...current, profile: result.profile }));
      setForm({
        name: result.profile.name ?? "",
        profilePictureUrl: result.profile.profilePictureUrl ?? "",
        college: result.profile.college ?? "",
        bio: result.profile.bio ?? "",
        subjects: result.profile.subjects ?? [],
      });
      setEditing(false);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer className="profile-page">
        <div className="profile-message" role="status">Loading profile…</div>
      </PageContainer>
    );
  }

  if (error && !activity.profile) {
    const needsLogin = isOwnProfile && error.toLowerCase().includes("sign in");
    return (
      <PageContainer className="profile-page">
        <section className="profile-message profile-message-error" role="alert">
          <span className="eyebrow">Profile</span>
          <h1>{needsLogin ? "Your profile is waiting" : "We couldn't load this profile"}</h1>
          <p>{error}</p>
          {needsLogin && (
            <Link className="button button-primary" to="/login">Go to log in</Link>
          )}
        </section>
      </PageContainer>
    );
  }

  const { profile, problems, approvedSolutions } = activity;
  if (!profile) return null;

  const subjects = editing
    ? (form.subjects ?? []).join(", ")
    : subjectsValue;

  return (
    <PageContainer className="profile-page">
      <div className="profile-page-heading">
        <div>
          <p className="eyebrow">{isOwnProfile ? "Your learning space" : "AcadLink member"}</p>
          <h1>{isOwnProfile ? "Your profile" : "Student profile"}</h1>
        </div>
        {isOwnProfile && !editing && (
          <button
            className="button button-secondary"
            onClick={() => {
              setForm({
                name: profile.name ?? "",
                profilePictureUrl: profile.profilePictureUrl ?? "",
                college: profile.college ?? "",
                bio: profile.bio ?? "",
                subjects: profile.subjects ?? [],
              });
              setEditing(true);
            }}
            type="button"
          >
            Edit profile
          </button>
        )}
      </div>

      {error && (
        <p className="profile-inline-error" role="alert">{error}</p>
      )}

      {editing ? (
        <form className="profile-edit-card" onSubmit={saveProfile}>
          <div className="profile-edit-heading">
            <div>
              <p className="eyebrow">Make it yours</p>
              <h2>Edit profile</h2>
            </div>
            <span className="profile-private-note">Only you can make changes</span>
          </div>

          <div className="profile-form-grid">
            <label className="profile-field">
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
            <label className="profile-field">
              <span>College or university</span>
              <input
                maxLength={120}
                name="college"
                onChange={updateForm}
                value={form.college}
              />
            </label>
            <label className="profile-field profile-field-full">
              <span>Profile picture URL</span>
              <input
                maxLength={2048}
                name="profilePictureUrl"
                onChange={updateForm}
                placeholder="https://example.com/your-photo.jpg"
                type="url"
                value={form.profilePictureUrl}
              />
              <ImageUploadField
                onUploaded={(result) => setForm((current) => ({
                  ...current,
                  profilePictureUrl: result.imageUrl,
                }))}
                purpose="profile"
                resourceId={profile.id}
              />
              <small>Use an image upload or public HTTPS/HTTP URL.</small>
            </label>
            <label className="profile-field profile-field-full">
              <span>Bio</span>
              <textarea
                maxLength={500}
                name="bio"
                onChange={updateForm}
                rows={4}
                value={form.bio}
              />
              <small>{form.bio.length}/500 characters</small>
            </label>
            <label className="profile-field profile-field-full">
              <span>Subjects and interests</span>
              <input
                maxLength={700}
                name="subjects"
                onChange={updateForm}
                placeholder="Biology, calculus, creative writing"
                value={subjects}
              />
              <small>Separate interests with commas (up to 12).</small>
            </label>
          </div>

          <div className="profile-form-actions">
            <button
              className="button button-secondary"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setError("");
              }}
              type="button"
            >
              Cancel
            </button>
            <button className="button button-primary" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <section className="profile-card">
          <div className="profile-overview">
            <div className="profile-avatar" aria-label={`${profile.name} profile picture`}>
              {profile.profilePictureUrl ? (
                <img alt="" src={profile.profilePictureUrl} />
              ) : (
                <span>{initials(profile.name)}</span>
              )}
            </div>
            <div className="profile-identity">
              <h2>{profile.name}</h2>
              <p className="profile-college">{profile.college || "College not added"}</p>
              <p className="profile-joined">Learning with AcadLink since {displayDate(profile.createdAt)}</p>
            </div>
            <span className="profile-member-mark" aria-hidden="true">✳</span>
          </div>
          <div className="profile-about">
            <div className="profile-section-heading">
              <h3>About</h3>
            </div>
            <p className="profile-bio">
              {profile.bio || "This student hasn’t added a bio yet."}
            </p>
          </div>
          <div className="profile-subjects">
            <h3>Subjects & interests</h3>
            {profile.subjects?.length ? (
              <div className="subject-list">
                {profile.subjects.map((subject) => (
                  <span className="subject-chip" key={subject}>{subject}</span>
                ))}
              </div>
            ) : (
              <p className="profile-empty-inline">No subjects or interests added yet.</p>
            )}
          </div>
        </section>
      )}

      <section className="profile-activity" aria-label="Student activity">
        <div className="profile-activity-section">
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">Shared with the community</p>
              <h2>Created problems</h2>
            </div>
            <span className="activity-count">{problems.length}</span>
          </div>
          {problems.length ? (
            <div className="activity-list">
              {problems.map((problem) => (
                <article className="activity-card" key={problem.id}>
                  <div className="activity-card-topline">
                    <span className="activity-subject">{problem.subject || "Academic question"}</span>
                    <time dateTime={problem.createdAt}>{displayDate(problem.createdAt)}</time>
                  </div>
                  <h3><Link to={`/problems/${problem.id}`}>{problem.title}</Link></h3>
                  <p>{problem.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="profile-empty-state">
              <span className="empty-state-mark" aria-hidden="true">✎</span>
              <p>No problems shared yet.</p>
            </div>
          )}
        </div>

        <div className="profile-activity-section">
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">Helpful answers</p>
              <h2>Approved solutions</h2>
            </div>
            <span className="activity-count activity-count-green">{approvedSolutions.length}</span>
          </div>
          {approvedSolutions.length ? (
            <div className="activity-list">
              {approvedSolutions.map((solution) => (
                <article className="activity-card solution-card" key={solution.id}>
                  <div className="activity-card-topline">
                    <span className="approved-label"><span /> Approved</span>
                    <time dateTime={solution.createdAt}>{displayDate(solution.createdAt)}</time>
                  </div>
                  <p className="solution-for">
                    {solution.problem?.title
                      ? `Solution for: ${solution.problem.title}`
                      : "Approved peer solution"}
                  </p>
                  <p>{solution.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="profile-empty-state">
              <span className="empty-state-mark empty-state-green" aria-hidden="true">✓</span>
              <p>No approved solutions yet.</p>
            </div>
          )}
        </div>
      </section>
    </PageContainer>
  );
}

export default ProfilePage;
