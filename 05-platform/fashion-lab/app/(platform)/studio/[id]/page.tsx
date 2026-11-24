import { RedirectToActiveProject } from "@/components/project/ProjectRedirects";

// Legacy studio URL; the studio now lives inside each project: /projects/[id]/design
export default function StudioIdPage() {
  return <RedirectToActiveProject stage="design" />;
}
