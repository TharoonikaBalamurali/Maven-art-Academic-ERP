import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { env } from '@/config/env';
import { useAuth, useAuthActions } from '@/features/auth/hooks';
import { homePathForRole } from '@/features/auth/portal';
import { useAuthStore } from '@/features/auth/auth.store';
import { FormError } from '@/shared/forms/FormError';
import { useApiForm } from '@/shared/forms/useApiForm';
import { Button, Card, CardBody, Input } from '@/shared/ui';
import { DemoCredentials } from './DemoCredentials';

/**
 * Client-side validation is shape-only (§30). The backend decides whether the
 * credentials are actually valid.
 */
const loginSchema = z.object({
  email: z.string().min(1, 'Enter your email address.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const role = useAuthStore((state) => state.identity?.role);
  const sessionError = useAuthStore((state) => state.error);
  const { login, clearError } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();

  // A message left by an expired session should not survive into a new attempt.
  useEffect(() => clearError, [clearError]);

  const { form, formError, submit, isSubmitting } = useApiForm<LoginValues>({
    schema: loginSchema,
    defaultValues: { email: '', password: '' },
    onSubmit: async (values) => {
      await login(values);
      const state = location.state as LocationState | null;
      const target = state?.from?.pathname;
      const identity = useAuthStore.getState().identity;
      navigate(target && target !== '/login' ? target : identity ? homePathForRole(identity.role) : '/', {
        replace: true,
      });
    },
  });

  if (isAuthenticated && role) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  const { errors } = form.formState;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--surface-sunken)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-page font-semibold">{env.appName}</h1>
          <p className="mt-1 text-body text-[var(--text-muted)]">Sign in to continue</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              <FormError message={formError ?? (form.formState.isDirty ? null : sessionError)} />

              <Input
                label="Email address"
                type="email"
                autoComplete="username"
                autoFocus
                required
                error={errors.email?.message}
                {...form.register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                error={errors.password?.message}
                {...form.register('password')}
              />

              <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Signing in…">
                Sign in
              </Button>
            </form>
          </CardBody>
        </Card>

        {env.apiMode === 'mock' && <DemoCredentials />}
      </div>
    </div>
  );
}
