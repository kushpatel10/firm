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
        "group relative rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border hover:bg-card/90",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-[13px] font-medium text-muted-foreground tracking-tight truncate">
          {title}
        </span>
        {icon && (
          <div className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl bg-secondary/90 border border-border/70 text-muted-foreground transition-colors group-hover:text-foreground shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 sm:mt-3">
        <span className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground tabular-nums block truncate">
          {value}
        </span>
      </div>

      {(description || trend) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "font-semibold",
                trendDirection === "up" && "text-emerald-500 dark:text-emerald-400",
                trendDirection === "down" && "text-rose-500 dark:text-rose-400",
                trendDirection === "neutral" && "text-muted-foreground"
              )}
            >
              {trend}
            </span>
          )}
          {description && <span className="truncate text-muted-foreground/90">{description}</span>}
        </div>
      )}
    </Card>
  );
}
