import { RedirectToActiveProject } from "@/components/project/ProjectRedirects";

// The studio now lives inside each project: /projects/[id]/design
export default function StudioPage() {
  return <RedirectToActiveProject stage="design" />;
}
