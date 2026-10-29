import { AppSidebar } from "@/components/layout/AppSidebar";
import { PlatformContent } from "@/components/layout/PlatformContent";
import { MobileNav } from "@/components/layout/MobileNav";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Desktop App Sidebar */}
      <div className="hidden md:block w-56 shrink-0">
        <AppSidebar />
      </div>

      {/* Main Content Area (Full height for Studio, padded for standard views) */}
      <PlatformContent>{children}</PlatformContent>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
