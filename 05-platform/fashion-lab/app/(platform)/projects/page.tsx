import { ProjectsDirectory } from "@/components/projects/ProjectsDirectory";

export const metadata = {
  title: "Project Portfolio & Lifecycle — Fashion-Lab",
  description: "Bespoke digital apparel portfolio, CAD pattern revisions, and production tech pack repository",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: openCreate } = await searchParams;
  return <ProjectsDirectory openCreate={openCreate === "1"} />;
}
