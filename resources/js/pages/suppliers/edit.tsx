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

interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface Props {
  supplier: Supplier;
}

export default function SuppliersEditPage({ supplier }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: supplier.name || "",
    email: supplier.email || "",
    phone: supplier.phone || "",
    address: supplier.address || "",
    notes: supplier.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/suppliers/${supplier.id}`);
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Suppliers", href: "/suppliers" },
    { title: "Edit", href: `/suppliers/${supplier.id}/edit` },
  ];

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/suppliers">
            <span className="hidden sm:inline-block">Back to Suppliers</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
      }
    >
      <Head title="Edit Supplier" />

      <div className="h-full flex flex-col">
        <Card className="w-full mx-auto flex flex-col flex-1 border-0 rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Edit Supplier</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col flex-1">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1 justify-between"
            >
              {/* Form Fields */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={data.name}
                      onChange={(e) => setData("name", e.target.value)}
                      placeholder="Supplier name"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={data.address}
                      onChange={(e) => setData("address", e.target.value)}
                      placeholder="Supplier address"
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => setData("email", e.target.value)}
                      placeholder="example@email.com"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={data.phone}
                      onChange={(e) => setData("phone", e.target.value)}
                      placeholder="+123456789"
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData("notes", e.target.value)}
                      placeholder="Additional information..."
                      rows={8}
                      className={`resize-y ${errors.notes ? "border-red-500" : ""}`}
                    />
                    {errors.notes && (
                      <p className="text-sm text-red-500 mt-1">{errors.notes}</p>
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
                  <Link href="/suppliers">Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update Supplier"
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
