import AppLayout from "@/layouts/app-layout";
import { Head, Link } from "@inertiajs/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, User, Calendar, Tag, ShoppingCart, DollarSign, Copy, Package, Clock, BarChart3, Percent, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BreadcrumbItem = {
  title: string;
  href: string;
};

interface Investor {
  id: number;
  name: string;
}

interface PurchaseItem {
  id: number;
  product_name: string;
  barcode_prinsipal: string;
  barcode_generated: string;
  unit_price: number;
  unit_price_with_discount: number;
  quantity: number;
  quantity_selled: number;
  subtotal: number;
  sale_price: number;
  purchase_id: number;
  created_at: string;
  updated_at: string;
  sold_percentage: number;
}

interface SaleItem {
  id: number;
  purchase_item_id: number;
  quantity: number;
  sale_price: number;
  subtotal: number;
  purchase_item?: PurchaseItem;
  purchaseItem?: PurchaseItem;
}

interface Sale {
  id: number;
  invoice_number: string;
  sale_date: string;
  subtotal: number;
  discount_reason: string;
  discount_value: number;
  total: number;
  currency: string;
  note: string;
  created_at: string;
  updated_at: string;
  investor: Investor;
  items: SaleItem[];
  total_items?: number;
}

interface Props {
  sale: Sale;
}

