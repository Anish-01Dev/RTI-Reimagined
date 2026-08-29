import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession, type Role } from "@/lib/demoIdentity";

/** Gates a route subtree to a session with the given role. A citizen who
 * somehow reaches /gov/* gets sent to the citizen home rather than an
 * error page, and vice versa — the wrong role isn't a login failure, it's
 * a wrong-door situation. */
export function ProtectedRoute({ role }: { role: Role }) {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (session.role !== role) {
    return (
      <Navigate to={session.role === "CITIZEN" ? "/app" : "/gov"} replace />
    );
  }
  return <Outlet />;
}
