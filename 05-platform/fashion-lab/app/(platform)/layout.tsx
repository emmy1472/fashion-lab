import { AppSidebar } from "@/components/layout/AppSidebar";
import { PlatformContent } from "@/components/layout/PlatformContent";
import { MobileNav } from "@/components/layout/MobileNav";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { SidebarSpacer } from "@/components/layout/SidebarSpacer";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-surface flex">
        {/* Desktop Fixed App Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Dynamic spacer that adjusts when sidebar collapses */}
        <SidebarSpacer />

        {/* Main Content Area */}
        <PlatformContent>{children}</PlatformContent>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
