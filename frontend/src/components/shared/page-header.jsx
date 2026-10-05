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
        <Breadcrumb className="hidden sm:block">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3.5 sm:pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 touch-scroll w-full sm:w-auto shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
