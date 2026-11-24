import { ProjectShell } from "@/components/project/ProjectShell";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectShell projectId={decodeURIComponent(id)}>{children}</ProjectShell>;
}
