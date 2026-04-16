import React from "react";
import DashboardLayout from "../Common/DashboardLayout";

function TechnicianDashboard({ user, onLogout }) {
  return (
    <DashboardLayout
      eyebrow="Technician Workspace"
      title="Technician dashboard"
      description="You are seeing this page because your technician account has already been approved by an admin."
      user={user}
      onLogout={onLogout}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <span className="text-lg font-bold text-accent">TN</span>
          <h2 className="mt-4 text-lg font-bold text-primary">Technician role</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The backend routed you here only after successful JWT login with the technician role.
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <span className="text-lg font-bold text-secondary">OK</span>
          <h2 className="mt-4 text-lg font-bold text-primary">Approved account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Backend approval is complete, so login is allowed and protected screens are available.
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5">
          <span className="text-lg font-bold text-accent">PR</span>
          <h2 className="mt-4 text-lg font-bold text-primary">Protected route</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This screen is hidden from other roles and depends on the stored JWT token.
          </p>
        </article>
      </div>

      <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-primary">Technician account summary</h2>
        <p className="mt-3 text-base leading-7 text-slate-500">
          Name: {user?.name}
          <br />
          Email: {user?.email}
          <br />
          Approved: {user?.approved ? "Yes" : "No"}
        </p>
      </section>
    </DashboardLayout>
  );
}

export default TechnicianDashboard;
