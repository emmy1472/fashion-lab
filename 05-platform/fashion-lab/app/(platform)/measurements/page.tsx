import { RedirectToActiveProject } from "@/components/project/ProjectRedirects";

// Measurements now live inside each project: /projects/[id]/measurements
export default function Page() {
  return <RedirectToActiveProject stage="measurements" />;
}
