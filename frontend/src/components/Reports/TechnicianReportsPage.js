import React, { useCallback, useEffect, useState } from "react";
import { BarChart3, Download, FileText, Printer, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { fetchAssignedTickets } from "../../services/api";
import { downloadFile, escapeHtml, formatReportDate, openPrintDocument, statusLabel, toCsv } from "./reportUtils";

function TechnicianReportsPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchAssignedTickets(token);
      setDashboard(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load technician reports.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function downloadTicketCsv() {
    const rows = [
      ["Ticket Number", "Title", "Status", "Priority", "Category", "Location", "Student", "Updated At"],
      ...(dashboard?.tickets || []).map((ticket) => [
        ticket.ticketNumber,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.location,
        ticket.createdByName,
        ticket.updatedAt,
      ]),
    ];

    downloadFile("technician-ticket-report.csv", toCsv(rows), "text/csv;charset=utf-8;");
  }

  function exportPdfReport() {
    const rows = (dashboard?.tickets || [])
      .slice(0, 12)
      .map(
        (ticket) => `
          <tr>
            <td>${escapeHtml(ticket.ticketNumber)}</td>
            <td>${escapeHtml(ticket.title)}</td>
            <td>${escapeHtml(statusLabel(ticket.status))}</td>
            <td>${escapeHtml(statusLabel(ticket.priority))}</td>
            <td>${escapeHtml(ticket.location)}</td>
            <td>${escapeHtml(ticket.createdByName)}</td>
          </tr>`
      )
      .join("");

    openPrintDocument({
      title: "Technician Work Report",
      subtitle: `Generated on ${formatReportDate()} for ${user?.name || "Technician"}. Use the browser print dialog and choose Save as PDF for a polished PDF export.`,
      bodyHtml: `
        <section class="section">
          <h2>Performance snapshot</h2>
          <div class="grid">
            <div class="stat"><div class="label">Assigned total</div><div class="value">${dashboard?.totalTickets || 0}</div></div>
            <div class="stat"><div class="label">Open</div><div class="value">${dashboard?.openTickets || 0}</div></div>
            <div class="stat"><div class="label">In progress</div><div class="value">${dashboard?.inProgressTickets || 0}</div></div>
            <div class="stat"><div class="label">Resolved</div><div class="value">${dashboard?.resolvedTickets || 0}</div></div>
            <div class="stat"><div class="label">Closed</div><div class="value">${dashboard?.closedTickets || 0}</div></div>
          </div>
        </section>
        <section class="section">
          <h2>Assigned ticket details</h2>
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Location</th>
                <th>Student</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6">No assigned tickets available.</td></tr>'}</tbody>
          </table>
        </section>
      `,
    });
  }

  return (
    <DashboardLayout
      eyebrow="Technician"
      title="Report generation"
      description="Generate quick technician work reports from your assigned tickets and export them in a simple format."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <Link
          to="/technician-dashboard"
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
          Loading technician reports...
        </section>
      ) : (
        <div className="grid gap-6">
          <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(8,145,178,0.94),rgba(6,182,212,0.86),rgba(255,255,255,0.94))] p-8 shadow-[0_28px_90px_rgba(6,182,212,0.18)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                  <BarChart3 size={14} />
                  Technician reporting
                </div>
                <h2 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                  Turn assigned work into clear, shareable reports.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/95">
                  Export a ticket CSV, generate a professional PDF-ready report, or print the current report view for meetings and follow-up.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={downloadTicketCsv}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-white px-6 py-4 text-sm font-semibold text-primary transition hover:bg-cyan-50"
                >
                  <Download size={16} />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={exportPdfReport}
                  className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-white/35 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <FileText size={16} />
                  Export PDF
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[28px] border border-cyan-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(6,182,212,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Assigned total</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.totalTickets || 0}</p>
            </article>
            <article className="rounded-[28px] border border-sky-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(14,165,233,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">In progress</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.inProgressTickets || 0}</p>
            </article>
            <article className="rounded-[28px] border border-emerald-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(16,185,129,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Resolved</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.resolvedTickets || 0}</p>
            </article>
            <article className="rounded-[28px] border border-violet-100 bg-white/92 p-6 shadow-[0_18px_45px_rgba(139,92,246,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">Closed</p>
              <p className="mt-3 text-4xl font-extrabold text-primary">{dashboard?.closedTickets || 0}</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
            <article className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Recent entries</p>
                  <h3 className="mt-3 text-3xl font-extrabold text-primary">Assigned ticket report lines</h3>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <Printer size={15} />
                  Print
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                {(dashboard?.tickets || []).slice(0, 8).map((ticket) => (
                  <article key={ticket.id} className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{ticket.ticketNumber}</p>
                        <h4 className="mt-2 text-xl font-bold text-primary">{ticket.title}</h4>
                        <p className="mt-2 text-sm text-slate-500">
                          {ticket.location} • {ticket.category} • {ticket.priority}
                        </p>
                      </div>
                      <div className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {statusLabel(ticket.status)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,254,255,0.96))] p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Wrench size={20} />
              </div>
              <h3 className="mt-5 text-2xl font-extrabold text-primary">What this report is good for</h3>
              <div className="mt-6 grid gap-3">
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Daily handover summaries
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Progress snapshots for supervisors
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-600">
                  Quick export of assigned work history
                </div>
              </div>
            </article>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default TechnicianReportsPage;
