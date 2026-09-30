import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  ACTIVE: {
    style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  CONFIRMED: {
    style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  DELIVERED: {
    style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  RECEIVED: {
    style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  ORDERED: {
    style: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  DRAFT: {
    style: "border-border/70 bg-secondary/60 text-muted-foreground",
    dot: "bg-muted-foreground/70",
  },
  INACTIVE: {
    style: "border-border/60 bg-transparent text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  CLOSED: {
    style: "border-border/60 bg-transparent text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  ARCHIVED: {
    style: "border-border/60 bg-transparent text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  SUSPENDED: {
    style: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  CANCELLED: {
    style: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

/**
 * Modern minimalist status pill badge with readable 12px text.
 * @param {Object} props
 * @param {string} props.status
 * @param {string} [props.className]
 */
export function StatusBadge({ status, className }) {
  const normalized = (status || "").toUpperCase();
  const config = STATUS_CONFIG[normalized] || {
    style: "border-border/60 bg-transparent text-muted-foreground",
    dot: "bg-muted-foreground/60",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-normal transition-colors shrink-0",
        config.style,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      <span>{normalized || "UNKNOWN"}</span>
    </Badge>
  );
}
