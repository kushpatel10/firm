import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  ACTIVE: {
    style: "border-border/80 bg-secondary/80 text-foreground",
    dot: "bg-foreground",
  },
  CONFIRMED: {
    style: "border-border/80 bg-secondary/80 text-foreground",
    dot: "bg-foreground",
  },
  DELIVERED: {
    style: "border-border/80 bg-secondary/80 text-foreground",
    dot: "bg-foreground",
  },
  RECEIVED: {
    style: "border-border/80 bg-secondary/80 text-foreground",
    dot: "bg-foreground",
  },
  ORDERED: {
    style: "border-border/70 bg-secondary/50 text-foreground/90",
    dot: "bg-muted-foreground",
  },
  DRAFT: {
    style: "border-border/60 bg-transparent text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
  INACTIVE: {
    style: "border-border/50 bg-transparent text-muted-foreground/80",
    dot: "bg-muted-foreground/40",
  },
  CLOSED: {
    style: "border-border/50 bg-transparent text-muted-foreground/80",
    dot: "bg-muted-foreground/40",
  },
  ARCHIVED: {
    style: "border-border/50 bg-transparent text-muted-foreground/80",
    dot: "bg-muted-foreground/40",
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
 * ChatGPT-inspired sleek minimalist status pill badge.
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-normal transition-colors",
        config.style,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      <span>{normalized || "UNKNOWN"}</span>
    </Badge>
  );
}
