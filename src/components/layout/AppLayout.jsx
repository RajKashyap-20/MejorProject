import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Made for curious minds, learning side by side.</p>
        <span>AcadLink © 2026</span>
      </footer>
    </div>
  );
}

export default AppLayout;
