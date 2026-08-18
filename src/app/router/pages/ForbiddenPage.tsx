import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { homePathForRole } from '@/features/auth/portal';
import { Button, ForbiddenState } from '@/shared/ui';

/** The 403 experience required by specification §12. */
export function ForbiddenPage() {
  const role = useAuthStore((state) => state.identity?.role);
  const home = role ? homePathForRole(role) : '/login';

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center">
      <ForbiddenState description="You do not have permission to view this page. If you believe this is a mistake, contact your administrator." />
      <Button variant="secondary" size="sm" className="mt-2">
        <Link to={home}>Back to dashboard</Link>
      </Button>
    </div>
  );
}
