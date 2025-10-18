import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, User, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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

export default function InvestorTransactionsCreatePage({
  investors,
}: {
  investors: Investor[];
}) {
  const { data, setData, processing, errors, reset } = useForm({
    date: new Date().toISOString().split('T')[0], // Default to today
    type: "In",
    amount: "",
    note: "",
    investor_id: "",
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
    // Use router.post instead of useForm's post to get proper error handling
    router.post("/investor_transactions", {
      ...formDataForSubmission,
      password,
    }, {
      onSuccess: () => {
        setShowPasswordModal(false);
        reset();
        setFormDataForSubmission({});
        toast.success("Investor transaction created successfully!");
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

  const handleClearAmount = () => {
    setData("amount", "");
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

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Investor Transactions", href: "/investor_transactions" },
    { title: "Create", href: "/investor_transactions/create" },
  ];

  const isFormValid = data.date && data.amount && data.investor_id && parseFloat(data.amount) > 0;

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
      <Head title="Create Investor Transaction" />

      <div className="h-full flex flex-col">
        <Card className="w-full mx-auto flex flex-col flex-1 border-0 rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create New Investor Transaction
            </CardTitle>
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
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates in browser
                      className={errors.date ? "border-red-500" : ""}
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
                          required
                        />
                        {data.amount && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleClearAmount}
                            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
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
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Optional</span>
                      <span>{data.note.length}/500</span>
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
                <Button type="button" variant="outline" asChild disabled={processing}>
                  <Link href="/investor_transactions">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={processing || !isFormValid}
                  className="min-w-32"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Transaction"
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
          action="create"
          isLoading={processing}
        />
      </div>
    </AppLayout>
  );
}
