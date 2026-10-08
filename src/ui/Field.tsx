import { useId, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { controls } from '../styles/controls';
import { tokens } from '../styles/tokens.stylex';

export interface FieldProps {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
export function useField({ id, hint, error }: FieldProps) {
  const generated = useId();
  const controlId = id ?? generated;
  return {
    id: controlId,
    labelId: `${controlId}-label`,
    hintId: `${controlId}-hint`,
    errorId: `${controlId}-error`,
    describedBy:
      [hint && `${controlId}-hint`, error && `${controlId}-error`]
        .filter(Boolean)
        .join(' ') || undefined,
  };
}
export const fieldStyles = stylex.create({
  error: {
    margin: 0,
    color: tokens.danger,
    fontSize: 13,
    overflowWrap: 'anywhere',
  },
  area: { resize: 'vertical', minHeight: 120 },
  disabled: { opacity: 0.5 },
  label: { fontWeight: 550 },
});
export function FieldFeedback({
  hint,
  error,
  ids,
}: Pick<FieldProps, 'hint' | 'error'> & { ids: ReturnType<typeof useField> }) {
  return (
    <>
      {hint && (
        <p id={ids.hintId} {...stylex.props(controls.muted)}>
          {hint}
        </p>
      )}
      {error && (
        <p id={ids.errorId} role="alert" {...stylex.props(fieldStyles.error)}>
          {error}
        </p>
      )}
    </>
  );
}
export function FieldFrame({
  label,
  required,
  hint,
  error,
  ids,
  children,
}: FieldProps & { ids: ReturnType<typeof useField>; children: ReactNode }) {
  return (
    <div {...stylex.props(controls.field)}>
      <label
        id={ids.labelId}
        htmlFor={ids.id}
        {...stylex.props(fieldStyles.label)}
      >
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      <FieldFeedback hint={hint} error={error} ids={ids} />
    </div>
  );
}
