export default function MatchLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
      <div className="h-6 w-28 animate-pulse rounded-full bg-black/10" />
      <div className="h-64 animate-pulse rounded-[2rem] bg-black/5" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="h-[36rem] animate-pulse rounded-[2rem] bg-black/5" />
        <div className="grid gap-6">
          <div className="h-[18rem] animate-pulse rounded-[2rem] bg-black/5" />
          <div className="h-[18rem] animate-pulse rounded-[2rem] bg-black/5" />
        </div>
      </div>
    </main>
  );
}
