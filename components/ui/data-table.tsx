"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowData,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  search?: true | { placeholder?: string; column?: string }
  toolbar?: React.ReactNode
  facets?: {
    columnId: string
    title?: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
  }[]
  enableSorting?: boolean
  enablePagination?: boolean
  pageSizeOptions?: number[]
  enableColumnVisibility?: boolean
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  search,
  toolbar,
  facets,
  enableSorting = true,
  enablePagination = true,
  pageSizeOptions,
  enableColumnVisibility = true,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    enableSorting,
  })

  const searchColumn = search && typeof search === "object" ? search.column : undefined
  let searchPlaceholder: string | undefined = "Search…"
  if (search && typeof search === "object") {
    searchPlaceholder = search.placeholder ?? searchPlaceholder
  }
  if (search === undefined) searchPlaceholder = undefined

  const hasToolbar = !!search || !!toolbar || !!facets?.length || enableColumnVisibility

  return (
    <div className="flex flex-col gap-3">
      {hasToolbar && (
        <div className="flex items-center gap-2 flex-wrap">
          {search && (
            <Input
              placeholder={searchPlaceholder}
              value={
                searchColumn
                  ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
                  : (table.getState().globalFilter as string)
              }
              onChange={(event) => {
                if (searchColumn) {
                  table.getColumn(searchColumn)?.setFilterValue(event.target.value)
                } else {
                  table.setGlobalFilter(event.target.value)
                }
              }}
              className="h-8 w-[200px] text-sm"
            />
          )}
          {facets?.map((facet) => {
            const column = table.getColumn(facet.columnId)
            if (!column || !column.getCanFilter()) return null
            return (
              <DataTableFacetedFilter
                key={facet.columnId}
                column={column}
                title={facet.title ?? facet.columnId}
                options={facet.options}
              />
            )
          })}
          {toolbar}
          {enableColumnVisibility && (
            <DataTableViewOptions table={table} />
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === "string" ? (
                          <DataTableColumnHeader
                            column={header.column}
                            title={header.column.columnDef.header as string}
                          />
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
  )
}