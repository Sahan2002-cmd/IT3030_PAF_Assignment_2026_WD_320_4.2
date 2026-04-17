import React, { useEffect, useState } from "react";
import { ArrowRight, Boxes, CheckCircle2, FileText, ShieldCheck, Ticket, UserCog, UserRoundCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import {
  fetchAllTickets,
  fetchAllUsers,
  fetchPendingTechnicians,
} from "../../services/api";

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
  const [ticketDashboard, setTicketDashboard] = useState(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [error, setError] = useState("");

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
      await Promise.all([
        loadPendingTechnicians(false),
        loadAllUsers(false),
        loadTicketDashboard(false),
      ]);
    } catch {
      // Individual loaders already surface their errors.
    }
  }

  async function loadTicketDashboard(showLoading = true) {
    if (showLoading) {
      setIsLoadingTickets(true);
    }

    try {
      const ticketData = await fetchAllTickets(token);
      setTicketDashboard(ticketData);
    } catch (loadError) {
      setError(loadError.message || "Failed to load tickets.");
    } finally {
      setIsLoadingTickets(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      setIsLoadingApprovals(true);
      setIsLoadingUsers(true);
      setError("");

      try {
        const [pendingData, usersData, ticketData] = await Promise.all([
          fetchPendingTechnicians(token),
          fetchAllUsers(token),
          fetchAllTickets(token),
        ]);

        if (isActive) {
          setPendingTechnicians(pendingData);
          setAllUsers(usersData);
          setTicketDashboard(ticketData);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError.message || "Failed to load admin data.");
        }
      } finally {
        if (isActive) {
          setIsLoadingApprovals(false);
          setIsLoadingUsers(false);
          setIsLoadingTickets(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isActive = false;
    };
  }, [token]);

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="Admin dashboard"
      description="A cleaner control center for accounts, approvals, and maintenance work, with each task available on its own focused page."
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
      {error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : null}
      {isLoadingApprovals || isLoadingUsers || isLoadingTickets ? (
        <section className="rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
          Loading admin dashboard...
        </section>
      ) : (
        <div className="grid gap-6">
          <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.90),rgba(14,165,233,0.76))] p-8 shadow-[0_28px_90px_rgba(15,23,42,0.20)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                  <ShieldCheck size={14} />
                  Admin control center
                </div>
                <h2 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                  Manage people, approvals, and ticket operations without crowding one screen.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100/90">
                  This dashboard gives you a clean overview first, while each admin task opens into its own focused and easier-to-manage page.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link to="/admin-tickets" className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-white px-6 py-4 text-sm font-semibold text-primary transition hover:bg-sky-50">
                  Ticket management
                  <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={refreshAdminData}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Refresh overview
                </button>
                <Link to="/admin-reports" className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15">
                  <FileText size={16} />
                  Reports
                </Link>
                <Link to="/admin-resources" className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15">
                  <Boxes size={16} />
                  Resources
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-primary"><Users size={18} /></div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Total users</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{allUsers.length}</p>
            </article>
            <article className="rounded-[28px] border border-amber-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(245,158,11,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><UserRoundCheck size={18} /></div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Pending approvals</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{pendingTechnicians.length}</p>
            </article>
            <article className="rounded-[28px] border border-cyan-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(6,182,212,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700"><Ticket size={18} /></div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">All tickets</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{ticketDashboard?.totalTickets || 0}</p>
            </article>
            <article className="rounded-[28px] border border-emerald-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(16,185,129,0.08)]">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={18} /></div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Resolved tickets</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{ticketDashboard?.resolvedTickets || 0}</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-primary"><Ticket size={20} /></div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">Ticket management</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">Assign technicians, review every incident, update workflow status, and manage rejection paths from a dedicated page.</p>
              <Link to="/admin-tickets" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary">
                Open ticket page
                <ArrowRight size={15} />
              </Link>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><UserCog size={20} /></div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">User management</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">See all accounts in one focused user view, including roles, approval state, and delete actions when cleanup is needed.</p>
              <Link to="/admin-users" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary">
                Open user management
                <ArrowRight size={15} />
              </Link>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><UserRoundCheck size={20} /></div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">Pending approvals</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">Keep technician approvals separate and easy to review so the admin queue stays calm and straightforward.</p>
              <Link to="/admin-approvals" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary">
                Open approvals
                <ArrowRight size={15} />
              </Link>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><FileText size={20} /></div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">Reports</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">Generate exports and summary reports for tickets, users, and the approval queue from one dedicated report center.</p>
              <Link to="/admin-reports" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary">
                Open reports
                <ArrowRight size={15} />
              </Link>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700"><Boxes size={20} /></div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">Resource catalogue</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">Create and review lecture halls, labs, meeting rooms, and equipment for Module A from a dedicated management page.</p>
              <Link to="/admin-resources" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-primary">
                Open resource management
                <ArrowRight size={15} />
              </Link>
            </article>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminDashboard;
