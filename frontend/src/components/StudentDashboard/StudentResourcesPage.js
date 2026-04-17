import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { createBooking, fetchResources } from "../../services/api";

const initialFilters = {
  type: "",
  minCapacity: "",
  location: "",
  status: "",
};

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

const emptyBookingForm = {
  bookingDate: "",
  startTime: "",
  endTime: "",
  purpose: "",
  expectedAttendees: "",
};

function formatTimeLabel(value) {
  if (!value) {
    return "";
  }

  const [hours, minutes] = value.slice(0, 5).split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toMinutes(value) {
  if (!value) {
    return 0;
  }

  const [hours, minutes] = value.slice(0, 5).split(":");
  return Number(hours) * 60 + Number(minutes);
}

function fromMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDateLabel(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function listDates(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function buildSlotSummaries(resource) {
  if (!resource.availableFromDate || !resource.availableToDate || !resource.availableFromTime || !resource.availableToTime) {
    return [];
  }

  const startMinutes = toMinutes(resource.availableFromTime);
  const endMinutes = toMinutes(resource.availableToTime);
  const dates = listDates(resource.availableFromDate, resource.availableToDate);
  const slots = [];

  dates.forEach((date) => {
    for (let slotStart = startMinutes; slotStart < endMinutes; slotStart += 120) {
      const slotEnd = Math.min(slotStart + 120, endMinutes);
      const overlappingBookings = (resource.bookings || []).filter((booking) => {
        if (booking.bookingDate !== date) {
          return false;
        }

        const bookingStart = toMinutes(booking.startTime);
        const bookingEnd = toMinutes(booking.endTime);
        return bookingStart < slotEnd && bookingEnd > slotStart;
      });

      const approvedBooked = overlappingBookings
        .filter((booking) => booking.status === "APPROVED")
        .reduce((sum, booking) => sum + (booking.expectedAttendees || 0), 0);

      const pendingRequested = overlappingBookings
        .filter((booking) => booking.status === "PENDING")
        .reduce((sum, booking) => sum + (booking.expectedAttendees || 0), 0);

      slots.push({
        date,
        startTime: fromMinutes(slotStart),
        endTime: fromMinutes(slotEnd),
        approvedBooked,
        pendingRequested,
        remainingCapacity: Math.max((resource.capacity || 0) - approvedBooked, 0),
      });
    }
  });

  return slots;
}

function formatAvailability(resource) {
  if (!resource.availableFromDate || !resource.availableToDate || !resource.availableFromTime || !resource.availableToTime) {
    return resource.availabilityWindows;
  }

  const startDate = new Date(`${resource.availableFromDate}T00:00:00`);
  const endDate = new Date(`${resource.availableToDate}T00:00:00`);
  const formatDate = (value) =>
    value.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (value) => {
    const [hours, minutes] = value.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return `${formatDate(startDate)} to ${formatDate(endDate)}, ${formatTime(resource.availableFromTime)} - ${formatTime(resource.availableToTime)}`;
}

function StudentResourcesPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [filters, setFilters] = useState(initialFilters);
  const [resources, setResources] = useState([]);
  const [activeBookingResourceId, setActiveBookingResourceId] = useState(null);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadResources = useCallback(async (nextFilters = filters, showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchResources(
        {
          ...nextFilters,
          minCapacity: nextFilters.minCapacity ? Number(nextFilters.minCapacity) : undefined,
        },
        token
      );
      setResources(data);
      setError("");
      setSuccessMessage("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load resources.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    loadResources(initialFilters);
  }, [loadResources]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await loadResources(filters, false);
  }

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

  async function handleBookingSubmit(event, resourceId) {
    event.preventDefault();
    setIsSubmittingBooking(true);
    setError("");
    setSuccessMessage("");

    try {
      await createBooking(
        {
          resourceId,
          bookingDate: bookingForm.bookingDate,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          purpose: bookingForm.purpose,
          expectedAttendees: bookingForm.expectedAttendees ? Number(bookingForm.expectedAttendees) : null,
        },
        token
      );
      setSuccessMessage("Booking request submitted. Pending requests show in yellow and approved bookings show in red.");
      setBookingForm(emptyBookingForm);
      setActiveBookingResourceId(null);
      await loadResources(filters, false);
    } catch (submitError) {
      setError(submitError.message || "Failed to create booking.");
    } finally {
      setIsSubmittingBooking(false);
    }
  }

  return (
    <DashboardLayout
      eyebrow="Student"
      title="Resource catalogue"
      description="Browse facilities and equipment, then filter the catalogue by type, capacity, location, and status."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
      actions={
        <>
          <Link
            to="/student-bookings"
            className="inline-flex items-center justify-center rounded-2xl border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-400 hover:bg-sky-50"
          >
            My bookings
          </Link>
          <Link
            to="/student-dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-400 hover:bg-sky-50"
          >
            Back to dashboard
          </Link>
        </>
      }
    >
      <section className="rounded-[32px] border border-sky-200/90 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={handleSubmit}>
          <select
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          >
            <option value="">All types</option>
            <option value="LECTURE_HALL">Lecture hall</option>
            <option value="LAB">Lab</option>
            <option value="MEETING_ROOM">Meeting room</option>
            <option value="PROJECTOR">Projector</option>
            <option value="CAMERA">Camera</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>

          <input
            type="number"
            min="1"
            name="minCapacity"
            value={filters.minCapacity}
            onChange={handleChange}
            placeholder="Minimum capacity"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          />

          <input
            name="location"
            value={filters.location}
            onChange={handleChange}
            placeholder="Location"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          />

          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          >
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="OUT_OF_SERVICE">Out of service</option>
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900"
          >
            Search
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : null}
        {successMessage ? (
          <p className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">{successMessage}</p>
        ) : null}

        {isLoading ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
            Loading resources...
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {resources.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
                No resources matched your filters.
              </div>
            ) : (
              resources.map((resource) => (
                <article key={resource.id} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                  {resource.imageDataUrl ? (
                    <img
                      src={resource.imageDataUrl}
                      alt={resource.name}
                      className="mb-5 h-56 w-full rounded-[24px] object-cover"
                    />
                  ) : null}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-primary">{resource.name}</h2>
                      <p className="mt-2 text-sm text-slate-500">{resource.location}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">{resource.type}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${resource.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {resource.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      Capacity: <span className="font-semibold text-primary">{resource.capacity}</span>
                    </div>
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:col-span-2">
                      Availability: <span className="font-semibold text-primary">{formatAvailability(resource)}</span>
                    </div>
                  </div>

                  {resource.description ? (
                    <p className="mt-4 text-sm leading-7 text-slate-600">{resource.description}</p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBookingResourceId(resource.id);
                        setBookingForm(emptyBookingForm);
                        setError("");
                        setSuccessMessage("");
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-900"
                    >
                      Request booking
                    </button>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Max 3 hours per booking
                    </span>
                  </div>

                  {activeBookingResourceId === resource.id ? (
                    <form className="mt-5 grid gap-4 rounded-[24px] border border-sky-200 bg-white p-5" onSubmit={(event) => handleBookingSubmit(event, resource.id)}>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <input type="date" value={bookingForm.bookingDate} onChange={(event) => setBookingForm((current) => ({ ...current, bookingDate: event.target.value }))} className={inputClasses} required />
                        <input type="time" value={bookingForm.startTime} onChange={(event) => setBookingForm((current) => ({ ...current, startTime: event.target.value }))} className={inputClasses} required />
                        <input type="time" value={bookingForm.endTime} onChange={(event) => setBookingForm((current) => ({ ...current, endTime: event.target.value }))} className={inputClasses} required />
                      </div>
                      <textarea rows={3} value={bookingForm.purpose} onChange={(event) => setBookingForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Purpose of the booking" className={inputClasses} required />
                      <input type="number" min="1" value={bookingForm.expectedAttendees} onChange={(event) => setBookingForm((current) => ({ ...current, expectedAttendees: event.target.value }))} placeholder="Expected attendees" className={inputClasses} />
                      <div className="flex flex-wrap gap-3">
                        <button type="submit" disabled={isSubmittingBooking} className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60">
                          {isSubmittingBooking ? "Submitting..." : "Submit request"}
                        </button>
                        <button type="button" onClick={() => setActiveBookingResourceId(null)} className="inline-flex items-center justify-center rounded-2xl border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-400 hover:bg-sky-50">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  <div className="mt-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Booking timeline</p>
                    <div className="mt-3 grid gap-3">
                      {resource.bookings?.length ? (
                        resource.bookings.map((booking) => (
                          <div key={booking.id} className={`rounded-[20px] border px-4 py-3 text-sm ${bookingTone(booking.status)}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold">{booking.status}</span>
                              <span>{booking.bookingDate} • {booking.startTime} - {booking.endTime}</span>
                            </div>
                            <p className="mt-2">{booking.requesterName}: {booking.purpose}</p>
                            {booking.adminReason ? <p className="mt-1 text-xs opacity-80">Reason: {booking.adminReason}</p> : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                          No bookings yet for this resource.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Available time slots</p>
                    <div className="mt-3 grid gap-3">
                      {buildSlotSummaries(resource).map((slot) => (
                        <div key={`${resource.id}-${slot.date}-${slot.startTime}`} className="rounded-[20px] border border-sky-200 bg-white px-4 py-3">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-primary">
                                {formatDateLabel(slot.date)} • {formatTimeLabel(slot.startTime)} - {formatTimeLabel(slot.endTime)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Remaining capacity: {slot.remainingCapacity} / {resource.capacity}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                Booked: {slot.approvedBooked}
                              </span>
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Pending: {slot.pendingRequested}
                              </span>
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Left: {slot.remainingCapacity}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default StudentResourcesPage;
