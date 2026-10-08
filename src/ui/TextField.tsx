import type { ComponentProps } from 'react';
import * as stylex from '@stylexjs/stylex';
import { controls } from '../styles/controls';
import { FieldFrame, useField, fieldStyles, type FieldProps } from './Field';

type Controlled = FieldProps & {
  value: string;
  onChange: (value: string) => void;
};
export type TextFieldProps = Controlled &
  Omit<
    ComponentProps<'input'>,
    keyof Controlled | 'onChange' | 'defaultValue' | 'type'
  > & { type?: 'text' | 'email' | 'url' | 'password' | 'search' | 'tel' };
export type TextAreaFieldProps = Controlled &
  Omit<
    ComponentProps<'textarea'>,
    keyof Controlled | 'onChange' | 'defaultValue'
  >;
export function TextField({
  label,
  hint,
  error,
  id,
  required,
  value,
  onChange,
  className,
  ...props
}: TextFieldProps) {
  const field = { label, hint, error, id, required };
  const ids = useField(field);
  const sx = stylex.props(controls.input, !!error && controls.invalid);
  return (
    <FieldFrame {...field} ids={ids}>
      <input
        {...props}
        {...sx}
        className={[sx.className, className].filter(Boolean).join(' ')}
        id={ids.id}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error || undefined}
        aria-describedby={
          [ids.describedBy, props['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
    </FieldFrame>
  );
}
export function TextAreaField({
  label,
  hint,
  error,
  id,
  required,
  value,
  onChange,
  className,
  ...props
}: TextAreaFieldProps) {
  const field = { label, hint, error, id, required };
  const ids = useField(field);
  const sx = stylex.props(
    controls.input,
    fieldStyles.area,
    !!error && controls.invalid,
  );
  return (
    <FieldFrame {...field} ids={ids}>
      <textarea
        {...props}
        {...sx}
        className={[sx.className, className].filter(Boolean).join(' ')}
        id={ids.id}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error || undefined}
        aria-describedby={
          [ids.describedBy, props['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
    </FieldFrame>
  );
}
