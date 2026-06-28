import { AuthGoogleProvider } from "@/features/auth/components/auth-google-provider";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthGoogleProvider>{children}</AuthGoogleProvider>;
}
