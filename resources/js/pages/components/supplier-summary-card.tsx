import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, DollarSign, CreditCard, TrendingUp, Package } from "lucide-react";

interface SupplierSummaryData {
  total_transactions?: number;
  total_suppliers?: number;
  total_amount?: number;
  pending_payments?: number;
  completed_transactions?: number;
  average_transaction?: number;
  [key: string]: number | undefined;
}

interface SupplierSummaryCardProps {
  summary: SupplierSummaryData;
}

export function SupplierSummaryCard({ summary }: SupplierSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Supplier-specific card configurations
  const supplierCardConfigs = {
    total_transactions: {
      title: "Total Transactions",
      icon: FileText,
      description: "All supplier transactions",
      color: "text-blue-600",
      formatter: formatNumber
    },
    total_suppliers: {
      title: "Total Suppliers",
      icon: Users,
      description: "Number of suppliers",
      color: "text-green-600",
      formatter: formatNumber
    },
    total_amount: {
      title: "Total Amount",
      icon: DollarSign,
      description: "Sum of all transactions",
      color: "text-purple-600",
      formatter: formatCurrency
    },
    pending_payments: {
      title: "Pending Payments",
      icon: CreditCard,
      description: "Awaiting processing",
      color: "text-orange-600",
      formatter: formatCurrency
    },
    completed_transactions: {
      title: "Completed",
      icon: TrendingUp,
      description: "Successful transactions",
      color: "text-green-600",
      formatter: formatNumber
    },
    average_transaction: {
      title: "Average Transaction",
      icon: Package,
      description: "Average amount per transaction",
      color: "text-cyan-600",
      formatter: formatCurrency
    }
  };

  // Create cards based on available supplier data
  const cards = Object.entries(summary)
    .filter(([key, value]) => value !== undefined && value !== null && supplierCardConfigs[key as keyof typeof supplierCardConfigs])
    .map(([key, value]) => {
      const config = supplierCardConfigs[key as keyof typeof supplierCardConfigs];
      return {
        key,
        title: config.title,
        value: config.formatter(value as number),
        icon: config.icon,
        description: config.description,
        color: config.color
      };
    })
    .sort((a, b) => {
      // Custom sorting for supplier transactions
      const order = ['total_transactions', 'total_suppliers', 'total_amount', 'pending_payments', 'completed_transactions', 'average_transaction'];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });

  // Responsive grid
  const getGridClass = (count: number) => {
    if (count === 1) return 'lg:grid-cols-1';
    if (count <= 2) return 'lg:grid-cols-2';
    if (count <= 3) return 'lg:grid-cols-3';
    return 'lg:grid-cols-4';
  };

  const gridClass = getGridClass(cards.length);

  if (cards.length === 0) {
    return (
      <div className="mb-6 p-4 border rounded-lg bg-muted/50">
        <p className="text-center text-muted-foreground">
          No supplier transaction data available
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridClass} gap-4`}>
        {cards.map((card) => (
          <Card key={card.key} className="shadow-sm border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
