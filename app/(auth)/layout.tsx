import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-meru-sand px-4 py-12">
      <div className="mb-8">
        <BrandLogo href="/" size="xl" priority />
      </div>
      {children}
    </div>
  );
}
