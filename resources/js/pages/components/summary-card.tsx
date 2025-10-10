import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  DollarSign,
  Truck,
  Percent,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  BarChart3,
  Users,
  FileText
} from "lucide-react";

interface SummaryData {
  [key: string]: number | undefined;
}

interface SummaryCardProps {
  summary: SummaryData;
}

export function SummaryCard({ summary }: SummaryCardProps) {
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

  // Define all possible card configurations
  const cardConfigs = {
    total_purchases: {
      title: "Total Purchases",
      icon: ShoppingCart,
      description: "Number of purchases",
      color: "text-blue-600",
      formatter: formatNumber
    },
    total_sales: {
      title: "Total Sales",
      icon: CreditCard,
      description: "Number of sales",
      color: "text-blue-600",
      formatter: formatNumber
    },
    total_subtotal: {
      title: "Subtotal",
      icon: Package,
      description: "Sum of all subtotals",
      color: "text-green-600",
      formatter: formatCurrency
    },
    total_discount: {
      title: "Total Discount",
      icon: Percent,
      description: "Total discounts applied",
      color: "text-orange-600",
      formatter: formatCurrency
    },
    total_shipping: {
      title: "Shipping Cost",
      icon: Truck,
      description: "Total shipping costs",
      color: "text-purple-600",
      formatter: formatCurrency
    },
    grand_total: {
      title: "Grand Total",
      icon: DollarSign,
      description: "Final total amount",
      color: "text-red-600",
      formatter: formatCurrency
    },
    // Add more as needed
    total_investors: {
      title: "Total Investors",
      icon: Users,
      description: "Number of investors",
      color: "text-indigo-600",
      formatter: formatNumber
    },
    total_items: {
      title: "Total Items",
      icon: FileText,
      description: "Number of items",
      color: "text-cyan-600",
      formatter: formatNumber
    }
  };

  // Create cards based on available data
  const cards = Object.entries(summary)
    .filter(([key, value]) => value !== undefined && value !== null && cardConfigs[key as keyof typeof cardConfigs])
    .map(([key, value]) => {
      const config = cardConfigs[key as keyof typeof cardConfigs];
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
      // Optional: Define custom sorting order
      const order = ['total_purchases', 'total_sales', 'total_subtotal', 'total_discount', 'total_shipping', 'grand_total'];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });

  // Responsive grid based on number of cards
  const getGridClass = (count: number) => {
    if (count <= 2) return 'lg:grid-cols-2';
    if (count <= 4) return 'lg:grid-cols-4';
    return 'lg:grid-cols-5';
  };

  const gridClass = getGridClass(cards.length);

  if (cards.length === 0) {
    return null; // Don't render anything if no summary data
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridClass} gap-4 mb-6`}>
      {cards.map((card, index) => (
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
  );
}
