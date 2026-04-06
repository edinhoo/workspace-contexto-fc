export default function MatchLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10">
      <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <div className="h-56 rounded-3xl border border-black/10 bg-white/70" />
        <div className="h-56 rounded-3xl border border-black/10 bg-white/70" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-3xl border border-black/10 bg-white/70" />
        <div className="h-80 rounded-3xl border border-black/10 bg-white/70" />
      </div>
    </main>
  );
}
