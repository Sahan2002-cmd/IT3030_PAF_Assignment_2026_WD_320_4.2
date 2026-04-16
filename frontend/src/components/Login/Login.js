import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../../services/api";
import { routeForRole } from "../../utils/auth";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const initialForm = {
  email: "",
  password: "",
};

const inputClasses =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-base text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10";

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function Login({ session, onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [googleRole, setGoogleRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [googleSetupError, setGoogleSetupError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleSetupError("Google sign-in is not configured yet.");
      return;
    }

    let isActive = true;

    loadGoogleScript()
      .then(() => {
        if (!isActive || !window.google?.accounts?.id) {
          return;
        }

        const buttonContainer = document.getElementById("google-signin-button");
        if (!buttonContainer) {
          return;
        }

        buttonContainer.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            setError("");
            setSuccessMessage("");
            setIsGoogleSubmitting(true);

            try {
              const data = await loginWithGoogle({
                credential: response.credential,
                role: googleRole,
              });

              if (data?.token) {
                onLogin(data);
                navigate(routeForRole(data.role), { replace: true });
              } else {
                setSuccessMessage(data?.message || "Google sign-in completed.");
              }
            } catch (submitError) {
              setError(submitError.message || "Google sign-in failed.");
            } finally {
              setIsGoogleSubmitting(false);
            }
          },
          ux_mode: "popup",
        });
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 360,
        });
      })
      .catch(() => {
        if (isActive) {
          setGoogleSetupError("Google sign-in could not be loaded.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [googleRole, navigate, onLogin]);

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
    setSuccessMessage("");
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
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="hidden overflow-hidden rounded-[36px] border border-white/70 bg-gradient-to-br from-sky-900 via-blue-800 to-blue-600 p-10 text-white shadow-[0_28px_90px_rgba(37,99,235,0.20)] lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-200">Campus Hub</p>
          <h1 className="mt-6 max-w-md text-5xl font-extrabold leading-[1.02]">
            One login for admin, student, and technician access
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-blue-50/90">
            Password login and Google OAuth now use the same backend session flow, so role routing and technician approval stay consistent.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200">Admin</p>
              <p className="mt-3 text-base leading-7 text-blue-50/90">
                Reviews pending technicians and approves them directly from the dashboard.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200">Technician approval</p>
              <p className="mt-3 text-base leading-7 text-blue-50/90">
                Technician accounts can sign up or use Google, but backend access still waits for admin approval.
              </p>
            </div>
          </div>

          <div className="mt-auto rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-200">Default admin</p>
            <p className="mt-3 text-base text-blue-50/90">admin@campushub.com</p>
            <p className="mt-1 text-base text-blue-50/90">Admin@123</p>
          </div>
        </div>

        <section className="rounded-[36px] border border-white/75 bg-white/88 p-6 shadow-[0_28px_90px_rgba(37,99,235,0.10)] backdrop-blur sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent lg:hidden">Campus Hub</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-primary">Login</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
              Sign in with email and password, or continue with Google OAuth 2.0.
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
            {successMessage ? (
              <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-base font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setGoogleRole("STUDENT")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  googleRole === "STUDENT"
                    ? "border-accent bg-sky-50 text-primary"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                Google as Student
              </button>
              <button
                type="button"
                onClick={() => setGoogleRole("TECHNICIAN")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  googleRole === "TECHNICIAN"
                    ? "border-accent bg-sky-50 text-primary"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                Google as Technician
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              The selected role is used only for first-time Google sign-in. Existing accounts keep their saved role.
            </p>

            <div className="mt-5 flex justify-center">
              <div id="google-signin-button" />
            </div>

            {isGoogleSubmitting ? (
              <p className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                Completing Google sign-in...
              </p>
            ) : null}
            {googleSetupError ? (
              <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {googleSetupError}
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

export default Login;
