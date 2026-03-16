interface SectionNumProps {
  n: string;
  label: string;
}

/**
 * Large semi-transparent section number (editorial style).
 * e.g. "01" with a small label below.
 */
export function SectionNum({ n, label }: SectionNumProps) {
  return (
    <div className="select-none">
      <span className="text-[120px] leading-none font-bold text-primary/10 block">
        {n}
      </span>
      <span className="text-sm font-semibold uppercase tracking-widest text-primary">
        {label}
      </span>
    </div>
  );
}
