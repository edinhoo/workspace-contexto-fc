export default function SearchLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10 md:px-10">
      <div className="space-y-3">
        <div className="h-4 w-28 rounded-full bg-black/10" />
        <div className="h-12 w-full max-w-2xl rounded-2xl bg-black/10" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-3xl border border-black/10 bg-white/70"
          />
        ))}
      </div>
    </main>
  );
}
