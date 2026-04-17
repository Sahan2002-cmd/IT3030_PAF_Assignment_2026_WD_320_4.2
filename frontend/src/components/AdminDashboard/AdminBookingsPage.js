import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { approveBooking, fetchAllBookings, fetchResources, rejectBooking } from "../../services/api";

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function bookingTone(status) {
  switch (status) {
    case "PENDING":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "APPROVED":
      return "border-red-300 bg-red-50 text-red-700";
    case "REJECTED":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "CANCELLED":
      return "border-slate-300 bg-slate-100 text-slate-700";
    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
}

function AdminBookingsPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [filters, setFilters] = useState({
    status: "",
    resourceId: "",
    requester: "",
  });
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [decisionNotes, setDecisionNotes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadPage = useCallback(async (nextFilters, showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const [resourcesData, bookingsData] = await Promise.all([
        fetchResources({}, token),
        fetchAllBookings(
          {
            ...nextFilters,
            resourceId: nextFilters.resourceId ? Number(nextFilters.resourceId) : undefined,
          },
          token
        ),
      ]);
      setResources(resourcesData);
      setBookings(bookingsData);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load bookings.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPage(filters);
  }, [filters, loadPage]);

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleFilterSubmit(event) {
    event.preventDefault();
    await loadPage(filters, false);
  }

  async function handleApprove(bookingId) {
    setBusyKey(`approve-${bookingId}`);
    setError("");
    setSuccessMessage("");

    try {
      await approveBooking(bookingId, { reason: decisionNotes[bookingId] || "" }, token);
      setSuccessMessage("Booking approved successfully.");
      await loadPage(filters, false);
    } catch (approveError) {
      setError(approveError.message || "Failed to approve booking.");
    } finally {
      setBusyKey("");
    }
  }

  async function handleReject(bookingId) {
    setBusyKey(`reject-${bookingId}`);
    setError("");
    setSuccessMessage("");

    try {
      await rejectBooking(bookingId, { reason: decisionNotes[bookingId] || "" }, token);
      setSuccessMessage("Booking rejected successfully.");
      await loadPage(filters, false);
    } catch (rejectError) {
      setError(rejectError.message || "Failed to reject booking.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="Booking management"
      description="Review, approve, reject, and filter resource booking requests across the whole system."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <Link
          to="/admin-dashboard"
          className="inline-flex items-center justify-center rounded-2xl border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-400 hover:bg-sky-50"
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

      <section className="rounded-[32px] border border-sky-200/90 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={handleFilterSubmit}>
          <select name="status" value={filters.status} onChange={handleFilterChange} className={inputClasses}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select name="resourceId" value={filters.resourceId} onChange={handleFilterChange} className={inputClasses}>
            <option value="">All resources</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name}
              </option>
            ))}
          </select>
          <input
            name="requester"
            value={filters.requester}
            onChange={handleFilterChange}
            placeholder="Search student name or email"
            className={inputClasses}
          />
          <button type="submit" className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900">
            Filter
          </button>
        </form>
      </section>

      {isLoading ? (
        <section className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
          Loading bookings...
        </section>
      ) : (
        <section className="mt-6 grid gap-4">
          {bookings.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
              No bookings matched your filters.
            </div>
          ) : (
            bookings.map((booking) => (
              <article key={booking.id} className="rounded-[32px] border border-sky-200/90 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-primary">{booking.resourceName}</h2>
                    <p className="mt-2 text-sm text-slate-500">{booking.resourceType} • {booking.resourceLocation}</p>
                    <p className="mt-2 text-sm text-slate-600">Requested by {booking.requesterName} ({booking.requesterEmail})</p>
                    <p className="mt-2 text-sm text-slate-600">{booking.bookingDate} • {booking.startTime} - {booking.endTime}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{booking.purpose}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${bookingTone(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    Expected attendees: <span className="font-semibold text-primary">{booking.expectedAttendees || "-"}</span>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    Requested on: <span className="font-semibold text-primary">{new Date(booking.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {booking.adminReason ? (
                  <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    Admin reason: <span className="font-semibold text-primary">{booking.adminReason}</span>
                  </div>
                ) : null}

                {booking.status === "PENDING" ? (
                  <div className="mt-5 grid gap-3">
                    <textarea
                      rows={3}
                      value={decisionNotes[booking.id] || ""}
                      onChange={(event) =>
                        setDecisionNotes((current) => ({
                          ...current,
                          [booking.id]: event.target.value,
                        }))
                      }
                      placeholder="Optional approval note or required rejection reason"
                      className={inputClasses}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleApprove(booking.id)}
                        disabled={busyKey === `approve-${booking.id}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60"
                      >
                        {busyKey === `approve-${booking.id}` ? "Approving..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(booking.id)}
                        disabled={busyKey === `reject-${booking.id}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                      >
                        {busyKey === `reject-${booking.id}` ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </section>
      )}
    </DashboardLayout>
  );
}

export default AdminBookingsPage;
