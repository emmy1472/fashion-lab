import { ResumeProject } from "@/components/project/ProjectRedirects";

export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResumeProject projectId={decodeURIComponent(id)} />;
}
