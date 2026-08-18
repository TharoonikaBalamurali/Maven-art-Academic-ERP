import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { homePathForRole } from '@/features/auth/portal';

/** Sends `/` to the correct portal for the signed-in role, or to login. */
export function RootRedirect() {
  const role = useAuthStore((state) => state.identity?.role);
  return <Navigate to={role ? homePathForRole(role) : '/login'} replace />;
}
