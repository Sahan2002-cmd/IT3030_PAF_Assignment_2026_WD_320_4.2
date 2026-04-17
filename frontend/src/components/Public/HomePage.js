import React, { useEffect, useState } from "react";
import { ArrowRight, Boxes, CalendarCheck2, ClipboardCheck, MapPin, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import PublicLayout from "./PublicLayout";

const featureCards = [
  {
    title: "Smart Resource Catalogue",
    description: "Browse lecture halls, labs, meeting rooms, and equipment with capacity, location, status, and booking windows in one place.",
    icon: Boxes,
    tone: "bg-sky-100 text-primary",
  },
  {
    title: "Structured Booking Workflow",
    description: "Students request slots, admins review approvals, and every booking follows a clear pending-to-approved or rejected journey.",
    icon: CalendarCheck2,
    tone: "bg-amber-100 text-amber-700",
  },
  {
    title: "Campus Support Coordination",
    description: "Maintenance reporting, technician workflows, and operational visibility all sit inside the same campus platform.",
    icon: Wrench,
    tone: "bg-emerald-100 text-emerald-700",
  },
];

const processSteps = [
  "Students discover available facilities and equipment through the resource catalogue.",
  "A booking request is submitted with purpose, attendees, date, and slot selection.",
  "Admins review requests, approve or reject them, and send professional email confirmation.",
  "The platform keeps the campus informed through booking history, slot capacity, and support workflows.",
];

const heroSlides = [
  {
    title: "University Campus Life",
    caption: "A real campus-facing experience for discovering shared academic spaces.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Learning Spaces",
    caption: "Lecture halls, study areas, and bookable facilities shown through a modern workflow.",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Academic Environment",
    caption: "A clearer system for resource access, booking visibility, and campus coordination.",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=80",
  },
];

function HomePage({ session }) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % heroSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <PublicLayout session={session}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.25),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(37,99,235,0.24),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.16),transparent_32%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700 shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
              <Sparkles size={14} />
              Modern campus operations
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] text-primary sm:text-6xl [font-family:Georgia,'Times_New_Roman',serif]">
              A smoother way to manage campus spaces, bookings, and support work.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
              Campus Hub is a centralized platform for managing university resources. It helps students find available facilities, request bookings, and understand capacity, while giving admins full control over approvals and operational visibility.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/student-resources"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(37,99,235,0.22)] transition hover:bg-sky-900"
              >
                Explore resources
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-6 py-3.5 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
              >
                About Campus Hub
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-[0_20px_50px_rgba(37,99,235,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Resources</p>
                <p className="mt-3 text-3xl font-black text-primary">Catalogue</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Spaces and equipment with real availability context.</p>
              </article>
              <article className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-[0_20px_50px_rgba(37,99,235,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Bookings</p>
                <p className="mt-3 text-3xl font-black text-primary">Workflow</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Pending, approved, rejected, and cancelled states stay clear.</p>
              </article>
              <article className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-[0_20px_50px_rgba(37,99,235,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Support</p>
                <p className="mt-3 text-3xl font-black text-primary">Operations</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Maintenance and campus service flow in the same system.</p>
              </article>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 hidden h-32 w-32 rounded-full bg-cyan-200/50 blur-3xl lg:block" />
            <div className="absolute right-0 top-0 hidden h-40 w-40 rounded-full bg-sky-300/40 blur-3xl lg:block" />
            <div className="relative overflow-hidden rounded-[36px] border border-sky-200/70 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(29,78,216,0.92),rgba(56,189,248,0.72))] p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.24)] sm:p-8">
              <div className="mb-6 overflow-hidden rounded-[28px] border border-white/15 bg-white/10 p-3 backdrop-blur-md">
                <div className="relative overflow-hidden rounded-[22px]">
                  {heroSlides.map((slide, index) => (
                    <img
                      key={slide.title}
                      src={slide.image}
                      alt={slide.title}
                      className={`h-64 w-full object-cover transition-all duration-700 sm:h-72 ${
                        index === activeSlideIndex ? "relative opacity-100" : "absolute inset-0 opacity-0"
                      }`}
                    />
                  ))}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.04),rgba(2,6,23,0.40))]" />
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold">{heroSlides[activeSlideIndex].title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-100/85">{heroSlides[activeSlideIndex].caption}</p>
                  </div>
                  <div className="flex gap-2">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={slide.title}
                        type="button"
                        aria-label={`Show slide ${index + 1}`}
                        onClick={() => setActiveSlideIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          index === activeSlideIndex ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <MapPin size={18} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Find the right place</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-100/85">Search by location, room type, and capacity instead of asking around manually.</p>
                </article>
                <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <ClipboardCheck size={18} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Book with confidence</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-100/85">Slot capacity, pending demand, and approval updates are visible before decisions happen.</p>
                </article>
                <article className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-md sm:col-span-2">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <ShieldCheck size={18} />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Professional campus administration</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-100/85">
                    Admins can manage resources, approve bookings, and keep a professional trail with email proof and review history.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-[30px] border border-white/80 bg-white/92 p-7 shadow-[0_24px_60px_rgba(37,99,235,0.08)]">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tone}`}>
                  <Icon size={20} />
                </div>
                <h2 className="mt-5 text-2xl font-extrabold text-primary">{feature.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[34px] border border-sky-200/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(239,246,255,0.96))] p-8 shadow-[0_24px_60px_rgba(37,99,235,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">What This Site Does</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-primary [font-family:Georgia,'Times_New_Roman',serif]">
              Built to reduce confusion around shared campus spaces.
            </h2>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              Instead of scattered communication and unclear availability, Campus Hub gives students and admins one coordinated workflow for discovering resources, requesting bookings, and managing approvals.
            </p>
            <div className="mt-8 overflow-hidden rounded-[26px] border border-sky-100">
              <img
                src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1400&q=80"
                alt="University students in a real campus environment"
                className="h-72 w-full object-cover"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {processSteps.map((step, index) => (
              <article key={step} className="rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-[0_20px_50px_rgba(37,99,235,0.06)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-600">{step}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export default HomePage;
