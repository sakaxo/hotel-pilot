import * as React from "react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { Pagination } from "@/components/common/Pagination"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters.",
  isLoading = false,
  onRowClick,
  pageSize,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  keyExtractor: (row: T) => string
  emptyTitle?: string
  emptyDescription?: string
  isLoading?: boolean
  onRowClick?: (row: T) => void
  pageSize?: number
}) {
  const [page, setPage] = React.useState(1)

  useSyncOnChange(rows.length, () => setPage(1))

  const effectivePageSize = pageSize ?? (rows.length || 1)
  const pageCount = Math.max(1, Math.ceil(rows.length / effectivePageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedRows = pageSize
    ? rows.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)
    : rows

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!isLoading &&
              pagedRows.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/40",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 align-middle text-foreground", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {isLoading && <LoadingState />}
        {!isLoading && rows.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} className="border-0" />
        )}
      </div>
      {pageSize && rows.length > 0 && (
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          totalItems={rows.length}
          pageSize={effectivePageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