export default function SalesViewPage({ sale }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Sales", href: "/sales" },
    { title: `View #${sale.id}`, href: `/sales/${sale.id}` },
  ];

  // Process numeric values
  const processedSale = {
    ...sale,
    subtotal: Number(sale.subtotal),
    discount_value: Number(sale.discount_value),
    total: Number(sale.total),
    items: sale.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      sale_price: Number(item.sale_price),
      subtotal: Number(item.subtotal),
    })),
  };

  const formatCurrency = (value: number) => {
    return `${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)} ${processedSale.currency}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      full: date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(`"${text}" copied to clipboard!`);
      })
      .catch(() => {
        toast.error("Failed to copy text. Please try again.");
      });
  };

  // Safe data access function
  const getPurchaseItemData = (item: SaleItem) => {
    const purchaseItem = item.purchaseItem || item.purchase_item;

    if (!purchaseItem) {
      console.warn('No purchase item found for sale item:', item.id);
      return {
        product_name: 'Unknown Product',
        barcode_prinsipal: 'N/A',
        barcode_generated: 'N/A',
        unit_price: 0,
        unit_price_with_discount: 0
      };
    }

    return {
      ...purchaseItem,
      unit_price: Number(purchaseItem.unit_price),
      unit_price_with_discount: Number(purchaseItem.unit_price_with_discount || purchaseItem.unit_price)
    };
  };

  // Calculate profit information with both original and final costs
  const getProfitInfo = (item: SaleItem) => {
    const purchaseItem = getPurchaseItemData(item);
    const originalCost = purchaseItem.unit_price;
    const finalCost = purchaseItem.unit_price_with_discount;
    const salePrice = item.sale_price;

    const hasDiscount = originalCost !== finalCost;
    const discountPerUnit = originalCost - finalCost;
    const discountPercentage = originalCost > 0 ? (discountPerUnit / originalCost) * 100 : 0;

    const profitPerUnit = salePrice - finalCost;
    const profitPercentage = finalCost > 0 ? (profitPerUnit / finalCost) * 100 : 0;

    return {
      originalCost,
      finalCost,
      salePrice,
      hasDiscount,
      discountPerUnit,
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      profitPerUnit,
      profitPercentage: Math.round(profitPercentage * 100) / 100,
      totalProfit: profitPerUnit * item.quantity
    };
  };

  // Calculate totals
  const totalQuantity = processedSale.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalProducts = processedSale.items.length;
  const totalProfit = processedSale.items.reduce((sum, item) => {
    const profitInfo = getProfitInfo(item);
    return sum + profitInfo.totalProfit;
  }, 0);

  // Format dates
  const createdDateTime = formatDateTime(processedSale.created_at);
  const updatedDateTime = formatDateTime(processedSale.updated_at);
  const saleDateTime = formatDateTime(processedSale.sale_date);

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/sales">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales
          </Link>
        </Button>
      }
    >
      <Head title={`Sale #${processedSale.id}`} />

      <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page header */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sale Details</h1>
              <p className="text-muted-foreground mt-1">
                Overview of sale information and transaction details
              </p>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full self-start sm:self-auto">
              #{processedSale.id}
            </span>
          </div>
        </div>

        {/* Profit Summary */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Profit Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(processedSale.total)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium text-muted-foreground mb-1">Items Sold</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalQuantity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sale Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Sale Information</CardTitle>
            <CardDescription>Basic details of this sale transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm">Investor</Label>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{processedSale.investor.name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Invoice Number</Label>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{processedSale.invoice_number || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Sale Date & Time</Label>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{saleDateTime.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Sale Items</CardTitle>
            <CardDescription>Products sold in this transaction</CardDescription>
          </CardHeader>

          <CardContent className="text-sm">
            <div className="rounded-lg border overflow-x-auto">
              {/* Enhanced Header */}
              <div className="grid grid-cols-16 gap-3 p-3 font-semibold border-b text-xs
                              bg-muted/50 dark:bg-muted/20 text-muted-foreground dark:text-gray-300 min-w-[1400px]">
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Barcode / Ref</div>
                <div className="col-span-2">Generated Barcode</div>
                <div className="col-span-1 text-center">Qty Sold</div>

                {/* Enhanced Pricing Header - Reduced Height */}
                <div className="col-span-4 text-center">
                    <span className="font-bold text-xs">Pricing & Profit Analysis</span>
                </div>

                <div className="col-span-2 text-center">Sale Subtotal</div>
                <div className="col-span-2 text-center">Profit Subtotal</div>
              </div>

              {processedSale.items.map((item, index) => {
                const purchaseItem = getPurchaseItemData(item);
                const profitInfo = getProfitInfo(item);
                const hasProfit = profitInfo.profitPerUnit > 0;
                const hasDiscount = profitInfo.hasDiscount;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-16 gap-3 p-3 border-b last:border-b-0 items-center hover:bg-muted/10 transition-colors min-w-[1400px]"
                  >
                    <div className="col-span-3 font-medium">
                      <p className="line-clamp-2">{purchaseItem.product_name}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs line-clamp-2">
                        {purchaseItem.barcode_prinsipal || "N/A"}
                      </p>
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      {purchaseItem.barcode_generated && purchaseItem.barcode_generated !== "N/A" && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => copyToClipboard(purchaseItem.barcode_generated)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      <p className="text-muted-foreground text-xs line-clamp-2 flex-1">
                        {purchaseItem.barcode_generated || "N/A"}
                      </p>
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                        {item.quantity}
                      </span>
                    </div>

                    {/* Enhanced Pricing Column - Reduced Height */}
                    <div className="col-span-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Original Cost */}
                        <div className={cn(
                          "border rounded-md p-2 transition-all duration-200",
                          hasDiscount
                            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400">
                              Original
                            </span>
                            {!hasDiscount && (
                              <Tag className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <p className={cn(
                            "font-bold text-xs",
                            hasDiscount
                              ? "text-red-600 dark:text-red-400 line-through"
                              : "text-green-600 dark:text-green-400"
                          )}>
                            {formatCurrency(profitInfo.originalCost)}
                          </p>
                          <p className="text-[9px] text-red-500 dark:text-red-400">
                            per unit
                          </p>
                        </div>

                        {/* Final Cost */}
                        <div className={cn(
                          "border rounded-md p-2 transition-all duration-200",
                          hasDiscount
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60"
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400">
                              Final
                            </span>
                            {hasDiscount && (
                              <Percent className="h-3 w-3 text-emerald-600" />
                            )}
                          </div>
                          <p className={cn(
                            "font-bold text-xs",
                            hasDiscount
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-600 dark:text-gray-400"
                          )}>
                            {formatCurrency(profitInfo.finalCost)}
                          </p>
                          <p className="text-[9px] text-emerald-500 dark:text-emerald-400">
                            per unit
                          </p>
                        </div>
                      </div>

                      {/* Discount Details - Smaller */}
                      {hasDiscount && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-700 rounded-md p-2">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="font-medium text-amber-700 dark:text-amber-300">
                              Purchase Discount
                            </span>
                            <div className="text-right">
                              <div className="font-bold text-amber-700 dark:text-amber-300">
                                -{formatCurrency(profitInfo.discountPerUnit)}
                              </div>
                              <div className="text-amber-600 dark:text-amber-400">
                                ({profitInfo.discountPercentage}%)
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {/* Sale Price */}
                        <div className="border rounded-md p-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400">
                              Sale
                            </span>
                            <DollarSign className="h-3 w-3 text-blue-600" />
                          </div>
                          <p className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {formatCurrency(item.sale_price)}
                          </p>
                          <p className="text-[9px] text-blue-500 dark:text-blue-400">
                            per unit
                          </p>
                        </div>

                        {/* Profit */}
                        <div className={cn(
                          "border rounded-md p-2 transition-all duration-200",
                          hasProfit
                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400">
                              Profit
                            </span>
                            {hasProfit && (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <p className={cn(
                            "font-bold text-xs",
                            hasProfit
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          )}>
                            {formatCurrency(profitInfo.profitPerUnit)}
                          </p>
                          <p className={cn(
                            "text-[9px]",
                            hasProfit
                              ? "text-green-500 dark:text-green-400"
                              : "text-gray-500 dark:text-gray-400"
                          )}>
                            {profitInfo.profitPercentage > 0 ? `+${profitInfo.profitPercentage}%` : `${profitInfo.profitPercentage}%`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sale Subtotal */}
                    <div className="col-span-2">
                      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-700 rounded-md p-2 text-center">
                        <p className="text-[9px] text-gray-600 dark:text-gray-400 font-medium mb-1">
                          Sale Subtotal
                        </p>
                        <p className="text-purple-600 dark:text-purple-400 font-bold text-xs">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    </div>

                    {/* Profit Subtotal */}
                    <div className="col-span-2">
                      <div className={cn(
                        "border rounded-md p-2 text-center",
                        hasProfit
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      )}>
                        <p className="text-[9px] text-gray-600 dark:text-gray-400 font-medium mb-1">
                          Profit Subtotal
                        </p>
                        <p className={cn(
                          "font-bold text-xs",
                          hasProfit
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          {formatCurrency(profitInfo.totalProfit)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <div className="flex justify-end">
          <Card className="w-full lg:w-1/2 xl:w-2/5 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center py-2">
                  <Label>Subtotal</Label>
                  <p className="font-semibold text-lg">{formatCurrency(processedSale.subtotal)}</p>
                </div>

                {processedSale.discount_value > 0 && (
                  <div className="flex justify-between items-center py-2 border-t">
                    <div>
                      <Label className="text-destructive">Discount</Label>
                      {processedSale.discount_reason && (
                        <p className="text-xs text-muted-foreground mt-1">{processedSale.discount_reason}</p>
                      )}
                    </div>
                    <p className="font-semibold text-destructive text-lg">
                      -{formatCurrency(processedSale.discount_value)}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-t-2 border-double">
                  <Label className="text-base font-bold">Total Amount</Label>
                  <p className="text-xl font-bold text-primary">{formatCurrency(processedSale.total)}</p>
                </div>

                {/* Profit Summary in Financial */}
                <div className="flex justify-between items-center py-2 border-t">
                  <Label className="text-green-600 font-medium">Total Profit</Label>
                  <p className="font-semibold text-lg text-green-600">
                    {formatCurrency(totalProfit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Metadata */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Metadata</CardTitle>
            <CardDescription>Detailed timeline and information about this sale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Created Date & Time</Label>
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{createdDateTime.date}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{createdDateTime.time}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {createdDateTime.full}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{updatedDateTime.date}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{updatedDateTime.time}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {updatedDateTime.full}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Sale Summary</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-muted/30 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Unique Products</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{totalProducts}</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/30 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Quantity</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">{totalQuantity}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Profit Performance</Label>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Total Profit</span>
                      <span className={cn(
                        "text-sm font-bold",
                        totalProfit > 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(totalProfit)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all rounded-full",
                          totalProfit > 0 ? "bg-green-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(100, Math.abs(totalProfit) / (processedSale.total || 1) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>Profit Margin</span>
                      <span>{((totalProfit / processedSale.total) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {processedSale.note && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{processedSale.note}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
