import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../Common/DashboardLayout";
import TicketWorkspace from "../Tickets/TicketWorkspace";
import { fetchMyTickets } from "../../services/api";

function StudentDashboard({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchMyTickets(token);
      setDashboard(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load your tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <DashboardLayout
      eyebrow="Student"
      title="Incident ticketing"
      description="Create maintenance tickets, track their status, and collaborate with technicians through updates and comments."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
    >
      {error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : null}
      {isLoading ? (
        <section className="rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
          Loading your tickets...
        </section>
      ) : (
        <TicketWorkspace
          mode="student"
          user={user}
          token={token}
          dashboard={dashboard}
          onRefresh={() => loadDashboard(false)}
          allowCreate
        />
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
