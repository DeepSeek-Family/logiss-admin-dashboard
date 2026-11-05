const ApplicationsPageSkeleton = () => (
  <div className="space-y-5" role="status" aria-label="Loading driver applications">
    <span className="sr-only">Loading driver applications…</span>
    <div className="space-y-2">
      <div className="h-6 w-48 animate-pulse rounded-md bg-line-2" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-line-2" />
    </div>
    <div className="grid min-h-[540px] grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
      <div className="space-y-3 rounded-xl border border-line-2 bg-white p-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg bg-bg" />
        ))}
      </div>
      <div className="hidden rounded-xl border border-line-2 bg-white p-6 lg:block">
        <div className="h-20 animate-pulse rounded-lg bg-bg" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-bg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ApplicationsPageSkeleton;
