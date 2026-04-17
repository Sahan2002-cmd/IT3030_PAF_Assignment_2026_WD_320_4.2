import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../Common/DashboardLayout";
import TicketWorkspace from "../Tickets/TicketWorkspace";
import { fetchAssignedTickets } from "../../services/api";

function TechnicianDashboard({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <DashboardLayout
      eyebrow="Technician"
      title="Assigned maintenance work"
      description="Manage assigned tickets, move work through the workflow, and keep students informed with clear resolution notes."
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

export default TechnicianDashboard;
