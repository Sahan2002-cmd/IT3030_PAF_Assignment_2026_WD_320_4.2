import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import TicketWorkspace from "../Tickets/TicketWorkspace";
import { fetchAllTickets, fetchAssignableTechnicians } from "../../services/api";

function AdminTicketsPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [ticketDashboard, setTicketDashboard] = useState(null);
  const [assignableTechnicians, setAssignableTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const [ticketData, technicianData] = await Promise.all([
        fetchAllTickets(token),
        fetchAssignableTechnicians(token),
      ]);
      setTicketDashboard(ticketData);
      setAssignableTechnicians(technicianData);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load ticket management.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="Ticket management"
      description="Assign technicians, track all incident tickets, and manage status changes from a dedicated admin ticket view."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <Link
          to="/admin-dashboard"
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
          Loading ticket management...
        </section>
      ) : (
        <TicketWorkspace
          mode="admin"
          user={user}
          token={token}
          dashboard={ticketDashboard}
          technicians={assignableTechnicians}
          onRefresh={() => loadDashboard(false)}
          showAssignment
        />
      )}
    </DashboardLayout>
  );
}

export default AdminTicketsPage;
