import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Clean, minimal metric card with crisp typography and subtle micro-interactions.
 */
export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendDirection = "neutral",
  className,
}) {
  return (
    <Card
      className={cn(
        "group relative rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-foreground/20 hover:bg-card/90",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground tracking-wide">
          {title}
        </span>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/80 border border-border/50 text-muted-foreground transition-colors group-hover:text-foreground">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
      </div>

      {(description || trend) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "font-medium",
                trendDirection === "up" && "text-foreground font-semibold",
                trendDirection === "down" && "text-muted-foreground",
                trendDirection === "neutral" && "text-muted-foreground"
              )}
            >
              {trend}
            </span>
          )}
          {description && <span className="truncate text-muted-foreground/80">{description}</span>}
        </div>
      )}
    </Card>
  );
}
