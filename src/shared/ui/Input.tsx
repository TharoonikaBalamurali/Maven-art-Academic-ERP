import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import { useFieldIds } from '@/lib/utils/id';
import { Field } from './Field';
import { controlClasses } from './control-classes';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hideLabel?: boolean;
  description?: string;
  error?: string;
  id?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel, description, error, id: providedId, containerClassName, className, required, ...rest },
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
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : description ? descriptionId : undefined}
        className={cn(controlClasses, className)}
        {...rest}
      />
    </Field>
  );
});
