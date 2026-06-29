/**
 * Admin section layout — applies dark SOC theme to all /admin/* routes.
 */
export const metadata = {
  title: "SafePay SOC | Admin Console",
  description: "SafePay Security Operations Center — fraud monitoring and case management",
};

export default function AdminSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element {
  return <>{children}</>;
}
