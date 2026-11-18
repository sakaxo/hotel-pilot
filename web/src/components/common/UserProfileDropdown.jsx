import * as React from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
export function UserProfileDropdown() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef(null);
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    if (!user)
        return null;
    return (<div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted" aria-haspopup="menu" aria-expanded={open}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {user.avatarInitials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-foreground">{user.name}</span>
          <span className="block text-xs text-muted-foreground">{user.role}</span>
        </span>
        <FiChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")}/>
      </button>
      {open && (<div role="menu" className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button type="button" onClick={() => {
                setOpen(false);
                navigate("/settings");
            }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted">
            <FiUser className="size-4 text-muted-foreground"/> My profile
          </button>
          <button type="button" onClick={() => {
                setOpen(false);
                navigate("/settings");
            }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted">
            <FiSettings className="size-4 text-muted-foreground"/> Settings
          </button>
          <button type="button" onClick={() => {
                setOpen(false);
                logout();
                navigate("/login");
            }} className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-sm text-danger hover:bg-danger/10">
            <FiLogOut className="size-4"/> Log out
          </button>
        </div>)}
    </div>);
}
