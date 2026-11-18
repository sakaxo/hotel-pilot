import { useLocation } from "react-router-dom";
import { FiMenu, FiSidebar } from "react-icons/fi";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { NotificationsDropdown } from "@/components/common/NotificationsDropdown";
import { UserProfileDropdown } from "@/components/common/UserProfileDropdown";
const PAGE_TITLES = [
    { match: "/dashboard", title: "Dashboard" },
    { match: "/reservations", title: "Reservations" },
    { match: "/guests", title: "Guests" },
    { match: "/rooms", title: "Rooms" },
    { match: "/operations", title: "Check-in / Checkout" },
    { match: "/access/cards", title: "RFID Cards" },
    { match: "/access/logs", title: "Access Logs" },
    { match: "/payments", title: "Payments" },
    { match: "/staff", title: "Staff" },
    { match: "/reports", title: "Reports & Analytics" },
    { match: "/settings", title: "Settings" },
];
function resolveTitle(pathname) {
    const found = PAGE_TITLES.find((entry) => pathname.startsWith(entry.match));
    return found?.title ?? "HotelPilot";
}
export function Topbar({ onToggleSidebar, onToggleMobile, }) {
    const location = useLocation();
    const title = resolveTitle(location.pathname);
    return (<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <button type="button" onClick={onToggleMobile} aria-label="Open navigation" className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden">
        <FiMenu className="size-4.5"/>
      </button>
      <button type="button" onClick={onToggleSidebar} aria-label="Toggle sidebar" className="hidden size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:flex">
        <FiSidebar className="size-4.5"/>
      </button>
      <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch />
        <NotificationsDropdown />
        <UserProfileDropdown />
      </div>
    </header>);
}
