import React, { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import ProfileModal from "./ProfileModal";

const navLinkClasses = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-white text-slate-950 shadow-[0_12px_32px_rgba(255,255,255,0.16)]"
      : "text-slate-200 hover:bg-white/10 hover:text-white"
  }`;

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
  notifications = [],
  onLogout,
  onMarkNotificationsRead,
  onProfileUpdate,
  children,
  actions,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const initials = initialsForUser(user);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );
  const dashboardRoute = user?.role ? `/${user.role.toLowerCase()}-dashboard` : null;

  function formatNotificationTime(value) {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleString();
  }

  function handleToggleNotifications() {
    const nextIsOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextIsOpen);

    if (nextIsOpen && unreadCount > 0 && onMarkNotificationsRead) {
      onMarkNotificationsRead();
    }
  }

  return (
    <>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-sky-300/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.94),rgba(15,23,42,0.96),rgba(30,41,59,0.92))] text-white backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#38bdf8,#1d4ed8,#e0f2fe)] text-lg font-black text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.24)]">
                CH
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-300">Campus Hub</p>
                <p className="text-sm font-semibold text-slate-300">Dashboard workspace</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-2 shadow-[0_14px_40px_rgba(15,23,42,0.24)] md:flex">
              <NavLink to="/" end className={navLinkClasses}>Home</NavLink>
              <NavLink to="/about" className={navLinkClasses}>About Us</NavLink>
              <NavLink to="/student-resources" className={navLinkClasses}>Resources</NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 rounded-[22px] border border-white/12 bg-white/6 px-3 py-2 text-white shadow-[0_14px_40px_rgba(15,23,42,0.24)] lg:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-sm font-bold text-white">
                  {initials || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user?.name || "Campus User"}</p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-sky-300">{user?.role}</p>
                </div>
              </div>
              {dashboardRoute ? (
                <Link
                  to={dashboardRoute}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
                >
                  Dashboard
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6">
        <section className="mx-auto w-full max-w-6xl">
          <header className="relative z-20 overflow-visible rounded-[32px] border border-sky-300/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(15,23,42,0.96),rgba(30,64,175,0.84))] p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">{eyebrow}</p>
                <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">{description}</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-950">
                    {user?.role}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100">
                    {user?.email}
                  </span>
                  {user?.mobileNumber ? (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100">
                      {user.mobileNumber}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                {actions}
                <div className="relative z-30">
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:border-white/25 hover:bg-white/12"
                    title="Notifications"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {isNotificationsOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[340px] rounded-[24px] border border-sky-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Notifications</p>
                          <h2 className="mt-1 text-lg font-bold text-primary">Recent activity</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="text-sm font-semibold text-slate-500 transition hover:text-primary"
                        >
                          Close
                        </button>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                          No notifications yet.
                        </div>
                      ) : (
                        <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto">
                          {notifications.map((notification) => (
                            <article
                              key={notification.id}
                              className={`rounded-2xl border p-4 ${
                                notification.read
                                  ? "border-slate-200 bg-slate-50/70"
                                  : "border-sky-200 bg-sky-50/80"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-sm font-bold text-primary">{notification.title}</h3>
                                  <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                                </div>
                                {!notification.read ? (
                                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
                                ) : null}
                              </div>
                              <p className="mt-3 text-xs text-slate-400">{formatNotificationTime(notification.createdAt)}</p>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-bold text-white transition hover:border-white/25 hover:bg-white/14"
                  title="Edit profile"
                  aria-label="Edit profile"
                >
                  {initials}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/12"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <section className="relative z-0 mt-6">{children}</section>

        </section>
        </main>

        <footer className="mt-20 border-t border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98),rgba(30,41,59,0.98))] text-white">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_1fr] lg:px-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-300">Campus Hub</p>
              <h2 className="mt-4 max-w-md text-3xl font-black leading-tight text-white [font-family:Georgia,'Times_New_Roman',serif]">
                One place for campus resources, bookings, and maintenance coordination.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                Campus Hub helps students, administrators, and technicians stay aligned through a cleaner flow for resource discovery, booking approval, and maintenance support.
              </p>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Explore</p>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <Link to="/" className="group inline-flex items-center gap-2 transition hover:text-white"><span className="transition group-hover:translate-x-1">Home</span></Link>
                <Link to="/about" className="group inline-flex items-center gap-2 transition hover:text-white"><span className="transition group-hover:translate-x-1">About Us</span></Link>
                <Link to="/student-resources" className="group inline-flex items-center gap-2 transition hover:text-white"><span className="transition group-hover:translate-x-1">Resources</span></Link>
                <Link to="/login" className="group inline-flex items-center gap-2 transition hover:text-white"><span className="transition group-hover:translate-x-1">Login</span></Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">What This Site Does</p>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-300">
                <p>Shows campus facilities and equipment in a searchable catalogue.</p>
                <p>Lets students request bookings with date, time slot, and attendee count.</p>
                <p>Helps admins review approvals and manage resource availability clearly.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

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
