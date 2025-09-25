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

// Supplier type (based on Laravel model)
type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export default function SuppliersPage({ suppliers, paginationLinks }: any) {
  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'Debts', header: 'Total Payments' },
    { accessorKey: 'Debts', header: 'Debts' },
    // { accessorKey: 'Debts', header: 'Total Versement' },
    { accessorKey: 'address', header: 'Address' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'email', header: 'Email' },
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
      <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <DataTable
          columns={columns}
          data={suppliers.data}
          paginationLinks={paginationLinks}
          searchRoute="suppliers" // ✅ Route name from Laravel
        />
      </div>
    </AppLayout>
  );
}
