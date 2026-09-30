import { InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Empty state with icon, title, description, and optional action.
 * @param {Object} props
 * @param {React.ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {string} [props.actionLabel]
 * @param {Function} [props.onAction]
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 p-10 sm:p-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary border border-border/70 text-muted-foreground">
        {icon || <InboxIcon className="h-7 w-7 text-muted-foreground" />}
      </div>
      <h3 className="mt-4 text-base sm:text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-5 h-10 rounded-xl px-5 text-xs sm:text-sm font-semibold shadow-xs" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
