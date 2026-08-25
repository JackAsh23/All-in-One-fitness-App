type Props = {
  grams: number;
  onChange: (grams: number) => void;
  step?: number;
};

export function PortionStepper({ grams, onChange, step = 10 }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(10, grams - step))}
        className="grid size-10 place-items-center rounded-xl bg-card text-lg"
      >
        −
      </button>
      <div className="flex-1 text-center">
        <p className="font-mono text-2xl">{grams}g</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(grams + step)}
        className="grid size-10 place-items-center rounded-xl bg-card text-lg"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => onChange(grams + 25)}
        className="rounded-xl bg-card px-3 py-2 text-xs text-fog"
      >
        +25
      </button>
    </div>
  );
}
