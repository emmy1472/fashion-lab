import { RedirectToActiveProject } from "@/components/project/ProjectRedirects";
import type { StageSlug } from "@/lib/production/stages";

const TAB_TO_STAGE: Record<string, StageSlug> = {
  cutting: "cutting",
  components: "trims",
  assembly: "assembly",
  finishing: "finishing",
};

// Production stages now live inside each project: /projects/[id]/cutting etc.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <RedirectToActiveProject stage={TAB_TO_STAGE[tab ?? ""] ?? "cutting"} />;
}
