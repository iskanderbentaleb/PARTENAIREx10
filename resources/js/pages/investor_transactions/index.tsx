import { useState } from 'react';
import { DataTable } from '../components/data-table';
import { InvestorSummaryCard } from '../components/investor-summary-card';
import { SelectFilter } from '../components/filters/select-filter';
import { RangeFilter } from '../components/filters/range-filter';
import { DateRangePickerFilter } from '../components/filters/date-range-picker-filter';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { Trash, Edit, Eye, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
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
import { PasswordConfirmModal } from '@/components/password-confirm-modal';

// Breadcrumbs
const breadcrumbs = [
  { title: 'Investor Transactions', href: '/investor-transactions' },
];

// InvestorTransaction type (based on Laravel model)
type InvestorTransaction = {
  id: number;
  date: string;
  type: "In" | "Out";
  amount: string;
  note: string;
  investor: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  purchase?: {
    id: number;
    supplier_invoice_number?: string;
  } | null;
  sale?: {
    id: number;
    invoice_number?: string;
  } | null;
};

interface InvestorTransactionsPageProps {
  transactions: {
    data: InvestorTransaction[];
  };
  paginationLinks: any[];
  filters?: Record<string, any>;
  filterOptions?: Record<string, any>;
  summary?: Record<string, any>;
}

export default function InvestorTransactionsPage({
  transactions,
  paginationLinks,
  filters = {},
  filterOptions = {},
  summary = {}
}: InvestorTransactionsPageProps) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    transactionId: number | null;
  }>({ isOpen: false, transactionId: null });

  const [isDeleting, setIsDeleting] = useState(false);

  // For date only (no time)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // For date + time (used in created_at and updated_at)
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const handleDeleteClick = (transactionId: number) => {
    setDeleteModal({ isOpen: true, transactionId });
  };

  const handleDeleteConfirm = (password: string) => {
    if (!deleteModal.transactionId) return;

    setIsDeleting(true);

    router.delete(route("investor_transactions.destroy", { id: deleteModal.transactionId }), {
      data: { password },
      onSuccess: () => {
        setDeleteModal({ isOpen: false, transactionId: null });
        toast.success("Transaction deleted successfully!");
      },
      onError: (errors) => {
        if (errors.password) {
          toast.error(errors.password);
        } else {
          toast.error("An error occurred while deleting the transaction.");
        }
      },
      onFinish: () => {
        setIsDeleting(false);
      },
    });
  };

  const columns: ColumnDef<InvestorTransaction>[] = [
    {
      accessorKey: "date",
      header: "Transaction Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return formatDate(date.toISOString());
      },
    },
    {
      accessorKey: "type",
      header: "Transaction Type",
      cell: ({ row }) => {
        const type = row.original.type;
        const isIn = type === "In";

        return (
          <div className="flex items-center gap-2">
            {isIn ? (
              <ArrowDownCircle className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowUpCircle className="h-5 w-5 text-red-600" />
            )}
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isIn
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isIn ? "In - دخول أموال للخزينة" : "Out - خروج أموال من الخزينة"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = parseFloat(row.original.amount);
        const isIn = row.original.type === "In";
        return (
          <div className={`font-medium ${isIn ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(row.original.amount)}
          </div>
        );
      }
    },
    { accessorKey: 'note', header: 'Note' },
    {
      accessorKey: 'investor',
      header: 'Investor',
      cell: ({ row }) => {
        const investor = row.original.investor;
        return (
          <div>
            <div className="font-medium">{investor?.name}</div>
            <div className="text-xs text-muted-foreground">
              {investor?.phone || ''} {investor?.email ? `| ${investor.email}` : ''}
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
      accessorKey: 'sale',
      header: 'Sale',
      cell: ({ row }) => {
        const sale = row.original.sale;
        return sale ? (
          <Link
            href={`/sales/${sale.id}`}
            className="text-blue-600 hover:underline"
          >
            #{sale.id} {sale.invoice_number ? `- ${sale.invoice_number}` : ''}
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Creation Date",
      cell: ({ row }) => formatDateTime(row.getValue("created_at")),
    },
    {
      accessorKey: "updated_at",
      header: "Update Date",
      cell: ({ row }) => {
        const createdAt = row.getValue("created_at");
        const updatedAt = row.getValue("updated_at");

        // Only show if different
        if (createdAt === updatedAt) return "—";

        return formatDateTime(updatedAt);
      },
    },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const transaction = row.original;
        const isLinked = transaction.purchase !== null || transaction.sale !== null;

        return (
          <div className="flex justify-center items-center space-x-1">
            {isLinked ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" disabled>
                      <Edit className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View only (linked to purchase/sale)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/investor_transactions/edit/${transaction.id}`}>
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

            {isLinked ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" disabled>
                      <Trash className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cannot delete (linked to purchase/sale)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(transaction.id)}
                  >
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
                    <AlertDialogAction
                      onClick={() => setDeleteModal({ isOpen: true, transactionId: transaction.id })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
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
  const investorOptions = filterOptions?.investors?.map((investor: any) => ({
    value: investor.id.toString(),
    label: investor.name
  })) || [];

  const transactionTypeOptions = [
    { value: 'In', label: 'In - دخول أموال' },
    { value: 'Out', label: 'Out - خروج أموال' }
  ];

  // Prepare investor-specific summary data
  const investorSummary = {
    total_transactions: summary.total_transactions || summary.total_count || transactions.data.length,
    total_investors: summary.total_investors || filterOptions?.investors?.length || 0,
    total_amount: summary.total_amount || summary.grand_total || summary.total_sum,
    total_invested: summary.total_invested || summary.investment_total,
    total_withdrawn: summary.total_withdrawn || summary.withdrawal_total,
    net_flow: summary.net_flow || summary.net_amount,
    average_transaction: summary.average_transaction || summary.avg_amount
  };

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/investor_transactions/create">Create new Transaction</Link>
        </Button>
      }
    >
      <Head title="Investor Transactions" />
      <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        {/* ✅ Investor Summary Card */}
        <InvestorSummaryCard summary={investorSummary} />

        <DataTable
          columns={columns}
          data={transactions.data}
          paginationLinks={paginationLinks}
          searchRoute="investor_transactions"
          searchPlaceholder="Search transactions, investors, notes..."
          initialFilters={filters}
          filterChildren={
            <>
              <DateRangePickerFilter />

              <SelectFilter
                label="Investor"
                filterKey="investor_id"
                options={investorOptions}
              />

              <SelectFilter
                label="Transaction Type"
                filterKey="type"
                options={transactionTypeOptions}
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

        {/* Password Confirmation Modal for Delete */}
        <PasswordConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, transactionId: null })}
          onConfirm={handleDeleteConfirm}
          action="delete"
          isLoading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
