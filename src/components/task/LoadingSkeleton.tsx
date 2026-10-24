import { useDelayedVisibility } from "../../hooks/useDelayedVisibility";

const widths = [75, 85, 60, 90, 70];

export default function LoadingSkeleton() {
  const visible = useDelayedVisibility(150);

  if (!visible) return null;

  return (
    <div className="space-y-3 animate-in fade-in-0 duration-200 ease-out">
      <div className="h-10 bg-muted rounded-lg" />
      {widths.map((w, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg">
          <div className="size-5 rounded-full bg-accent animate-pulse mt-0.5" />
          <div className="flex-1 space-y-2">
            <div
              className="h-3.5 bg-accent rounded animate-pulse"
              style={{ width: `${w}%` }}
            />
            <div
              className="h-3 bg-muted rounded animate-pulse"
              style={{ width: `${w - 20}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
