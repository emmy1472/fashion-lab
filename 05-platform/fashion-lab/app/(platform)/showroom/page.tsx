import { RedirectToActiveProject } from "@/components/project/ProjectRedirects";

// The showroom now lives inside each project: /projects/[id]/showroom
export default function ShowroomPage() {
  return <RedirectToActiveProject stage="showroom" />;
}
