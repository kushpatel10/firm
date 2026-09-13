import { Construction } from "lucide-react";

/**
 * Coming Soon placeholder for unbuilt features.
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 */
export function ComingSoon({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-16 text-center min-h-[400px]">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Construction className="h-10 w-10 text-primary" />
      </div>
      <h3 className="mt-6 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {description || "This feature is under development and will be available soon."}
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        Coming Soon
      </div>
    </div>
  );
}
