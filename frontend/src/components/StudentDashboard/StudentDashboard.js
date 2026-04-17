import React, { useCallback, useEffect, useState } from "react";
import { ArrowRight, Clock3, Layers3, Sparkles, Ticket, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
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
      title="Student command center"
      description="A cleaner home base for requests, activity, and progress before you jump into the full ticket workspace."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <Link
          to="/student-tickets"
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
          <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(2,132,199,0.92),rgba(14,165,233,0.86),rgba(255,255,255,0.92))] p-8 shadow-[0_28px_90px_rgba(14,165,233,0.20)] sm:p-10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                  <Sparkles size={14} />
                  Ready for quick action
                </div>
                <h2 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                  Submit issues faster and follow every update without the clutter.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-sky-50/95">
                  Your dashboard stays focused on what matters right now, while the full ticket center gives you creation,
                  evidence uploads, comments, and tracking in one place.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  to="/student-tickets"
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-white px-6 py-4 text-sm font-semibold text-primary transition hover:bg-sky-50"
                >
                  Open ticket center
                  <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => loadDashboard(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/35 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Refresh stats
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[28px] border border-sky-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(14,165,233,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-primary">
                <Layers3 size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Total tickets</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.totalTickets || 0}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">All requests you have submitted so far.</p>
            </article>

            <article className="rounded-[28px] border border-amber-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(245,158,11,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Clock3 size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Open now</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.openTickets || 0}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Tickets waiting for assignment or first action.</p>
            </article>

            <article className="rounded-[28px] border border-cyan-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(6,182,212,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Zap size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">In progress</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.inProgressTickets || 0}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Requests currently being worked on by technicians.</p>
            </article>

            <article className="rounded-[28px] border border-emerald-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(16,185,129,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Sparkles size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Completed</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">
                {(dashboard?.resolvedTickets || 0) + (dashboard?.closedTickets || 0)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Resolved and closed issues that moved through the workflow.</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Recent tickets</p>
                  <h3 className="mt-3 text-3xl font-extrabold text-primary">Latest activity</h3>
                </div>
                <Link
                  to="/student-tickets"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary"
                >
                  View all tickets
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="mt-6 grid gap-4">
                {dashboard?.tickets?.slice(0, 3).map((ticket) => (
                  <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white">
                            {ticket.ticketNumber}
                          </span>
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
                            {ticket.category.replaceAll("_", " ")}
                          </span>
                        </div>
                        <h4 className="mt-3 text-xl font-bold text-primary">{ticket.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {ticket.location} • {ticket.resourceName}
                        </p>
                      </div>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                        {ticket.status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </article>
                ))}

                {dashboard?.tickets?.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                    <h4 className="text-xl font-bold text-primary">No tickets yet</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Start from the ticket center to create your first maintenance request.
                    </p>
                  </div>
                ) : null}
              </div>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.96))] p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Quick path</p>
              <h3 className="mt-3 text-3xl font-extrabold text-primary">Go straight to tickets</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                The full ticket page is where you create requests, upload images, track comments, and refresh the latest status.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Create incidents with category, priority, and contact details.
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Upload up to three evidence images for each issue.
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Read technician updates and join the comment thread.
                </div>
              </div>

              <Link
                to="/student-tickets"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-900"
              >
                Open tickets page
                <ArrowRight size={16} />
              </Link>
            </article>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
