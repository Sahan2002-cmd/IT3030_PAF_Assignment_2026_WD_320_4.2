import React from "react";

function DashboardLayout({ eyebrow, title, description, user, onLogout, children, actions }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[32px] border border-white/60 bg-primary p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-accent">{eyebrow}</p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight">{title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-200">{description}</p>

          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Signed In User</p>
            <p className="mt-4 text-2xl font-bold">{user?.name}</p>
            <p className="mt-2 break-all text-sm text-slate-200">{user?.email}</p>
            <div className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
              {user?.role}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <span aria-hidden="true">[ ]</span>
            Logout
          </button>
        </aside>

        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          {actions ? <div className="mb-6 flex flex-wrap justify-end gap-3">{actions}</div> : null}
          {children}
        </section>
      </section>
    </main>
  );
}

export default DashboardLayout;
