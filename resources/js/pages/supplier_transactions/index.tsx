import { DataTable } from '../components/data-table';
import { SupplierSummaryCard } from '../components/supplier-summary-card'; // Updated import
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DateRangePickerFilter } from '../components/filters/date-range-picker-filter';

// Breadcrumbs
const breadcrumbs = [
  { title: 'Supplier Transactions', href: '/supplier-transactions' },
];

// SupplierTransaction type (based on Laravel model)
type SupplierTransaction = {
  id: number;
  date: string;
  amount: string;
  note: string;
  supplier: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  purchase?: {
    id: number;
    supplier_invoice_number?: string;
  } | null;
};

interface SupplierTransactionsPageProps {
  transactions: {
    data: SupplierTransaction[];
  };
  paginationLinks: any[];
  filters?: Record<string, any>;
  filterOptions?: Record<string, any>;
  summary?: Record<string, any>;
}

export default function SupplierTransactionsPage({
  transactions,
  paginationLinks,
  filters = {},
  filterOptions = {},
  summary = {}
}: SupplierTransactionsPageProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const columns: ColumnDef<SupplierTransaction>[] = [
    {
      accessorKey: "date",
      header: "Transaction Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return formatDate(date.toISOString());
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.original.amount)
    },
    { accessorKey: 'note', header: 'Note' },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => {
        const supplier = row.original.supplier;
        return (
          <div>
            <div className="font-medium">{supplier?.name}</div>
            <div className="text-xs text-muted-foreground">
              {supplier?.phone || ''} {supplier?.email ? `| ${supplier.email}` : ''}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'purchase',
      header: 'Purchase',
      cell: ({ row }) => {
        const purchase = row.original.purchase;
        return purchase ? (
          <Link
            href={`/purchases/view/${purchase.id}`}
            className="text-blue-600 hover:underline"
          >
            #{purchase.id} {purchase.supplier_invoice_number ? `- ${purchase.supplier_invoice_number}` : ''}
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const transaction = row.original;
        const isLinkedToPurchase = transaction.purchase !== null;

        const handleDelete = () => {
          if (isLinkedToPurchase) return;

          router.delete(route("supplier_transactions.destroy", { id: transaction.id }), {
            onSuccess: () => toast.success("Transaction deleted successfully!"),
            onError: () => toast.error("An error occurred."),
          });
        };

        return (
          <div className="flex justify-center items-center space-x-1">
            {isLinkedToPurchase ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" disabled>
                      <Edit className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View only (linked to purchase)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/supplier_transactions/edit/${transaction.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit transaction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {isLinkedToPurchase ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" disabled>
                      <Trash className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cannot delete (linked to purchase)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Trash className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this transaction? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      },
    },
  ];

  // Prepare filter options with safe defaults
  const supplierOptions = filterOptions?.suppliers?.map((supplier: any) => ({
    value: supplier.id.toString(),
    label: supplier.name
  })) || [];

  // Prepare supplier-specific summary data
  const supplierSummary = {
    total_transactions: summary.total_transactions || summary.total_count || transactions.data.length,
    total_suppliers: summary.total_suppliers || filterOptions?.suppliers?.length || 0,
    total_amount: summary.total_amount || summary.grand_total || summary.total_sum,
    pending_payments: summary.pending_payments || summary.pending_amount,
    completed_transactions: summary.completed_transactions || summary.completed_count,
    average_transaction: summary.average_transaction || summary.avg_amount
  };

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/supplier_transactions/create">Create new Transaction</Link>
        </Button>
      }
    >
      <Head title="Supplier Transactions" />
      <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* ✅ Supplier-Specific Summary Cards */}
        <SupplierSummaryCard summary={supplierSummary} />

        <DataTable
          columns={columns}
          data={transactions.data}
          paginationLinks={paginationLinks}
          searchRoute="supplier_transactions"
          searchPlaceholder="Search transactions, suppliers, notes..."
          initialFilters={filters}
          filterChildren={
            <>
              <DateRangePickerFilter />

              <SelectFilter
                label="Supplier"
                filterKey="supplier_id"
                options={supplierOptions}
              />

              <RangeFilter
                label="Transaction Amount"
                filterKey="amount"
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
