import React, { useState } from "react";
import ProfileModal from "./ProfileModal";

function initialsForUser(user) {
  const source = (user?.name || user?.email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function DashboardLayout({
  eyebrow,
  title,
  description,
  user,
  onLogout,
  onProfileUpdate,
  children,
  actions,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const initials = initialsForUser(user);

  return (
    <>
      <main className="min-h-screen px-4 py-8 sm:px-6">
        <section className="mx-auto w-full max-w-6xl">
          <header className="rounded-[28px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">{eyebrow}</p>
                <h1 className="mt-3 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">{description}</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                    {user?.role}
                  </span>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                    {user?.email}
                  </span>
                  {user?.mobileNumber ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                      {user.mobileNumber}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                {actions}
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sm font-bold text-primary transition hover:border-sky-300 hover:bg-sky-100"
                  title="Edit profile"
                  aria-label="Edit profile"
                >
                  {initials}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <section className="mt-6">{children}</section>
        </section>
      </main>

      <ProfileModal
        isOpen={isProfileOpen}
        user={user}
        onClose={() => setIsProfileOpen(false)}
        onSave={onProfileUpdate}
      />
    </>
  );
}

export default DashboardLayout;
