import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { ApiError } from '@/lib/api';
import { renderWithProviders } from '@/test/render';
import { Button, Input } from '@/shared/ui';
import { FormError } from './FormError';
import { useApiForm } from './useApiForm';

const schema = z.object({
  email: z.string().min(1, 'Enter your email address.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type Values = z.infer<typeof schema>;

function TestForm({ onSubmit }: { onSubmit: (values: Values) => Promise<void> }) {
  const { form, formError, submit, isSubmitting } = useApiForm<Values>({
    schema,
    defaultValues: { email: '', password: '' },
    onSubmit,
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={submit} noValidate>
      <FormError message={formError} />
      <Input label="Email address" error={errors.email?.message} {...form.register('email')} />
      <Input
        label="Password"
        type="password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <Button type="submit" loading={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}

describe('useApiForm', () => {
  it('blocks submission and reports client-side validation errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<TestForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('associates each error with its input for assistive technology', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    const email = await screen.findByLabelText(/Email address/);
    expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = email.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? '')).toHaveTextContent(
      'Enter your email address.',
    );
  });

  it('maps backend 422 field errors onto the matching inputs', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({
        kind: 'validation',
        message: 'Some of the information provided is not valid.',
        status: 422,
        fieldErrors: { email: ['This email is already registered.'] },
      }),
    );

    renderWithProviders(<TestForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Email address/), 'taken@example.com');
    await user.type(screen.getByLabelText(/Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('This email is already registered.')).toBeInTheDocument();
    // A field-level failure should not also raise a form-level banner.
    expect(screen.queryByRole('alert', { name: /not valid/ })).not.toBeInTheDocument();
  });

  it('shows a form-level banner for failures that belong to no field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({ kind: 'server', message: 'Something went wrong on our side.', status: 500 }),
    );

    renderWithProviders(<TestForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Email address/), 'user@example.com');
    await user.type(screen.getByLabelText(/Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our side.');
  });

  it('never leaks a raw non-API failure to the user', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new TypeError('cannot read property of undefined'));

    renderWithProviders(<TestForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Email address/), 'user@example.com');
    await user.type(screen.getByLabelText(/Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('An unexpected error occurred. Please try again.');
    expect(alert).not.toHaveTextContent('undefined');
  });

  it('passes validated values through on success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<TestForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Email address/), 'user@example.com');
    await user.type(screen.getByLabelText(/Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'secret123',
      }),
    );
  });
});
