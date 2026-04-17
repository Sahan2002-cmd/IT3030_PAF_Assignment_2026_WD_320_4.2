import React, { useCallback, useEffect, useState } from "react";
import { ArrowRight, FileText, Mail, Phone, ShieldCheck, Ticket, UserCircle2, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
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
      title="Technician dashboard"
      description="See your technician details here and jump into the dedicated ticket workspace when you are ready to work through assigned incidents."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <Link
          to="/technician-tickets"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900"
        >
          <Ticket size={16} />
          Tickets
        </Link>
      }
    >
      {error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : null}
      {isLoading ? (
        <section className="rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
          Loading dashboard...
        </section>
      ) : (
        <div className="grid gap-6">
          <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.90),rgba(14,165,233,0.76))] p-8 shadow-[0_28px_90px_rgba(15,23,42,0.20)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100/60 bg-white/24 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] backdrop-blur-md">
                  <Wrench size={14} />
                  Technician workspace
                </div>
                <h2 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                  Keep maintenance work clear, calm, and easy to manage.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100/90">
                  Review your account details here, then move into the dedicated tickets page to update statuses, add notes, and keep students informed.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  to="/technician-tickets"
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-white px-6 py-4 text-sm font-semibold text-primary transition hover:bg-cyan-50"
                >
                  Open tickets
                  <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => loadDashboard(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Refresh stats
                </button>
                <Link
                  to="/technician-reports"
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <FileText size={16} />
                  Reports
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[28px] border border-cyan-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(6,182,212,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <UserCircle2 size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Full name</p>
              <p className="mt-3 text-2xl font-extrabold text-primary">{user?.name || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Your approved technician account name.</p>
            </article>
            <article className="rounded-[28px] border border-sky-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(14,165,233,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-primary">
                <Mail size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Email</p>
              <p className="mt-3 break-all text-xl font-extrabold text-primary">{user?.email || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Your main work contact email.</p>
            </article>
            <article className="rounded-[28px] border border-emerald-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(16,185,129,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Phone size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Mobile number</p>
              <p className="mt-3 text-2xl font-extrabold text-primary">{user?.mobileNumber || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Used for quick coordination when needed.</p>
            </article>
            <article className="rounded-[28px] border border-violet-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(139,92,246,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <ShieldCheck size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">Account status</p>
              <p className="mt-3 text-2xl font-extrabold text-primary">{user?.approved ? "Approved" : "Pending"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Technician access depends on approval status.</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Work summary</p>
                  <h3 className="mt-3 text-3xl font-extrabold text-primary">Assigned ticket status</h3>
                </div>
                <Link to="/technician-tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary">
                  Go to tickets
                  <ArrowRight size={15} />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <article className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Assigned total</p>
                  <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.totalTickets || 0}</p>
                </article>
                <article className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">In progress</p>
                  <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.inProgressTickets || 0}</p>
                </article>
                <article className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Resolved</p>
                  <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.resolvedTickets || 0}</p>
                </article>
                <article className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Closed</p>
                  <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.closedTickets || 0}</p>
                </article>
              </div>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,254,255,0.96))] p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Quick path</p>
              <h3 className="mt-3 text-3xl font-extrabold text-primary">Focused ticket page</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Use the tickets page to update status, write resolution notes, and keep the service workflow moving cleanly.
              </p>
              <div className="mt-6 grid gap-3">
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Add technician progress updates
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Resolve tickets with clear notes
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Follow role-colored comments easily
                </div>
              </div>
              <div className="mt-8 grid gap-3">
                <Link
                  to="/technician-tickets"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-900"
                >
                  Open tickets page
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/technician-reports"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <FileText size={16} />
                  Open reports page
                </Link>
              </div>
            </article>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default TechnicianDashboard;
