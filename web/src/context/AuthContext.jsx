import * as React from "react";
import { readFromStorage, writeToStorage, clearStorage } from "@/services/storage";
const AUTH_STORAGE_KEY = "auth";
// Demo staff accounts used to simulate authentication for each represented role.
export const MOCK_ACCOUNTS = [
    {
        email: "admin@hotelpilot.com",
        password: "password123",
        user: {
            id: "staff-1",
            name: "Adaeze Nwosu",
            email: "admin@hotelpilot.com",
            role: "Administrator",
            avatarInitials: "AN",
        },
    },
    {
        email: "manager@hotelpilot.com",
        password: "password123",
        user: {
            id: "staff-2",
            name: "Benjamin Osei",
            email: "manager@hotelpilot.com",
            role: "Manager",
            avatarInitials: "BO",
        },
    },
    {
        email: "reception@hotelpilot.com",
        password: "password123",
        user: {
            id: "staff-3",
            name: "Comfort Eze",
            email: "reception@hotelpilot.com",
            role: "Receptionist",
            avatarInitials: "CE",
        },
    },
    {
        email: "accounts@hotelpilot.com",
        password: "password123",
        user: {
            id: "staff-5",
            name: "Esther Umeh",
            email: "accounts@hotelpilot.com",
            role: "Accountant",
            avatarInitials: "EU",
        },
    },
];
const AuthContext = React.createContext(undefined);
function readSessionAuth() {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = window.sessionStorage.getItem(`hotelpilot:${AUTH_STORAGE_KEY}`);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function AuthProvider({ children }) {
    const [user, setUser] = React.useState(() => readFromStorage(AUTH_STORAGE_KEY, readSessionAuth()));
    const login = React.useCallback((email, password, remember = true) => {
        const normalizedEmail = email.trim().toLowerCase();
        const account = MOCK_ACCOUNTS.find((a) => a.email === normalizedEmail);
        if (!account) {
            return { success: false, message: "No account found with that email address." };
        }
        if (account.password !== password) {
            return { success: false, message: "Incorrect password. Please try again." };
        }
        setUser(account.user);
        if (remember) {
            writeToStorage(AUTH_STORAGE_KEY, account.user);
        }
        else {
            window.sessionStorage.setItem(`hotelpilot:${AUTH_STORAGE_KEY}`, JSON.stringify(account.user));
        }
        return { success: true };
    }, []);
    const logout = React.useCallback(() => {
        setUser(null);
        clearStorage(AUTH_STORAGE_KEY);
        window.sessionStorage.removeItem(`hotelpilot:${AUTH_STORAGE_KEY}`);
    }, []);
    const value = React.useMemo(() => ({ user, isAuthenticated: !!user, login, logout }), [user, login, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const ctx = React.useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
export const ALL_ROLES = [
    "Administrator",
    "Manager",
    "Receptionist",
    "Accountant",
    "Front Desk Staff",
];
