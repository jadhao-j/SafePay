import { UserShell } from "@/components/shared/UserShell";

export default function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return <UserShell>{children}</UserShell>;
}
