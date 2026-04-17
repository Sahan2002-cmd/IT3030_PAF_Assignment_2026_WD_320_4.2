import React from "react";
import { Building2, CalendarDays, GraduationCap, Users, Wrench } from "lucide-react";
import PublicLayout from "./PublicLayout";

const values = [
  {
    title: "Clarity",
    description: "We make resource access and booking decisions visible, structured, and easy to understand.",
    icon: Building2,
    tone: "bg-sky-100 text-primary",
  },
  {
    title: "Coordination",
    description: "Students, admins, and technicians work from the same source of truth instead of disconnected messages.",
    icon: Users,
    tone: "bg-cyan-100 text-cyan-700",
  },
  {
    title: "Reliability",
    description: "Every booking follows a workflow and every important decision can be tracked with a professional record.",
    icon: CalendarDays,
    tone: "bg-amber-100 text-amber-700",
  },
];

function AboutPage({ session }) {
  return (
    <PublicLayout session={session}>
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[38px] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(239,246,255,0.96))] p-8 shadow-[0_28px_70px_rgba(37,99,235,0.09)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">About Us</p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-primary [font-family:Georgia,'Times_New_Roman',serif]">
              Campus Hub exists to make shared campus operations feel calm, fair, and organized.
            </h1>
            <p className="mt-6 text-base leading-8 text-slate-600">
              This platform was designed for academic environments where classrooms, labs, meeting spaces, and equipment are shared by many people. The goal is simple: help the campus community understand what is available, request it properly, and manage approvals without unnecessary confusion.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Campus Hub combines resource discovery, booking management, and maintenance support in a single experience so the institution can work more smoothly across students, administrators, and technicians.
            </p>
            <div className="mt-8 overflow-hidden rounded-[28px] border border-sky-100">
              <img
                src="https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1400&q=80"
                alt="Modern university campus building"
                className="h-72 w-full object-cover"
              />
            </div>
          </div>

          <div className="rounded-[38px] border border-sky-200/80 bg-[linear-gradient(160deg,rgba(15,23,42,0.95),rgba(29,78,216,0.92),rgba(56,189,248,0.72))] p-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:p-10">
            <div className="grid gap-4">
              <article className="rounded-[24px] border border-white/15 bg-white/10 p-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <GraduationCap size={18} />
                </div>
                <h2 className="mt-4 text-xl font-bold">For students</h2>
                <p className="mt-2 text-sm leading-7 text-slate-100/85">Discover spaces, check availability, and request bookings with clearer confidence.</p>
              </article>
              <article className="rounded-[24px] border border-white/15 bg-white/10 p-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <CalendarDays size={18} />
                </div>
                <h2 className="mt-4 text-xl font-bold">For admins</h2>
                <p className="mt-2 text-sm leading-7 text-slate-100/85">Manage resources, approve bookings, monitor capacity, and keep professional confirmation records.</p>
              </article>
              <article className="rounded-[24px] border border-white/15 bg-white/10 p-5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <Wrench size={18} />
                </div>
                <h2 className="mt-4 text-xl font-bold">For operations</h2>
                <p className="mt-2 text-sm leading-7 text-slate-100/85">Coordinate maintenance and support work without separating it from campus resource context.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <article key={value.title} className="rounded-[30px] border border-white/80 bg-white/92 p-7 shadow-[0_24px_60px_rgba(37,99,235,0.08)]">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${value.tone}`}>
                  <Icon size={20} />
                </div>
                <h2 className="mt-5 text-2xl font-extrabold text-primary">{value.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{value.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}

export default AboutPage;
