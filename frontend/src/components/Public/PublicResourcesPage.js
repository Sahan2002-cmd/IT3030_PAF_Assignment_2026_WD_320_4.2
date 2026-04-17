import React, { useEffect, useState } from "react";
import { Camera, GraduationCap, MapPin, MonitorPlay, Package, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchResources } from "../../services/api";
import PublicLayout from "./PublicLayout";

const typeIconMap = {
  LECTURE_HALL: GraduationCap,
  LAB: MonitorPlay,
  MEETING_ROOM: Users,
  PROJECTOR: MonitorPlay,
  CAMERA: Camera,
  EQUIPMENT: Package,
};

const typeLabels = {
  LECTURE_HALL: "Lecture Hall",
  LAB: "Lab",
  MEETING_ROOM: "Meeting Room",
  PROJECTOR: "Projector",
  CAMERA: "Camera",
  EQUIPMENT: "Equipment",
};

const initialFilters = {
  type: "",
  minCapacity: "",
  location: "",
  status: "",
};

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function formatAvailability(resource) {
  if (!resource.availableFromDate || !resource.availableToDate || !resource.availableFromTime || !resource.availableToTime) {
    return resource.availabilityWindows || "Availability not specified";
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

function PublicResourcesPage({ session }) {
  const [filters, setFilters] = useState(initialFilters);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadResources(nextFilters = initialFilters, showLoading = true) {
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const data = await fetchResources({
          ...nextFilters,
          minCapacity: nextFilters.minCapacity ? Number(nextFilters.minCapacity) : undefined,
        });
        if (isActive) {
          setResources(data);
          setError("");
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError.message || "Failed to load resources.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadResources();

    return () => {
      isActive = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const data = await fetchResources({
        ...filters,
        minCapacity: filters.minCapacity ? Number(filters.minCapacity) : undefined,
      });
      setResources(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load resources.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PublicLayout session={session}>
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[36px] border border-white/80 bg-white/92 p-8 shadow-[0_28px_70px_rgba(37,99,235,0.09)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Resources</p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-primary [font-family:Georgia,'Times_New_Roman',serif]">
              A clear picture of what the campus can offer.
            </h1>
            <p className="mt-6 text-base leading-8 text-slate-600">
              The resource area of Campus Hub is designed to show bookable spaces and equipment in a simple, understandable way. Students can discover what exists, understand capacity, and move into the booking process with less uncertainty.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              This page highlights the kinds of resources the system manages, including halls, labs, meeting rooms, projectors, cameras, and other shared equipment.
            </p>
          </div>

          <div className="rounded-[36px] border border-sky-200/80 bg-[linear-gradient(160deg,rgba(15,23,42,0.95),rgba(29,78,216,0.92),rgba(56,189,248,0.72))] p-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:p-10">
            <h2 className="text-2xl font-extrabold">What students can understand here</h2>
            <div className="mt-6 grid gap-4">
              <article className="rounded-[24px] border border-white/15 bg-white/10 p-5">
                <p className="text-sm leading-7 text-slate-100/90">Which resources exist on campus and what type of activity they support.</p>
              </article>
              <article className="rounded-[24px] border border-white/15 bg-white/10 p-5">
                <p className="text-sm leading-7 text-slate-100/90">Capacity and location details before a booking request is made.</p>
              </article>
              <article className="rounded-[24px] border border-white/15 bg-white/10 p-5">
                <p className="text-sm leading-7 text-slate-100/90">Availability windows and booking slots that help prevent confusion and crowding.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Live Catalogue</p>
            <h2 className="mt-2 text-3xl font-extrabold text-primary">Available campus resources</h2>
          </div>
          <p className="text-sm text-slate-500">A public view styled like the student resource catalogue.</p>
        </div>

        <section className="mt-6 rounded-[32px] border border-sky-200/90 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={handleSubmit}>
            <select
              name="type"
              value={filters.type}
              onChange={handleChange}
              className={inputClasses}
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
              className={inputClasses}
            />

            <input
              name="location"
              value={filters.location}
              onChange={handleChange}
              placeholder="Location"
              className={inputClasses}
            />

            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className={inputClasses}
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
        </section>

        {error ? (
          <div className="mt-6 rounded-[24px] border border-red-100 bg-red-50 p-5 text-sm text-red-600">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-white/92 p-8 text-center text-slate-500">
            Loading resources...
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {resources.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/92 p-8 text-center text-slate-500">
                No resources are available right now.
              </div>
            ) : (
              resources.map((resource) => {
                const Icon = typeIconMap[resource.type] || Package;
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
                        <h3 className="text-xl font-extrabold text-primary">{resource.name}</h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <MapPin size={14} />
                          {resource.location}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-primary">
                          <Icon size={18} />
                        </div>
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                          {typeLabels[resource.type] || resource.type}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${resource.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {resource.status === "ACTIVE" ? "Available" : "Out of service"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-600">
                        Capacity: <span className="font-semibold text-primary">{resource.capacity}</span>
                      </div>
                      <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-600 sm:col-span-2">
                        Availability: <span className="font-semibold text-primary">{formatAvailability(resource)}</span>
                      </div>
                    </div>

                    {resource.description ? (
                      <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                        Sign in as student to book this resource
                      </span>
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-900"
                      >
                        Go to login
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

export default PublicResourcesPage;
