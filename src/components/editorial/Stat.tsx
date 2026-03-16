interface StatProps {
  value: string;
  label: string;
}

/**
 * Large stat display — value in primary color, label in muted.
 */
export function Stat({ value, label }: StatProps) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
