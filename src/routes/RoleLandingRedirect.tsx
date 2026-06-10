import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getHomeRoute } from '@/utils/businessRules';

export function RoleLandingRedirect() {
  const { session, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return null;
  }

  return <Navigate to={session ? getHomeRoute(session.role) : '/login'} replace />;
}
