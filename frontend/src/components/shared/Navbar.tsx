export function Navbar(): JSX.Element {
  return (
    <header className="flex items-center justify-between border-b border-user-border bg-user-surface px-6 py-4">
      {/* TODO: Add auth-aware navigation links and profile controls. */}
      <h2 className="font-display text-3xl tracking-wide">SafePay</h2>
      <span className="text-sm text-user-text-secondary">Navigation</span>
    </header>
  );
}
