import React, { useEffect, useState } from "react";
import { isValidMobileNumber, isValidPassword, MOBILE_NUMBER_RULE_TEXT, PASSWORD_RULE_TEXT } from "../../utils/validation";

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function ProfileModal({ isOpen, user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
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
      mobileNumber: user.mobileNumber || "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
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
    const trimmedMobileNumber = formData.mobileNumber.trim();
    const wantsPasswordChange =
      Boolean(formData.currentPassword) || Boolean(formData.newPassword) || Boolean(formData.confirmNewPassword);

    if (!isValidMobileNumber(trimmedMobileNumber)) {
      setError(MOBILE_NUMBER_RULE_TEXT);
      return;
    }

    if (wantsPasswordChange) {
      if (!formData.currentPassword) {
        setError("Current password is required.");
        return;
      }

      if (!isValidPassword(formData.newPassword)) {
        setError(PASSWORD_RULE_TEXT);
        return;
      }

      if (formData.newPassword !== formData.confirmNewPassword) {
        setError("New passwords do not match.");
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobileNumber: trimmedMobileNumber,
      };

      if (wantsPasswordChange) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
        payload.confirmNewPassword = formData.confirmNewPassword;
      }

      await onSave(payload);
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
          Account settings
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-500">
          Update your account information and password.
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

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-primary">Mobile number</span>
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              className={inputClasses}
              inputMode="numeric"
              pattern="\d{10}"
              maxLength="10"
              placeholder="Enter 10-digit mobile number"
              required
            />
            <span className="text-xs text-slate-500">{MOBILE_NUMBER_RULE_TEXT}</span>
          </label>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Change password</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Leave these fields blank to keep your current password.
            </p>

            <div className="mt-4 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Current password</span>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Enter current password"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-primary">New password</span>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={inputClasses}
                    minLength="6"
                    pattern="(?=.*[a-z])(?=.*[A-Z]).{6,}"
                    placeholder="Enter new password"
                  />
                  <span className="text-xs text-slate-500">{PASSWORD_RULE_TEXT}</span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-primary">Confirm new password</span>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    className={inputClasses}
                    minLength="6"
                    pattern="(?=.*[a-z])(?=.*[A-Z]).{6,}"
                    placeholder="Confirm new password"
                  />
                </label>
              </div>
            </div>
          </div>

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
