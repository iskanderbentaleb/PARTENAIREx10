import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Trash, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

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
  available_cash: number;
}

interface PurchaseItem {
  id?: number;
  product_name: string;
  barcode_prinsipal: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sale_price: number;
  quantity_selled?: number;
}

interface Purchase {
  id: number;
  supplier_id: string;
  investor_id: string;
  supplier_invoice_number: string;
  purchase_date: string;
  due_date: string;
  subtotal: number;
  discount_value: number;
  discount_reason: string;
  shipping_value: number;
  shipping_note: string;
  total: number;
  currency: string;
  note: string;
  invoice_image: string | null;
  items: PurchaseItem[];
}

interface Props {
  purchase: Purchase;
  suppliers: Supplier[];
  investors: Investor[];
  amount_paid: number;
}

export default function PurchasesEditPage({ purchase, suppliers, investors, amount_paid }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    supplier_id: purchase.supplier_id || "",
    investor_id: purchase.investor_id || "",
    supplier_invoice_number: purchase.supplier_invoice_number || "",
    purchase_date: purchase?.purchase_date ? purchase.purchase_date.split("T")[0] : new Date().toISOString().split("T")[0],
    due_date: purchase.due_date || "",
    subtotal: purchase.subtotal || 0,
    discount_reason: purchase.discount_reason || "",
    discount_value: purchase.discount_value || 0,
    shipping_note: purchase.shipping_note || "",
    shipping_value: purchase.shipping_value || 0,
    total: purchase.total || 0,
    amount_paid: amount_paid || 0,
    currency: purchase.currency || "DZD",
    note: purchase.note || "",
    invoice_image: null as File | null,
    items: purchase.items.length > 0 ? purchase.items.map(item => ({
      id: item.id,
      product_name: item.product_name || "",
      barcode_prinsipal: item.barcode_prinsipal || "",
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      subtotal: item.subtotal || 0,
      sale_price: item.sale_price || 0,
      quantity_selled: item.quantity_selled || 0,
    })) : [
      {
        product_name: "",
        barcode_prinsipal: "",
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
        sale_price: 0,
      } as PurchaseItem,
    ],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Calculate amount remaining
  const amountRemaining = data.total - data.amount_paid;

  // Get selected investor
  const selectedInvestor = investors.find(inv => inv.id === parseInt(data.investor_id));

  // Debug: Check items data
  useEffect(() => {
    console.log('Purchase items from backend:', purchase.items);
    console.log('Form items with IDs:', data.items);
  }, [purchase.items, data.items]);

  // auto-calc due_date (30 days) when purchase_date changes and due_date empty
  useEffect(() => {
    if (data.purchase_date && !data.due_date) {
      const purchaseDate = new Date(data.purchase_date);
      const dueDate = new Date(purchaseDate);
      dueDate.setDate(dueDate.getDate() + 30);
      setData("due_date", dueDate.toISOString().split("T")[0]);
    }
  }, [data.purchase_date]);

  // Recalculate subtotal & total when items / discount change
  useEffect(() => {
    const newSubtotal = (data.items || []).reduce(
      (sum: number, item: PurchaseItem) => sum + Number(item.subtotal || 0),
      0
    );
    const discount = Number(data.discount_value || 0);
    const newTotal = parseFloat((newSubtotal - discount).toFixed(2));

    // update only if changed to avoid infinite loops
    if (newSubtotal !== Number(data.subtotal)) {
      setData("subtotal", newSubtotal);
    }
    if (newTotal !== Number(data.total)) {
      setData("total", newTotal);
    }
  }, [JSON.stringify(data.items), data.discount_value]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!data.supplier_id) errors.supplier_id = "Supplier is required";
    if (!data.investor_id) errors.investor_id = "Investor is required";
    if (!data.purchase_date) errors.purchase_date = "Purchase date is required";

    if (data.purchase_date && data.due_date) {
      const purchaseDate = new Date(data.purchase_date);
      const dueDate = new Date(data.due_date);
      if (dueDate < purchaseDate) errors.due_date = "Due date cannot be before purchase date";
    }

    if (Number(data.discount_value) < 0) errors.discount_value = "Discount value cannot be negative";
    if (Number(data.shipping_value) < 0) errors.shipping_value = "Shipping value cannot be negative";
    if (Number(data.amount_paid) < 0) errors.amount_paid = "Amount paid cannot be negative";
    if (Number(data.amount_paid) > Number(data.total)) errors.amount_paid = "Amount paid cannot exceed total amount";


    // Check if investor has sufficient balance (calculated from purchases)
    if (selectedInvestor && data.total > selectedInvestor.available_cash) {
      errors.investor_id = `Investor has insufficient balance. Available: ${selectedInvestor.available_cash.toFixed(2)} DZD`;
    }


    (data.items || []).forEach((item: any, index: number) => {
      if (!item.product_name) errors[`items.${index}.product_name`] = "Product name is required";

      // Check if quantity is less than sold quantity
      if (item.id && item.quantity_selled > 0 && Number(item.quantity) < item.quantity_selled) {
        errors[`items.${index}.quantity`] = `Cannot set quantity less than sold quantity (Sold: ${item.quantity_selled})`;
      }

      if (Number(item.quantity) <= 0) errors[`items.${index}.quantity`] = "Quantity must be greater than 0";
      if (Number(item.unit_price) < 0) errors[`items.${index}.unit_price`] = "Unit price cannot be negative";
      if (Number(item.sale_price) < 0) errors[`items.${index}.sale_price`] = "Sale price cannot be negative";
      if (Number(item.sale_price) < Number(item.unit_price)) {
        errors[`items.${index}.sale_price`] = "Sale price must be greater than purchase price";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
        toast.error("Please fix the validation errors");
        return;
    }

    // Debug: Check what items are being sent
    console.log('Items being sent to backend:', data.items);

    // Create FormData to handle file uploads
    const formData = new FormData();

    // Append all form data to FormData
    Object.keys(data).forEach(key => {
        if (key === 'items') {
          console.log('Items JSON being sent:', JSON.stringify(data[key]));
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'invoice_image' && data[key]) {
          formData.append(key, data[key] as File);
        } else if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key] as string);
        }
    });

    // Use the correct approach for form submission
    post(route('purchases.update', purchase.id), formData, {
        forceFormData: true,
        onSuccess: () => {
          toast.success("Purchase updated successfully!");
        },
        onError: (errors) => {
          toast.error("Failed to update purchase. Please check the errors below.");
          if (errors) {
              // Combine frontend and backend errors
              setValidationErrors({ ...validationErrors, ...errors });
          }
        },
    });
  };

  const addItem = () => {
    setData("items", [
      ...data.items,
      {
        product_name: "",
        barcode_prinsipal: "",
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
        sale_price: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) {
      toast.warning("You need at least one item");
      return;
    }
    const updated = data.items.filter((_: any, i: number) => i !== index);
    setData("items", updated);

    // clear any validation errors for that item
    const newErrors = { ...validationErrors };
    Object.keys(newErrors).forEach((k) => {
      if (k.startsWith(`items.${index}.`)) delete newErrors[k];
    });
    setValidationErrors(newErrors);
  };

  const updateItem = (index: number, key: keyof PurchaseItem, value: any) => {
    const updated = [...data.items];

    // Preserve the existing ID if it exists
    const existingId = updated[index].id;

    // convert numeric inputs
    if (key === "quantity") updated[index][key] = parseInt(value as any) || 0;
    else if (key === "unit_price" || key === "sale_price")
      updated[index][key] = parseFloat(value as any) || 0;
    else updated[index][key] = value;

    // recalc item subtotal (quantity * unit_price)
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unit_price) || 0;
    updated[index].subtotal = parseFloat((qty * price).toFixed(2));

    // Ensure the ID is preserved
    if (existingId) {
      updated[index].id = existingId;
    }

    setData("items", updated);

    // clear related validation errors
    const newErrors = { ...validationErrors };
    delete newErrors[`items.${index}.quantity`];
    delete newErrors[`items.${index}.unit_price`];
    delete newErrors[`items.${index}.sale_price`];
    delete newErrors[`items.${index}.product_name`];
    setValidationErrors(newErrors);
  };

  const handleFieldChange = (field: string, value: any) => {
    setData(field, value);

    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Purchases", href: "/purchases" },
    { title: "Edit", href: `/purchases/${purchase.id}/edit` },
  ];

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href={route('purchases')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchases
          </Link>
        </Button>
      }
    >
      <Head title="Edit Purchase" />

      <div className="py-6 px-4 md:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit Purchase #{purchase.id}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Purchase Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Purchase Information</CardTitle>
              <CardDescription>Update the details for this purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Supplier */}
                <div className="space-y-2">
                  <Label htmlFor="supplier_id" className={cn((validationErrors.supplier_id || errors.supplier_id) && "text-destructive")}>
                    Supplier *
                  </Label>
                  <select
                    id="supplier_id"
                    value={data.supplier_id}
                    onChange={(e) => handleFieldChange("supplier_id", e.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                      (validationErrors.supplier_id || errors.supplier_id) && "border-destructive"
                    )}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {(validationErrors.supplier_id || errors.supplier_id) && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.supplier_id || errors.supplier_id}
                    </p>
                  )}
                </div>

                {/* Investor */}
                <div className="space-y-2">
                  <Label htmlFor="investor_id" className={cn((validationErrors.investor_id || errors.investor_id) && "text-destructive")}>
                    Investor *
                  </Label>
                  <select
                    id="investor_id"
                    value={data.investor_id}
                    onChange={(e) => handleFieldChange("investor_id", e.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                      (validationErrors.investor_id || errors.investor_id) && "border-destructive"
                    )}
                  >
                    <option value="">Select Investor</option>
                    {investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} — Balance: {Number(inv.available_cash).toFixed(2)} {data.currency}
                      </option>
                    ))}
                  </select>
                  {(validationErrors.investor_id || errors.investor_id) && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.investor_id || errors.investor_id}
                    </p>
                  )}
                </div>

                {/* Invoice No */}
                <div className="space-y-2">
                  <Label htmlFor="supplier_invoice_number">Supplier Invoice Number</Label>
                  <Input
                    id="supplier_invoice_number"
                    value={data.supplier_invoice_number}
                    onChange={(e) => handleFieldChange("supplier_invoice_number", e.target.value)}
                    placeholder="e.g, BEBEMODE-0001"
                  />
                </div>

                {/* Purchase Date */}
                <div className="space-y-2">
                  <Label htmlFor="purchase_date" className={cn((validationErrors.purchase_date || errors.purchase_date) && "text-destructive")}>
                    Purchase Date *
                  </Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={data.purchase_date}
                    onChange={(e) => handleFieldChange("purchase_date", e.target.value)}
                    className={(validationErrors.purchase_date || errors.purchase_date) ? "border-destructive" : ""}
                  />
                  {(validationErrors.purchase_date || errors.purchase_date) && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.purchase_date || errors.purchase_date}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Purchase Items</CardTitle>
              <Button type="button" variant="outline" onClick={addItem} size="sm" className="ml-2">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {data.items.map((item: any, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 rounded-lg border">
                  {/* Hidden ID field for debugging */}
                  {item.id && (
                    <input type="hidden" value={item.id} />
                  )}

                  {/* Product */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className={cn((validationErrors[`items.${index}.product_name`] || errors[`items.${index}.product_name`]) && "text-destructive")}>
                      Product *
                    </Label>
                    <Input
                      className={cn("w-full", (validationErrors[`items.${index}.product_name`] || errors[`items.${index}.product_name`]) && "border-destructive")}
                      value={item.product_name}
                      onChange={(e) => updateItem(index, "product_name", e.target.value)}
                      placeholder="Product name"
                    />
                    {(validationErrors[`items.${index}.product_name`] || errors[`items.${index}.product_name`]) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors[`items.${index}.product_name`] || errors[`items.${index}.product_name`]}
                      </p>
                    )}
                  </div>

                  {/* Barcode */}
                  <div className="space-y-2 md:col-span-1">
                    <Label className={cn((validationErrors[`items.${index}.barcode_prinsipal`] || errors[`items.${index}.barcode_prinsipal`]) && "text-destructive")}>
                      Barcode / Ref
                    </Label>
                    <Input
                      className={cn("w-full", (validationErrors[`items.${index}.barcode_prinsipal`] || errors[`items.${index}.barcode_prinsipal`]) && "border-destructive")}
                      value={item.barcode_prinsipal}
                      onChange={(e) => updateItem(index, "barcode_prinsipal", e.target.value)}
                      placeholder="barcode or ref"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2 md:col-span-1">
                    <Label className={cn((validationErrors[`items.${index}.quantity`] || errors[`items.${index}.quantity`]) && "text-destructive")}>
                      Qty *
                      {item.quantity_selled > 0 && (
                        <span className="text-xs text-amber-600 ml-1">
                          (Sold: {item.quantity_selled})
                        </span>
                      )}
                    </Label>
                    <Input
                      type="number"
                      min={item.quantity_selled || 1}
                      className={cn("w-full", (validationErrors[`items.${index}.quantity`] || errors[`items.${index}.quantity`]) && "border-destructive")}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    />
                    {(validationErrors[`items.${index}.quantity`] || errors[`items.${index}.quantity`]) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors[`items.${index}.quantity`] || errors[`items.${index}.quantity`]}
                      </p>
                    )}
                  </div>

                  {/* Purchase Price */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className={cn((validationErrors[`items.${index}.unit_price`] || errors[`items.${index}.unit_price`]) && "text-destructive")}>Purchase Price *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className={cn("w-full", (validationErrors[`items.${index}.unit_price`] || errors[`items.${index}.unit_price`]) && "border-destructive")}
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                    />
                    {(validationErrors[`items.${index}.unit_price`] || errors[`items.${index}.unit_price`]) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors[`items.${index}.unit_price`] || errors[`items.${index}.unit_price`]}
                      </p>
                    )}
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className={cn((validationErrors[`items.${index}.sale_price`] || errors[`items.${index}.sale_price`]) && "text-destructive")}>Sale Price *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className={cn("w-full", (validationErrors[`items.${index}.sale_price`] || errors[`items.${index}.sale_price`]) && "border-destructive")}
                      value={item.sale_price}
                      onChange={(e) => updateItem(index, "sale_price", e.target.value)}
                    />
                    {(validationErrors[`items.${index}.sale_price`] || errors[`items.${index}.sale_price`]) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors[`items.${index}.sale_price`] || errors[`items.${index}.sale_price`]}
                      </p>
                    )}
                  </div>

                  {/* Subtotal */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Subtotal</Label>
                    <Input
                      type="number"
                      className="w-full bg-muted"
                      value={Number(item.subtotal || 0).toFixed(2)}
                      readOnly
                    />
                  </div>

                    {item.quantity_selled < 1 && (
                        <div className="flex md:col-span-1">
                            <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-9 w-9 rounded-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
                            onClick={() => removeItem(index)}
                            disabled={data.items.length <= 1}
                            aria-label="Remove item"
                            >
                            <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                </div>
              ))}
            </CardContent>
          </Card>

          {/* Financial Details */}
          <div className="flex justify-end">
            <Card className="w-full md:w-1/2">
              <CardHeader>
                <CardTitle className="text-xl">Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Subtotal */}
                  <div className="space-y-2">
                    <Label htmlFor="subtotal">Subtotal</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      value={Number(data.subtotal || 0).toFixed(2)}
                      readOnly
                      className="font-semibold bg-muted"
                    />
                  </div>

                  {/* Discount Reason + Value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount_reason">Discount Reason</Label>
                      <Input
                        id="discount_reason"
                        value={data.discount_reason}
                        onChange={(e) => handleFieldChange("discount_reason", e.target.value)}
                        placeholder="Reason for discount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount_value">Discount Value</Label>
                      <Input
                        id="discount_value"
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number(data.discount_value || 0)}
                        onChange={(e) => handleFieldChange("discount_value", parseFloat(e.target.value || "0"))}
                      />
                    </div>
                  </div>

                  {/* Shipping Note + Value */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipping_note">Shipping Note</Label>
                      <Input
                        id="shipping_note"
                        value={data.shipping_note}
                        onChange={(e) => handleFieldChange("shipping_note", e.target.value)}
                        placeholder="Shipping details"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_value">Shipping Value</Label>
                      <Input
                        id="shipping_value"
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number(data.shipping_value || 0)}
                        onChange={(e) => handleFieldChange("shipping_value", parseFloat(e.target.value || "0"))}
                      />
                    </div>
                  </div>

                  {/* Investor Balance Info */}
                  {selectedInvestor && (
                    <div className="p-3 bg-blue-600 rounded-md border border-blue-400">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">Investor Balance:</span>
                        <span className="text-sm font-semibold text-white">
                          {selectedInvestor.available_cash.toFixed(2)} {data.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="space-y-2">
                    <Label htmlFor="total">Total Amount</Label>
                    <Input
                      id="total"
                      type="number"
                      value={Number(data.total || 0).toFixed(2)}
                      readOnly
                      className="text-lg font-bold bg-muted"
                    />
                  </div>

                  {/* Amount Paid */}
                  <div className="space-y-2">
                    <Label htmlFor="amount_paid" className={cn((validationErrors.amount_paid || errors.amount_paid) && "text-destructive")}>
                      Amount Paid
                    </Label>
                    <Input
                      id="amount_paid"
                      type="number"
                      min="0"
                      step="0.01"
                      max={data.total}
                      value={data.amount_paid}
                      onChange={(e) => {
                        const paid = Math.min(parseFloat(e.target.value || "0"), data.total);
                        handleFieldChange("amount_paid", paid);
                      }}
                      placeholder="Enter amount paid"
                      className={(validationErrors.amount_paid || errors.amount_paid) ? "border-destructive" : ""}
                    />
                    {(validationErrors.amount_paid || errors.amount_paid) && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.amount_paid || errors.amount_paid}
                      </p>
                    )}
                  </div>

                  {/* Amount Remaining */}
                  <div className="space-y-2">
                    <Label htmlFor="amount_remaining">Amount Remaining</Label>
                    <Input
                      id="amount_remaining"
                      type="number"
                      value={amountRemaining.toFixed(2)}
                      readOnly
                      className={cn(
                        "font-semibold text-white",
                        amountRemaining > 0 ? "bg-amber-500" : "bg-green-500"
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Invoice File</CardTitle>
              <CardDescription>
                {purchase.invoice_image ? "Current file: " + purchase.invoice_image : "Upload new invoice (PDF, JPG, PNG, XLSX)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setData("invoice_image", e.target.files[0]);
                  } else {
                    setData("invoice_image", null);
                  }
                }}
              />
              {data.invoice_image && <p className="text-sm mt-2">New file: {data.invoice_image.name}</p>}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="note">Notes</Label>
              <Textarea
                id="note"
                value={data.note}
                onChange={(e) => setData("note", e.target.value)}
                placeholder="Additional information about this purchase..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" asChild disabled={processing}>
              <Link href={route('purchases')}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Purchase"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
