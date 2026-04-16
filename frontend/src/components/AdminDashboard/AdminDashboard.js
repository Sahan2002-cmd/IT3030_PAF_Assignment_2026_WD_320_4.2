import React, { useEffect, useState } from "react";
import DashboardLayout from "../Common/DashboardLayout";
import { approveTechnician, deleteUser, fetchAllUsers, fetchPendingTechnicians } from "../../services/api";

function AdminDashboard({
  user,
  token,
  notifications,
  onLogout,
  onRefreshUser,
  onMarkNotificationsRead,
  onProfileUpdate,
}) {
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPendingTechnicians(showLoading = true) {
    if (showLoading) {
      setIsLoadingApprovals(true);
    }

    try {
      const data = await fetchPendingTechnicians(token);
      setPendingTechnicians(data);
    } catch (loadError) {
      setError(loadError.message || "Failed to load pending technicians.");
    } finally {
      setIsLoadingApprovals(false);
    }
  }

  async function loadAllUsers(showLoading = true) {
    if (showLoading) {
      setIsLoadingUsers(true);
    }

    try {
      const data = await fetchAllUsers(token);
      setAllUsers(data);
    } catch (loadError) {
      setError(loadError.message || "Failed to load users.");
    } finally {
      setIsLoadingUsers(false);
    }
  }

  async function refreshAdminData() {
    setError("");

    try {
      await Promise.all([loadPendingTechnicians(false), loadAllUsers(false)]);
    } catch {
      // Individual loaders already surface their errors.
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      setIsLoadingApprovals(true);
      setIsLoadingUsers(true);
      setError("");

      try {
        const [pendingData, usersData] = await Promise.all([
          fetchPendingTechnicians(token),
          fetchAllUsers(token),
        ]);

        if (isActive) {
          setPendingTechnicians(pendingData);
          setAllUsers(usersData);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError.message || "Failed to load admin data.");
        }
      } finally {
        if (isActive) {
          setIsLoadingApprovals(false);
          setIsLoadingUsers(false);
        }
      }
    }

    loadInitialData();

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
      await refreshAdminData();
      await onRefreshUser();
    } catch (approveError) {
      setError(approveError.message || "Failed to approve technician.");
    } finally {
      setApprovingId(null);
    }
  }

  async function handleDeleteUser(userId, userName) {
    const confirmed = window.confirm(`Delete ${userName}'s account? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(userId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await deleteUser(userId, token);
      setSuccessMessage(response.message || "User deleted successfully.");
      await refreshAdminData();
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="User management"
      description="Review user accounts, approve technicians, and remove accounts when needed."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <button
          type="button"
          onClick={refreshAdminData}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
        >
          Refresh
        </button>
      }
    >
      <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_rgba(37,99,235,0.08)] backdrop-blur sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Total users</p>
            <p className="mt-3 text-3xl font-extrabold text-primary">{allUsers.length}</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Pending approvals</p>
            <p className="mt-3 text-3xl font-extrabold text-primary">{pendingTechnicians.length}</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Administrators</p>
            <p className="mt-3 text-3xl font-extrabold text-primary">
              {allUsers.filter((account) => account.role === "ADMIN").length}
            </p>
          </article>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Pending requests</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">{pendingTechnicians.length}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Accounts waiting for review</p>
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

        {isLoadingApprovals ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-slate-500">
            Loading pending technicians...
          </div>
        ) : null}

        {!isLoadingApprovals && pendingTechnicians.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-sky-200 bg-sky-50/70 p-10 text-center">
            <h3 className="text-xl font-bold text-primary">No pending requests</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              There are no technician accounts awaiting approval.
            </p>
          </div>
        ) : null}

        {!isLoadingApprovals && pendingTechnicians.length > 0 ? (
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
        ) : null}

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">All users</p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">{allUsers.length}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Review all registered accounts and remove users when required.
          </p>
        </div>

        {isLoadingUsers ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-slate-500">
            Loading users...
          </div>
        ) : null}

        {!isLoadingUsers && allUsers.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {allUsers.map((account) => {
              const isCurrentAdmin = account.id === user?.id;
              const statusLabel =
                account.role === "TECHNICIAN" ? (account.approved ? "Approved" : "Pending approval") : "Active";

              return (
                <article
                  key={account.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-primary">{account.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{account.email}</p>
                      {account.mobileNumber ? <p className="mt-1 text-sm text-slate-500">{account.mobileNumber}</p> : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                          {account.role}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            account.approved
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {statusLabel}
                        </span>
                        {isCurrentAdmin ? (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            Current account
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(account.id, account.name)}
                      className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isCurrentAdmin || deletingId === account.id}
                    >
                      {deletingId === account.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  );
}

export default AdminDashboard;
