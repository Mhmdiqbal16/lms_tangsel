import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Permission, Role } from '@/types';
import { getHomeRoute } from '@/utils/businessRules';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  requiredPermission?: Permission;
}

export function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { session, isAuthLoading, hasPermission } = useAuth();

  if (isAuthLoading) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to={getHomeRoute(session.role)} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={getHomeRoute(session.role)} replace />;
  }

  return <Outlet />;
}
