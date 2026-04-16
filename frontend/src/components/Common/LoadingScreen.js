import React from "react";

function LoadingScreen({ message = "Loading your workspace..." }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-[32px] border border-white/70 bg-white/85 p-10 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-accent" />
        <h1 className="mt-6 text-3xl font-extrabold text-primary">Campus Hub</h1>
        <p className="mt-3 text-base leading-7 text-slate-500">{message}</p>
      </section>
    </main>
  );
}

export default LoadingScreen;
