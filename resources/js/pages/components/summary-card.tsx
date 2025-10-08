import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Truck, Percent, ShoppingCart } from "lucide-react";

interface SummaryData {
  total_purchases: number;
  total_subtotal: number;
  total_discount: number;
  total_shipping: number;
  grand_total: number;
}

interface SummaryCardProps {
  summary: SummaryData;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD', // You can make this dynamic based on your data
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Purchases",
      value: summary.total_purchases.toString(),
      icon: ShoppingCart,
      description: "Number of purchases",
      color: "text-blue-600"
    },
    {
      title: "Subtotal",
      value: formatCurrency(summary.total_subtotal),
      icon: Package,
      description: "Sum of all subtotals",
      color: "text-green-600"
    },
    {
      title: "Total Discount",
      value: formatCurrency(summary.total_discount),
      icon: Percent,
      description: "Total discounts applied",
      color: "text-orange-600"
    },
    {
      title: "Shipping Cost",
      value: formatCurrency(summary.total_shipping),
      icon: Truck,
      description: "Total shipping costs",
      color: "text-purple-600"
    },
    {
      title: "Grand Total",
      value: formatCurrency(summary.grand_total),
      icon: DollarSign,
      description: "Final total amount",
      color: "text-red-600"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
