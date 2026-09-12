export default function AppLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-80 max-w-full rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
