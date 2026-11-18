import * as React from "react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingState } from "@/components/common/LoadingState"
import { Pagination } from "@/components/common/Pagination"
import { useSyncOnChange } from "@/hooks/useSyncOnChange"

export function DataTable({
  columns,
  rows,
  keyExtractor,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters.",
  isLoading = false,
  onRowClick,

  // Existing client-side pagination
  pageSize,

  // Optional server-side pagination
  serverPagination = false,
  page = 1,
  pageCount = 1,
  totalItems,
  onPageChange,
}) {
  const [localPage, setLocalPage] = React.useState(1)

  useSyncOnChange(rows.length, () => setLocalPage(1))

  const effectivePageSize = pageSize ?? (rows.length || 1)
  const localPageCount = Math.max(1, Math.ceil(rows.length / effectivePageSize))

  const currentLocalPage = Math.min(localPage, localPageCount)

  const displayedRows = serverPagination
    ? rows
    : pageSize
      ? rows.slice(
          (currentLocalPage - 1) * effectivePageSize,
          currentLocalPage * effectivePageSize
        )
      : rows

  const paginationPage = serverPagination ? page : currentLocalPage
  const paginationPageCount = serverPagination ? pageCount : localPageCount

  const paginationTotal = serverPagination ? totalItems : rows.length

  const paginationPageSize = serverPagination
    ? pageSize || 8
    : effectivePageSize

  const showPagination = serverPagination
    ? paginationTotal > 0
    : pageSize && rows.length > 0

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
              displayedRows.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/40",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 align-middle text-foreground",
                        col.className
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>

        {isLoading && <LoadingState />}

        {!isLoading && rows.length === 0 && (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="border-0"
          />
        )}
      </div>

      {showPagination && (
        <Pagination
          page={paginationPage}
          pageCount={paginationPageCount}
          totalItems={paginationTotal}
          pageSize={paginationPageSize}
          onPageChange={serverPagination ? onPageChange : setLocalPage}
        />
      )}
    </div>
  )
}
