import React, { useEffect, useState } from "react";

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function ProfileModal({ isOpen, user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    setFormData({
      name: user.name || "",
      email: user.email || "",
    });
    setError("");
  }, [isOpen, user]);

  if (!isOpen) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await onSave({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      });
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/20 px-4 py-6 backdrop-blur-sm">
      <section
        className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(37,99,235,0.16)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Profile</p>
        <h2 id="profile-modal-title" className="mt-4 text-3xl font-extrabold text-primary">
          Edit your details
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-500">
          Update the details stored in your backend account. Changes apply to the current session immediately.
        </p>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-primary">Name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-primary">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ProfileModal;
