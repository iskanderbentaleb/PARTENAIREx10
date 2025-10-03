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
import { ArrowLeft, FileText, User, Calendar, Tag, ShoppingCart, DollarSign, Copy } from "lucide-react";
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
  // REMOVED: total_profit and profit_calculation
}

interface Props {
  sale: Sale;
}

export default function SalesViewPage({ sale }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Sales", href: "/sales" },
    { title: `View #${sale.id}`, href: `/sales/${sale.id}` },
  ];

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = Number(value);
    if (isNaN(num)) return "0.00 DZD";
    return `${num.toFixed(2)} DZD`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
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
        unit_price: 0
      };
    }

    return purchaseItem;
  };

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
      <Head title={`Sale #${sale.id}`} />

      <div className="py-6 px-4 md:px-8 space-y-10">
        {/* Page header */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Sale Details #{sale.id}</h1>
          </div>
          <p className="text-muted-foreground">
            Overview of sale information and transaction details
          </p>
        </div>

        {/* Sale Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sale Information</CardTitle>
            <CardDescription>Basic details of this sale transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Investor</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{sale.investor.name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{sale.invoice_number || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sale Date</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(sale.sale_date)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sale Items</CardTitle>
            <CardDescription>Products sold in this transaction</CardDescription>
          </CardHeader>

          <CardContent className="text-sm">
            <div className="rounded-md border overflow-x-auto">
              {/* REMOVED: Profit column from header */}
              <div className="grid grid-cols-14 gap-4 p-3 font-medium border-b text-xs">
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Barcode/Ref</div>
                <div className="col-span-2">Generated Barcode/Ref</div>
                <div className="col-span-1 text-center">Qty Sold</div>
                <div className="col-span-2 text-right">Purchase Price</div>
                <div className="col-span-2 text-right">Sale Price</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              {sale.items.map((item, index) => {
                const purchaseItem = getPurchaseItemData(item);

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-14 gap-4 p-3 border-b last:border-b-0 items-center"
                  >
                    <div className="col-span-3 font-medium">{purchaseItem.product_name}</div>

                    <div className="col-span-2 text-sm text-muted-foreground">
                      {purchaseItem.barcode_prinsipal}
                    </div>

                    <div className="col-span-2 flex items-center gap-1">
                      {purchaseItem.barcode_generated && purchaseItem.barcode_generated !== "N/A" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(purchaseItem.barcode_generated)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {purchaseItem.barcode_generated}
                      </p>
                    </div>

                    <div className="col-span-1 text-center">{item.quantity}</div>

                    <div className="col-span-2 text-right">
                      <p className="text-sm text-red-600">{formatCurrency(purchaseItem.unit_price)}</p>
                    </div>

                    <div className="col-span-2 text-right">
                      <p className="text-sm font-medium">{formatCurrency(item.sale_price)}</p>
                    </div>

                    {/* REMOVED: Profit column completely */}

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
              <CardTitle className="text-xl">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <Label>Subtotal</Label>
                  <p className="font-semibold">{formatCurrency(sale.subtotal)}</p>
                </div>

                {sale.discount_value > 0 && (
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Discount</Label>
                      {sale.discount_reason && (
                        <p className="text-xs text-muted-foreground">{sale.discount_reason}</p>
                      )}
                    </div>
                    <p className="font-semibold text-destructive">
                      -{formatCurrency(sale.discount_value)}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <Label className="text-base">Total Amount</Label>
                  <p className="text-lg font-bold">{formatCurrency(sale.total)}</p>
                </div>

                {/* REMOVED: Entire profit section from financial summary */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Metadata</CardTitle>
            <CardDescription>Additional information about this sale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Created Date</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(sale.created_at)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Updated</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(sale.updated_at)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Total Items Sold</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{sale.total_items}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Unique Products</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{sale.items.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {sale.note && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Additional Information - NOTE </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm whitespace-pre-wrap">{sale.note}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
