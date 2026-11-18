import * as React from "react";
const ToastContext = React.createContext(undefined);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);
    const dismissToast = React.useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const showToast = React.useCallback((toast) => {
        const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
        window.setTimeout(() => dismissToast(id), 4500);
    }, [dismissToast]);
    const value = React.useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);
    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
export function useToast() {
    const ctx = React.useContext(ToastContext);
    if (!ctx)
        throw new Error("useToast must be used within a ToastProvider");
    return ctx;
}
