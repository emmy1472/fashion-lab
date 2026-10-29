import { MetricCards } from "@/components/dashboard/MetricCards";
import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export const metadata = {
  title: "Dashboard — Fashion-Lab",
  description: "Fashion design, collaboration, and production studio dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Good morning, Emmanuel 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Turn your ideas into reality. Design, collaborate and bring your fashion vision to life.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <MetricCards />

      {/* Featured Banner & Quick Actions */}
      <HeroBanner />

      {/* Recent Projects & Activity Feed Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <RecentProjects />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
