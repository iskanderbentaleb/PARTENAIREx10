import { DataTable } from '../components/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { Trash, Edit, Printer, Calendar, X, Download, FileUp } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CreditCard, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DateRangePickerFilter } from './../components/filters/date-range-picker-filter';
import { format } from "date-fns";

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

type DateFilter = {
  startDate?: string;
  endDate?: string;
};

export default function SuppliersPage({ suppliers, paginationLinks, totals }: any) {
  const [dateFilters, setDateFilters] = useState<DateFilter>({});
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  function formatMoney(value: number | null | undefined) {
    const num = value ?? 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 2,
    }).format(num);
  }

  const updateDateFilter = (key: string, value: any) => {
    setDateFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePrintWithDateRange = (supplierId: number) => {
    const params = new URLSearchParams();

    if (dateFilters.startDate && dateFilters.endDate) {
      params.append('start_date', dateFilters.startDate);
      params.append('end_date', dateFilters.endDate);
    }

    window.open(`/suppliers/${supplierId}/print?${params.toString()}`, '_blank');
    setPrintDialogOpen(false);
    setDateFilters({});
  };

  const handlePrintAllTime = (supplierId: number) => {
    window.open(`/suppliers/${supplierId}/print`, '_blank');
    setPrintDialogOpen(false);
  };

    const getQuickRangeUrl = (supplierId: number, range: string) => {
    const params = new URLSearchParams();
    const now = new Date();

    const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    switch (range) {
        case 'last_week': {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.append('start_date', formatLocalDate(lastWeek));
        params.append('end_date', formatLocalDate(now));
        break;
        }

        case 'last_month': {
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            params.append('start_date', formatLocalDate(startOfThisMonth));
            params.append('end_date', formatLocalDate(endOfThisMonth));
            break;
        }


        case 'this_year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        params.append('start_date', formatLocalDate(startOfYear));
        params.append('end_date', formatLocalDate(endOfYear));
        break;
        }

        default:
        break;
    }

    window.open(`/suppliers/${supplierId}/print?${params.toString()}`, '_blank');
    setPrintDialogOpen(false);
    };


  const openPrintDialog = (supplierId: number) => {
    setSelectedSupplier(supplierId);
    setPrintDialogOpen(true);
  };

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

        let color = "text-green-600";
        if (debt > 0) {
          color = "text-red-600";
        } else if (debt < 0) {
          color = "text-orange-500";
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
        const hasPurchases = (supplier.purchases_sum_total ?? 0) > 0;

        const handleDelete = () => {
          if (hasPurchases) return;

          router.delete(route("suppliers.destroy", { id: supplier.id }), {
            onSuccess: () => toast.success("Supplier deleted successfully!"),
            onError: () => toast.error("An error occurred."),
          });
        };

        const handleExport = (supplierId: number) => {
            window.open(`/suppliers/${supplierId}/export`, '_blank');
        };

        return (
          <div className="flex justify-center items-center space-x-1">
            {/* Edit Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/suppliers/edit/${supplier.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit supplier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Print Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPrintDialog(supplier.id)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Print supplier report</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Export Button */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExport(supplier.id)}
                            >
                                <FileUp className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Export to Excel</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>


            {hasPurchases ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" disabled>
                      <Trash className="h-4 w-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cannot delete supplier with purchase history</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete supplier</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
          <Link href="/suppliers/create">Create new Supplier</Link>
        </Button>
      }
    >
      <Head title="Suppliers" />

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[100vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">
                Imprimer Rapport - {suppliers.data.find(s => s.id === selectedSupplier)?.name || ''}
              </DialogTitle>
            </div>
            <DialogDescription>
              Choisissez une période pour filtrer les transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Quick Range Buttons */}
            <div className="space-y-3">
              {/* <h4 className="text-sm font-medium text-gray-900">Périodes Rapides</h4> */}
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="h-11 justify-start"
                  onClick={() => selectedSupplier && getQuickRangeUrl(selectedSupplier, 'last_week')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Semaine Dernière
                </Button>
                <Button
                  variant="outline"
                  className="h-11 justify-start"
                  onClick={() => selectedSupplier && getQuickRangeUrl(selectedSupplier, 'last_month')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Mois Dernier
                </Button>
                <Button
                  variant="outline"
                  className="h-11 justify-start"
                  onClick={() => selectedSupplier && getQuickRangeUrl(selectedSupplier, 'this_year')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Cette Année
                </Button>
                <Button
                  variant="outline"
                  className="h-11 justify-start"
                  onClick={() => selectedSupplier && handlePrintAllTime(selectedSupplier)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Toute la Période
                </Button>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* Dashboard summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4">
        <Card className="shadow-sm border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-200">{formatMoney(totals.purchases)}</div>
            <p className="text-xs text-muted-foreground mt-1">All supplier purchases</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMoney(totals.payments)}</div>
            <p className="text-xs text-muted-foreground mt-1">Amount paid to suppliers</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debts</CardTitle>
            <FileText className={`h-4 w-4 ${
              totals.debts > 0 ? "text-red-600" : totals.debts < 0 ? "text-orange-500" : "text-green-600"
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totals.debts > 0 ? "text-red-600" : totals.debts < 0 ? "text-orange-500" : "text-green-600"
            }`}>
              {formatMoney(totals.debts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.debts > 0 ? "Outstanding balance" : totals.debts < 0 ? "Prepaid amount" : "All settled"}
            </p>
          </CardContent>
        </Card>
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
