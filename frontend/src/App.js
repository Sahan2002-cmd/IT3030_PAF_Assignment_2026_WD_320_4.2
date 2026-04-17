import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import AboutPage from "./components/Public/AboutPage";
import HomePage from "./components/Public/HomePage";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import AdminApprovalsPage from "./components/AdminDashboard/AdminApprovalsPage";
import AdminBookingsPage from "./components/AdminDashboard/AdminBookingsPage";
import AdminReportsPage from "./components/Reports/AdminReportsPage";
import AdminResourcesPage from "./components/AdminDashboard/AdminResourcesPage";
import AdminTicketsPage from "./components/AdminDashboard/AdminTicketsPage";
import AdminUsersPage from "./components/AdminDashboard/AdminUsersPage";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
import StudentBookingsPage from "./components/StudentDashboard/StudentBookingsPage";
import StudentResourcesPage from "./components/StudentDashboard/StudentResourcesPage";
import StudentTicketsPage from "./components/StudentDashboard/StudentTicketsPage";
import TechnicianReportsPage from "./components/Reports/TechnicianReportsPage";
import TechnicianDashboard from "./components/TechnicianDashboard/TechnicianDashboard";
import TechnicianTicketsPage from "./components/TechnicianDashboard/TechnicianTicketsPage";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import LoadingScreen from "./components/Common/LoadingScreen";
import {
  fetchAllBookings,
  fetchAllTickets,
  fetchCurrentUser,
  fetchMyBookings,
  fetchMyTickets,
  updateOwnProfile,
} from "./services/api";
import { clearSession, loadSession, storeSession, updateStoredUser } from "./utils/auth";
import {
  addNotification,
  loadNotificationSnapshot,
  loadNotifications,
  markAllNotificationsRead,
  saveNotificationSnapshot,
} from "./utils/notifications";

const NOTIFICATION_SYNC_INTERVAL_MS = 30000;

function ticketStatusLabel(status) {
  switch (status) {
    case "OPEN":
      return "Open";
    case "IN_PROGRESS":
      return "In Progress";
    case "RESOLVED":
      return "Resolved";
    case "CLOSED":
      return "Closed";
    case "REJECTED":
      return "Rejected";
    default:
      return status;
  }
}

function buildTicketNotification(ticket, previousStatus) {
  switch (ticket.status) {
    case "IN_PROGRESS":
      return {
        title: "Ticket in progress",
        message: `${ticket.ticketNumber} is now in progress.`,
      };
    case "RESOLVED":
      return {
        title: "Ticket resolved",
        message: `${ticket.ticketNumber} has been resolved.`,
      };
    case "CLOSED":
      return {
        title: "Ticket closed",
        message: `${ticket.ticketNumber} has been closed.`,
      };
    case "REJECTED":
      return {
        title: "Ticket rejected",
        message: `${ticket.ticketNumber} was rejected.`,
      };
    default:
      return {
        title: "Ticket updated",
        message: `${ticket.ticketNumber} changed from ${ticketStatusLabel(previousStatus)} to ${ticketStatusLabel(ticket.status)}.`,
      };
  }
}

function bookingStatusLabel(status) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function formatBookingDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildBookingNotification(booking, previousStatus) {
  const bookingDate = formatBookingDate(booking.bookingDate);

  switch (booking.status) {
    case "APPROVED":
      return {
        title: "Booking approved",
        message: `Your booking for ${booking.resourceName} on ${bookingDate} was approved.`,
      };
    case "REJECTED":
      return {
        title: "Booking rejected",
        message: `Your booking for ${booking.resourceName} on ${bookingDate} was rejected.`,
      };
    case "CANCELLED":
      return {
        title: "Booking cancelled",
        message: `Your booking for ${booking.resourceName} on ${bookingDate} was cancelled.`,
      };
    default:
      return {
        title: "Booking updated",
        message: `Your booking for ${booking.resourceName} changed from ${bookingStatusLabel(previousStatus)} to ${bookingStatusLabel(booking.status)}.`,
      };
  }
}

function buildAdminTicketNotification(ticket) {
  return {
    title: "New incident ticket",
    message: `${ticket.ticketNumber} was submitted by ${ticket.createdByName}.`,
  };
}

function buildAdminBookingNotification(booking) {
  return {
    title: "New booking request",
    message: `${booking.requesterName} requested ${booking.resourceName} for ${formatBookingDate(booking.bookingDate)}.`,
  };
}

