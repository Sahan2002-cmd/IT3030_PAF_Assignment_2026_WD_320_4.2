import React from "react";
import DashboardLayout from "../Common/DashboardLayout";

function TechnicianDashboard({ user, notifications, onLogout, onMarkNotificationsRead, onProfileUpdate }) {
  return (
    <DashboardLayout
      eyebrow="Technician"
      title="Technician dashboard"
      description="This page appears only after admin approval. If you can see it, your account has already cleared the approval step."
      user={user}
      notifications={notifications}
      onLogout={onLogout}
      onMarkNotificationsRead={onMarkNotificationsRead}
      onProfileUpdate={onProfileUpdate}
    >
      <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_rgba(37,99,235,0.08)] backdrop-blur sm:p-8">
        <h2 className="text-2xl font-bold text-primary">Technician access confirmed</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
          The backend only allows technicians into this route after approval, so this dashboard keeps the focus on your account status instead of filler content.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-[28px] border border-sky-100 bg-sky-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Approval</p>
            <p className="mt-3 text-lg font-bold text-primary">{user?.approved ? "Approved" : "Pending"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your current technician approval state is controlled entirely by the admin backend endpoint.
            </p>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Profile</p>
            <p className="mt-3 text-lg font-bold text-primary">Keep your details current</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the profile avatar in the top-right corner to edit your account details.
            </p>
          </article>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default TechnicianDashboard;
