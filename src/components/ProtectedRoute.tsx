import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentPortalUser } from "@/hooks/useCurrentPortalUser";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { canAccessManagement, loading: portalLoading } = useCurrentPortalUser(user?.id);

  // When authenticated but not allowed (e.g. orders-platform-only user), sign out and redirect
  useEffect(() => {
    if (authLoading || portalLoading || !user) return;
    if (canAccessManagement === false) {
      signOut();
    }
  }, [authLoading, portalLoading, user, canAccessManagement, signOut]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Still loading portal user for this auth user
  if (portalLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Authenticated but not a management user (e.g. orders platform only) — redirect after signOut
  if (!canAccessManagement) {
    return <Navigate to="/login" replace state={{ from: "management_access_denied" }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
