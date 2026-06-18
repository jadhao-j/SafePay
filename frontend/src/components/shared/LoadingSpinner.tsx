export function LoadingSpinner(): JSX.Element {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-user-text-secondary">
      {/* TODO: Replace with branded loading animation respecting reduced-motion. */}
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-user-primary border-t-transparent" />
      Loading...
    </div>
  );
}
