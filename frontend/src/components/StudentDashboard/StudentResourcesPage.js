import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { fetchResources } from "../../services/api";

const initialFilters = {
  type: "",
  minCapacity: "",
  location: "",
  status: "",
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
        <Link
          to="/student-dashboard"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
        >
          Back to dashboard
        </Link>
      }
    >
      <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
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
