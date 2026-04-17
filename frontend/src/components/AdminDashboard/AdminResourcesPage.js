import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { createResource, fetchResources } from "../../services/api";

const initialForm = {
  name: "",
  type: "LECTURE_HALL",
  capacity: "",
  location: "",
  availabilityWindows: "",
  status: "ACTIVE",
  description: "",
};

function AdminResourcesPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [formData, setFormData] = useState(initialForm);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadResources = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchResources({}, token);
      setResources(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Failed to load resources.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await createResource(
        {
          ...formData,
          capacity: Number(formData.capacity),
        },
        token
      );

      setSuccessMessage(`${response.name} was added to the catalogue.`);
      setFormData(initialForm);
      await loadResources(false);
    } catch (submitError) {
      setError(submitError.message || "Failed to create resource.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="Resource management"
      description="Create and review the facilities and equipment catalogue for Module A."
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
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Create resource</p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">Add a catalogue item</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Create bookable spaces and equipment with the metadata students need before booking workflows are added.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Resource name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              >
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
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Capacity"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                required
              />
            </div>

            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              required
            />

            <textarea
              name="availabilityWindows"
              value={formData.availabilityWindows}
              onChange={handleChange}
              placeholder="Availability windows, for example Mon-Fri 08:00-16:00"
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              required
            />

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            >
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_SERVICE">Out of service</option>
            </select>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional notes"
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            />

            {error ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            ) : null}
            {successMessage ? (
              <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">{successMessage}</p>
            ) : null}

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving resource..." : "Add resource"}
            </button>
          </form>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Catalogue</p>
              <h2 className="mt-3 text-3xl font-extrabold text-primary">Existing resources</h2>
            </div>
            <button
              type="button"
              onClick={() => loadResources(false)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
              Loading resources...
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {resources.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
                  No resources in the catalogue yet.
                </div>
              ) : (
                resources.map((resource) => (
                  <article key={resource.id} className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{resource.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{resource.location}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">{resource.type}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${resource.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {resource.status}
                        </span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">Capacity: {resource.capacity}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Availability: {resource.availabilityWindows}</p>
                    {resource.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default AdminResourcesPage;
