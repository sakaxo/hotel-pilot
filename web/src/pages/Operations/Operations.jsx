import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { PageHeader } from "@/components/common/PageHeader";
import { cn } from "@/lib/utils";
import { CheckInPanel } from "@/pages/Operations/CheckInPanel";
import { CheckoutPanel } from "@/pages/Operations/CheckoutPanel";
export function Operations() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") === "checkout" ? "checkout" : "checkin";
    const [tab, setTab] = React.useState(initialTab);
    function selectTab(next) {
        setTab(next);
        setSearchParams({ tab: next });
    }
    return (<div className="flex flex-col gap-5">
      <PageHeader title="Check-in / Checkout" description="Process guest arrivals and departures, including RFID card assignment."/>

      <div className="flex gap-2 rounded-lg border border-border bg-card p-1">
        <button type="button" onClick={() => selectTab("checkin")} className={cn("flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors", tab === "checkin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
          <FiLogIn className="size-4"/> Check-in
        </button>
        <button type="button" onClick={() => selectTab("checkout")} className={cn("flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors", tab === "checkout" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
          <FiLogOut className="size-4"/> Checkout
        </button>
      </div>

      {tab === "checkin" ? <CheckInPanel /> : <CheckoutPanel />}
    </div>);
}
