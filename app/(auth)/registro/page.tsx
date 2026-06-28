import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registro",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-meru-sand px-4 py-12">
      <RegisterForm />
    </div>
  );
}
