export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-meru-sand">
      <div className="mx-auto max-w-4xl px-4 py-12">{children}</div>
    </div>
  );
}
