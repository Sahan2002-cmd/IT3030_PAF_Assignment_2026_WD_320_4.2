import React from "react";
import DashboardLayout from "../Common/DashboardLayout";

function TechnicianDashboard({ user, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  return (
    <DashboardLayout
      eyebrow="Technician"
      title="Dashboard"
      description="Review your account status and keep your profile information current."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
    >
      <section className="rounded-[28px] border border-white/70 bg-white/92 p-6 shadow-[0_20px_60px_rgba(37,99,235,0.08)] backdrop-blur sm:p-8">
        <h2 className="text-2xl font-bold text-primary">Technician account</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
          Your account is available for technician access.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-[24px] border border-sky-100 bg-sky-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Status</p>
            <p className="mt-3 text-lg font-bold text-primary">{user?.approved ? "Approved" : "Pending"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Technician access depends on administrator approval.
            </p>
          </article>

          <article className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Profile</p>
            <p className="mt-3 text-lg font-bold text-primary">Manage account details</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the profile button in the top-right corner to update your information.
            </p>
          </article>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default TechnicianDashboard;
