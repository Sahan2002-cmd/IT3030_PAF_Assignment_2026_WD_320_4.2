import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { approveTechnician, fetchPendingTechnicians } from "../../services/api";

function AdminApprovalsPage({
  user,
  token,
  notifications,
  onLogout,
  onRefreshUser,
  onMarkNotificationsRead,
  onProfileUpdate,
}) {
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadApprovals = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchPendingTechnicians(token);
      setPendingTechnicians(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load pending technicians.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  async function handleApprove(technicianId) {
    setApprovingId(technicianId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await approveTechnician(technicianId, token);
      setSuccessMessage(response.message || "Technician approved successfully.");
      await loadApprovals(false);
      await onRefreshUser();
    } catch (approveError) {
      setError(approveError.message || "Failed to approve technician.");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="Pending approvals"
      description="Review technician signup requests in a focused approval queue."
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
      {successMessage ? (
        <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">{successMessage}</p>
      ) : null}
      {isLoading ? (
        <section className="rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
          Loading pending technicians...
        </section>
      ) : pendingTechnicians.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-sky-200 bg-sky-50/70 p-10 text-center">
          <h3 className="text-xl font-bold text-primary">No pending requests</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">There are no technician accounts awaiting approval.</p>
        </section>
      ) : (
        <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
          <div className="grid gap-4">
            {pendingTechnicians.map((technician) => (
              <article key={technician.id} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-primary">{technician.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{technician.email}</p>
                    {technician.mobileNumber ? <p className="mt-1 text-sm text-slate-500">{technician.mobileNumber}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                        {technician.role}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pending
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApprove(technician.id)}
                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
                    disabled={approvingId === technician.id}
                  >
                    {approvingId === technician.id ? "Approving..." : "Approve"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}

export default AdminApprovalsPage;
