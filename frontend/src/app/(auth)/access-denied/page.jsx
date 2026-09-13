import { Button } from "@/components/ui/button";
import { ShieldOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground text-lg">
            Your Google account is not registered in the system.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          This is a private platform. Only users created by the Super Admin can
          access it. Please contact your administrator to request access.
        </p>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/login">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </Button>
      </div>
    </div>
  );
}
