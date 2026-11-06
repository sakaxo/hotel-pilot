import { NavLink } from "react-router-dom"
import {
  FiActivity,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiHome,
  FiLogIn,
  FiSettings,
  FiUsers,
  FiX,
} from "react-icons/fi"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: FiHome },
      { label: "Reservations", to: "/reservations", icon: FiCalendar },
      { label: "Guests", to: "/guests", icon: FiUsers },
      { label: "Rooms", to: "/rooms", icon: FiGrid },
    ],
  },
  {
    label: "Hotel Operations",
    items: [{ label: "Check-in / Checkout", to: "/operations", icon: FiLogIn }],
  },
  {
    label: "Access Control",
    items: [
      { label: "RFID Cards", to: "/access/cards", icon: FiCreditCard },
      { label: "Access Logs", to: "/access/logs", icon: FiActivity },
    ],
  },
  {
    label: "Finance",
    items: [{ label: "Payments", to: "/payments", icon: FiDollarSign }],
  },
  {
    label: "Administration",
    items: [
      { label: "Staff", to: "/staff", icon: FiBriefcase },
      { label: "Reports", to: "/reports", icon: FiBarChart2 },
      { label: "Settings", to: "/settings", icon: FiSettings },
    ],
  },
]

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[72px]"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
              HP
            </span>
            {!collapsed && (
              <span className="truncate text-sm font-semibold tracking-wide">HotelPilot</span>
            )}
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
          >
            <FiX className="size-4.5" />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="mb-1.5 px-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        isActive && "bg-sidebar-primary/15 text-sidebar-foreground",
                        collapsed && "justify-center"
                      )
                    }
                  >
                    <item.icon className="size-4.5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        {!collapsed && (
          <div className="border-t border-sidebar-border px-4 py-3">
            <p className="text-[11px] text-sidebar-foreground/50">HotelPilot v0.1 · Frontend Prototype</p>
          </div>
        )}
      </aside>
    </>
  )
}
