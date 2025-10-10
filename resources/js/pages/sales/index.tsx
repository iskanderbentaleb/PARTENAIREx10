import { DataTable } from '../components/data-table';
import { SummaryCard } from '../components/summary-card';
import { SelectFilter } from '../components/filters/select-filter';
import { RangeFilter } from '../components/filters/range-filter';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { Trash, Edit, Eye } from "lucide-react";


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

interface BreadcrumbItem {
  title: string;
  href: string;
}

// Sale type (based on Laravel model + relations)
type Sale = {
  id: number;
  invoice_number: string | null;
  sale_date: string;
  subtotal: string;
  discount_reason: string | null;
  discount_value: string;
  total: string;
  currency: string;
  note: string | null;
  investor: {
    id: number;
    name: string;
  } | null;
  user: {
    id: number;
    name: string;
  } | null;
};

interface SalesPageProps {
  sales: {
    data: Sale[];
  };
  paginationLinks: any[];
  filters?: Record<string, any>;
  filterOptions?: Record<string, any>;
  summary?: Record<string, any>;
}

export default function SalesPage({
  sales,
  paginationLinks,
  filters = {},
  filterOptions = {},
  summary = {}
}: SalesPageProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <div className="">{row.original.id}</div>
    },
    {
      accessorKey: 'invoice_number',
      header: 'Invoice No.',
      cell: ({ row }) => row.original.invoice_number || '—'
    },
    {
      accessorKey: "sale_date",
      header: "Sale Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("sale_date"));
        return formatDate(date.toISOString());
      },
    },
    {
      accessorKey: 'investor.name',
      header: 'Investor',
      cell: ({ row }) => row.original.investor?.name ?? '—'
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      cell: ({ row }) => {
        const subtotal = parseFloat(row.original.subtotal);
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.original.currency || 'USD',
        }).format(subtotal);
      }
    },
    {
      accessorKey: 'discount_value',
      header: 'Discount',
      cell: ({ row }) => {
        const discount = parseFloat(row.original.discount_value);
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.original.currency || 'USD',
        }).format(discount);
      }
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const total = parseFloat(row.original.total);
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row.original.currency || 'USD',
        }).format(total);
      }
    },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const sale = row.original;

        const handleDelete = () => {
          router.delete(route("sales.destroy", { id: sale.id }), {
            onSuccess: () => toast.success("Sale deleted successfully!"),
            onError: () => toast.error("An error occurred while deleting the sale."),
          });
        };

        return (
          <div className="flex justify-center items-center space-x-1">
            <Button asChild variant="ghost" size="sm">
              <Link href={route('sales.show', sale.id)}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={route('sales.edit', sale.id)}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete sale #{sale.id}?
                    {sale.invoice_number && ` (Invoice: ${sale.invoice_number})`}
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground text-white hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  // Prepare filter options with safe defaults
  const investorOptions = filterOptions?.investors?.map((investor: any) => ({
    value: investor.id.toString(),
    label: investor.name
  })) || [];

  const currencyOptions = filterOptions?.currencies?.map((currency: string) => ({
    value: currency,
    label: currency
  })) || [];

  // Breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sales', href: '/sales' },
  ];

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href='sales/create'>Create New Sale</Link>
        </Button>
      }
    >
      <Head title="Sales" />

      <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* ✅ Summary Cards - Shows aggregated data based on current filters */}
        {/* <SummaryCard summary={summary} /> */}
        <SummaryCard summary={summary} type="sale" />


        <DataTable
          columns={columns}
          data={sales.data}
          paginationLinks={paginationLinks}
          searchRoute="sales"
          searchPlaceholder="Search sales, investors, products..."
          initialFilters={filters}
          filterChildren={
            <>
              <DateRangePickerFilter />

              <SelectFilter
                label="Investor"
                filterKey="investor_id"
                options={investorOptions}
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
