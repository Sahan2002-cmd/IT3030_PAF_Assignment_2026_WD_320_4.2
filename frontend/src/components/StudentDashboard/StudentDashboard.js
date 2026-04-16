import React from "react";
import DashboardLayout from "../Common/DashboardLayout";

function StudentDashboard({ user, onLogout }) {
  return (
    <DashboardLayout
      eyebrow="Student Workspace"
      title="Student dashboard"
      description="Your student account is active immediately after signup and authenticated by the backend JWT flow."
      user={user}
      onLogout={onLogout}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <span className="text-lg font-bold text-accent">ST</span>
          <h2 className="mt-4 text-lg font-bold text-primary">Role</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            You are logged in as a student and routed here automatically after backend login.
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <span className="text-lg font-bold text-secondary">OK</span>
          <h2 className="mt-4 text-lg font-bold text-primary">Approval status</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Student accounts are approved immediately, so there is no manual waiting step.
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <span className="text-lg font-bold text-accent">ME</span>
          <h2 className="mt-4 text-lg font-bold text-primary">Profile</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Name: {user?.name}
            <br />
            Email: {user?.email}
          </p>
        </article>
      </div>

      <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-primary">Connected backend behavior</h2>
        <p className="mt-3 text-base leading-7 text-slate-500">
          This page exists to confirm the frontend is using the backend auth system correctly. The student route is protected,
          requires a valid JWT, and restores the user from `/api/auth/me` after refresh.
        </p>
      </section>
    </DashboardLayout>
  );
}

export default StudentDashboard;
