import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../Common/DashboardLayout";
import { createResource, deleteResource, fetchResources, updateResource } from "../../services/api";

const initialForm = {
  name: "",
  type: "LECTURE_HALL",
  capacity: "",
  location: "",
  availableFromDate: "",
  availableToDate: "",
  availableFromTime: "",
  availableToTime: "",
  status: "ACTIVE",
  description: "",
  imageDataUrl: "",
};

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

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

  return `${formatDate(startDate)} to ${formatDate(endDate)}, ${resource.availableFromTime} - ${resource.availableToTime}`;
}

function toFormState(resource) {
  if (!resource) {
    return initialForm;
  }

  return {
    name: resource.name || "",
    type: resource.type || "LECTURE_HALL",
    capacity: resource.capacity ? String(resource.capacity) : "",
    location: resource.location || "",
    availableFromDate: resource.availableFromDate || "",
    availableToDate: resource.availableToDate || "",
    availableFromTime: resource.availableFromTime ? resource.availableFromTime.slice(0, 5) : "",
    availableToTime: resource.availableToTime ? resource.availableToTime.slice(0, 5) : "",
    status: resource.status || "ACTIVE",
    description: resource.description || "",
    imageDataUrl: resource.imageDataUrl || "",
  };
}

function AdminResourcesPage({ user, token, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  const [formData, setFormData] = useState(initialForm);
  const [filters, setFilters] = useState({
    type: "",
    minCapacity: "",
    location: "",
    status: "",
  });
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [deletingResourceId, setDeletingResourceId] = useState(null);
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
    } catch (loadError) {
      setError(loadError.message || "Failed to load resources.");
    } finally {
      setIsLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    loadResources(filters);
  }, [loadResources]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setFormData((current) => ({
        ...current,
        imageDataUrl: "",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        imageDataUrl: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
      };

      const response = editingResourceId
        ? await updateResource(editingResourceId, payload, token)
        : await createResource(payload, token);

      setSuccessMessage(
        editingResourceId
          ? `${response.name} was updated successfully.`
          : `${response.name} was added to the catalogue.`
      );
      setFormData(initialForm);
      setEditingResourceId(null);
      await loadResources(filters, false);
    } catch (submitError) {
      setError(submitError.message || `Failed to ${editingResourceId ? "update" : "create"} resource.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFilterSubmit(event) {
    event.preventDefault();
    await loadResources(filters, false);
  }

  function handleEditResource(resource) {
    setEditingResourceId(resource.id);
    setFormData(toFormState(resource));
    setError("");
    setSuccessMessage("");
  }

  function handleCancelEdit() {
    setEditingResourceId(null);
    setFormData(initialForm);
    setError("");
    setSuccessMessage("");
  }

  async function handleDeleteResource(resource) {
    const confirmed = window.confirm(`Delete ${resource.name}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingResourceId(resource.id);
    setError("");
    setSuccessMessage("");

    try {
      const response = await deleteResource(resource.id, token);
      setSuccessMessage(response.message || "Resource deleted successfully.");
      if (editingResourceId === resource.id) {
        handleCancelEdit();
      }
      await loadResources(filters, false);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete resource.");
    } finally {
      setDeletingResourceId(null);
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
      <div className="grid gap-6">
        <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
            {editingResourceId ? "Edit resource" : "Create resource"}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">
            {editingResourceId ? "Update catalogue item" : "Add a catalogue item"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Create bookable spaces and equipment with the metadata students need before booking workflows are added.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Resource name"
              className={inputClasses}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={inputClasses}
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
                className={inputClasses}
                required
              />
            </div>

            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location"
              className={inputClasses}
              required
            />

            <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Availability window</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-primary">Available from date</span>
                  <input
                    type="date"
                    name="availableFromDate"
                    value={formData.availableFromDate}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-primary">Available to date</span>
                  <input
                    type="date"
                    name="availableToDate"
                    value={formData.availableToDate}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-primary">Start time</span>
                  <input
                    type="time"
                    name="availableFromTime"
                    value={formData.availableFromTime}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-primary">End time</span>
                  <input
                    type="time"
                    name="availableToTime"
                    value={formData.availableToTime}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </label>
              </div>
            </div>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={inputClasses}
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
              className={inputClasses}
            />

            <div className="grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Resource image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={inputClasses}
                />
              </label>
              {formData.imageDataUrl ? (
                <img
                  src={formData.imageDataUrl}
                  alt="Resource preview"
                  className="h-48 w-full rounded-[24px] object-cover"
                />
              ) : null}
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            ) : null}
            {successMessage ? (
              <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">{successMessage}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (editingResourceId ? "Updating resource..." : "Saving resource...")
                  : (editingResourceId ? "Update resource" : "Add resource")}
              </button>
              {editingResourceId ? (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] sm:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Catalogue</p>
                <h2 className="mt-3 text-3xl font-extrabold text-primary">Existing resources</h2>
              </div>
              <button
                type="button"
                onClick={() => loadResources(filters, false)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
              >
                Refresh
              </button>
            </div>

            <form className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50/75 p-5 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={handleFilterSubmit}>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
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
                onChange={handleFilterChange}
                placeholder="Minimum capacity"
                className={inputClasses}
              />
              <input
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Location"
                className={inputClasses}
              />
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
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
                Filter
              </button>
            </form>
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
                    {resource.imageDataUrl ? (
                      <img
                        src={resource.imageDataUrl}
                        alt={resource.name}
                        className="mb-4 h-48 w-full rounded-[22px] object-cover"
                      />
                    ) : null}
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
                    <p className="mt-2 text-sm leading-6 text-slate-600">Availability: {formatAvailability(resource)}</p>
                    {resource.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditResource(resource)}
                        className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(resource)}
                        className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingResourceId === resource.id}
                      >
                        {deletingResourceId === resource.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
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
