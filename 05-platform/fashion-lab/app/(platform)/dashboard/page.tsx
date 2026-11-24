import { PageHeader } from "@/components/ui/page-header";
import { ContinueCard } from "@/components/dashboard/ContinueCard";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { QuickActions } from "@/components/dashboard/QuickActions";

export const metadata = {
  title: "Home — Fashion-Lab",
  description: "Pick up your garment projects where you left off.",
};

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader title="Welcome back" description="Pick up where you left off, or start a new garment." />

      <ContinueCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <RecentProjects />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
