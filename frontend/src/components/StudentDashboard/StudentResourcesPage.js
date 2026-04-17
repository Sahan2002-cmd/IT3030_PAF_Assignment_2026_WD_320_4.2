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

function usesAttendeeCapacity(resourceType) {
  return resourceType === "LECTURE_HALL" || resourceType === "LAB" || resourceType === "MEETING_ROOM";
}

const emptyBookingForm = {
  bookingDate: "",
  startTime: "",
  endTime: "",
  purpose: "",
  expectedAttendees: "",
};

function isSameSlot(bookingForm, slot) {
  return (
    bookingForm.bookingDate === slot.date &&
    bookingForm.startTime === slot.startTime &&
    bookingForm.endTime === slot.endTime
  );
}

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

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function listDates(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    dates.push(toDateInputValue(cursor));
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
  const effectiveCapacity = usesAttendeeCapacity(resource.type) ? (resource.capacity || 0) : 1;

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
        remainingCapacity: Math.max(effectiveCapacity - approvedBooked - pendingRequested, 0),
      });
    }
  });

  return slots;
}

function buildDateSummaries(resource) {
  const groupedDates = new Map();

  buildSlotSummaries(resource).forEach((slot) => {
    const current = groupedDates.get(slot.date) || {
      date: slot.date,
      totalSlots: 0,
      openSlots: 0,
    };

    current.totalSlots += 1;
    if (slot.remainingCapacity > 0) {
      current.openSlots += 1;
    }

    groupedDates.set(slot.date, current);
  });

  return Array.from(groupedDates.values());
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

function StudentResourcesPage({
  user,
  token,
  notifications,
  onLogout,
  onMarkNotificationsRead,
  onProfileUpdate,
  onAddNotification,
}) {
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

  function handleSelectDate(resourceId, date) {
    setActiveBookingResourceId(resourceId);
    setBookingForm((current) => ({
      bookingDate: date,
      startTime: "",
      endTime: "",
      purpose:
        activeBookingResourceId === resourceId && current.bookingDate === date
          ? current.purpose
          : "",
      expectedAttendees:
        activeBookingResourceId === resourceId && current.bookingDate === date
          ? current.expectedAttendees
          : "",
    }));
    setError("");
    setSuccessMessage("");
  }

  function handleSelectSlot(resourceId, slot) {
    setActiveBookingResourceId(resourceId);
    setBookingForm((current) => ({
      bookingDate: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      purpose:
        activeBookingResourceId === resourceId && isSameSlot(current, slot)
          ? current.purpose
          : "",
      expectedAttendees:
        activeBookingResourceId === resourceId && isSameSlot(current, slot)
          ? current.expectedAttendees
          : "",
    }));
    setError("");
    setSuccessMessage("");
  }

  function handleExpectedAttendeesChange(event, maxCapacity) {
    const { value } = event.target;

    if (!value) {
      setBookingForm((current) => ({
        ...current,
        expectedAttendees: "",
      }));
      return;
    }

    const nextValue = Math.min(Math.max(Number(value), 1), Math.max(maxCapacity, 1));
    setBookingForm((current) => ({
      ...current,
      expectedAttendees: String(nextValue),
    }));
  }

  async function handleBookingSubmit(event, resourceId) {
    event.preventDefault();
    setIsSubmittingBooking(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await createBooking(
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
      const resourceName =
        resources.find((resource) => resource.id === resourceId)?.name || response.resourceName || "resource";
      setSuccessMessage("Booking request submitted. Pending requests show in yellow and approved bookings show in red.");
      onAddNotification?.({
        title: "Booking request submitted",
        message: `Your booking for ${resourceName} on ${formatDateLabel(bookingForm.bookingDate)} is pending approval.`,
        type: "booking",
      });
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
          <div className="mt-6 grid gap-3">
            {resources.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
                No resources matched your filters.
              </div>
            ) : (
              resources.map((resource) => {
                const dateSummaries = buildDateSummaries(resource);
                const selectedDate = activeBookingResourceId === resource.id ? bookingForm.bookingDate : "";
                const selectedDateSlots = buildSlotSummaries(resource).filter((slot) => slot.date === selectedDate);
                const selectedSlot = selectedDateSlots.find((slot) => isSameSlot(bookingForm, slot));
                const selectedSlotCapacity = selectedSlot?.remainingCapacity ?? (usesAttendeeCapacity(resource.type) ? (resource.capacity ?? 1) : 1);
                const showAttendeeField = usesAttendeeCapacity(resource.type);

                return (
                <article key={resource.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  {resource.imageDataUrl ? (
                    <img
                      src={resource.imageDataUrl}
                      alt={resource.name}
                      className="mb-4 h-36 w-full rounded-[18px] object-cover"
                    />
                  ) : null}
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-primary">{resource.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{resource.location}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">{resource.type}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${resource.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {resource.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                      {showAttendeeField ? (
                        <>Capacity: <span className="font-semibold text-primary">{resource.capacity}</span></>
                      ) : (
                        <>Booking unit: <span className="font-semibold text-primary">Single equipment item</span></>
                      )}
                    </div>
                    <div className="rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 sm:col-span-2">
                      Availability: <span className="font-semibold text-primary">{formatAvailability(resource)}</span>
                    </div>
                  </div>

                  {resource.description ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                      Pick a date first, then choose a slot
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      Max 3 hours per booking
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Available dates</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dateSummaries.map((dateSummary) => {
                        const isSelected = activeBookingResourceId === resource.id && bookingForm.bookingDate === dateSummary.date;
                        return (
                          <button
                            key={`${resource.id}-${dateSummary.date}`}
                            type="button"
                            onClick={() => handleSelectDate(resource.id, dateSummary.date)}
                            className={`rounded-2xl border px-3 py-2 text-left transition ${
                              isSelected
                                ? "border-primary bg-sky-100 text-primary shadow-[0_12px_32px_rgba(37,99,235,0.14)]"
                                : "border-sky-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                            }`}
                          >
                            <p className="text-sm font-semibold">{formatDateLabel(dateSummary.date)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Open slots: {dateSummary.openSlots} / {dateSummary.totalSlots}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeBookingResourceId === resource.id ? (
                    <form className="mt-4 grid gap-3 rounded-[20px] border border-sky-200 bg-white p-4" onSubmit={(event) => handleBookingSubmit(event, resource.id)}>
                      <div className="rounded-[16px] border border-sky-200 bg-sky-50/70 px-3 py-3 text-sm text-sky-900">
                        <p className="font-semibold">Selected slot</p>
                        <p className="mt-1">
                          {bookingForm.bookingDate && bookingForm.startTime && bookingForm.endTime
                            ? `${formatDateLabel(bookingForm.bookingDate)} - ${formatTimeLabel(bookingForm.startTime)} to ${formatTimeLabel(bookingForm.endTime)}`
                            : bookingForm.bookingDate
                              ? "Now choose one of the slots for this date."
                              : "Choose one of the available dates below."}
                        </p>
                      </div>
                      <textarea rows={3} value={bookingForm.purpose} onChange={(event) => setBookingForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Purpose of the booking" className={inputClasses} required />
                      {showAttendeeField ? (
                        <input type="number" min="1" max={selectedSlotCapacity} value={bookingForm.expectedAttendees} onChange={(event) => handleExpectedAttendeesChange(event, selectedSlotCapacity)} placeholder="Expected attendees" className={inputClasses} />
                      ) : null}
                      {selectedSlot && showAttendeeField ? (
                        <p className="text-xs font-medium text-slate-500">
                          You can request up to {selectedSlotCapacity} attendees for this slot. Pending and approved requests already reduce this number.
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" disabled={isSubmittingBooking || !bookingForm.bookingDate || !bookingForm.startTime || !bookingForm.endTime || (showAttendeeField && Number(bookingForm.expectedAttendees || 0) > selectedSlotCapacity)} className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60">
                          {isSubmittingBooking ? "Submitting..." : "Submit request"}
                        </button>
                        <button type="button" onClick={() => {
                          setActiveBookingResourceId(null);
                          setBookingForm(emptyBookingForm);
                        }} className="inline-flex items-center justify-center rounded-2xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-sky-400 hover:bg-sky-50">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  <div className="mt-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Available time slots</p>
                    <div className="mt-2 grid gap-2">
                      {!selectedDate ? (
                        <div className="rounded-[16px] border border-dashed border-sky-200 bg-white px-3 py-3 text-sm text-slate-500">
                          Select a date first to see the available slots.
                        </div>
                      ) : selectedDateSlots.map((slot) => (
                        <div
                          key={`${resource.id}-${slot.date}-${slot.startTime}`}
                          className={`rounded-[16px] border px-3 py-3 transition ${
                            activeBookingResourceId === resource.id && isSameSlot(bookingForm, slot)
                              ? "border-primary bg-sky-100 shadow-[0_12px_32px_rgba(37,99,235,0.14)]"
                              : "border-sky-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-primary">
                                {formatDateLabel(slot.date)} - {formatTimeLabel(slot.startTime)} to {formatTimeLabel(slot.endTime)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {showAttendeeField
                                  ? `Remaining capacity: ${slot.remainingCapacity} / ${resource.capacity}`
                                  : `Availability left: ${slot.remainingCapacity} / 1`}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                {showAttendeeField ? `Booked: ${slot.approvedBooked}` : `Booked: ${slot.approvedBooked > 0 ? "Yes" : "No"}`}
                              </span>
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                {showAttendeeField ? `Pending: ${slot.pendingRequested}` : `Pending: ${slot.pendingRequested > 0 ? "Yes" : "No"}`}
                              </span>
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {showAttendeeField ? `Left: ${slot.remainingCapacity}` : `${slot.remainingCapacity > 0 ? "Available" : "Reserved"}`}
                              </span>
                              <button
                                type="button"
                                disabled={resource.status !== "ACTIVE" || slot.remainingCapacity <= 0}
                                onClick={() => handleSelectSlot(resource.id, slot)}
                                className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-900 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                {resource.status !== "ACTIVE" ? "Unavailable" : slot.remainingCapacity <= 0 ? "Full" : "Book this slot"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
                );
              })
            )}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default StudentResourcesPage;
