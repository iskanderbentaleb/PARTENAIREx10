import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, TrendingDown, CreditCard, BarChart3, FileText } from "lucide-react";

interface InvestorSummaryData {
  total_transactions?: number;
  total_investors?: number;
  total_invested?: number;
  total_withdrawn?: number;
  average_transaction?: number;
  [key: string]: number | undefined;
}

interface InvestorSummaryCardProps {
  summary: InvestorSummaryData;
}

export function InvestorSummaryCard({ summary }: InvestorSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Investor-specific card configurations
  const investorCardConfigs = {
    total_transactions: {
      title: "Total Transactions",
      icon: FileText,
      description: "All investor transactions",
      color: "text-blue-600",
      formatter: formatNumber
    },
    total_investors: {
      title: "Total Investors",
      icon: Users,
      description: "Number of investors",
      color: "text-green-600",
      formatter: formatNumber
    },
    total_invested: {
      title: "Total Invested",
      icon: TrendingUp,
      description: "Total investment amount",
      color: "text-green-600",
      formatter: formatCurrency
    },
    total_withdrawn: {
      title: "Total Withdrawn",
      icon: TrendingDown,
      description: "Total withdrawal amount",
      color: "text-orange-600",
      formatter: formatCurrency
    },
    average_transaction: {
      title: "Average Transaction",
      icon: CreditCard,
      description: "Average amount per transaction",
      color: "text-indigo-600",
      formatter: formatCurrency
    }
  };

  // Create cards based on available investor data
  const cards = Object.entries(summary)
    .filter(([key, value]) => value !== undefined && value !== null && investorCardConfigs[key as keyof typeof investorCardConfigs])
    .map(([key, value]) => {
      const config = investorCardConfigs[key as keyof typeof investorCardConfigs];
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
      // Custom sorting for investor transactions
      const order = ['total_transactions', 'total_investors' , 'total_invested', 'total_withdrawn', 'average_transaction'];
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
          No investor transaction data available
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
