"use client";

type TransferInfo = {
  bankName?: string;
  accountHolder?: string;
  cbu?: string;
  alias?: string;
  notes?: string;
};

export function TransferBankDetails({ transfer }: { transfer: TransferInfo }) {
  const rows = [
    transfer.bankName ? ["Banco", transfer.bankName] : null,
    transfer.accountHolder ? ["Titular", transfer.accountHolder] : null,
    transfer.cbu ? ["CBU", transfer.cbu] : null,
    transfer.alias ? ["Alias", transfer.alias] : null,
  ].filter((row): row is [string, string] => Boolean(row));

  if (rows.length === 0 && !transfer.notes) return null;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-ice/50 p-4 text-left text-sm text-brand-charcoal">
      <p className="font-medium">Transferencia</p>
      <dl className="mt-2 space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap gap-x-2">
            <dt className="text-brand-muted">{label}:</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {transfer.notes ? (
        <p className="mt-2 whitespace-pre-line text-brand-muted">{transfer.notes}</p>
      ) : null}
    </div>
  );
}
