import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

/**
 * Page header with title, breadcrumbs, and optional action buttons.
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {Array<{ label: string, href?: string }>} [props.breadcrumbs]
 * @param {React.ReactNode} [props.actions]
 */
export function PageHeader({ title, description, breadcrumbs = [], actions }) {
  return (
    <div className="space-y-1">
      {breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={i}>
                <BreadcrumbItem>
                  {i === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href || "#"}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {i < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4 sm:pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
}
