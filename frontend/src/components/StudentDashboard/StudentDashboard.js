import React from "react";
import DashboardLayout from "../Common/DashboardLayout";

function StudentDashboard({ user, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  return (
    <DashboardLayout
      eyebrow="Student"
      title="Student dashboard"
      description="Your account is active and ready to use. Keep your profile up to date from the avatar button in the top-right corner."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
    >
      <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_rgba(37,99,235,0.08)] backdrop-blur sm:p-8">
        <h2 className="text-2xl font-bold text-primary">Welcome back, {user?.name}</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
          This student view stays intentionally simple. Your account was approved automatically during signup,
          and the page is protected by the backend JWT session restored from `/api/auth/me`.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-[28px] border border-sky-100 bg-sky-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Account status</p>
            <p className="mt-3 text-lg font-bold text-primary">Active student access</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Students can log in immediately after registration.
            </p>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Quick note</p>
            <p className="mt-3 text-lg font-bold text-primary">Need to change your details?</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Click your profile avatar in the top-right corner to edit your name or email.
            </p>
          </article>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default StudentDashboard;
