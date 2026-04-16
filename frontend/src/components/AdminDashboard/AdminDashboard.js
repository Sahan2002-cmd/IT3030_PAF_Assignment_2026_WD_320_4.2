import React, { useEffect, useState } from "react";
import DashboardLayout from "../Common/DashboardLayout";
import { approveTechnician, fetchPendingTechnicians } from "../../services/api";

function AdminDashboard({ user, token, onLogout, onRefreshUser }) {
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

  const actions = (
    <button
      type="button"
      onClick={loadPendingTechnicians}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:border-accent/40"
    >
      <span aria-hidden="true">[+]</span>
      Refresh list
    </button>
  );

  return (
    <DashboardLayout
      eyebrow="Admin Control"
      title="Technician approvals"
      description="This dashboard uses the backend admin endpoints to review and approve technician accounts."
      user={user}
      onLogout={onLogout}
      actions={actions}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-accent">PN</span>
            <h2 className="text-base font-semibold text-primary">Pending technicians</h2>
          </div>
          <p className="mt-4 text-4xl font-extrabold text-primary">{pendingTechnicians.length}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Accounts waiting for admin approval.</p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-secondary">AD</span>
            <h2 className="text-base font-semibold text-primary">Admin authority</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            Only admins can access `/api/admin/technicians/pending` and `/api/admin/technicians/{'{id}'}/approve`.
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-accent">OK</span>
            <h2 className="text-base font-semibold text-primary">Backend sync</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            The dashboard refreshes directly from the backend, so what you see here is the real approval queue.
          </p>
        </article>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : null}
      {successMessage ? (
        <p className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-accent">TN</span>
          <h2 className="text-2xl font-bold text-primary">Pending Technician Requests</h2>
        </div>
        <p className="mt-3 text-base leading-7 text-slate-500">
          Approving a technician here allows that user to log in and access technician features.
        </p>

        {isLoading ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-slate-500">
            Loading pending technicians...
          </div>
        ) : null}

        {!isLoading && pendingTechnicians.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
              OK
            </span>
            <h3 className="mt-4 text-xl font-bold text-primary">No pending approvals</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Every technician signup has already been reviewed.
            </p>
          </div>
        ) : null}

        {!isLoading && pendingTechnicians.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {pendingTechnicians.map((technician) => (
              <article
                key={technician.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
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
                        Pending approval
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApprove(technician.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                    disabled={approvingId === technician.id}
                  >
                    <span aria-hidden="true">[OK]</span>
                    {approvingId === technician.id ? "Approving..." : "Approve technician"}
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
