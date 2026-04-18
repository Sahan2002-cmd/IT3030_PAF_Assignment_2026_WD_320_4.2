import React, { useEffect, useState } from "react";
import { requestPasswordResetOtp, resetPasswordWithOtp } from "../../services/api";
import { isValidPassword, PASSWORD_RULE_TEXT } from "../../utils/validation";
 
const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";
 
const initialForm = {
  email: "",
  otp: "",
  newPassword: "",
  confirmNewPassword: "",
};
 
function ForgotPasswordModal({ isOpen, defaultEmail, onClose, onSuccess }) {
  const [formData, setFormData] = useState(initialForm);
  const [step, setStep] = useState("request");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
 
  useEffect(() => {
    if (!isOpen) {
      return;
    }
 
    setFormData({
      ...initialForm,
      email: defaultEmail || "",
    });
    setStep("request");
    setError("");
    setMessage("");
    setIsRequesting(false);
    setIsResetting(false);
  }, [defaultEmail, isOpen]);
 
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
 
  async function handleRequestOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsRequesting(true);
 
    try {
      const response = await requestPasswordResetOtp({
        email: formData.email.trim().toLowerCase(),
      });
      setStep("reset");
      setMessage(response.message || "An OTP has been sent to your email.");
    } catch (requestError) {
      setError(requestError.message || "Failed to send OTP.");
    } finally {
      setIsRequesting(false);
    }
  }
 
  async function handleResetPassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");
 
    if (!/^\d{6}$/.test(formData.otp.trim())) {
      setError("OTP must be exactly 6 digits.");
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
 
    setIsResetting(true);
 
    try {
      const response = await resetPasswordWithOtp({
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword,
      });
 
      onSuccess(response.message || "Password reset successful. You can log in now.");
      onClose();
    } catch (resetError) {
      setError(resetError.message || "Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  }
 
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sky-950/20 px-4 py-6 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center sm:items-center">
      <section
        className="my-auto w-full max-w-lg max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_30px_90px_rgba(37,99,235,0.16)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Password reset</p>
        <h2 id="forgot-password-title" className="mt-4 text-3xl font-extrabold text-primary">
          Reset password
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-500">
          {step === "request"
            ? "Enter your email to receive a one-time password."
            : "Enter the OTP from your email and set a new password."}
        </p>
 
        <form className="mt-6 grid gap-5" onSubmit={step === "request" ? handleRequestOtp : handleResetPassword}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-primary">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Enter your email"
              required
            />
          </label>
 
          {step === "reset" ? (
            <>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">OTP</span>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  className={inputClasses}
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </label>
 
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
                  required
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
                  required
                />
              </label>
            </>
          ) : null}
 
          {error ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}
          {message ? (
            <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">{message}</p>
          ) : null}
 
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300"
            >
              Cancel
            </button>
 
            <div className="flex flex-col gap-3 sm:flex-row">
              {step === "reset" ? (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-800 transition hover:border-sky-300"
                  disabled={isRequesting}
                >
                  {isRequesting ? "Sending..." : "Resend OTP"}
                </button>
              ) : null}
 
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
                disabled={isRequesting || isResetting}
              >
                {step === "request"
                  ? isRequesting
                    ? "Sending OTP..."
                    : "Send OTP"
                  : isResetting
                    ? "Resetting..."
                    : "Reset password"}
              </button>
            </div>
          </div>
        </form>
      </section>
      </div>
    </div>
  );
}
 
export default ForgotPasswordModal;
 
 