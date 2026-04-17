import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { deleteUser, fetchAllUsers } from "../../services/api";

function AdminUsersPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchAllUsers(token);
      setAllUsers(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
      await loadUsers(false);
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
      description="Review all registered accounts in one place and remove accounts when necessary."
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
          Loading users...
        </section>
      ) : (
        <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Total users</p>
              <p className="mt-3 text-3xl font-extrabold text-primary">{allUsers.length}</p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Technicians</p>
              <p className="mt-3 text-3xl font-extrabold text-primary">
                {allUsers.filter((account) => account.role === "TECHNICIAN").length}
              </p>
            </article>
            <article className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Students</p>
              <p className="mt-3 text-3xl font-extrabold text-primary">
                {allUsers.filter((account) => account.role === "STUDENT").length}
              </p>
            </article>
          </div>

          <div className="mt-8 grid gap-4">
            {allUsers.map((account) => {
              const isCurrentAdmin = account.id === user?.id;
              const statusLabel =
                account.role === "TECHNICIAN" ? (account.approved ? "Approved" : "Pending approval") : "Active";

              return (
                <article key={account.id} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
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
                            account.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
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
        </section>
      )}
    </DashboardLayout>
  );
}

export default AdminUsersPage;
