import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { cancelBooking, fetchMyBookings } from "../../services/api";

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

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StudentBookingsPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadBookings = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchMyBookings(token);
      setBookings(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load your bookings.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function handleCancel(bookingId) {
    setBusyId(bookingId);
    setError("");
    setSuccessMessage("");

    try {
      await cancelBooking(bookingId, { reason: "Cancelled by student" }, token);
      setSuccessMessage("Booking cancelled successfully.");
      await loadBookings(false);
    } catch (cancelError) {
      setError(cancelError.message || "Failed to cancel booking.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardLayout
      eyebrow="Student"
      title="My bookings"
      description="Track your booking requests, see admin decisions, and cancel approved bookings when needed."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <Link
          to="/student-dashboard"
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
      {isLoading ? (
        <section className="rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
          Loading bookings...
        </section>
      ) : (
        <section className="grid gap-4">
          {bookings.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/92 p-10 text-center text-slate-500">
              You have not placed any booking requests yet.
            </div>
          ) : (
            bookings.map((booking) => (
              <article key={booking.id} className="rounded-[32px] border border-sky-200/90 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-primary">{booking.resourceName}</h2>
                    <p className="mt-2 text-sm text-slate-500">{booking.resourceType} • {booking.resourceLocation}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {formatDate(booking.bookingDate)} • {booking.startTime} - {booking.endTime}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{booking.purpose}</p>
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
                    Admin note: <span className="font-semibold text-primary">{booking.adminReason}</span>
                  </div>
                ) : null}

                {booking.status === "APPROVED" ? (
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleCancel(booking.id)}
                      disabled={busyId === booking.id}
                      className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {busyId === booking.id ? "Cancelling..." : "Cancel booking"}
                    </button>
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

export default StudentBookingsPage;
