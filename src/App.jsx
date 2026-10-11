import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CreateProblemPage from "./pages/CreateProblemPage.jsx";
import ChatInboxPage from "./pages/ChatInboxPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProblemPage from "./pages/ProblemPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RequireAuth from "./components/auth/RequireAuth.jsx";

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="admin-loading" role="status">Checking administrator access…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <AdminPage />;
}

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminRoute />} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route
          path="problems/new"
          element={<RequireAuth><CreateProblemPage /></RequireAuth>}
        />
        <Route path="problems/:problemId" element={<ProblemPage />} />
        <Route path="chat" element={<RequireAuth><ChatInboxPage /></RequireAuth>} />
        <Route path="chat/:conversationId" element={<RequireAuth><ChatPage /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="profile/:userId" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
