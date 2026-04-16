import React, { useMemo, useState } from "react";
import { Bell } from "lucide-react";
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
      <main className="min-h-screen px-4 py-8 sm:px-6">
        <section className="mx-auto w-full max-w-6xl">
          <header className="relative z-20 overflow-visible rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_rgba(37,99,235,0.10)] backdrop-blur sm:p-8">
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
                <div className="relative z-30">
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-sky-200 bg-white text-primary transition hover:border-sky-300 hover:bg-sky-50"
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
                    <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[340px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
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

          <section className="relative z-0 mt-6">{children}</section>
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
