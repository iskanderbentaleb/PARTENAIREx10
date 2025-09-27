import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type BreadcrumbItem = {
  title: string;
  href: string;
};

type Supplier = {
  id: number;
  name: string;
};

type SupplierFinancialData = {
  total_purchases: number;
  total_payments: number;
  total_debts: number;
};

export default function SupplierTransactionsCreatePage({
  suppliers,
}: {
  suppliers: Supplier[];
}) {
  const { data, setData, post, processing, errors } = useForm({
    date: "",
    amount: "",
    note: "",
    supplier_id: "",
  });

  const [supplierData, setSupplierData] =
    useState<SupplierFinancialData | null>(null);
  const [loadingSupplier, setLoadingSupplier] = useState(false);

  // Safely parse any value to a number, fallback 0
  function parseNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  // Money formatter
  function formatMoney(value: number | null | undefined) {
    const num = value ?? 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "DZD",
      minimumFractionDigits: 2,
    }).format(num);
  }

  useEffect(() => {
    if (!data.supplier_id) {
      setSupplierData(null);
      return;
    }

    const controller = new AbortController();
    setLoadingSupplier(true);

    fetch(`/suppliers/${data.supplier_id}/financial-data`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((json) => {
        // Coerce values to numbers to avoid .toFixed / formatting errors
        setSupplierData({
          total_purchases: parseNumber(json.total_purchases),
          total_payments: parseNumber(json.total_payments),
          total_debts: parseNumber(json.total_debts),
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to load supplier financial data:", err);
          toast.error("Could not load supplier data.");
          setSupplierData(null);
        }
      })
      .finally(() => setLoadingSupplier(false));

    return () => controller.abort();
  }, [data.supplier_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/supplier_transactions", {
      // optionally transform data before send
      onError: () => toast.error("Failed to save transaction"),
      onSuccess: () => toast.success("Transaction saved"),
    });
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Supplier Transactions", href: "/supplier_transactions" },
    { title: "Create", href: "/supplier_transactions/create" },
  ];

  // debt color logic: >0 => red (owes), 0 => green, <0 => orange (prepaid)
  const debtColorClass = (debt: number) =>
    debt > 0 ? "text-red-600" : debt < 0 ? "text-orange-500" : "text-green-600";

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
            <CardTitle className="text-xl font-bold">
              Create New Supplier Transaction
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 space-y-6">
            {/* Supplier Data Dashboard */}
            <div className="mb-2">
              {!data.supplier_id && (
                <p className="text-sm text-gray-500">Select a supplier to view totals</p>
              )}
              {loadingSupplier && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading supplier data...
                </div>
              )}
            </div>

            {supplierData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-gray-100 dark:bg-zinc-900  shadow-sm">
                  <p className="text-xs text-gray-500">Total Purchases</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                    {formatMoney(supplierData.total_purchases)}
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-gray-100 dark:bg-zinc-900 shadow-sm">
                  <p className="text-xs text-gray-500">Total Payments</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatMoney(supplierData.total_payments)}
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-gray-100 dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Debt</p>
                    <p className={`text-lg font-semibold ${debtColorClass(supplierData.total_debts)}`}>
                      {formatMoney(supplierData.total_debts)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setData("amount", Math.abs(supplierData.total_debts).toString())
                      }
                      className="text-sm"
                    >
                      Use debt
                    </Button>
                    <span className="text-xs text-gray-400">Fill amount with debt value</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 justify-between"
              noValidate
            >
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

                  {/* Amount + quick actions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="amount">
                        Amount <span className="text-red-500">*</span>
                      </Label>
                      <div className="text-xs text-gray-400">DA</div>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={data.amount}
                        onChange={(e) => setData("amount", e.target.value)}
                        placeholder="0.00"
                        className={errors.amount ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setData("amount", "")}
                        className="whitespace-nowrap"
                      >
                        Clear
                      </Button>
                    </div>

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
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                        errors.supplier_id ? "border-red-500" : "border-gray-300"
                      }`}
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
                <Button type="button" variant="outline" asChild disabled={processing}>
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
