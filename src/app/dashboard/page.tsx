import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard";
import { quoteSearchRepository } from "@/db/quote-repository";
import { auth } from "@/lib/auth";
import { assertExternalServicesConfigured } from "@/lib/config";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  assertExternalServicesConfigured();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const recent = await quoteSearchRepository.recent(session.user.id);

  return (
    <Dashboard
      userName={session.user.name}
      initialRecent={recent.map((search) => ({
        ...search,
        providerTimestamp: search.providerTimestamp?.toISOString() ?? null,
        searchedAt: search.searchedAt.toISOString(),
      }))}
    />
  );
}
