import React, { useCallback, useEffect, useState } from "react";
import { ArrowRight, Boxes, IdCard, Mail, Phone, ShieldCheck, Sparkles, Ticket, UserCircle2 } from "lucide-react";
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
      title="Student dashboard"
      description="See your account details here, then jump into the ticket area whenever you want to create or track maintenance requests."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <>
          <Link
            to="/student-resources"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
          >
            <Boxes size={16} />
            View resources
          </Link>
          <Link
            to="/student-tickets"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900"
          >
            <Ticket size={16} />
            Tickets
          </Link>
        </>
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
          <section className="relative overflow-hidden rounded-[36px] border border-sky-200/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,64,175,0.90),rgba(14,165,233,0.80))] p-8 shadow-[0_28px_90px_rgba(15,23,42,0.20)] sm:p-10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-sky-300/20 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100/70 bg-white/16 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] backdrop-blur-md">
                  <Sparkles size={14} />
                  Student workspace
                </div>
                <h2 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                  Welcome back, {user?.name}.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100/90">
                  Keep your profile details in view here and use the ticket section whenever you need to report an issue,
                  upload evidence, or follow technician updates.
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
                <Link
                  to="/student-resources"
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-sky-100/70 bg-white/12 px-6 py-4 text-sm font-semibold text-white transition hover:border-white/90 hover:bg-white/18"
                >
                  View resources
                </Link>
                <button
                  type="button"
                  onClick={() => loadDashboard(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-sky-100/70 bg-white/12 px-6 py-4 text-sm font-semibold text-white transition hover:border-white/90 hover:bg-white/18"
                >
                  Refresh stats
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[28px] border border-sky-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(14,165,233,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-primary">
                <UserCircle2 size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Full name</p>
              <p className="mt-3 text-2xl font-extrabold text-primary">{user?.name || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Your registered student account name.</p>
            </article>

            <article className="rounded-[28px] border border-amber-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(245,158,11,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Mail size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Email</p>
              <p className="mt-3 break-all text-xl font-extrabold text-primary">{user?.email || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Your login and account contact email.</p>
            </article>

            <article className="rounded-[28px] border border-cyan-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(6,182,212,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Phone size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Mobile number</p>
              <p className="mt-3 text-2xl font-extrabold text-primary">{user?.mobileNumber || "-"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Reachable contact detail for service updates.</p>
            </article>

            <article className="rounded-[28px] border border-emerald-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(16,185,129,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={18} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Account status</p>
              <p className="mt-3 text-2xl font-extrabold text-primary">Active</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Your student access is available and ready to use.</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Profile details</p>
                  <h3 className="mt-3 text-3xl font-extrabold text-primary">Account summary</h3>
                </div>
                <Link
                  to="/student-tickets"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary"
                >
                  Go to tickets
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="mt-6 grid gap-4">
                <article className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-primary">
                      <IdCard size={18} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-primary">Profile management</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Use the profile icon at the top-right any time you want to update your name, email, phone number, or password.
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <Ticket size={18} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-primary">Ticket access</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        The ticket page is separate on purpose, so reporting issues and following maintenance updates feels focused and easy to manage.
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-primary">Account readiness</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Your student account is active and ready for sign-in, ticket submission, and communication with support staff.
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                      <Boxes size={18} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-primary">Resource catalogue</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Use the resource view to browse lecture halls, labs, meeting rooms, and equipment with filters for type, capacity, and location.
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.96))] p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Ticket snapshot</p>
              <h3 className="mt-3 text-3xl font-extrabold text-primary">Quick ticket view</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Your full ticket workflow is in the separate tickets page, but here is a quick summary before you open it.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Total tickets: <span className="font-semibold text-primary">{dashboard?.totalTickets || 0}</span>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Open tickets: <span className="font-semibold text-primary">{dashboard?.openTickets || 0}</span>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  In progress: <span className="font-semibold text-primary">{dashboard?.inProgressTickets || 0}</span>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Resolved + closed:{" "}
                  <span className="font-semibold text-primary">
                    {(dashboard?.resolvedTickets || 0) + (dashboard?.closedTickets || 0)}
                  </span>
                </div>
              </div>

              <Link
                to="/student-tickets"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-[24px] bg-primary px-6 py-4 text-sm font-semibold text-white transition hover:bg-sky-900"
              >
                Open tickets page
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/student-resources"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
              >
                View resource catalogue
              </Link>
            </article>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentDashboard;
