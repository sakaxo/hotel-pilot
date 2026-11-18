import * as React from "react";
import { createInitialData } from "@/data/initialData";
import { readFromStorage, writeToStorage } from "@/services/storage";
const DATA_STORAGE_KEY = "data";
function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 7)}`;
}
function nextReference(prefix, existing) {
    const numbers = existing
        .map((item) => Number(item.reference.replace(`${prefix}-`, "")))
        .filter((n) => !Number.isNaN(n));
    const next = (numbers.length ? Math.max(...numbers) : 999) + 1;
    return `${prefix}-${next}`;
}
function nowIso() {
    return new Date().toISOString();
}
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
export function computePaymentStatus(totalAmount, amountPaid) {
    if (amountPaid <= 0)
        return "Pending";
    if (amountPaid >= totalAmount)
        return "Paid";
    return "Partially Paid";
}
const AppDataContext = React.createContext(undefined);
export function AppDataProvider({ children }) {
    const [data, setData] = React.useState(() => readFromStorage(DATA_STORAGE_KEY, createInitialData()));
    React.useEffect(() => {
        writeToStorage(DATA_STORAGE_KEY, data);
    }, [data]);
    const getGuest = React.useCallback((id) => data.guests.find((g) => g.id === id), [data.guests]);
    const getRoom = React.useCallback((id) => data.rooms.find((r) => r.id === id), [data.rooms]);
    const getRoomCategory = React.useCallback((id) => data.roomCategories.find((c) => c.id === id), [data.roomCategories]);
    const getReservation = React.useCallback((id) => data.reservations.find((r) => r.id === id), [data.reservations]);
    const addGuest = (guest) => {
        const created = {
            ...guest,
            id: uid("guest"),
            registrationDate: todayStr(),
            status: "Active",
        };
        setData((prev) => ({ ...prev, guests: [created, ...prev.guests] }));
        return created;
    };
    const updateGuest = (id, patch) => {
        setData((prev) => ({
            ...prev,
            guests: prev.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
    };
    const addRoom = (room) => {
        const created = {
            ...room,
            id: uid("room"),
            status: "Available",
            currentGuestId: null,
            housekeepingStatus: "Clean",
        };
        setData((prev) => ({ ...prev, rooms: [...prev.rooms, created] }));
        return created;
    };
    const updateRoom = (id, patch) => {
        setData((prev) => ({
            ...prev,
            rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
    };
    const setRoomStatus = (id, status) => {
        updateRoom(id, { status });
    };
    const addRoomCategory = (category) => {
        const created = { ...category, id: uid("cat") };
        setData((prev) => ({ ...prev, roomCategories: [...prev.roomCategories, created] }));
        return created;
    };
    const updateRoomCategory = (id, patch) => {
        setData((prev) => ({
            ...prev,
            roomCategories: prev.roomCategories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
    };
    const addReservation = (reservation) => {
        let created;
        setData((prev) => {
            const reference = nextReference("RSV", prev.reservations);
            created = {
                ...reservation,
                id: uid("res"),
                reference,
                amountPaid: 0,
                paymentStatus: "Pending",
                status: reservation.status ?? "Pending",
                createdAt: nowIso(),
            };
            const rooms = prev.rooms.map((r) => r.id === created.roomId && r.status === "Available"
                ? { ...r, status: "Reserved" }
                : r);
            return { ...prev, reservations: [created, ...prev.reservations], rooms };
        });
        return created;
    };
    const updateReservation = (id, patch) => {
        setData((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
    };
    const cancelReservation = (id) => {
        setData((prev) => {
            const reservation = prev.reservations.find((r) => r.id === id);
            const reservations = prev.reservations.map((r) => r.id === id ? { ...r, status: "Cancelled" } : r);
            let rooms = prev.rooms;
            if (reservation) {
                const stillActive = reservations.some((r) => r.roomId === reservation.roomId &&
                    (r.status === "Confirmed" || r.status === "Pending" || r.status === "Checked In"));
                if (!stillActive) {
                    rooms = prev.rooms.map((r) => r.id === reservation.roomId && r.status === "Reserved"
                        ? { ...r, status: "Available" }
                        : r);
                }
            }
            return { ...prev, reservations, rooms };
        });
    };
    const registerCard = (uidValue) => {
        let created;
        setData((prev) => {
            const reference = nextReference("CRD", prev.rfidCards);
            created = {
                id: uid("card"),
                reference,
                uid: uidValue,
                status: "Available",
                assignedGuestId: null,
                assignedRoomId: null,
                reservationId: null,
                assignedDate: null,
                expiryDate: null,
                history: [
                    { id: uid("hist"), date: nowIso(), action: "Registered", details: "Card added to inventory" },
                ],
            };
            return { ...prev, rfidCards: [created, ...prev.rfidCards] };
        });
        return created;
    };
    const appendCardHistory = (card, action, details) => [
        { id: uid("hist"), date: nowIso(), action, details },
        ...card.history,
    ];
    const assignCard = (cardId, guestId, roomId, reservationId, expiryDate) => {
        setData((prev) => ({
            ...prev,
            rfidCards: prev.rfidCards.map((c) => c.id === cardId
                ? {
                    ...c,
                    status: "Assigned",
                    assignedGuestId: guestId,
                    assignedRoomId: roomId,
                    reservationId,
                    assignedDate: todayStr(),
                    expiryDate,
                    history: appendCardHistory(c, "Assigned", `Assigned to room ${getRoom(roomId)?.number ?? ""}`),
                }
                : c),
        }));
    };
    const revokeCard = (cardId, reason = "Checkout - authorization revoked") => {
        setData((prev) => ({
            ...prev,
            rfidCards: prev.rfidCards.map((c) => c.id === cardId
                ? {
                    ...c,
                    status: "Available",
                    assignedGuestId: null,
                    assignedRoomId: null,
                    reservationId: null,
                    assignedDate: null,
                    expiryDate: null,
                    history: appendCardHistory(c, "Revoked", reason),
                }
                : c),
        }));
    };
    const blockCard = (cardId) => {
        setData((prev) => ({
            ...prev,
            rfidCards: prev.rfidCards.map((c) => c.id === cardId
                ? {
                    ...c,
                    status: "Blocked",
                    history: appendCardHistory(c, "Blocked", "Card blocked by staff"),
                }
                : c),
        }));
    };
    const markCardLost = (cardId) => {
        setData((prev) => ({
            ...prev,
            rfidCards: prev.rfidCards.map((c) => c.id === cardId
                ? {
                    ...c,
                    status: "Lost",
                    history: appendCardHistory(c, "Marked Lost", "Card reported lost"),
                }
                : c),
        }));
    };
    const replaceCard = (oldCardId, newUid) => {
        let replacement;
        setData((prev) => {
            const oldCard = prev.rfidCards.find((c) => c.id === oldCardId);
            const reference = nextReference("CRD", prev.rfidCards);
            replacement = {
                id: uid("card"),
                reference,
                uid: newUid,
                status: oldCard?.assignedGuestId ? "Assigned" : "Available",
                assignedGuestId: oldCard?.assignedGuestId ?? null,
                assignedRoomId: oldCard?.assignedRoomId ?? null,
                reservationId: oldCard?.reservationId ?? null,
                assignedDate: oldCard?.assignedGuestId ? todayStr() : null,
                expiryDate: oldCard?.expiryDate ?? null,
                history: [
                    {
                        id: uid("hist"),
                        date: nowIso(),
                        action: "Registered",
                        details: `Replacement for ${oldCard?.reference ?? "card"}`,
                    },
                ],
            };
            const rfidCards = prev.rfidCards.map((c) => c.id === oldCardId
                ? {
                    ...c,
                    status: "Blocked",
                    assignedGuestId: null,
                    assignedRoomId: null,
                    reservationId: null,
                    assignedDate: null,
                    expiryDate: null,
                    history: appendCardHistory(c, "Replaced", `Replaced by ${replacement.reference}`),
                }
                : c);
            return { ...prev, rfidCards: [replacement, ...rfidCards] };
        });
        return replacement;
    };
    const addAccessLog = (log) => {
        let created;
        setData((prev) => {
            const reference = nextReference("ACC", prev.accessLogs);
            created = { ...log, id: uid("log"), reference, timestamp: log.timestamp ?? nowIso() };
            return { ...prev, accessLogs: [created, ...prev.accessLogs] };
        });
        return created;
    };
    const recordPayment = (reservationId, amount, method, notes) => {
        let created;
        setData((prev) => {
            const reservation = prev.reservations.find((r) => r.id === reservationId);
            const reference = nextReference("PMT", prev.payments);
            created = {
                id: uid("pay"),
                reference,
                guestId: reservation?.guestId ?? "",
                reservationId,
                amount,
                method,
                date: nowIso(),
                status: "Paid",
                notes,
            };
            const reservations = prev.reservations.map((r) => {
                if (r.id !== reservationId)
                    return r;
                const amountPaid = r.amountPaid + amount;
                return {
                    ...r,
                    amountPaid,
                    paymentStatus: computePaymentStatus(r.totalAmount, amountPaid),
                };
            });
            return { ...prev, payments: [created, ...prev.payments], reservations };
        });
        return created;
    };
    const addStaff = (member) => {
        const created = { ...member, id: uid("staff") };
        setData((prev) => ({ ...prev, staff: [created, ...prev.staff] }));
        return created;
    };
    const updateStaff = (id, patch) => {
        setData((prev) => ({
            ...prev,
            staff: prev.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));
    };
    const toggleStaffStatus = (id) => {
        setData((prev) => ({
            ...prev,
            staff: prev.staff.map((s) => s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s),
        }));
    };
    const updateSettings = (patch) => {
        setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    };
    const markNotificationRead = (id) => {
        setData((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
    };
    const markAllNotificationsRead = () => {
        setData((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        }));
    };
    const checkInReservation = (reservationId, cardId) => {
        setData((prev) => {
            const reservation = prev.reservations.find((r) => r.id === reservationId);
            if (!reservation)
                return prev;
            const reservations = prev.reservations.map((r) => r.id === reservationId ? { ...r, status: "Checked In" } : r);
            const rooms = prev.rooms.map((r) => r.id === reservation.roomId
                ? {
                    ...r,
                    status: "Occupied",
                    currentGuestId: reservation.guestId,
                    housekeepingStatus: "Dirty",
                }
                : r);
            const rfidCards = prev.rfidCards.map((c) => c.id === cardId
                ? {
                    ...c,
                    status: "Assigned",
                    assignedGuestId: reservation.guestId,
                    assignedRoomId: reservation.roomId,
                    reservationId: reservation.id,
                    assignedDate: todayStr(),
                    expiryDate: reservation.checkOutDate,
                    history: appendCardHistory(c, "Assigned", `Checked in to room ${prev.rooms.find((rm) => rm.id === reservation.roomId)?.number ?? ""}`),
                }
                : c);
            const reference = nextReference("ACC", prev.accessLogs);
            const accessLogs = [
                {
                    id: uid("log"),
                    reference,
                    roomId: reservation.roomId,
                    cardId,
                    guestId: reservation.guestId,
                    timestamp: nowIso(),
                    result: "Granted",
                    description: "Card activated at check-in",
                },
                ...prev.accessLogs,
            ];
            return { ...prev, reservations, rooms, rfidCards, accessLogs };
        });
    };
    const checkOutReservation = (reservationId) => {
        setData((prev) => {
            const reservation = prev.reservations.find((r) => r.id === reservationId);
            if (!reservation)
                return prev;
            const reservations = prev.reservations.map((r) => r.id === reservationId ? { ...r, status: "Checked Out" } : r);
            const rooms = prev.rooms.map((r) => r.id === reservation.roomId
                ? {
                    ...r,
                    status: "Cleaning",
                    currentGuestId: null,
                    housekeepingStatus: "Dirty",
                }
                : r);
            const assignedCard = prev.rfidCards.find((c) => c.reservationId === reservationId);
            const rfidCards = prev.rfidCards.map((c) => c.reservationId === reservationId
                ? {
                    ...c,
                    status: "Available",
                    assignedGuestId: null,
                    assignedRoomId: null,
                    reservationId: null,
                    assignedDate: null,
                    expiryDate: null,
                    history: appendCardHistory(c, "Revoked", "Checkout - authorization revoked"),
                }
                : c);
            const reference = nextReference("ACC", prev.accessLogs);
            const accessLogs = assignedCard
                ? [
                    {
                        id: uid("log"),
                        reference,
                        roomId: reservation.roomId,
                        cardId: assignedCard.id,
                        guestId: reservation.guestId,
                        timestamp: nowIso(),
                        result: "Granted",
                        description: "Card authorization revoked at checkout",
                    },
                    ...prev.accessLogs,
                ]
                : prev.accessLogs;
            return { ...prev, reservations, rooms, rfidCards, accessLogs };
        });
    };
    const resetDemoData = () => {
        setData(createInitialData());
    };
    const value = {
        data,
        addGuest,
        updateGuest,
        addRoom,
        updateRoom,
        setRoomStatus,
        addRoomCategory,
        updateRoomCategory,
        addReservation,
        updateReservation,
        cancelReservation,
        registerCard,
        assignCard,
        revokeCard,
        blockCard,
        markCardLost,
        replaceCard,
        addAccessLog,
        recordPayment,
        addStaff,
        updateStaff,
        toggleStaffStatus,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        checkInReservation,
        checkOutReservation,
        getGuest,
        getRoom,
        getRoomCategory,
        getReservation,
        resetDemoData,
    };
    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
export function useAppData() {
    const ctx = React.useContext(AppDataContext);
    if (!ctx)
        throw new Error("useAppData must be used within an AppDataProvider");
    return ctx;
}
