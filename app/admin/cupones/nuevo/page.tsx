import { CouponForm } from "@/features/admin/components/coupon-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default function NewCouponPage() {
  return (
    <div>
      <PageHeader
        title="Nuevo cupón"
        description="Código de descuento para una vendedora, con su comisión."
      />
      <CouponForm />
    </div>
  );
}
