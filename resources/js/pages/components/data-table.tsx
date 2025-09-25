import * as React from "react";
import {
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  getCoreRowModel,
  getSortedRowModel,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./Pagination";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { router, usePage } from "@inertiajs/react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  paginationLinks: { url: string | null; label: string; active: boolean }[];
  searchRoute: string; // ✅ route name or full URL for search/pagination
  searchParam?: string; // ✅ default: "search"
}

export function DataTable<TData, TValue>({
  columns,
  data,
  paginationLinks,
  searchRoute,
  searchParam = "search",
}: DataTableProps<TData, TValue>) {
  const pageProps = usePage().props as Record<string, any>;
  const searchValue = pageProps[searchParam] ?? "";
  const [query, setQuery] = useState<string>(
    typeof searchValue === "string" ? searchValue : ""
  );

  const handleSearch = () => {
    router.get(
      route(searchRoute),
      { [searchParam]: query },
      { preserveScroll: true, preserveState: true }
    );
  };

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <>
      {/* ---- Search Bar ------ */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex flex-row flex-wrap items-center gap-2"
      >
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border-gray-300 dark:border-gray-700"
        />
        <Button
          type="submit"
          className="bg-zinc-900 text-white hover:bg-zinc-700 dark:hover:bg-zinc-800"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* ---- Table ------ */}
      <div className="bg-white dark:bg-zinc-950 rounded-md border h-full shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <Table className="w-full">
            {/* Table Header */}
            <TableHeader className="bg-gray-100 dark:bg-zinc-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="p-3 font-semibold text-gray-900 dark:text-gray-100 uppercase text-xs border-b"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            {/* Table Body */}
            <TableBody>
              {data.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-900"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="p-1/2 pl-3 pr-3 text-xs border-b border-gray-200 dark:border-zinc-900"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-6 w-6 mb-1 opacity-50" />
                      No results found
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ---- Pagination ------ */}
        <div className="mt-auto border-t dark:bg-zinc-900">
          <DataTablePagination
            paginationLinks={paginationLinks}
            searchParam={searchParam}
          />
        </div>
      </div>
    </>
  );
}
