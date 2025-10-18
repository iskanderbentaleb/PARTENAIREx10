import { DataTable } from '../components/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { Trash, Edit, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  total_capital: number;
  available_cash: number;
  cash_in_process: number;
  profit?: number;
};

type Totals = {
  totalCapital: number;
  availableCash: number;
  cashInProcess: number;
  profit: number;
  totalInvested: number;
  totalWithdrawn: number;
};

// Format money function
const formatMoney = (amount: number, currency: string = 'DZD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Color-coded amount component with dark mode
const MoneyAmount = ({ amount, showIcon = false }: { amount: number; showIcon?: boolean }) => {
  const isPositive = amount >= 0;
  const isZero = amount === 0;

  return (
    <div className={`flex items-center gap-1 font-medium ${
      isZero
        ? 'text-gray-600 dark:text-gray-400'
        : isPositive
          ? 'text-green-600 dark:text-green-500'
          : 'text-red-600 dark:text-red-500'
    }`}>
      {showIcon && !isZero && (
        isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
      )}
      <span>{formatMoney(Math.abs(amount))}</span>
    </div>
  );
};

// Capital badge with status and dark mode
const CapitalBadge = ({ amount }: { amount: number }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

  if (amount > 10000) variant = "default";
  else if (amount > 5000) variant = "secondary";
  else if (amount === 0) variant = "outline";

  return (
    <Badge variant={variant} className="font-mono text-xs">
      {/* <DollarSign className="h-3 w-3 mr-1" /> */}
      {formatMoney(amount)}
    </Badge>
  );
};

// Cash status indicator with dark mode
const CashStatus = ({ available, inProcess }: { available: number; inProcess: number }) => {
  const total = available + inProcess;
  const availablePercentage = total > 0 ? (available / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="flex justify-between text-xs">
        <span className="text-green-600 dark:text-green-500 font-medium">{formatMoney(available)}</span>
        <span className="text-blue-600 dark:text-blue-500 font-medium">{formatMoney(inProcess)}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-green-500 dark:bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${availablePercentage}%` }}
        />
      </div>
    </div>
  );
};

interface InvestorsPageProps {
  investors: any;
  paginationLinks: any;
  search?: string;
  totals: Totals;
}

export default function InvestorsPage({ investors, paginationLinks, totals }: InvestorsPageProps) {
  const columns: ColumnDef<Investor>[] = [
    {
      accessorKey: 'name',
      header: 'Investor',
      cell: ({ row }) => (
        <div className="font-semibold text-gray-900 dark:text-gray-100">{row.getValue('name')}</div>
      )
    },
    {
      accessorKey: 'total_capital',
      header: 'Total Capital',
      cell: ({ row }) => {
        const amount = row.getValue('total_capital') as number;
        return <CapitalBadge amount={amount} />;
      }
    },
    {
      accessorKey: 'available_cash',
      header: 'Available Cash',
      cell: ({ row }) => {
        const amount = row.getValue('available_cash') as number;
        return <MoneyAmount amount={amount} showIcon />;
      }
    },
    {
      accessorKey: 'cash_in_process',
      header: 'In Process',
      cell: ({ row }) => {
        const amount = row.getValue('cash_in_process') as number;
        return (
          <div className="text-blue-600 dark:text-blue-500 font-medium">
            {formatMoney(amount)}
          </div>
        );
      }
    },
    {
      id: 'cash_status',
      header: 'Cash Status',
      cell: ({ row }) => {
        const available = row.getValue('available_cash') as number;
        const inProcess = row.getValue('cash_in_process') as number;
        return <CashStatus available={available} inProcess={inProcess} />;
      }
    },
    {
      accessorKey: 'profit',
      header: 'Profit/Loss',
      cell: ({ row }) => {
        const profit = row.getValue('profit') as number;
        return <MoneyAmount amount={profit} showIcon />;
      }
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string;
        return phone ? (
          <a
            href={`tel:${phone}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
          >
            {phone}
          </a>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
        );
      }
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string;
        return email ? (
          <a
            href={`mailto:${email}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
          >
            {email}
          </a>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
        );
      }
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => {
        const address = row.getValue('address') as string;
        return address ? (
          <div
            className="text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate"
            title={address}
          >
            {address}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
        );
      }
    },
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
          <div className="flex justify-center items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link href={`/investors/edit/${investor.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                    disabled={
                    (investor.profit ?? 0) !== 0 || (investor.total_capital ?? 0) !== 0
                    }
                    title={
                    (investor.profit ?? 0) !== 0 || (investor.total_capital ?? 0) !== 0
                        ? "Cannot delete investor with active profit/loss or capital"
                        : "Delete investor"
                    }
                >
                    <Trash className="h-4 w-4" />
                </Button>
                </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{investor.name}</strong>?
                    This will also delete all associated transactions, purchases, and sales.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  >
                    Delete Investor
                  </AlertDialogAction>
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
        <Button asChild variant="default" size="sm">
          <Link href="/investors/create" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Create Investor
          </Link>
        </Button>
      }
    >
      <Head title="Investors" />


        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4">
        {/* Total Capital Card */}
        <Card className="shadow-sm border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capital</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatMoney(totals.totalCapital)}</div>
            <p className="text-xs text-muted-foreground mt-1">Available + In Process</p>
            </CardContent>
        </Card>

        {/* Available Cash Card */}
        <Card className="shadow-sm border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
            </div>
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatMoney(totals.availableCash)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to use</p>
            </CardContent>
        </Card>

        {/* Cash in Process Card */}
        <Card className="shadow-sm border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Process</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </div>
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{formatMoney(totals.cashInProcess)}</div>
            <p className="text-xs text-muted-foreground mt-1">Inventory value</p>
            </CardContent>
        </Card>

        {/* Total Profit Card */}
        <Card className="shadow-sm border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <div className={`p-2 rounded-full ${
                totals.profit >= 0
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
                {totals.profit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
                ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                )}
            </div>
            </CardHeader>
            <CardContent>
            <div className={`text-2xl font-bold ${
                totals.profit >= 0
                ? 'text-green-600 dark:text-green-500'
                : 'text-red-600 dark:text-red-500'
            }`}>
                {formatMoney(totals.profit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sales - Cost of goods</p>
            </CardContent>
        </Card>
        </div>

        <div className="flex flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
            <DataTable
            columns={columns}
            data={investors.data}
            paginationLinks={paginationLinks}
            searchRoute="investors"
            />
        </div>
    </AppLayout>
  );
}