function App() {
  const [session, setSession] = useState(() => {
    const storedSession = loadSession();

    return {
      status: storedSession.token
        ? (storedSession.user ? "authenticated" : "loading")
        : "anonymous",
      token: storedSession.token,
      user: storedSession.user,
    };
  });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!session.user?.id) {
      setNotifications([]);
      return;
    }

    setNotifications(loadNotifications(session.user.id));
  }, [session.user?.id]);

  const addUserNotification = useCallback((userId, notification) => {
    const nextNotifications = addNotification(userId, notification);
    if (session.user?.id === userId) {
      setNotifications(nextNotifications);
    }
  }, [session.user?.id]);

  const addCurrentUserNotification = useCallback((notification) => {
    if (!session.user?.id) {
      return;
    }

    addUserNotification(session.user.id, notification);
  }, [addUserNotification, session.user?.id]);

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
          mobileNumber: currentUser.mobileNumber,
          role: currentUser.role,
          approved: currentUser.approved,
          createdAt: currentUser.createdAt,
        };

        if (nextUser.role === "TECHNICIAN" && nextUser.approved && !session.user?.approved) {
          addUserNotification(nextUser.id, {
            title: "Approval confirmed",
            message: "Your technician account has been approved.",
            type: "approval",
          });
        }

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
  }, [addUserNotification, session.status, session.token, session.user]);

  useEffect(() => {
    if (
      session.status !== "authenticated"
      || !session.token
      || !session.user?.id
      || session.user.role !== "STUDENT"
    ) {
      return;
    }

    let isActive = true;

    async function syncStudentNotifications() {
      try {
        const [ticketDashboard, bookings] = await Promise.all([
          fetchMyTickets(session.token),
          fetchMyBookings(session.token),
        ]);

        if (!isActive) {
          return;
        }

        const previousTicketSnapshot = loadNotificationSnapshot(session.user.id, "student-tickets");
        const nextTicketSnapshot = {};

        (ticketDashboard?.tickets || []).forEach((ticket) => {
          nextTicketSnapshot[ticket.id] = ticket.status;
          const previousStatus = previousTicketSnapshot[ticket.id];

          if (previousStatus && previousStatus !== ticket.status) {
            addUserNotification(session.user.id, {
              ...buildTicketNotification(ticket, previousStatus),
              type: "ticket",
            });
          }
        });

        saveNotificationSnapshot(session.user.id, "student-tickets", nextTicketSnapshot);

        const previousBookingSnapshot = loadNotificationSnapshot(session.user.id, "student-bookings");
        const nextBookingSnapshot = {};

        bookings.forEach((booking) => {
          nextBookingSnapshot[booking.id] = booking.status;
          const previousStatus = previousBookingSnapshot[booking.id];

          if (previousStatus && previousStatus !== booking.status) {
            addUserNotification(session.user.id, {
              ...buildBookingNotification(booking, previousStatus),
              type: "booking",
            });
          }
        });

        saveNotificationSnapshot(session.user.id, "student-bookings", nextBookingSnapshot);
      } catch {
        // Keep login flow resilient if the background notification sync fails.
      }
    }

    syncStudentNotifications();
    const intervalId = window.setInterval(syncStudentNotifications, NOTIFICATION_SYNC_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [addUserNotification, session.status, session.token, session.user]);

  useEffect(() => {
    if (
      session.status !== "authenticated"
      || !session.token
      || !session.user?.id
      || session.user.role !== "ADMIN"
    ) {
      return;
    }

    let isActive = true;

    async function syncAdminNotifications() {
      try {
        const [ticketDashboard, bookings] = await Promise.all([
          fetchAllTickets(session.token),
          fetchAllBookings({}, session.token),
        ]);

        if (!isActive) {
          return;
        }

        const previousTicketSnapshot = loadNotificationSnapshot(session.user.id, "admin-tickets");
        const hasPreviousTicketSnapshot = Object.keys(previousTicketSnapshot).length > 0;
        const nextTicketSnapshot = {};

        (ticketDashboard?.tickets || []).forEach((ticket) => {
          nextTicketSnapshot[ticket.id] = ticket.createdAt;
          if (hasPreviousTicketSnapshot && !previousTicketSnapshot[ticket.id]) {
            addUserNotification(session.user.id, {
              ...buildAdminTicketNotification(ticket),
              type: "ticket",
            });
          }
        });

        saveNotificationSnapshot(session.user.id, "admin-tickets", nextTicketSnapshot);

        const previousBookingSnapshot = loadNotificationSnapshot(session.user.id, "admin-bookings");
        const hasPreviousBookingSnapshot = Object.keys(previousBookingSnapshot).length > 0;
        const nextBookingSnapshot = {};

        bookings.forEach((booking) => {
          nextBookingSnapshot[booking.id] = booking.createdAt;
          if (hasPreviousBookingSnapshot && !previousBookingSnapshot[booking.id]) {
            addUserNotification(session.user.id, {
              ...buildAdminBookingNotification(booking),
              type: "booking",
            });
          }
        });

        saveNotificationSnapshot(session.user.id, "admin-bookings", nextBookingSnapshot);
      } catch {
        // Keep login flow resilient if the background notification sync fails.
      }
    }

    syncAdminNotifications();
    const intervalId = window.setInterval(syncAdminNotifications, NOTIFICATION_SYNC_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [addUserNotification, session.status, session.token, session.user]);

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
        mobileNumber: currentUser.mobileNumber,
        role: currentUser.role,
        approved: currentUser.approved,
        createdAt: currentUser.createdAt,
      };

      if (nextUser.role === "TECHNICIAN" && nextUser.approved && !session.user?.approved) {
        addUserNotification(nextUser.id, {
          title: "Approval confirmed",
          message: "Your technician account has been approved.",
          type: "approval",
        });
      }

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

    const previousUser = session.user;
    const response = await updateOwnProfile(payload, session.token);
    const nextSession = storeSession(response);

    if (!nextSession.token || !nextSession.user) {
      throw new Error("Profile update did not return a valid session.");
    }

    if (previousUser?.id) {
      if (payload.name?.trim() && payload.name.trim() !== previousUser.name) {
        addUserNotification(previousUser.id, {
          title: "Name updated",
          message: `Your name was changed to ${payload.name.trim()}.`,
          type: "profile",
        });
      }

      if (payload.email?.trim().toLowerCase() && payload.email.trim().toLowerCase() !== previousUser.email) {
        addUserNotification(previousUser.id, {
          title: "Email updated",
          message: `Your email was changed to ${payload.email.trim().toLowerCase()}.`,
          type: "profile",
        });
      }

      if (payload.mobileNumber?.trim() && payload.mobileNumber.trim() !== previousUser.mobileNumber) {
        addUserNotification(previousUser.id, {
          title: "Mobile number updated",
          message: "Your mobile number was updated successfully.",
          type: "profile",
        });
      }

      if (payload.newPassword) {
        addUserNotification(previousUser.id, {
          title: "Password changed",
          message: "Your password was changed successfully.",
          type: "security",
        });
      }
    }

    setSession({
      status: "authenticated",
      token: nextSession.token,
      user: nextSession.user,
    });

    return response;
  }

  function handleMarkNotificationsRead() {
    if (!session.user?.id) {
      return;
    }

    setNotifications(markAllNotificationsRead(session.user.id));
  }

  function renderHome() {
    if (session.status === "loading") {
      return <LoadingScreen />;
    }

    if (session.user?.role) {
      return <HomePage session={session} />;
    }

    return <HomePage session={session} />;
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={renderHome()} />
          <Route path="/about" element={<AboutPage session={session} />} />
          <Route path="/resources" element={<Navigate to="/student-resources" replace />} />
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
                  notifications={notifications}
                  onLogout={handleLogout}
                  onRefreshUser={handleRefreshUser}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
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
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-tickets"
            element={
              <ProtectedRoute session={session} requiredRole="ADMIN">
                <AdminTicketsPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-users"
            element={
              <ProtectedRoute session={session} requiredRole="ADMIN">
                <AdminUsersPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-approvals"
            element={
              <ProtectedRoute session={session} requiredRole="ADMIN">
                <AdminApprovalsPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onRefreshUser={handleRefreshUser}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-reports"
            element={
              <ProtectedRoute session={session} requiredRole="ADMIN">
                <AdminReportsPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-resources"
            element={
              <ProtectedRoute session={session} requiredRole="ADMIN">
                <AdminResourcesPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-bookings"
            element={
              <ProtectedRoute session={session} requiredRole="ADMIN">
                <AdminBookingsPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-tickets"
            element={
              <ProtectedRoute session={session} requiredRole="STUDENT">
                <StudentTicketsPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-resources"
            element={
              <ProtectedRoute session={session} requiredRole="STUDENT">
                <StudentResourcesPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                  onAddNotification={addCurrentUserNotification}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-bookings"
            element={
              <ProtectedRoute session={session} requiredRole="STUDENT">
                <StudentBookingsPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
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
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician-tickets"
            element={
              <ProtectedRoute session={session} requiredRole="TECHNICIAN">
                <TechnicianTicketsPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onProfileUpdate={handleProfileUpdate}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technician-reports"
            element={
              <ProtectedRoute session={session} requiredRole="TECHNICIAN">
                <TechnicianReportsPage
                  user={session.user}
                  token={session.token}
                  notifications={notifications}
                  onLogout={handleLogout}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
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
