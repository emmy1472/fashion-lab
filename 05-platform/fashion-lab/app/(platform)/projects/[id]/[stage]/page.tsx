import { notFound } from "next/navigation";
import { ProjectStageView } from "@/components/project/ProjectStageView";
import { getStageBySlug } from "@/lib/production/stages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage } = await params;
  const s = getStageBySlug(stage);
  return { title: s ? `${s.name} — Fashion-Lab` : "Fashion-Lab" };
}

export default async function ProjectStagePage({
  params,
}: {
  params: Promise<{ id: string; stage: string }>;
}) {
  const { stage } = await params;
  const s = getStageBySlug(stage);
  if (!s) notFound();
  return <ProjectStageView stage={s.slug} />;
}
