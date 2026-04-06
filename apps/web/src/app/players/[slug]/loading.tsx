export default function PlayerLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10 md:px-10">
      <div className="h-56 rounded-3xl border border-black/10 bg-white/70" />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-72 rounded-3xl border border-black/10 bg-white/70" />
        <div className="h-96 rounded-3xl border border-black/10 bg-white/70" />
      </div>
    </main>
  );
}
