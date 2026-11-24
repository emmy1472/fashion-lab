import { RedirectToActiveProject } from "@/components/project/ProjectRedirects";

// Virtual fitting now lives inside each project: /projects/[id]/fitting
export default function FittingPage() {
  return <RedirectToActiveProject stage="fitting" />;
}
