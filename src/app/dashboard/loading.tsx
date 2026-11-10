export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-56 animate-pulse rounded-xl bg-white/[0.06] motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-[24px] bg-white/[0.05] motion-reduce:animate-none" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-[24px] bg-white/[0.05] motion-reduce:animate-none" />
    </div>
  );
}
