import { DataTable } from '../components/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { Trash, Edit } from "lucide-react";
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

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Suppliers', href: '/suppliers' },
];

// Supplier type
type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  purchases_sum_total?: number;
  transactions_sum_amount?: number;
  total_debt?: number;
};

export default function SuppliersPage({ suppliers, paginationLinks, totals }: any) {

  function formatMoney(value: number | null | undefined) {
    const num = value ?? 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "DZD", // Change if needed
      minimumFractionDigits: 2,
    }).format(num);
  }

  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: "purchases_sum_total",
      header: "Total Purchase Amount",
      cell: ({ row }) => (
        <span className="font-medium text-gray-950 dark:text-gray-200">
          {formatMoney(row.original.purchases_sum_total)}
        </span>
      ),
    },
    {
      accessorKey: "dash",
      header: "-",
      cell: () => <span className="text-gray-500 font-bold">-</span>,
      enableSorting: false,
    },
    {
      accessorKey: "transactions_sum_amount",
      header: "Total Payments",
      cell: ({ row }) => (
        <span className="font-medium text-green-600">
          {formatMoney(row.original.transactions_sum_amount)}
        </span>
      ),
    },
    {
      accessorKey: "equal",
      header: "=",
      cell: () => <span className="text-gray-500 font-bold">=</span>,
      enableSorting: false,
    },
    {
      accessorKey: "total_debt",
      header: "Total Debt",
      cell: ({ row }) => {
        const debt = row.original.total_debt ?? 0;

        let color = "text-green-600"; // default balanced
        if (debt > 0) {
          color = "text-red-600"; // owes
        } else if (debt < 0) {
          color = "text-orange-500"; // prepaid
        }

        return (
          <span className={`font-bold ${color}`}>
            {formatMoney(debt)}
          </span>
        );
      },
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'address', header: 'Address' },
    { accessorKey: 'notes', header: 'Notes' },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const supplier = row.original;

        const handleDelete = () => {
          router.delete(route("suppliers.destroy", { id: supplier.id }), {
            onSuccess: () => toast.success("Supplier deleted successfully!"),
            onError: () => toast.error("An error occurred."),
          });
        };

        return (
          <div className="flex justify-center items-center">
            <Button asChild variant="ghost" size="sm" className="mr-2">
              <Link href={`/suppliers/edit/${supplier.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
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
                    Are you sure you want to delete {supplier.name}? This action cannot be undone.
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
    },
  ];

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/suppliers/create">Create new Supplier</Link>
        </Button>
      }
    >
      <Head title="Suppliers" />

      {/* Dashboard summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4">
        <div className="p-4 rounded-xl shadow bg-gray-100 dark:bg-zinc-900 ">
          <h4 className="text-sm font-medium text-gray-500">Total Purchases</h4>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-200">{formatMoney(totals.purchases)}</p>
        </div>
        <div className="p-4 rounded-xl shadow bg-gray-100 dark:bg-zinc-900">
          <h4 className="text-sm font-medium text-gray-500">Total Payments</h4>
          <p className="text-lg font-bold text-green-600">{formatMoney(totals.payments)}</p>
        </div>
        <div className="p-4 rounded-xl shadow bg-gray-100 dark:bg-zinc-900">
          <h4 className="text-sm font-medium text-gray-500">Total Debts</h4>
          <p className={`text-lg font-bold ${
            totals.debts > 0 ? "text-red-600" : totals.debts < 0 ? "text-orange-500" : "text-green-600"
          }`}>
            {formatMoney(totals.debts)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <DataTable
          columns={columns}
          data={suppliers.data}
          paginationLinks={paginationLinks}
          searchRoute="suppliers"
        />
      </div>
    </AppLayout>
  );
}
