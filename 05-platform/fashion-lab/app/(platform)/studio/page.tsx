import { StudioWorkspace } from "@/components/studio/StudioWorkspace";

export const metadata = {
  title: "Design Studio — Fashion-Lab",
  description: "Interactive 2D & 3D digital apparel studio with real-time vector CAD and WebGL rendering",
};

export default function StudioPage() {
  return <StudioWorkspace initialGarmentId="track-jacket" />;
}
