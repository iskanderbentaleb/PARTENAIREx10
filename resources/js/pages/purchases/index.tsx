import { DataTable } from '../components/data-table';
import { SummaryCard } from '../components/summary-card'; // ✅ Import summary card
import { SelectFilter } from '../components/filters/select-filter';
import { RangeFilter } from '../components/filters/range-filter';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { Trash, Edit, Eye } from "lucide-react";
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { DateRangePickerFilter } from '../components/filters/date-range-picker-filter';

// Breadcrumbs
const breadcrumbs = [
  { title: 'Purchases', href: '/purchases' },
];

// Purchase type (based on Laravel model + relations)
type Purchase = {
  id: number;
  supplier_invoice_number: string | null;
  purchase_date: string;
  due_date: string | null;
  subtotal: string;
  discount_reason: string | null;
  discount_value: string;
  shipping_note: string | null;
  shipping_value: string;
  total: string;
  sold_percentage: number;
  currency: string;
  note: string | null;
  supplier: {
    id: number;
    name: string;
  };
  investor: {
    id: number;
    name: string;
  };
};

export default function PurchasesPage({
  purchases,
  paginationLinks,
  filters = {},
  filterOptions = {},
  summary = {} // ✅ Receive summary data from backend
}: any) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const columns: ColumnDef<Purchase>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'supplier_invoice_number', header: 'Invoice No.' },
    {
      accessorKey: "purchase_date",
      header: "Purchase Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("purchase_date"));
        return formatDate(date.toISOString());
      },
    },
    {
      accessorKey: 'supplier.name',
      header: 'Supplier',
      cell: ({ row }) => row.original.supplier?.name ?? '—'
    },
    {
      accessorKey: 'investor.name',
      header: 'Investor',
      cell: ({ row }) => row.original.investor?.name ?? '—'
    },
    {
      accessorKey: "sold_percentage",
      header: "Sold %",
      cell: ({ row }) => {
        const value = row.original.sold_percentage ?? 0;

        let colorClass = "bg-green-600";
        if (value < 30) colorClass = "bg-red-500";
        else if (value < 70) colorClass = "bg-yellow-500";
        else if (value < 90) colorClass = "bg-amber-500";

        return (
          <div className="flex items-center gap-3 w-full">
            <div className="w-[60%] h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all rounded-full", colorClass)}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-muted-foreground min-w-[35px]">
              {value}%
            </span>
          </div>
        );
      },
    },
    { accessorKey: 'total', header: 'Total' },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const purchase = row.original;

        const handleDelete = () => {
          router.delete(route("purchases.destroy", { id: purchase.id }), {
            onSuccess: () => toast.success("Purchase deleted successfully!"),
            onError: () => toast.error("An error occurred."),
          });
        };

        const isDeleteDisabled = purchase.sold_percentage > 0;

        return (
          <div className="flex justify-center items-center">
            {/* View button */}
            <Button asChild variant="ghost" size="sm" className="mr-2">
              <Link href={route('purchases.show', purchase.id)}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>

            {/* Edit button */}
            <Button asChild variant="ghost" size="sm" className="mr-2">
              <Link href={route('purchases.edit', purchase.id)}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>

            {/* Delete button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleteDisabled}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete purchase #{purchase.id}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    }
  ];

  // Prepare filter options with safe defaults
  const supplierOptions = filterOptions?.suppliers?.map((supplier: any) => ({
    value: supplier.id.toString(),
    label: supplier.name
  })) || [];

  const investorOptions = filterOptions?.investors?.map((investor: any) => ({
    value: investor.id.toString(),
    label: investor.name
  })) || [];

  const currencyOptions = filterOptions?.currencies?.map((currency: string) => ({
    value: currency,
    label: currency
  })) || [];

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href={route('purchases.create')}>Create new Purchase</Link>
        </Button>
      }
    >
      <Head title="Purchases" />
      <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* ✅ Summary Cards - Shows aggregated data based on current filters */}
        <SummaryCard summary={summary} type="purchase" />


        <DataTable
          columns={columns}
          data={purchases.data}
          paginationLinks={paginationLinks}
          searchRoute="purchases"
          initialFilters={filters}
          filterChildren={
            <>
              <DateRangePickerFilter />

              <SelectFilter
                label="Supplier"
                filterKey="supplier_id"
                options={supplierOptions}
              />

              <SelectFilter
                label="Investor"
                filterKey="investor_id"
                options={investorOptions}
              />

              <RangeFilter
                label="Sold Percentage"
                filterKey="sold_percentage"
                minPlaceholder="Min %"
                maxPlaceholder="Max %"
                minValue={0}
                maxValue={100}
              />

              <RangeFilter
                label="Total Amount"
                filterKey="total"
                minPlaceholder="Min amount"
                maxPlaceholder="Max amount"
                minValue={0}
                maxValue={9999999999.99}
              />
            </>
          }
        />
      </div>
    </AppLayout>
  );
}
