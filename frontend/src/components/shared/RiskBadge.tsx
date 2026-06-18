type RiskLevel = "low" | "medium" | "high";

type RiskBadgeProps = {
  level: RiskLevel;
};

export function RiskBadge({ level }: RiskBadgeProps): JSX.Element {
  const classes: Record<RiskLevel, string> = {
    low: "bg-user-success/20 text-user-success border-user-success/40",
    medium: "bg-user-warning/20 text-user-warning border-user-warning/40",
    high: "bg-user-danger/20 text-user-danger border-user-danger/40"
  };

  return <span className={`inline-flex rounded-full border px-3 py-1 font-mono text-xs uppercase ${classes[level]}`}>{level}</span>;
}
