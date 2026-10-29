import { StudioWorkspace } from "@/components/studio/StudioWorkspace";

export const metadata = {
  title: "Design Studio — Fashion-Lab",
  description: "Interactive 2D & 3D digital apparel studio with real-time vector CAD and WebGL rendering",
};

export default async function StudioIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <StudioWorkspace initialGarmentId={resolvedParams.id || "track-jacket"} />
  );
}
