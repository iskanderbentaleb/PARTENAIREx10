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
import { ArrowLeft, FileText, Download, Copy } from "lucide-react";
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
      subtotal: Number(item.subtotal),
      sale_price: Number(item.sale_price),
    })),
  };

  const amountRemaining = processedPurchase.total - processedPurchase.amount_paid;

  const formatCurrency = (value: number) => `${value.toFixed(2)} ${processedPurchase.currency}`;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

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

      <div className="py-6 px-4 md:px-8 space-y-10">
        {/* Page header */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Purchase Details</h1>
            <span className="text-sm text-muted-foreground">#{processedPurchase.id}</span>
          </div>
          <p className="text-muted-foreground">
            Overview of purchase information and sold quantities
          </p>
        </div>

        {/* Overall Sold Percentage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Overall Sold Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all rounded-full", overallColorClass)}
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {totalSold}/{totalQuantity} ({overallPercentage}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Purchase Information</CardTitle>
            <CardDescription>Basic details of this purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <p className="text-sm">{processedPurchase.supplier.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Investor</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <p className="text-sm">{processedPurchase.investor.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Supplier Invoice Number</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <p className="text-sm">{processedPurchase.supplier_invoice_number || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <p className="text-sm">{formatDate(processedPurchase.purchase_date)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Purchase Items</CardTitle>
            <CardDescription>Products included in this purchase</CardDescription>
          </CardHeader>

          <CardContent className="text-sm">
            <div className="rounded-md border overflow-x-auto">
              <div className="grid grid-cols-16 gap-4 p-3 font-medium border-b text-xs">
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Barcode/Ref</div>
                <div className="col-span-2">Generated Barcode/Ref</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">Qty Sold (%)</div>
                <div className="col-span-2 text-right">Purchase Price</div>
                <div className="col-span-2 text-right">Sale Price</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              {processedPurchase.items.map((item, index) => {
                const percentage = getSoldPercentage(item);
                const colorClass = getColorClass(percentage);

                return (
                  <div
                    key={index}
                    className="grid grid-cols-16 gap-4 p-3 border-b last:border-b-0 items-center"
                  >
                    <div className="col-span-3 font-medium">{item.product_name}</div>

                    <div className="col-span-2 text-sm text-muted-foreground">
                      {item.barcode_prinsipal || "N/A"}
                    </div>

                    <div className="col-span-2 flex items-center gap-1">
                        {item.barcode_generated && (
                                <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(item.barcode_generated)}
                                >
                                <Copy className="h-3 w-3" />
                                </Button>
                        )}
                      <p className="text-sm text-muted-foreground truncate">
                        {item.barcode_generated || "N/A"}
                      </p>
                    </div>

                    <div className="col-span-1 text-center">{item.quantity}</div>

                    <div className="col-span-2 flex flex-col items-center">
                      <p className="text-xs font-medium">{item.quantity_selled}</p>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-1">
                        <div
                          className={cn("h-full transition-all rounded-full", colorClass)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {percentage}%
                      </span>
                    </div>

                    <div className="col-span-2 text-right">{formatCurrency(item.unit_price)}</div>
                    <div className="col-span-2 text-right">{formatCurrency(item.sale_price)}</div>
                    <div className="col-span-2 text-right font-medium">{formatCurrency(item.subtotal)}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <div className="flex justify-end">
          <Card className="w-full md:w-1/2">
            <CardHeader>
              <CardTitle className="text-xl">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <Label>Subtotal</Label>
                  <p className="font-semibold">{formatCurrency(processedPurchase.subtotal)}</p>
                </div>

                {processedPurchase.discount_value > 0 && (
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Discount</Label>
                      {processedPurchase.discount_reason && (
                        <p className="text-xs text-muted-foreground">{processedPurchase.discount_reason}</p>
                      )}
                    </div>
                    <p className="font-semibold text-destructive">
                      -{formatCurrency(processedPurchase.discount_value)}
                    </p>
                  </div>
                )}

                {processedPurchase.shipping_value > 0 && (
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Shipping</Label>
                      {processedPurchase.shipping_note && (
                        <p className="text-xs text-muted-foreground">{processedPurchase.shipping_note}</p>
                      )}
                    </div>
                    <p className="font-semibold">+{formatCurrency(processedPurchase.shipping_value)}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <Label className="text-base">Total Amount</Label>
                  <p className="text-lg font-bold">{formatCurrency(processedPurchase.total)}</p>
                </div>

                <div className="flex justify-between items-center">
                  <Label>Amount Paid</Label>
                  <p className="font-semibold">{formatCurrency(processedPurchase.amount_paid)}</p>
                </div>

                <div className="flex justify-between items-center">
                  <Label>Amount Remaining</Label>
                  <p
                    className={cn(
                      "font-semibold",
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

        {/* File Attachment */}
        {processedPurchase.invoice_image && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Invoice Attachment</CardTitle>
              <CardDescription>Document associated with this purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 border rounded-md">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Invoice File</p>
                  <p className="text-xs text-muted-foreground">
                    {processedPurchase.invoice_image.split("/").pop()}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{processedPurchase.note}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
