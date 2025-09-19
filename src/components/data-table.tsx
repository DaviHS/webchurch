"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusTranslations } from "@/lib/utils";

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  onPageChange: (page: number) => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  noResultsMessage?: string
  showColumnToggle?: boolean
  showGlobalFilter?: boolean
  showPagination?: boolean
  pageSize?: number
  loading?: boolean
  pagination?: PaginationProps
  onRowClick?: (row: TData) => void
  getRowCanExpand?: (row: any) => boolean
  renderSubComponent?: (props: { row: any }) => React.ReactElement
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  noResultsMessage = "Nenhum resultado encontrado.",
  showColumnToggle = true,
  showGlobalFilter = true,
  showPagination = true,
  pageSize = 10,
  loading = false,
  pagination,
  onRowClick,
  getRowCanExpand,
  renderSubComponent,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize,
        pageIndex: pagination ? pagination.currentPage - 1 : 0,
      },
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      if ((columnId === "status" || columnId === "tipo") && typeof value === "string") {
        const statusTranslation = statusTranslations[value] || value
        return String(statusTranslation).toLowerCase().includes(filterValue.toLowerCase())
      }
      return typeof value === "string"
        ? String(value).toLowerCase().includes(filterValue.toLowerCase())
        : String(value).includes(filterValue)
    },
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    getRowCanExpand,
  })

  const toggleRowExpanded = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }))
  }

  return (
    <div className="space-y-4">
      <div className="w-full">
        {(showGlobalFilter || showColumnToggle) && (
          <div className="flex items-center py-4">
            {showGlobalFilter && (
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
              />
            )}
            {showColumnToggle && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Colunas <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        <div className="rounded-md border relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
              <span className="text-gray-500">Carregando...</span>
            </div>
          )}
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {getRowCanExpand && <TableHead className="w-10" />}
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className={onRowClick ? "cursor-pointer" : ""}
                    >
                      {getRowCanExpand && getRowCanExpand(row) && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpanded(row.id)}
                          >
                            {expandedRows[row.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          onClick={() => onRowClick?.(row.original)}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {getRowCanExpand && getRowCanExpand(row) && expandedRows[row.id] && (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="bg-muted/50">
                          {renderSubComponent && renderSubComponent({ row })}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (getRowCanExpand ? 1 : 0)} 
                    className="h-24 text-center"
                  >
                    {noResultsMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {showPagination && pagination && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {data.length} de {pagination.totalItems ?? data.length} linha(s) exibidas.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}