import { Sheet } from "./Sheet";

type Props = {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
};

export function BarcodeSheet({ open, onClose, onScan }: Props) {
  return (
    <Sheet open={open} title="Scan barcode" onClose={onClose}>
      <p className="text-sm text-fog">
        On a real phone, your camera opens here. For this prototype, type a code or tap a demo product.
      </p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const code = String(data.get("code") ?? "").trim();
          if (code) onScan(code);
        }}
      >
        <input
          name="code"
          placeholder="4800123456789"
          className="flex-1 rounded-2xl border border-line bg-card px-3 py-3 outline-none"
          inputMode="numeric"
        />
        <button type="submit" className="rounded-2xl bg-eat px-4 py-3 font-semibold text-ink">
          Look up
        </button>
      </form>
      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-fog">Demo scans</p>
        {[
          { code: "4800123456789", label: "Jollibee Chickenjoy" },
          { code: "4800987654321", label: "7-Eleven siopao" },
          { code: "4800555123456", label: "Kwek-kwek" },
          { code: "4800666123456", label: "McDo Burger McDo" },
        ].map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => onScan(item.code)}
            className="flex w-full items-center justify-between rounded-2xl bg-card px-3 py-3 text-left"
          >
            <span>{item.label}</span>
            <span className="font-mono text-xs text-fog">{item.code.slice(-4)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
