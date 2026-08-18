/**
 * Delivery status of a screen (Part 15 of the review brief).
 *
 * Shown in the UI so a placeholder can never be mistaken for a finished
 * module during a demo or a review.
 *
 *   foundation  — infrastructure that is complete and depended upon
 *   placeholder — route and guard exist; no business functionality
 *   partial     — some functionality delivered, some pending
 *   implemented — the module as specified
 */
export type ModuleStatus = 'foundation' | 'placeholder' | 'partial' | 'implemented';

export const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = {
  foundation: 'Foundation',
  placeholder: 'Placeholder',
  partial: 'Partially implemented',
  implemented: 'Implemented',
};

export const MODULE_STATUS_TONE = {
  foundation: 'accent',
  placeholder: 'warning',
  partial: 'info',
  implemented: 'success',
} as const;
