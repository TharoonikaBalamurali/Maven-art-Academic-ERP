import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { homePathForRole } from '@/features/auth/portal';
import { Button, NotFoundState } from '@/shared/ui';

/** Route-level 404 (Day 1 step 7). */
export function NotFoundPage() {
  const role = useAuthStore((state) => state.identity?.role);
  const home = role ? homePathForRole(role) : '/login';

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center">
      <NotFoundState description="This page does not exist, or it has moved." />
      <Button variant="secondary" size="sm" className="mt-2">
        <Link to={home}>Back to dashboard</Link>
      </Button>
    </div>
  );
}
