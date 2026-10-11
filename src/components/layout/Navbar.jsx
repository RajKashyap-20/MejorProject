import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import NotificationBell from "../notifications/NotificationBell.jsx";
import ChatNavLink from "../chat/ChatNavLink.jsx";

const primaryLinks = [
  { to: "/feed", label: "Explore" },
  { to: "/problems/new", label: "Ask a question" },
  { to: "/profile", label: "Profile" },
];

function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    setSignOutError("");
    try {
      await signOut();
    } catch (error) {
      setSignOutError(error.message);
    }
  }

  return (
    <header className="site-header">
      <nav className="navbar page-container" aria-label="Main navigation">
        <Link className="brand" to="/" aria-label="AcadLink home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">Acad<span>Link</span></span>
        </Link>

        <div className="nav-links">
          {primaryLinks
            .filter((link) => user || link.to === "/feed")
            .map((link) => (
              <NavLink
                className={({ isActive }) =>
                  `nav-link${isActive ? " nav-link-active" : ""}`
                }
                key={link.to}
                to={link.to}
              >
                {link.label}
              </NavLink>
            ))}
        </div>

        <div className="nav-actions">
          {loading ? null : user ? (
            <>
              <NotificationBell />
              <NavLink className="nav-login" to="/profile">Hi, {user.name.split(" ")[0]}</NavLink>
              <ChatNavLink />
              {user.role === "ADMIN" && (
                <NavLink className="nav-login" to="/admin">Admin</NavLink>
              )}
              <button className="nav-signout" onClick={handleSignOut} type="button">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink className="nav-login" to="/login">Log in</NavLink>
              <Link className="button button-small button-primary" to="/register">
                Join AcadLink
              </Link>
            </>
          )}
        </div>
        {signOutError && <span className="nav-error" role="alert">{signOutError}</span>}
      </nav>
    </header>
  );
}

export default Navbar;
