import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/layouts/Sidebar";
import { Topbar } from "@/layouts/Topbar";
import { ToastContainer } from "@/components/common/ToastContainer";
import { readFromStorage, writeToStorage } from "@/services/storage";
export function DashboardLayout() {
    const [collapsed, setCollapsed] = React.useState(() => readFromStorage("sidebarCollapsed", false));
    const [mobileOpen, setMobileOpen] = React.useState(false);
    React.useEffect(() => {
        writeToStorage("sidebarCollapsed", collapsed);
    }, [collapsed]);
    return (<div className="flex min-h-svh bg-background">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)}/>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setCollapsed((v) => !v)} onToggleMobile={() => setMobileOpen(true)}/>
        <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>);
}
