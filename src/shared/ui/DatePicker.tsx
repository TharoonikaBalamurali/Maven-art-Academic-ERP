import { forwardRef } from 'react';
import { Input, type InputProps } from './Input';

export type DatePickerProps = Omit<InputProps, 'type'>;

/**
 * Date input.
 *
 * Day 1 decision: use the native `<input type="date">` rather than a calendar
 * library. It is accessible and localised for free, and it gives mobile users
 * the OS date picker. If a future requirement needs range selection or
 * institution-specific calendars, this component is the single place to swap in
 * a richer implementation — no caller changes.
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  props,
  ref,
) {
  return <Input ref={ref} type="date" {...props} />;
});
