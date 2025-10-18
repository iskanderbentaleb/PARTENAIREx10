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
import { ArrowLeft, FileText, Download, Copy, Calendar, Package, BarChart3, ShoppingCart, Tag, Percent, DollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BreadcrumbItem = {
  title: string;
  href: string;
};

interface Supplier {
  id: number;
  name: string;
}

interface Investor {
  id: number;
  name: string;
  current_balance: number;
}

interface Item {
  product_name: string;
  barcode_prinsipal: string;
  barcode_generated: string;
  quantity: number;
  quantity_selled: number;
  unit_price: number;
  unit_price_with_discount: number;
  subtotal: number;
  sale_price: number;
}

interface Purchase {
  id: number;
  supplier_id: number;
  investor_id: number;
  supplier_invoice_number: string;
  purchase_date: string;
  subtotal: number;
  discount_reason: string;
  discount_value: number;
  shipping_note: string;
  shipping_value: number;
  total: number;
  currency: string;
  note: string;
  invoice_image: string | null;
  items: Item[];
  supplier: Supplier;
  investor: Investor;
  amount_paid: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  purchase: Purchase;
}

export default function PurchasesViewPage({ purchase }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Purchases", href: "/purchases" },
    { title: `View #${purchase.id}`, href: `/purchases/${purchase.id}` },
  ];

  // Process numeric values
  const processedPurchase = {
    ...purchase,
    subtotal: Number(purchase.subtotal),
    discount_value: Number(purchase.discount_value),
    shipping_value: Number(purchase.shipping_value),
    total: Number(purchase.total),
    amount_paid: Number(purchase.amount_paid),
    items: purchase.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      unit_price_with_discount: Number(item.unit_price_with_discount),
      subtotal: Number(item.subtotal),
      sale_price: Number(item.sale_price),
    })),
  };

  const amountRemaining = processedPurchase.total - processedPurchase.amount_paid;




    const formatCurrency = (amount: number, currency: string = 'DZD'): string => {
        return `${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)} ${currency}`;
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

  // Per-item sold %
  const getSoldPercentage = (item: Item) =>
    !item.quantity || item.quantity <= 0
      ? 0
      : Math.min(100, Math.round((item.quantity_selled / item.quantity) * 100));

  // Progress color
  const getColorClass = (percentage: number) => {
    if (percentage < 30) return "bg-red-500";
    if (percentage < 70) return "bg-amber-500";
    if (percentage < 90) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Overall sold percentage
  const totalQuantity = processedPurchase.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalSold = processedPurchase.items.reduce((sum, item) => sum + item.quantity_selled, 0);
  const overallPercentage = totalQuantity ? Math.round((totalSold / totalQuantity) * 100) : 0;
  const overallColorClass = getColorClass(overallPercentage);

  // Calculate additional metadata
  const totalProducts = processedPurchase.items.length;
  const totalValue = processedPurchase.items.reduce((sum, item) => sum + item.subtotal, 0);
  const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  // Copy text function with toast
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(`"${text}" copied to clipboard!`);
      })
      .catch(() => {
        toast.error("Failed to copy text. Please try again.");
      });
  };

  // Calculate discount per unit and percentage
  const getDiscountInfo = (item: Item) => {
    if (item.unit_price === item.unit_price_with_discount) {
      return { discountPerUnit: 0, discountPercentage: 0 };
    }

    const discountPerUnit = item.unit_price - item.unit_price_with_discount;
    const discountPercentage = (discountPerUnit / item.unit_price) * 100;

    return {
      discountPerUnit,
      discountPercentage: Math.round(discountPercentage * 100) / 100
    };
  };

  // Format dates
  const createdDateTime = formatDateTime(processedPurchase.created_at);
  const updatedDateTime = formatDateTime(processedPurchase.updated_at);
  const purchaseDateTime = formatDateTime(processedPurchase.purchase_date);

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchases
          </Link>
        </Button>
      }
    >
      <Head title={`Purchase #${processedPurchase.id}`} />

      <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page header */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Purchase Details</h1>
              <p className="text-muted-foreground mt-1">
                Overview of purchase information and sold quantities
              </p>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full self-start sm:self-auto">
              #{processedPurchase.id}
            </span>
          </div>
        </div>

        {/* Overall Sold Percentage */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overall Sold Quantity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all rounded-full", overallColorClass)}
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {totalSold}/{totalQuantity} ({overallPercentage}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Purchase Information</CardTitle>
            <CardDescription>Basic details of this purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm">Supplier</Label>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">{processedPurchase.supplier.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Investor</Label>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">{processedPurchase.investor.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Supplier Invoice Number</Label>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium">{processedPurchase.supplier_invoice_number || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Purchase Date & Time</Label>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{purchaseDateTime.date}</p>
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
            <CardTitle className="text-lg sm:text-xl">Purchase Items</CardTitle>
            <CardDescription>Products included in this purchase</CardDescription>
          </CardHeader>

          <CardContent className="text-sm">
            <div className="rounded-lg border overflow-x-auto">
              {/* Enhanced Header */}
              <div className="grid grid-cols-16 gap-3 p-4 font-semibold border-b text-xs
                              bg-muted/50 dark:bg-muted/20 text-muted-foreground dark:text-gray-300 min-w-[1200px]">
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Barcode / Ref</div>
                <div className="col-span-2">Generated Barcode</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">Qty Sold (%)</div>

                {/* Enhanced Price Column Header */}
                <div className="col-span-3 text-center">
                  <span className="font-bold text-xs">Pricing Details</span>
                </div>

                <div className="col-span-2 text-center">Sale Price</div>
                <div className="col-span-1 text-center">Subtotal</div>
              </div>

              {processedPurchase.items.map((item, index) => {
                const percentage = getSoldPercentage(item);
                const colorClass = getColorClass(percentage);
                const discountInfo = getDiscountInfo(item);
                const hasDiscount = discountInfo.discountPerUnit > 0;

                return (
                  <div
                    key={index}
                    className="grid grid-cols-16 gap-3 p-4 border-b last:border-b-0 items-center hover:bg-muted/10 transition-colors min-w-[1200px]"
                  >
                    <div className="col-span-3 font-medium">
                      <p className="line-clamp-2">{item.product_name}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs line-clamp-2">
                        {item.barcode_prinsipal || "N/A"}
                      </p>
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      {item.barcode_generated && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => copyToClipboard(item.barcode_generated)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      <p className="text-muted-foreground text-xs line-clamp-2 flex-1">
                        {item.barcode_generated || "N/A"}
                      </p>
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            {item.quantity_selled}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all rounded-full", colorClass)}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Price Column */}
                    <div className="col-span-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Original Price */}
                        <div className={cn(
                          "border rounded-lg p-3 transition-all duration-200",
                          hasDiscount
                            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                              Original
                            </span>
                            {!hasDiscount && (
                              <Tag className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <p className={cn(
                            "font-bold text-sm",
                            hasDiscount
                              ? "text-red-600 dark:text-red-400 line-through"
                              : "text-green-600 dark:text-green-400"
                          )}>
                            {formatCurrency(item.unit_price)}
                          </p>
                        </div>

                        {/* Final Price with Discount */}
                        <div className={cn(
                          "border rounded-lg p-3 transition-all duration-200",
                          hasDiscount
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                              Final
                            </span>
                            {hasDiscount && (
                              <Percent className="h-3 w-3 text-emerald-600" />
                            )}
                          </div>
                          <p className={cn(
                            "font-bold text-sm",
                            hasDiscount
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-600 dark:text-gray-400"
                          )}>
                            {formatCurrency(item.unit_price_with_discount)}
                          </p>
                        </div>
                      </div>

                      {/* Discount Details */}
                      {hasDiscount && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-medium text-amber-700 dark:text-amber-300">
                              Discount Applied
                            </span>
                            <div className="text-right">
                              <div className="font-bold text-amber-700 dark:text-amber-300">
                                -{formatCurrency(discountInfo.discountPerUnit)}
                              </div>
                              <div className="text-amber-600 dark:text-amber-400">
                                ({discountInfo.discountPercentage}%)
                              </div>
                            </div>
                          </div>
                          <div className="text-[9px] text-amber-600 dark:text-amber-400 text-center">
                            Purchase Price - (Discount / Quantities)
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sale Price */}
                    <div className="col-span-2">
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium mb-1">
                          Sale Price
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                          {formatCurrency(item.sale_price)}
                        </p>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="col-span-1">
                      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium mb-1">
                          Subtotal
                        </p>
                        <p className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                          {formatCurrency(item.subtotal)}
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
                  <p className="font-semibold text-lg">{formatCurrency(processedPurchase.subtotal)}</p>
                </div>

                {processedPurchase.discount_value > 0 && (
                  <div className="flex justify-between items-center py-2 border-t">
                    <div>
                      <Label className="text-destructive">Discount</Label>
                      {processedPurchase.discount_reason && (
                        <p className="text-xs text-muted-foreground mt-1">{processedPurchase.discount_reason}</p>
                      )}
                    </div>
                    <p className="font-semibold text-destructive text-lg">
                      -{formatCurrency(processedPurchase.discount_value)}
                    </p>
                  </div>
                )}

                {processedPurchase.shipping_value > 0 && (
                  <div className="flex justify-between items-center py-2 border-t">
                    <div>
                      <Label>Shipping</Label>
                      {processedPurchase.shipping_note && (
                        <p className="text-xs text-muted-foreground mt-1">{processedPurchase.shipping_note}</p>
                      )}
                    </div>
                    <p className="font-semibold text-lg">+{formatCurrency(processedPurchase.shipping_value)}</p>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-t-2 border-double">
                  <Label className="text-base font-bold">Total Amount</Label>
                  <p className="text-xl font-bold text-primary">{formatCurrency(processedPurchase.total)}</p>
                </div>

                <div className="flex justify-between items-center py-2">
                  <Label>Amount Paid</Label>
                  <p className="font-semibold text-lg text-green-600">{formatCurrency(processedPurchase.amount_paid)}</p>
                </div>

                <div className="flex justify-between items-center py-2 border-t">
                  <Label>Amount Remaining</Label>
                  <p
                    className={cn(
                      "font-semibold text-lg",
                      amountRemaining > 0 ? "text-amber-600" : "text-green-600"
                    )}
                  >
                    {formatCurrency(amountRemaining)}
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
            <CardDescription>Detailed timeline and information about this purchase</CardDescription>
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
                  <Label className="text-sm font-medium">Products Summary</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-muted/30 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total Products</span>
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
                  <Label className="text-sm font-medium">Sales Performance</Label>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium">Sold Progress</span>
                      <span className="text-sm font-bold text-primary">{overallPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all rounded-full", overallColorClass)}
                        style={{ width: `${overallPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>{totalSold} sold</span>
                      <span>{totalQuantity - totalSold} remaining</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Attachment */}
        {processedPurchase.invoice_image && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Invoice Attachment</CardTitle>
              <CardDescription>Document associated with this purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Invoice File</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {processedPurchase.invoice_image.split("/").pop()}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                  <a
                    href={`/storage/${processedPurchase.invoice_image}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {processedPurchase.note && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{processedPurchase.note}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
