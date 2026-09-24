import { notFound } from "next/navigation";
import { CouponForm } from "@/features/admin/components/coupon-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCouponByIdAdmin } from "@/features/coupons/lib/get-coupons";

type Props = { params: Promise<{ id: string }> };

export default async function EditCouponPage({ params }: Props) {
  const { id } = await params;
  const coupon = await getCouponByIdAdmin(id);
  if (!coupon) notFound();

  return (
    <div>
      <PageHeader title="Editar cupón" description={coupon.code} />
      <CouponForm coupon={coupon} />
    </div>
  );
}
