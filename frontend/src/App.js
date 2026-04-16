import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import TechnicianDashboard from "./components/TechnicianDashboard/TechnicianDashboard";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import LoadingScreen from "./components/Common/LoadingScreen";
import { fetchCurrentUser, updateOwnProfile } from "./services/api";
import { clearSession, loadSession, routeForRole, storeSession, updateStoredUser } from "./utils/auth";

function App() {
  const [session, setSession] = useState(() => {
    const storedSession = loadSession();

    return {
      status: storedSession.token ? "loading" : "anonymous",
      token: storedSession.token,
      user: storedSession.user,
    };
  });

  useEffect(() => {
    if (session.status !== "loading" || !session.token || session.user) {
      return;
    }

    let isActive = true;

    async function restoreFromToken() {
      try {
        const currentUser = await fetchCurrentUser(session.token);

        if (!isActive) {
          return;
        }

        const nextUser = {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          approved: currentUser.approved,
          createdAt: currentUser.createdAt,
        };

        updateStoredUser(nextUser);
        setSession({
          status: "authenticated",
          token: session.token,
          user: nextUser,
        });
      } catch {
        if (!isActive) {
          return;
        }

        clearSession();
        setSession({
          status: "anonymous",
          token: null,
          user: null,
        });
      }
    }

    restoreFromToken();

    return () => {
      isActive = false;
    };
  }, [session.status, session.token, session.user]);

  function handleLogin(authResponse) {
    const nextSession = storeSession(authResponse);
    if (!nextSession.token || !nextSession.user) {
      return;
    }

    setSession({
      status: "authenticated",
      token: nextSession.token,
      user: nextSession.user,
    });
  }

  function handleLogout() {
    clearSession();
    setSession({
      status: "anonymous",
      token: null,
      user: null,
    });
  }

  async function handleRefreshUser() {
    if (!session.token) {
      handleLogout();
      return;
    }

    try {
      const currentUser = await fetchCurrentUser(session.token);
      const nextUser = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        approved: currentUser.approved,
        createdAt: currentUser.createdAt,
      };

      updateStoredUser(nextUser);
      setSession((current) => ({
        ...current,
        status: "authenticated",
        user: nextUser,
      }));
    } catch {
      handleLogout();
    }
  }

  async function handleProfileUpdate(payload) {
    if (!session.token) {
      handleLogout();
      throw new Error("Your session has expired. Please sign in again.");
    }

    const response = await updateOwnProfile(payload, session.token);
    const nextSession = storeSession(response);

    if (!nextSession.token || !nextSession.user) {
      throw new Error("Profile update did not return a valid session.");
    }

    setSession({
      status: "authenticated",
      token: nextSession.token,
      user: nextSession.user,
    });

    return response;
  }

  function renderHome() {
    if (session.status === "loading") {
      return <LoadingScreen />;
    }

    if (session.user?.role) {
      return <Navigate to={routeForRole(session.user.role)} replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={renderHome()} />
          <Route
            path="/login"
            element={<Login session={session} onLogin={handleLogin} />}
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute session={session} requiredRole="ADMIN">
                <AdminDashboard
                  user={session.user}
                  token={session.token}
                  onLogout={handleLogout}
                  onRefreshUser={handleRefreshUser}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute session={session} requiredRole="STUDENT">
                <StudentDashboard
                  user={session.user}
                  onLogout={handleLogout}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician-dashboard"
            element={
              <ProtectedRoute session={session} requiredRole="TECHNICIAN">
                <TechnicianDashboard
                  user={session.user}
                  onLogout={handleLogout}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
