type SidebarProps = {
  mode?: "user" | "admin";
};

export function Sidebar({ mode = "user" }: SidebarProps): JSX.Element {
  const classes =
    mode === "admin"
      ? "theme-admin border-admin-border bg-admin-surface text-white"
      : "border-user-border bg-user-surface text-user-text-primary";

  return (
    <aside className={`w-64 border-r p-4 ${classes}`}>
      {/* TODO: Add role-based sidebar navigation based on AppFlow routes. */}
      <h3 className="text-lg font-semibold">{mode === "admin" ? "SOC Menu" : "User Menu"}</h3>
    </aside>
  );
}
