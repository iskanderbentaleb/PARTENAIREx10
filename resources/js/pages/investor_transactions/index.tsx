import { DataTable } from '../components/data-table';
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

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Investor Transactions', href: '/investor_transactions' },
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

export default function InvestorTransactionsPage({ transactions, paginationLinks }: any) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
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
    { accessorKey: 'amount', header: 'Amount' },
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
      accessorKey: 'actions',
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const transaction = row.original;
        const isLinked = transaction.purchase !== null || transaction.sale !== null;

        const handleDelete = () => {
          if (isLinked) return;

          router.delete(route("investor_transactions.destroy", { id: transaction.id }), {
            onSuccess: () => toast.success("Transaction deleted successfully!"),
            onError: () => toast.error("An error occurred."),
          });
        };

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
        <DataTable
          columns={columns}
          data={transactions.data}
          paginationLinks={paginationLinks}
          searchRoute="investor_transactions"
        />
      </div>
    </AppLayout>
  );
}
