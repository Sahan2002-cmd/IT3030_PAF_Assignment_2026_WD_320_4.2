import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import TicketWorkspace from "../Tickets/TicketWorkspace";
import { fetchAssignedTickets } from "../../services/api";

function TechnicianTicketsPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchAssignedTickets(token);
      setDashboard(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load assigned tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <DashboardLayout
      eyebrow="Technician"
      title="Technician tickets"
      description="Work through assigned incidents, add resolution notes, and keep students informed from a focused ticket workspace."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <Link
          to="/technician-dashboard"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
        >
          Back to dashboard
        </Link>
      }
    >
      {error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : null}
      {isLoading ? (
        <section className="rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
          Loading assigned tickets...
        </section>
      ) : (
        <TicketWorkspace
          mode="technician"
          user={user}
          token={token}
          dashboard={dashboard}
          onRefresh={() => loadDashboard(false)}
        />
      )}
    </DashboardLayout>
  );
}

export default TechnicianTicketsPage;
