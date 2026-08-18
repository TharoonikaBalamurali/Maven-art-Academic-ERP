import { useId } from 'react';

/**
 * Stable ids for label/description/error wiring.
 *
 * Every form control needs an id for its `<label for>`, plus ids for the
 * elements referenced by `aria-describedby` and `aria-errormessage`.
 */
export function useFieldIds(providedId?: string) {
  const generated = useId();
  const id = providedId ?? generated;
  return {
    id,
    labelId: `${id}-label`,
    descriptionId: `${id}-description`,
    errorId: `${id}-error`,
  };
}
