import { createPortal } from "react-dom";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX, FiXCircle } from "react-icons/fi";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
const VARIANT_STYLES = {
    success: { icon: FiCheckCircle, className: "text-success" },
    error: { icon: FiXCircle, className: "text-danger" },
    warning: { icon: FiAlertTriangle, className: "text-warning" },
    info: { icon: FiInfo, className: "text-info" },
};
export function ToastContainer() {
    const { toasts, dismissToast } = useToast();
    if (toasts.length === 0)
        return null;
    return createPortal(<div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
            const { icon: Icon, className } = VARIANT_STYLES[toast.variant];
            return (<div key={toast.id} className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-lg">
            <Icon className={cn("mt-0.5 size-5 shrink-0", className)}/>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.description && (<p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>)}
            </div>
            <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification" className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <FiX className="size-3.5"/>
            </button>
          </div>);
        })}
    </div>, document.body);
}
