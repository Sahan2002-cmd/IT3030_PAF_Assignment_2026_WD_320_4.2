import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { loginUser } from "../../services/api";
import { routeForRole } from "../../utils/auth";

const initialForm = {
  email: "",
  password: "",
};

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function Login({ session, onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session.user?.role) {
    return <Navigate to={routeForRole(session.user.role)} replace />;
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
    setIsSubmitting(true);

    try {
      const response = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      onLogin(response);
      setFormData(initialForm);
      navigate(routeForRole(response.role), { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden overflow-hidden rounded-[32px] border border-white/60 bg-primary shadow-[0_24px_70px_rgba(15,23,42,0.16)] lg:block">
          <div className="relative flex h-full min-h-[760px] flex-col overflow-hidden px-10 py-12 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.22),transparent_28%)]" />
            <div className="relative z-10 flex h-full flex-col">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent">Campus Hub</p>
                <h1 className="mt-6 max-w-md text-5xl font-extrabold leading-[1.05]">Sign in to your account</h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
                  This frontend is now connected to the new backend auth flow with three roles:
                  admin, student, and technician.
                </p>
              </div>

              <div className="mt-10 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-accent">AD</span>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Admin</p>
                  </div>
                  <p className="mt-3 text-base leading-7 text-slate-100">
                    Admins can review pending technicians and approve their access directly from the dashboard.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-secondary">TN</span>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Technician Approval</p>
                  </div>
                  <p className="mt-3 text-base leading-7 text-slate-100">
                    Technician accounts can sign up, but the backend blocks login until an admin approves them.
                  </p>
                </div>
              </div>

              <div className="mt-auto rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">Default admin</p>
                <p className="mt-3 text-base text-slate-200">Email: admin@campushub.com</p>
                <p className="mt-1 text-base text-slate-200">Password: Admin@123</p>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent lg:hidden">Campus Hub</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-primary">Login</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              Use the backend-authenticated login to access the right dashboard for your role.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Need an account?
              {" "}
              <Link to="/register" className="font-semibold text-accent transition hover:text-primary">
                Create one
              </Link>
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
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
              <span className="text-sm font-semibold text-primary">Password</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={inputClasses}
                required
              />
            </label>

            {error ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
              disabled={isSubmitting}
            >
              <span aria-hidden="true">[>]</span>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

export default Login;
