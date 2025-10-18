import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, User, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PasswordConfirmModal } from "@/components/password-confirm-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";

type BreadcrumbItem = {
  title: string;
  href: string;
};

type Investor = {
  id: number;
  name: string;
};

type PageProps = {
  investors: Investor[];
  transaction: {
    id: number;
    date: string;
    type: string;
    amount: string;
    note: string | null;
    investor_id: number;
    purchase_id: number | null;
    sale_id: number | null;
    created_at: string;
    updated_at: string;
  };
};

export default function InvestorTransactionsEditPage() {
  const { transaction, investors } = usePage<PageProps>().props;

  const { data, setData, processing, errors } = useForm({
    date: transaction.date || new Date().toISOString().split('T')[0],
    type: transaction.type || "In",
    amount: transaction.amount || "",
    note: transaction.note || "",
    investor_id: transaction.investor_id?.toString() || "",
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formDataForSubmission, setFormDataForSubmission] = useState({});

  // Validate date string and check if it's in the future
  const isValidDate = (dateString: string): { isValid: boolean; isFuture: boolean; date: Date | null } => {
    // Parse the date string (YYYY-MM-DD format from input)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return { isValid: false, isFuture: false, date: null };
    }

    // Create today's date without time component for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compare dates (ignoring time)
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    return {
      isValid: true,
      isFuture: selectedDate > today,
      date: selectedDate
    };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if transaction is linked to other records
    if (isLinkedToOtherRecords) {
      toast.error("This transaction is linked to other records and cannot be edited.");
      return;
    }

    // Client-side validation
    if (!data.date || !data.amount || !data.investor_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate date format and future date
    const dateValidation = isValidDate(data.date);
    if (!dateValidation.isValid) {
      toast.error("Please enter a valid date");
      return;
    }

    if (dateValidation.isFuture) {
      const formattedDate = dateValidation.date?.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      toast.error(`${formattedDate} is in the future. Please select a valid date.`);
      return;
    }

    // Validate amount is positive
    const amountValue = parseFloat(data.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Amount must be a number greater than 0");
      return;
    }

    // Store the form data for later submission and show password modal
    setFormDataForSubmission({ ...data });
    setShowPasswordModal(true);
  };

  const handlePasswordConfirm = (password: string) => {
    // Use router.put instead of useForm's put to get proper error handling
    router.put(`/investor_transactions/${transaction.id}`, {
      ...formDataForSubmission,
      password,
    }, {
      onSuccess: () => {
        setShowPasswordModal(false);
        toast.success("Investor transaction updated successfully!");
      },
      onError: (errors) => {
        if (errors.password) {
          // Password error - show in toast and keep modal open
          toast.error(errors.password);
        } else {
          // Other form errors - close modal and they will be displayed automatically
          setShowPasswordModal(false);
          if (Object.keys(errors).length > 0) {
            toast.error("Please check the form for errors.");
          }
        }
      },
    });
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const decimalCount = (sanitizedValue.match(/\./g) || []).length;
    if (decimalCount <= 1) {
      setData("amount", sanitizedValue);
    }
  };

  const handleClearAmount = () => {
    setData("amount", "");
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Investor Transactions", href: "/investor_transactions" },
    { title: "Edit", href: `/investor_transactions/${transaction.id}/edit` },
  ];

  const isLinkedToOtherRecords = transaction.purchase_id !== null || transaction.sale_id !== null;

  const isFormValid = data.date && data.amount && data.investor_id &&
                     parseFloat(data.amount) > 0;

  // Check if there are any errors
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/investor_transactions">
            <span className="hidden sm:inline-block">Back to Transactions</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
      }
    >
      <Head title="Edit Investor Transaction" />

      <div className="h-full flex flex-col">
        <Card className="w-full mx-auto flex flex-col flex-1 border-0 rounded-none shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Edit Investor Transaction #{transaction.id}
              </CardTitle>
              <Badge variant={transaction.type === "In" ? "default" : "secondary"}>
                {transaction.type === "In" ? "Cash In" : "Cash Out"}
              </Badge>
            </div>

            {isLinkedToOtherRecords && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This transaction is linked to other records and cannot be edited or deleted.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>

          <CardContent className="flex flex-col flex-1 space-y-6">
            {/* Global Error Alert - Show when there are ANY errors */}
            {hasErrors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the errors below before proceeding.
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Created:</span>{" "}
                {new Date(transaction.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="text-sm">
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(transaction.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleFormSubmit}
              className="flex flex-col flex-1 justify-between"
              noValidate
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={data.date}
                      onChange={(e) => setData("date", e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={errors.date ? "border-red-500" : ""}
                      disabled={isLinkedToOtherRecords || processing}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Maximum allowed date: {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {errors.date && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.date}
                      </p>
                    )}
                  </div>

                  {/* Transaction Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type">
                      Type <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="type"
                      value={data.type}
                      onChange={(e) => setData("type", e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.type ? "border-red-500" : "border-gray-300"
                      }`}
                      disabled={isLinkedToOtherRecords || processing}
                      required
                    >
                      <option value="In">In - إدخال أموال للخزينة</option>
                      <option value="Out">Out - إخراج أموال من الخزينة</option>
                    </select>
                    {errors.type && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.type}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="amount">
                        Amount (DZD) <span className="text-red-500">*</span>
                      </Label>
                      <div className="text-xs text-gray-400">Must be greater than 0</div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="amount"
                          type="text"
                          inputMode="decimal"
                          value={data.amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="0.00"
                          className={`pr-12 ${errors.amount ? "border-red-500" : ""}`}
                          disabled={isLinkedToOtherRecords || processing}
                          required
                        />
                        {data.amount && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleClearAmount}
                            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
                            disabled={isLinkedToOtherRecords || processing}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>

                    {errors.amount && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  {/* Investor */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="investor_id" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Investor <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="investor_id"
                      value={data.investor_id}
                      onChange={(e) => setData("investor_id", e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.investor_id ? "border-red-500" : "border-gray-300"
                      }`}
                      disabled={isLinkedToOtherRecords || processing}
                      required
                    >
                      <option value="">Select investor</option>
                      {investors.map((investor) => (
                        <option key={investor.id} value={investor.id}>
                          {investor.name}
                        </option>
                      ))}
                    </select>
                    {errors.investor_id && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.investor_id}
                      </p>
                    )}
                    {investors.length === 0 && (
                      <p className="text-sm text-yellow-600 mt-1">
                        No investors found. Please create an investor first.
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Textarea
                      id="note"
                      value={data.note}
                      onChange={(e) => setData("note", e.target.value)}
                      placeholder="Additional details about this transaction..."
                      rows={4}
                      className={`resize-y focus:ring-2 focus:ring-blue-500 ${
                        errors.note ? "border-red-500" : ""
                      }`}
                      disabled={isLinkedToOtherRecords || processing}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Optional</span>
                      <span>{data.note?.length || 0}/500</span>
                    </div>
                    {errors.note && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.note}
                      </p>
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
                  <Link href="/investor_transactions">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={processing || !isFormValid || isLinkedToOtherRecords}
                  className="min-w-32"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : isLinkedToOtherRecords ? (
                    "Cannot Edit (Linked Transaction)"
                  ) : (
                    "Update Transaction"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Confirmation Modal */}
        <PasswordConfirmModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onConfirm={handlePasswordConfirm}
          action="update"
          isLoading={processing}
        />
      </div>
    </AppLayout>
  );
}
