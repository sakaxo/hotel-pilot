import * as React from "react";
import { FiBriefcase, FiPlus, FiUserCheck, FiUserX } from "react-icons/fi";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput } from "@/components/common/SearchInput";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { ALL_ROLES } from "@/context/AuthContext";
import { StaffForm } from "@/pages/Staff/StaffForm";
export function Staff() {
    const { data, toggleStaffStatus } = useAppData();
    const { showToast } = useToast();
    const [search, setSearch] = React.useState("");
    const [roleFilter, setRoleFilter] = React.useState("all");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [formOpen, setFormOpen] = React.useState(false);
    const [editingStaff, setEditingStaff] = React.useState(null);
    const [viewingStaff, setViewingStaff] = React.useState(null);
    const filtered = React.useMemo(() => {
        const term = search.trim().toLowerCase();
        return data.staff.filter((s) => {
            const matchesSearch = !term || `${s.name} ${s.email}`.toLowerCase().includes(term);
            const matchesRole = roleFilter === "all" || s.role === roleFilter;
            const matchesStatus = statusFilter === "all" || s.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [data.staff, search, roleFilter, statusFilter]);
    const columns = [
        {
            key: "name",
            header: "Staff member",
            render: (s) => (<div>
          <p className="font-medium text-foreground">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.email}</p>
        </div>),
        },
        { key: "phone", header: "Phone", render: (s) => s.phone },
        { key: "role", header: "Role", render: (s) => s.role },
        { key: "department", header: "Department", render: (s) => s.department },
        { key: "hireDate", header: "Hired", render: (s) => formatDate(s.hireDate) },
        { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status}/> },
        {
            key: "actions",
            header: "",
            className: "text-right",
            render: (s) => (<div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setViewingStaff(s)}>
            View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
                    setEditingStaff(s);
                    setFormOpen(true);
                }}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" className={s.status === "Active" ? "text-danger" : "text-success"} onClick={() => {
                    toggleStaffStatus(s.id);
                    showToast({
                        title: `${s.name} ${s.status === "Active" ? "deactivated" : "activated"}`,
                        variant: "info",
                    });
                }}>
            {s.status === "Active" ? "Deactivate" : "Activate"}
          </Button>
        </div>),
        },
    ];
    return (<div className="flex flex-col gap-5">
      <PageHeader title="Staff" description="Manage hotel staff accounts, roles and departments." actions={<Button onClick={() => {
                setEditingStaff(null);
                setFormOpen(true);
            }}>
            <FiPlus data-icon="inline-start"/> Add staff member
          </Button>}/>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total staff" value={data.staff.length} icon={<FiBriefcase />} accent="primary"/>
        <StatCard label="Active" value={data.staff.filter((s) => s.status === "Active").length} icon={<FiUserCheck />} accent="success"/>
        <StatCard label="Inactive" value={data.staff.filter((s) => s.status === "Inactive").length} icon={<FiUserX />} accent="danger"/>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="w-full sm:max-w-sm"/>
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown label="Role" value={roleFilter} onChange={setRoleFilter} options={ALL_ROLES.map((r) => ({ label: r, value: r }))}/>
          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
        ]}/>
        </div>
      </div>

      <DataTable columns={columns} rows={filtered} keyExtractor={(s) => s.id} pageSize={8} onRowClick={(s) => setViewingStaff(s)} emptyTitle="No staff members found" emptyDescription="Try adjusting your search or filters."/>

      <StaffForm open={formOpen} onClose={() => {
            setFormOpen(false);
            setEditingStaff(null);
        }} staff={editingStaff}/>

      <Modal open={!!viewingStaff} onClose={() => setViewingStaff(null)} title={viewingStaff?.name ?? ""} description={viewingStaff?.email} size="sm" footer={<Button variant="outline" onClick={() => setViewingStaff(null)}>
            Close
          </Button>}>
        {viewingStaff && (<div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{viewingStaff.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium text-foreground">{viewingStaff.role}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="font-medium text-foreground">{viewingStaff.department}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hire date</p>
              <p className="font-medium text-foreground">{formatDate(viewingStaff.hireDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <StatusBadge status={viewingStaff.status}/>
            </div>
          </div>)}
      </Modal>
    </div>);
}
