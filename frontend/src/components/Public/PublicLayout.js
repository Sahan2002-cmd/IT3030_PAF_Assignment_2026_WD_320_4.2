import React from "react";
import { Link, NavLink } from "react-router-dom";

const navLinkClasses = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-white text-slate-950 shadow-[0_12px_32px_rgba(255,255,255,0.16)]"
      : "text-slate-200 hover:bg-white/10 hover:text-white"
  }`;

function PublicLayout({ children, session }) {
  const dashboardRoute = session.user?.role
    ? `/${session.user.role.toLowerCase()}-dashboard`
    : null;

  return (
    <div className="min-h-screen bg-transparent text-primary">
      <header className="sticky top-0 z-40 border-b border-sky-300/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.94),rgba(15,23,42,0.96),rgba(30,41,59,0.92))] text-white backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#1d4ed8,#38bdf8,#e0f2fe)] text-lg font-black text-slate-950 shadow-[0_16px_40px_rgba(56,189,248,0.24)]">
              CH
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-300">Campus Hub</p>
              <p className="text-sm font-semibold text-slate-300">Smart campus resource coordination</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-2 shadow-[0_14px_40px_rgba(15,23,42,0.24)] md:flex">
            <NavLink to="/" end className={navLinkClasses}>Home</NavLink>
            <NavLink to="/about" className={navLinkClasses}>About Us</NavLink>
            <NavLink to="/student-resources" className={navLinkClasses}>Resources</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {dashboardRoute ? (
              <Link
                to={dashboardRoute}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#38bdf8,#1d4ed8)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.20)] transition hover:brightness-110"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

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
  );
}

export default PublicLayout;
