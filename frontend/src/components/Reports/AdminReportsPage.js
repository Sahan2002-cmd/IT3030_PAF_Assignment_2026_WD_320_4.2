import React, { useCallback, useEffect, useState } from "react";
import { BarChart3, ClipboardList, Download, FileText, Printer, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { fetchAllTickets, fetchAllUsers, fetchPendingTechnicians } from "../../services/api";
import { downloadFile, escapeHtml, formatReportDate, openPrintDocument, statusLabel, toCsv } from "./reportUtils";

function AdminReportsPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [tickets, setTickets] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const [ticketData, userData, pendingData] = await Promise.all([
        fetchAllTickets(token),
        fetchAllUsers(token),
        fetchPendingTechnicians(token),
      ]);
      setTickets(ticketData);
      setUsers(userData);
      setPendingTechnicians(pendingData);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load admin reports.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function downloadTicketCsv() {
    const rows = [
      ["Ticket Number", "Title", "Status", "Priority", "Category", "Created By", "Assigned Technician", "Updated At"],
      ...((tickets?.tickets || []).map((ticket) => [
        ticket.ticketNumber,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.createdByName,
        ticket.assignedTechnicianName || "Unassigned",
        ticket.updatedAt,
      ])),
    ];

    downloadFile("admin-ticket-report.csv", toCsv(rows), "text/csv;charset=utf-8;");
  }

  function downloadUserCsv() {
    const rows = [
      ["Name", "Email", "Role", "Approved", "Created At"],
      ...users.map((account) => [
        account.name,
        account.email,
        account.role,
        account.approved,
        account.createdAt,
      ]),
    ];

    downloadFile("admin-user-report.csv", toCsv(rows), "text/csv;charset=utf-8;");
  }

  function exportPdfReport() {
    const ticketRows = (tickets?.tickets || [])
      .slice(0, 10)
      .map(
        (ticket) => `
          <tr>
            <td>${escapeHtml(ticket.ticketNumber)}</td>
            <td>${escapeHtml(ticket.title)}</td>
            <td>${escapeHtml(statusLabel(ticket.status))}</td>
            <td>${escapeHtml(ticket.createdByName)}</td>
            <td>${escapeHtml(ticket.assignedTechnicianName || "Unassigned")}</td>
          </tr>`
      )
      .join("");

    const approvalItems = pendingTechnicians.length
      ? `<ul class="muted-list">${pendingTechnicians
          .map((account) => `<li>${escapeHtml(account.name)} (${escapeHtml(account.email)})</li>`)
          .join("")}</ul>`
      : `<p class="small">No pending technician approvals at the moment.</p>`;

    openPrintDocument({
      title: "Admin Operations Report",
      subtitle: `Generated on ${formatReportDate()} for ${user?.name || "Admin"}. Use the browser print dialog and choose Save as PDF for a professional PDF export.`,
      bodyHtml: `
        <section class="section">
          <h2>Executive snapshot</h2>
          <div class="grid">
            <div class="stat"><div class="label">Total users</div><div class="value">${users.length}</div></div>
            <div class="stat"><div class="label">Pending approvals</div><div class="value">${pendingTechnicians.length}</div></div>
            <div class="stat"><div class="label">All tickets</div><div class="value">${tickets?.totalTickets || 0}</div></div>
            <div class="stat"><div class="label">Open</div><div class="value">${tickets?.openTickets || 0}</div></div>
            <div class="stat"><div class="label">Resolved</div><div class="value">${tickets?.resolvedTickets || 0}</div></div>
            <div class="stat"><div class="label">Rejected</div><div class="value">${tickets?.rejectedTickets || 0}</div></div>
          </div>
        </section>
        <section class="section">
          <h2>Recent ticket operations</h2>
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Status</th>
                <th>Created by</th>
                <th>Assigned technician</th>
              </tr>
            </thead>
            <tbody>${ticketRows || '<tr><td colspan="5">No tickets available.</td></tr>'}</tbody>
          </table>
        </section>
        <section class="section">
          <h2>Pending approval queue</h2>
          ${approvalItems}
        </section>
      `,
    });
  }

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="Report generation"
      description="Generate admin-level reports for users, approvals, and ticket operations from one clean reporting page."
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
          Loading admin reports...
        </section>
      ) : (
        <div className="grid gap-6">
          <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.90),rgba(14,165,233,0.76))] p-8 shadow-[0_28px_90px_rgba(15,23,42,0.20)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                  <BarChart3 size={14} />
                  Admin reporting
                </div>
                <h2 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                  Create executive-style snapshots for people, tickets, and approvals.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100/90">
                  Export clean CSVs, generate a PDF-ready summary report, or print the current report view for reviews and admin follow-up.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={exportPdfReport}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-white px-6 py-4 text-sm font-semibold text-primary transition hover:bg-sky-50"
                >
                  <FileText size={16} />
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/25 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <Printer size={16} />
                  Print report
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Total users</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{users.length}</p>
            </article>
            <article className="rounded-[28px] border border-amber-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(245,158,11,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Pending approvals</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{pendingTechnicians.length}</p>
            </article>
            <article className="rounded-[28px] border border-cyan-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(6,182,212,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">All tickets</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{tickets?.totalTickets || 0}</p>
            </article>
            <article className="rounded-[28px] border border-emerald-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(16,185,129,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Resolved</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{tickets?.resolvedTickets || 0}</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-primary">
                <ClipboardList size={20} />
              </div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">Ticket report</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">Export every ticket with assignment and status information for oversight or audit use.</p>
              <button
                type="button"
                onClick={downloadTicketCsv}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900"
              >
                <Download size={15} />
                Export ticket CSV
              </button>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Users size={20} />
              </div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">User report</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">Generate a clean list of users with roles, approval state, and account creation timestamps.</p>
              <button
                type="button"
                onClick={downloadUserCsv}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900"
              >
                <Download size={15} />
                Export user CSV
              </button>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <ShieldCheck size={20} />
              </div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">Approval report</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">See who is still waiting for approval and include the approval queue in admin reviews.</p>
              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/75 p-4 text-sm text-slate-600">
                Pending technicians: <span className="font-semibold text-primary">{pendingTechnicians.length}</span>
              </div>
            </article>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
            <h3 className="text-3xl font-extrabold text-primary">Recent ticket report lines</h3>
            <div className="mt-6 grid gap-4">
              {(tickets?.tickets || []).slice(0, 8).map((ticket) => (
                <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{ticket.ticketNumber}</p>
                      <h4 className="mt-2 text-xl font-bold text-primary">{ticket.title}</h4>
                      <p className="mt-2 text-sm text-slate-500">
                        {ticket.createdByName} • {ticket.assignedTechnicianName || "Unassigned"} • {ticket.priority}
                      </p>
                    </div>
                    <div className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {statusLabel(ticket.status)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminReportsPage;
