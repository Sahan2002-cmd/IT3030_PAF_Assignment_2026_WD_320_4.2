import React, { useEffect, useState } from "react";
import DashboardLayout from "../Common/DashboardLayout";
import { approveTechnician, fetchPendingTechnicians } from "../../services/api";

function AdminDashboard({ user, token, onLogout, onRefreshUser, onProfileUpdate }) {
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPendingTechnicians() {
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchPendingTechnicians(token);
      setPendingTechnicians(data);
    } catch (loadError) {
      setError(loadError.message || "Failed to load pending technicians.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialPendingTechnicians() {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchPendingTechnicians(token);
        if (isActive) {
          setPendingTechnicians(data);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError.message || "Failed to load pending technicians.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadInitialPendingTechnicians();

    return () => {
      isActive = false;
    };
  }, [token]);

  async function handleApprove(technicianId) {
    setApprovingId(technicianId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await approveTechnician(technicianId, token);
      setSuccessMessage(response.message || "Technician approved successfully.");
      await loadPendingTechnicians();
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
      title="Technician approvals"
      description="Only the approval queue is shown here so the admin workspace stays focused on the one backend action that matters."
      user={user}
      onLogout={onLogout}
      onProfileUpdate={onProfileUpdate}
      actions={
        <button
          type="button"
          onClick={loadPendingTechnicians}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
        >
          Refresh approvals
        </button>
      }
    >
      <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_rgba(37,99,235,0.08)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Pending queue</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">{pendingTechnicians.length}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Technician accounts waiting for admin approval
            </p>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : null}
        {successMessage ? (
          <p className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            {successMessage}
          </p>
        ) : null}

        {isLoading ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-slate-500">
            Loading pending technicians...
          </div>
        ) : null}

        {!isLoading && pendingTechnicians.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-sky-200 bg-sky-50/70 p-10 text-center">
            <h3 className="text-xl font-bold text-primary">No pending approvals</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              All technician signups have already been reviewed.
            </p>
          </div>
        ) : null}

        {!isLoading && pendingTechnicians.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {pendingTechnicians.map((technician) => (
              <article
                key={technician.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-primary">{technician.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{technician.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                        {technician.role}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Waiting approval
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
        ) : null}
      </section>
    </DashboardLayout>
  );
}

export default AdminDashboard;
