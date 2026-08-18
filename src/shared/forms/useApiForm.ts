import { useCallback, useState, type BaseSyntheticEvent } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { isApiError } from '@/lib/api';

export interface UseApiFormOptions<TValues extends FieldValues> {
  schema: ZodType<TValues>;
  defaultValues: DefaultValues<TValues>;
  onSubmit: (values: TValues) => Promise<void>;
}

export interface UseApiFormResult<TValues extends FieldValues> {
  form: UseFormReturn<TValues, unknown, TValues>;
  /** Error not attributable to a single field (e.g. 500, or invalid credentials). */
  formError: string | null;
  clearFormError: () => void;
  submit: (event?: BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Form foundation (Day 1 step 17).
 *
 * Combines the three things every ERP form needs:
 *
 *  1. schema validation for fast client-side feedback (UX only — the backend
 *     remains the authority, §30);
 *  2. mapping of 422 `fieldErrors` from the API onto the matching inputs, so
 *     backend validation lands next to the field that caused it;
 *  3. a form-level error slot for failures that belong to no single field.
 *
 * Frontend validation is deliberately limited to shape and presence. Anything
 * institutional (fee rules, eligibility, approval conditions) stays server-side.
 */
export function useApiForm<TValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
}: UseApiFormOptions<TValues>): UseApiFormResult<TValues> {
  const form = useForm<TValues, unknown, TValues>({
    // `zodResolver`'s overloads cannot be satisfied by a generic schema; the
    // runtime contract (schema output === TValues) is guaranteed by the
    // `ZodType<TValues>` parameter, so the cast is checked at every call site.
    resolver: zodResolver(schema as never) as Resolver<TValues, unknown, TValues>,
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const clearFormError = useCallback(() => setFormError(null), []);

  const submit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (caught) {
      if (isApiError(caught)) {
        const entries = Object.entries(caught.fieldErrors);
        if (entries.length > 0) {
          for (const [field, messages] of entries) {
            const message = messages[0];
            if (message) {
              form.setError(field as Path<TValues>, { type: 'server', message });
            }
          }
          // Field errors are shown inline; no banner needed.
          return;
        }
        setFormError(caught.message);
        return;
      }
      setFormError('An unexpected error occurred. Please try again.');
    }
  });

  return {
    form,
    formError,
    clearFormError,
    submit,
    isSubmitting: form.formState.isSubmitting,
  };
}
