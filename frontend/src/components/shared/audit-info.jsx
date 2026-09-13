import { formatDateTime } from "@/lib/utils";
import { Clock, User } from "lucide-react";

/**
 * Displays audit metadata (created/updated by/at).
 * @param {Object} props
 * @param {string} [props.createdAt]
 * @param {string} [props.updatedAt]
 * @param {string} [props.createdBy]
 * @param {string} [props.updatedBy]
 */
export function AuditInfo({ createdAt, updatedAt, createdBy, updatedBy }) {
  if (!createdAt && !updatedAt) return null;

  return (
    <div className="text-xs text-muted-foreground space-y-1 border-t pt-4 mt-4">
      {createdAt && (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>Created {formatDateTime(createdAt)}</span>
          {createdBy && (
            <>
              <User className="h-3 w-3 ml-2" />
              <span>{createdBy}</span>
            </>
          )}
        </div>
      )}
      {updatedAt && updatedAt !== createdAt && (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>Updated {formatDateTime(updatedAt)}</span>
          {updatedBy && (
            <>
              <User className="h-3 w-3 ml-2" />
              <span>{updatedBy}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
