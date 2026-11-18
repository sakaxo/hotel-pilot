import * as React from "react";
import { Link } from "react-router-dom";
import { FiSave } from "react-icons/fi";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSyncOnChange } from "@/hooks/useSyncOnChange";
import { RoomCategoryManager } from "@/pages/Rooms/RoomCategoryManager-remove";
const ALL_PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Mobile Money", "Paystack"];
const SECTIONS = [
    { id: "profile", label: "Hotel profile" },
    { id: "general", label: "General preferences" },
    { id: "categories", label: "Room categories & rates" },
    { id: "reservation-policy", label: "Reservation policies" },
    { id: "checkin-policy", label: "Check-in / checkout" },
    { id: "payment", label: "Payment configuration" },
    { id: "access", label: "Access control" },
    { id: "staff", label: "Staff & roles" },
    { id: "notifications", label: "Notifications" },
];
export function Settings() {
    const { data, updateSettings } = useAppData();
    const { showToast } = useToast();
    const [section, setSection] = React.useState("profile");
    const [draft, setDraft] = React.useState(data.settings);
    const [categoryManagerOpen, setCategoryManagerOpen] = React.useState(false);
    useSyncOnChange(data.settings, (settings) => {
        setDraft(settings);
    });
    function set(key, value) {
        setDraft((d) => ({ ...d, [key]: value }));
    }
    function togglePaymentMethod(method) {
        setDraft((d) => ({
            ...d,
            paymentMethods: d.paymentMethods.includes(method)
                ? d.paymentMethods.filter((m) => m !== method)
                : [...d.paymentMethods, method],
        }));
    }
    function handleSave() {
        updateSettings(draft);
        showToast({ title: "Settings saved", variant: "success" });
    }
    const roleCounts = React.useMemo(() => {
        const counts = {};
        data.staff.forEach((s) => {
            counts[s.role] = (counts[s.role] ?? 0) + 1;
        });
        return counts;
    }, [data.staff]);
    return (<div className="flex flex-col gap-5">
      <PageHeader title="Settings" description="Configure hotel profile, policies and system preferences." actions={<Button onClick={handleSave}>
            <FiSave data-icon="inline-start"/> Save changes
          </Button>}/>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => (<button key={s.id} type="button" onClick={() => setSection(s.id)} className={cn("shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors", section === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              {s.label}
            </button>))}
        </nav>

        <div className="rounded-lg border border-border bg-card p-5">
          {section === "profile" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Hotel profile</h2>
              <FormInput label="Hotel name" value={draft.hotelName} onChange={(e) => set("hotelName", e.target.value)}/>
              <FormInput label="Tagline" value={draft.tagline} onChange={(e) => set("tagline", e.target.value)}/>
              <FormTextarea label="Address" value={draft.address} onChange={(e) => set("address", e.target.value)}/>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Phone" value={draft.phone} onChange={(e) => set("phone", e.target.value)}/>
                <FormInput label="Email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)}/>
              </div>
            </div>)}

          {section === "general" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">General preferences</h2>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Currency code" value={draft.currency} onChange={(e) => set("currency", e.target.value)}/>
                <FormInput label="Tax rate (%)" type="number" value={draft.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))}/>
              </div>
            </div>)}

          {section === "categories" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Room categories &amp; rates</h2>
              <p className="text-sm text-muted-foreground">
                Manage room categories, capacity and base rates. You can also manage categories from the{" "}
                <Link to="/rooms" className="text-primary hover:underline">
                  Rooms
                </Link>{" "}
                page.
              </p>
              <ul className="divide-y divide-border rounded-md border border-border">
                {data.roomCategories.map((c) => (<li key={c.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">Capacity {c.capacity}</p>
                    </div>
                    <p className="font-medium text-foreground">{formatCurrency(c.baseRate)}/night</p>
                  </li>))}
              </ul>
              <Button variant="outline" className="self-start" onClick={() => setCategoryManagerOpen(true)}>
                Manage categories
              </Button>
            </div>)}

          {section === "reservation-policy" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Reservation policies</h2>
              <FormTextarea label="Cancellation policy" value={draft.cancellationPolicy} onChange={(e) => set("cancellationPolicy", e.target.value)} rows={4}/>
              <FormInput label="Late checkout fee" type="number" value={draft.lateCheckoutFee} onChange={(e) => set("lateCheckoutFee", Number(e.target.value))}/>
            </div>)}

          {section === "checkin-policy" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Check-in / checkout policies</h2>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Standard check-in time" type="time" value={draft.checkInTime} onChange={(e) => set("checkInTime", e.target.value)}/>
                <FormInput label="Standard check-out time" type="time" value={draft.checkOutTime} onChange={(e) => set("checkOutTime", e.target.value)}/>
              </div>
            </div>)}

          {section === "payment" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Payment configuration</h2>
              <p className="text-sm text-muted-foreground">Select which payment methods are accepted at the front desk.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ALL_PAYMENT_METHODS.map((method) => (<label key={method} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    <input type="checkbox" checked={draft.paymentMethods.includes(method)} onChange={() => togglePaymentMethod(method)} className="size-4 rounded border-border accent-primary"/>
                    {method}
                  </label>))}
              </div>
              <p className="text-xs text-muted-foreground">
                Paystack integration is reserved for a future backend-connected phase.
              </p>
            </div>)}

          {section === "access" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Access control preferences</h2>
              <FormInput label="Default card expiry (days)" type="number" value={draft.cardExpiryDays} onChange={(e) => set("cardExpiryDays", Number(e.target.value))}/>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={draft.autoRevokeOnCheckout} onChange={(e) => set("autoRevokeOnCheckout", e.target.checked)} className="size-4 rounded border-border accent-primary"/>
                Automatically revoke RFID card authorization at checkout
              </label>
            </div>)}

          {section === "staff" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Staff &amp; role settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage individual staff accounts from the{" "}
                <Link to="/staff" className="text-primary hover:underline">
                  Staff
                </Link>{" "}
                page. Current role distribution:
              </p>
              <ul className="divide-y divide-border rounded-md border border-border">
                {Object.entries(roleCounts).map(([role, count]) => (<li key={role} className="flex items-center justify-between px-3 py-2.5 text-sm">
                    <p className="font-medium text-foreground">{role}</p>
                    <p className="text-muted-foreground">{count} staff member(s)</p>
                  </li>))}
              </ul>
            </div>)}

          {section === "notifications" && (<div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Notification preferences</h2>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={draft.notifyOnLowCardInventory} onChange={(e) => set("notifyOnLowCardInventory", e.target.checked)} className="size-4 rounded border-border accent-primary"/>
                Notify when RFID card inventory is running low
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={draft.notifyOnOverduePayments} onChange={(e) => set("notifyOnOverduePayments", e.target.checked)} className="size-4 rounded border-border accent-primary"/>
                Notify when reservations have overdue payments
              </label>
            </div>)}

          <div className="mt-5 flex justify-end border-t border-border pt-4">
            <Button onClick={handleSave}>
              <FiSave data-icon="inline-start"/> Save changes
            </Button>
          </div>
        </div>
      </div>

      <RoomCategoryManager open={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)}/>
    </div>);
}
