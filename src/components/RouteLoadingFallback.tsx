const RouteLoadingFallback = () => (
  <div
    className="w-full min-h-[55vh] p-4 sm:p-6 animate-pulse"
    role="status"
    aria-live="polite"
    aria-label="Loading page"
  >
    <span className="sr-only">Loading page…</span>
    <div className="h-7 w-48 rounded-lg bg-line-2 mb-6" />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-28 rounded-2xl bg-white border border-line-2 p-4">
          <div className="h-3 w-24 rounded bg-line-2 mb-5" />
          <div className="h-7 w-16 rounded bg-line-1" />
        </div>
      ))}
    </div>
    <div className="h-64 rounded-2xl bg-white border border-line-2 p-5">
      <div className="h-4 w-40 rounded bg-line-2 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-9 rounded-lg bg-line-1" />
        ))}
      </div>
    </div>
  </div>
);

export default RouteLoadingFallback;
