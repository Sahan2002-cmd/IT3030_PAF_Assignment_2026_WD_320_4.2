import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signupUser } from "../../services/api";
import { isValidMobileNumber, isValidPassword, MOBILE_NUMBER_RULE_TEXT, PASSWORD_RULE_TEXT } from "../../utils/validation";

const initialForm = {
  name: "",
  email: "",
  mobileNumber: "",
  password: "",
  confirmPassword: "",
  role: "STUDENT",
};

const roleOptions = [
  {
    value: "STUDENT",
    title: "Student",
    description: "Immediate account access after registration.",
  },
  {
    value: "TECHNICIAN",
    title: "Technician",
    description: "Access is enabled after administrator approval.",
  },
];

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function Register() {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setSuccessMessage("");

    const trimmedMobileNumber = formData.mobileNumber.trim();

    if (!isValidMobileNumber(trimmedMobileNumber)) {
      setError(MOBILE_NUMBER_RULE_TEXT);
      return;
    }

    if (!isValidPassword(formData.password)) {
      setError(PASSWORD_RULE_TEXT);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await signupUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobileNumber: trimmedMobileNumber,
        password: formData.password,
        role: formData.role,
      });

      setSuccessMessage(response.message || "Signup successful.");
      setFormData(initialForm);
    } catch (submitError) {
      setError(submitError.message || "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent">Campus Hub</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-primary">Create account</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              Complete the form below to register your account.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-accent transition hover:text-primary">
                Sign in
              </Link>
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              {roleOptions.map((option) => {
                const isSelected = formData.role === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, role: option.value }))}
                    className={`rounded-[24px] border px-5 py-5 text-left transition ${
                      isSelected
                        ? "border-secondary bg-secondary/10 shadow-[0_18px_30px_rgba(34,197,94,0.18)]"
                        : "border-slate-200 bg-slate-50/80 hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">{option.title}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{option.description}</p>
                  </button>
                );
              })}
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-primary">Name</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
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
                placeholder="Enter your email"
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
                placeholder="Enter 10-digit mobile number"
                inputMode="numeric"
                pattern="\d{10}"
                maxLength="10"
                className={inputClasses}
                required
              />
              <span className="text-xs text-slate-500">{MOBILE_NUMBER_RULE_TEXT}</span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  minLength="6"
                  pattern="(?=.*[a-z])(?=.*[A-Z]).{6,}"
                  className={inputClasses}
                  required
                />
                <span className="text-xs text-slate-500">{PASSWORD_RULE_TEXT}</span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  minLength="6"
                  pattern="(?=.*[a-z])(?=.*[A-Z]).{6,}"
                  className={inputClasses}
                  required
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}
            {successMessage ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <p>{successMessage}</p>
                <Link to="/login" className="mt-2 inline-flex font-semibold text-primary underline">
                  Go to login
                </Link>
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
      </section>
    </main>
  );
}

export default Register;
