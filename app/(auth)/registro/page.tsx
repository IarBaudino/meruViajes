import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registro",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
