import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Plus, Trash, ArrowLeft, AlertCircle, Search, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

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
  quantity: number;
  quantity_selled: number;
  unit_price: number;
  sale_price: number;
  subtotal: number;
  sold_percentage: number;
  available_quantity: number;
  purchase?: {
    supplier_id: number;
  };
}

interface SaleItemForm {
  purchase_item_id: number;
  quantity: number;
  unit_price: number;
  sale_price: number;
  subtotal: number;
  product_name: string;
  barcode_generated: string;
  available_quantity: number;
}

interface SaleFormData {
  invoice_number: string;
  sale_date: string;
  investor_id: string;
  subtotal: number;
  discount_reason: string;
  discount_value: number;
  total: number;
  note: string;
  items: SaleItemForm[];
}

interface Sale {
  id: number;
  invoice_number: string;
  sale_date: string;
  investor_id: number;
  subtotal: number;
  discount_reason: string;
  discount_value: number;
  total: number;
  note: string;
  items: SaleItemForm[];
}

interface Props {
  sale: Sale;
  investors: Investor[];
  purchaseItems: PurchaseItem[];
  initialSaleItems: SaleItemForm[];
}

export default function SalesEditPage({ sale, investors, purchaseItems: initialPurchaseItems, initialSaleItems }: Props) {
  const { data, setData, put, processing, errors: serverErrors } = useForm<SaleFormData>({
    invoice_number: sale.invoice_number || "",
    sale_date: sale.sale_date ? new Date(sale.sale_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    investor_id: sale.investor_id?.toString() || "",
    subtotal: sale.subtotal || 0,
    discount_reason: sale.discount_reason || "",
    discount_value: sale.discount_value || 0,
    total: sale.total || 0,
    note: sale.note || "",
    items: initialSaleItems || [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PurchaseItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>(initialPurchaseItems);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Sales", href: "/sales" },
    { title: `Edit ${sale.invoice_number || `Sale #${sale.id}`}`, href: `/sales/${sale.id}/edit` },
  ];

  // Combine server and local errors
  const validationErrors = useMemo(() => ({
    ...localErrors,
    ...serverErrors
  }), [localErrors, serverErrors]);

  // Memoized available purchase items for selected investor
  const availablePurchaseItems = useMemo(() =>
    purchaseItems.filter(item => item.available_quantity > 0),
    [purchaseItems]
  );

  // Load products when investor is selected
  useEffect(() => {
    const loadInvestorProducts = async () => {
      if (!data.investor_id) {
        setPurchaseItems([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const response = await fetch(`/api/investor/${data.investor_id}/purchase-items`);
        if (response.ok) {
          const result = await response.json();
          setPurchaseItems(result.purchaseItems || []);
        } else {
          toast.error("Failed to load investor products");
          setPurchaseItems([]);
        }
      } catch (error) {
        toast.error("Error loading products");
        setPurchaseItems([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (data.investor_id) {
      loadInvestorProducts();
    }
  }, [data.investor_id]);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults(availablePurchaseItems.slice(0, 5));
      return;
    }

    const results = availablePurchaseItems.filter(item =>
      item.barcode_generated?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode_prinsipal?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    setSearchResults(results);
  }, [searchTerm, availablePurchaseItems]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Calculate totals when items or discount change
  useEffect(() => {
    const items = Array.isArray(data.items) ? data.items : [];

    const newSubtotal = items.reduce((sum: number, item: SaleItemForm) => {
      const itemSubtotal = Number(item.subtotal) || 0;
      return sum + itemSubtotal;
    }, 0);

    const discount = Number(data.discount_value) || 0;
    const newTotal = Math.max(0, newSubtotal - discount);

    if (Math.abs(newSubtotal - (Number(data.subtotal) || 0)) > 0.01) {
      setData("subtotal", parseFloat(newSubtotal.toFixed(2)));
    }

    if (Math.abs(newTotal - (Number(data.total) || 0)) > 0.01) {
      setData("total", parseFloat(newTotal.toFixed(2)));
    }
  }, [data.items, data.discount_value, data.subtotal, data.total, setData]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Basic field validation
    if (!data.investor_id) {
      errors.investor_id = "Investor is required";
    }

    if (!data.sale_date) {
      errors.sale_date = "Sale date is required";
    }

    const discountValue = Number(data.discount_value) || 0;
    const subtotalValue = Number(data.subtotal) || 0;

    if (discountValue < 0) {
      errors.discount_value = "Discount value cannot be negative";
    }

    if (discountValue > subtotalValue) {
      errors.discount_value = "Discount cannot exceed subtotal";
    }

    // Items validation
    const items = Array.isArray(data.items) ? data.items : [];
    items.forEach((item, index) => {
      const purchaseItem = purchaseItems.find(pi => pi.id === item.purchase_item_id);
      const availableQty = purchaseItem?.available_quantity || 0;

      if (!item.purchase_item_id) {
        errors[`items.${index}.purchase_item_id`] = "Product is required";
      }

      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0) {
        errors[`items.${index}.quantity`] = "Quantity must be greater than 0";
      } else if (quantity > (availableQty + quantity)) {
        errors[`items.${index}.quantity`] = `Only ${availableQty} items available`;
      }

      const salePrice = Number(item.sale_price) || 0;
      if (salePrice < 0) {
        errors[`items.${index}.sale_price`] = "Sale price cannot be negative";
      }

      const unitPrice = purchaseItem?.unit_price || 0;
      if (salePrice < unitPrice) {
        errors[`items.${index}.sale_price`] = "Sale price should not be below purchase price";
      }
    });

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  }, [data, purchaseItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) {
      toast.error("Please add at least one item to the sale");
      return;
    }

    // Prepare form data with proper number conversion
    const formData = {
      ...data,
      subtotal: Number(data.subtotal) || 0,
      discount_value: Number(data.discount_value) || 0,
      total: Number(data.total) || 0,
      items: items.map(item => ({
        purchase_item_id: item.purchase_item_id,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        sale_price: Number(item.sale_price) || 0,
        subtotal: Number(item.subtotal) || 0,
      }))
    };

    put(route('sales.update', sale.id), formData, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Sale updated successfully!");
      },
      onError: () => {
        toast.error("Failed to update sale. Please check the form for errors.");
      },
    });
  };

  const addItemFromSearch = (purchaseItem: PurchaseItem) => {
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.some(item => item.purchase_item_id === purchaseItem.id)) {
      toast.warning("This item is already in the sale");
      return;
    }

    const newItem: SaleItemForm = {
      purchase_item_id: purchaseItem.id,
      quantity: 1,
      unit_price: Number(purchaseItem.unit_price) || 0,
      sale_price: Number(purchaseItem.sale_price) || 0,
      subtotal: Number(purchaseItem.sale_price) || 0,
      product_name: purchaseItem.product_name || "",
      barcode_generated: purchaseItem.barcode_generated || "",
      available_quantity: purchaseItem.available_quantity || 0,
    };

    setData("items", [...items, newItem]);
    setSearchTerm("");
    setShowSearchResults(false);

    // Clear related errors
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('items.')) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const removeItem = (index: number) => {
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length <= 1) {
      toast.warning("You need at least one item in the sale");
      return;
    }

    const updatedItems = items.filter((_, i) => i !== index);
    setData("items", updatedItems);

    // Clear related errors
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`items.${index}.`)) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const updateItem = (index: number, field: keyof SaleItemForm, value: any) => {
    const items = Array.isArray(data.items) ? data.items : [];
    const updatedItems = [...items];

    if (field === "quantity") {
      const quantity = Math.max(parseInt(value) || 0, 0);
      const availableQty = updatedItems[index]?.available_quantity || 0;
      updatedItems[index].quantity = Math.min(quantity, availableQty);
    } else if (field === "sale_price") {
      updatedItems[index].sale_price = Math.max(parseFloat(value) || 0, 0);
    } else {
      (updatedItems[index] as any)[field] = value;
    }

    // Recalculate subtotal
    const quantity = Number(updatedItems[index].quantity) || 0;
    const salePrice = Number(updatedItems[index].sale_price) || 0;
    updatedItems[index].subtotal = parseFloat((quantity * salePrice).toFixed(2));

    setData("items", updatedItems);

    // Clear field-specific error
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`items.${index}.${field}`];
      return newErrors;
    });
  };

  const handleFieldChange = (field: keyof SaleFormData, value: any) => {
    setData(field, value);

    if (validationErrors[field]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear items when investor changes
    if (field === "investor_id" && data.items.length > 0) {
      setData("items", []);
      toast.info("Items cleared for new investor selection");
    }
  };

  const getAvailableQuantity = (purchaseItemId: number): number => {
    return purchaseItems.find(pi => pi.id === purchaseItemId)?.available_quantity || 0;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Shopping Cart Icon Component
  const ShoppingCart = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href={route('sales')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales
          </Link>
        </Button>
      }
    >
      <Head title={`Edit ${sale.invoice_number || `Sale #${sale.id}`}`} />

      <div className="py-6 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Edit Sale {sale.invoice_number && `- ${sale.invoice_number}`}
          </h1>
          <p className="text-gray-600 mt-2">Update sale transaction information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sale Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Sale Information
              </CardTitle>
              <CardDescription>Update basic details about the sale transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Investor */}
                <div className="space-y-2">
                  <Label htmlFor="investor_id" className="required">
                    Investor
                  </Label>
                  <select
                    id="investor_id"
                    value={data.investor_id}
                    onChange={(e) => handleFieldChange("investor_id", e.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      validationErrors.investor_id && "border-destructive"
                    )}
                  >
                    <option value="">Select Investor</option>
                    {investors.map((investor) => (
                      <option key={investor.id} value={investor.id}>
                        {investor.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.investor_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.investor_id}
                    </p>
                  )}
                </div>

                {/* Invoice Number */}
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">
                    Invoice Number
                  </Label>
                  <Input
                    id="invoice_number"
                    value={data.invoice_number}
                    onChange={(e) => handleFieldChange("invoice_number", e.target.value)}
                    placeholder="SALE-001"
                    className={cn(
                      validationErrors.invoice_number && "border-destructive"
                    )}
                  />
                  {validationErrors.invoice_number && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.invoice_number}
                    </p>
                  )}
                </div>

                {/* Sale Date */}
                <div className="space-y-2">
                  <Label htmlFor="sale_date" className="required">
                    Sale Date
                  </Label>
                  <Input
                    id="sale_date"
                    type="date"
                    value={data.sale_date}
                    onChange={(e) => handleFieldChange("sale_date", e.target.value)}
                    className={cn(
                      validationErrors.sale_date && "border-destructive"
                    )}
                  />
                  {validationErrors.sale_date && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.sale_date}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Search - Only show if investor is selected */}
          {data.investor_id ? (
            <Card className=" border dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Add Products
                  {loadingProducts && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
                <CardDescription>
                  {loadingProducts ? (
                    "Loading products..."
                  ) : (
                    `Search for products by barcode or name. ${availablePurchaseItems.length} products available in stock for this investor.`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative search-container">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by barcode, product name, or reference..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      className="pl-10 pr-10"
                      disabled={loadingProducts || availablePurchaseItems.length === 0}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Search Results */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full p-3 text-left border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                          onClick={() => addItemFromSearch(item)}
                        >
                          <div className="font-medium text-sm">{item.product_name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Barcode: {item.barcode_generated} | Available: {item.available_quantity} | Price: {formatCurrency(item.sale_price || 0)} DZD
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No products available message */}
                  {!loadingProducts && availablePurchaseItems.length === 0 && data.investor_id && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="text-amber-800 dark:text-amber-200 text-sm">
                        No products available for this investor. Please select a different investor or ensure the investor has products in stock.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className=" border dark:border-zinc-800 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Add Products
                </CardTitle>
                <CardDescription>
                  Please select an investor first to view available products.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg text-center">
                  <AlertCircle className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select an investor to view available products
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sale Items */}
          <Card className="border dark:border-zinc-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <ShoppingCart className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                Shopping Cart
                </CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">
                {items.length} item(s) added to this sale
              </CardDescription>
            </CardHeader>

            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-40 text-zinc-500 dark:text-zinc-400" />
                  <p className="font-medium text-zinc-700 dark:text-zinc-200">No items added yet</p>
                  <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-400">
                    {data.investor_id
                      ? "Search for products above to add them to the sale."
                      : "Select an investor first to add products."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const availableQty = getAvailableQuantity(item.purchase_item_id);
                    const maxQuantity = Math.min(availableQty, 99999);

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-14 gap-4 p-4 border rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm"
                      >
                        {/* Product Info */}
                        <div className="lg:col-span-4">
                          <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                            Product{" "}
                            <span className="text-zinc-500 dark:text-zinc-400">
                              ({item.barcode_generated})
                            </span>
                          </Label>
                          <div className="mt-1 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700">
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                              {item.product_name}
                            </div>
                          </div>
                          {validationErrors[`items.${index}.purchase_item_id`] && (
                            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors[`items.${index}.purchase_item_id`]}
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="lg:col-span-2">
                          <Label
                            htmlFor={`quantity-${index}`}
                            className="required text-zinc-700 dark:text-zinc-200"
                          >
                            Quantity
                          </Label>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {" "}
                            (Available: {availableQty})
                          </span>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            max={maxQuantity + item.quantity}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", e.target.value)
                            }
                            className={cn(
                              "mt-1 bg-white dark:bg-zinc-800 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600",
                              validationErrors[`items.${index}.quantity`] &&
                              "border-destructive"
                            )}
                          />
                          {validationErrors[`items.${index}.quantity`] && (
                            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors[`items.${index}.quantity`]}
                            </p>
                          )}
                        </div>


                        {/* Purchase Price */}
                        <div className="lg:col-span-2">
                            <Label
                            htmlFor={`price-${index}`}
                            className="required text-zinc-700 dark:text-zinc-200"
                            >
                            Purchase Price (DZD)
                            </Label>
                            <Input
                            readOnly
                            id={`price-${index}`}
                            type="number"
                            value={item.unit_price}
                            className={"mt-1 bg-red-600 text-white dark:bg-red-800 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600 "}
                            />
                        </div>

                        {/* Sale Price */}
                        <div className="lg:col-span-2">
                          <Label
                            htmlFor={`price-${index}`}
                            className="required text-zinc-700 dark:text-zinc-200"
                          >
                            Sale Price (DZD)
                          </Label>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.sale_price}
                            onChange={(e) =>
                              updateItem(index, "sale_price", e.target.value)
                            }
                            className={cn(
                              "mt-1 bg-white dark:bg-zinc-800 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600",
                              validationErrors[`items.${index}.sale_price`] &&
                              "border-destructive"
                            )}
                          />
                          {validationErrors[`items.${index}.sale_price`] && (
                            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {validationErrors[`items.${index}.sale_price`]}
                            </p>
                          )}
                        </div>

                        {/* Subtotal */}
                        <div className="lg:col-span-2">
                          <Label className="text-zinc-700 dark:text-zinc-200">
                            Subtotal (DZD)
                          </Label>
                          <Input
                            value={formatCurrency(item.subtotal)}
                            readOnly
                            className="mt-1 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 font-medium border-zinc-200 dark:border-zinc-700"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-end justify-end lg:col-span-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-9 w-9 mt-2 lg:mt-7"
                            disabled={items.length <= 1}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <div className="flex justify-end">
            <Card className="w-full lg:w-2/5">
              <CardHeader>
                <CardTitle className="text-xl">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <Label className="text-base">Subtotal</Label>
                  <span className="text-lg font-semibold">
                    {formatCurrency(Number(data.subtotal) || 0)} DZD
                  </span>
                </div>

                {/* Discount */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount_reason">Discount Reason</Label>
                    <Input
                      id="discount_reason"
                      value={data.discount_reason}
                      onChange={(e) => handleFieldChange("discount_reason", e.target.value)}
                      placeholder="Special offer, bulk discount, etc."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_value">Discount Amount (DZD)</Label>
                    <Input
                      id="discount_value"
                      type="number"
                      min="0"
                      step="0.01"
                      max={Number(data.subtotal) || 0}
                      value={data.discount_value}
                      onChange={(e) => handleFieldChange("discount_value", Math.max(parseFloat(e.target.value) || 0, 0))}
                      className={cn(
                        "mt-1",
                        validationErrors.discount_value && "border-destructive"
                      )}
                    />
                    {validationErrors.discount_value && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.discount_value}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Label className="text-lg font-semibold">Total Amount</Label>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(Number(data.total) || 0)} DZD
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="note">Notes (Optional)</Label>
              <Textarea
                id="note"
                value={data.note}
                onChange={(e) => setData("note", e.target.value)}
                placeholder="Any additional information about this sale..."
                rows={3}
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={processing}
            >
              <Link href={route('sales')}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={processing || items.length === 0 || !data.investor_id}
              className="min-w-32"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  Update Sale
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
