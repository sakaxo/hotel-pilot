import * as React from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";
export function Modal({ open, onClose, title, description, children, footer, size = "md", }) {
    React.useEffect(() => {
        if (!open)
            return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);
    if (!open)
        return null;
    const sizeStyles = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };
    return createPortal(<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]" aria-hidden onClick={onClose}/>
      <div role="dialog" aria-modal="true" aria-label={title} className={cn("relative z-10 w-full rounded-lg border border-border bg-card shadow-xl", sizeStyles[size])}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <FiX className="size-4"/>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
      </div>
    </div>, document.body);
}
