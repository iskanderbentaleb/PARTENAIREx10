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
  { title: 'Investors', href: '/investors' },
];

// Investor type (based on Laravel model)
type Investor = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export default function InvestorsPage({ investors, paginationLinks }: any) {
  const columns: ColumnDef<Investor>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'available_balance', header: 'Available Balance' },
    { accessorKey: 'working_capital', header: 'Cash in Process' },
    { accessorKey: 'address', header: 'Address' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'notes', header: 'Notes' },
    {
      accessorKey: 'actions',
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const investor = row.original;

        const handleDelete = () => {
          router.delete(route("investors.destroy", { id: investor.id }), {
            onSuccess: () => toast.success("Investor deleted successfully!"),
            onError: () => toast.error("An error occurred."),
          });
        };

        return (
          <div className="flex justify-center items-center">
            <Button asChild variant="ghost" size="sm" className="mr-2">
              <Link href={`/investors/edit/${investor.id}`}>
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
                    Are you sure you want to delete {investor.name}? This action cannot be undone.
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
          <Link href="/investors/create">Create new Investor</Link>
        </Button>
      }
    >
      <Head title="Investors" />
      <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <DataTable
          columns={columns}
          data={investors.data}
          paginationLinks={paginationLinks}
          searchRoute="investors" // ✅ Route name from Laravel
        />
      </div>
    </AppLayout>
  );
}
