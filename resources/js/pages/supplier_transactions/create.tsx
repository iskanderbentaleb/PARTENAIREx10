import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type BreadcrumbItem = {
  title: string;
  href: string;
};

type Supplier = {
  id: number;
  name: string;
};

export default function SupplierTransactionsCreatePage({ suppliers }: { suppliers: Supplier[] }) {
  const { data, setData, post, processing, errors } = useForm({
    date: "",
    amount: "",
    note: "",
    supplier_id: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/supplier_transactions");
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Supplier Transactions", href: "/supplier_transactions" },
    { title: "Create", href: "/supplier_transactions/create" },
  ];

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/supplier_transactions">
            <span className="hidden sm:inline-block">Back to Transactions</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
      }
    >
      <Head title="Create Supplier Transaction" />

      <div className="h-full flex flex-col">
        <Card className="w-full mx-auto flex flex-col flex-1 border-0 rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Create New Supplier Transaction</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col flex-1">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 justify-between"
            >
              {/* Form Fields */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={data.date}
                      onChange={(e) => setData("date", e.target.value)}
                      className={errors.date ? "border-red-500" : ""}
                    />
                    {errors.date && (
                      <p className="text-sm text-red-500 mt-1">{errors.date}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Amount <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={data.amount}
                      onChange={(e) => setData("amount", e.target.value)}
                      placeholder="0.00"
                      className={errors.amount ? "border-red-500" : ""}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                    )}
                  </div>

                  {/* Supplier */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="supplier_id">
                      Supplier <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="supplier_id"
                      value={data.supplier_id}
                      onChange={(e) => setData("supplier_id", e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${errors.supplier_id ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    {errors.supplier_id && (
                      <p className="text-sm text-red-500 mt-1">{errors.supplier_id}</p>
                    )}
                  </div>


                  {/* Note */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      value={data.note}
                      onChange={(e) => setData("note", e.target.value)}
                      placeholder="Additional details..."
                      rows={6}
                      className={`resize-y ${errors.note ? "border-red-500" : ""}`}
                    />
                    {errors.note && (
                      <p className="text-sm text-red-500 mt-1">{errors.note}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-6 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={processing}
                >
                  <Link href="/supplier_transactions">Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Transaction"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
