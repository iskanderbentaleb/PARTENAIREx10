import { DataTable } from '../components/data-table';
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

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
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

export default function SupplierTransactionsPage({ transactions, paginationLinks }: any) {
  const columns: ColumnDef<SupplierTransaction>[] = [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'amount', header: 'Amount' },
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
          if (isLinkedToPurchase) return; // Prevent deletion if linked to purchase

          router.delete(route("supplier_transactions.destroy", { id: transaction.id }), {
            onSuccess: () => toast.success("Investor deleted successfully!"),
            onError: () => toast.error("An error occurred."),
          });
        };

        return (
          <div className="flex justify-center items-center space-x-1">
            {isLinkedToPurchase ? (
              // View only mode for transactions linked to purchases
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" disabled>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View only (linked to purchase)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              // Edit button - only show for transactions not linked to purchases
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
              // Disabled delete button with tooltip for linked transactions
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
              // Delete button - only show for transactions not linked to purchases
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
          <Link href="/supplier_transactions/create">Create new Transaction</Link>
        </Button>
      }
    >
      <Head title="Supplier Transactions" />
      <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <DataTable
          columns={columns}
          data={transactions.data}
          paginationLinks={paginationLinks}
          searchRoute="supplier_transactions" // ✅ Laravel route
        />
      </div>
    </AppLayout>
  );
}
