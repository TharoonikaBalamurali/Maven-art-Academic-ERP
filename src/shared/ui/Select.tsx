import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { useFieldIds } from '@/lib/utils/id';
import { Field } from './Field';
import { controlClasses } from './control-classes';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hideLabel?: boolean;
  description?: string;
  error?: string;
  id?: string;
  options: readonly SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

/**
 * A native `<select>`. Deliberately not a custom listbox: native selects are
 * keyboard- and screen-reader-correct everywhere and give mobile users the OS
 * picker, which matters for the mobile-first Student/Parent portal (§33).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hideLabel,
    description,
    error,
    id: providedId,
    options,
    placeholder,
    containerClassName,
    className,
    required,
    ...rest
  },
  ref,
) {
  const { id, descriptionId, errorId } = useFieldIds(providedId);

  return (
    <Field
      id={id}
      label={label}
      hideLabel={hideLabel}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      required={required}
      className={containerClassName}
    >
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : description ? descriptionId : undefined}
        className={cn(controlClasses, 'pr-8', className)}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
});
