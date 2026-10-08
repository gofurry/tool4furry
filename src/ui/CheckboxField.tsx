import { Checkbox } from '@base-ui/react/checkbox';
import { CheckIcon } from '@phosphor-icons/react';
import * as stylex from '@stylexjs/stylex';
import { tokens } from '../styles/tokens.stylex';
import { controls } from '../styles/controls';
import { FieldFeedback, useField, fieldStyles, type FieldProps } from './Field';

export interface CheckboxFieldProps extends FieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  name?: string;
}
export function CheckboxField({
  checked,
  onCheckedChange,
  name,
  ...field
}: CheckboxFieldProps) {
  const ids = useField(field);
  return (
    <div {...stylex.props(controls.field)}>
      <label
        htmlFor={ids.id}
        {...stylex.props(styles.label, field.disabled && fieldStyles.disabled)}
      >
        <Checkbox.Root
          id={ids.id}
          name={name}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={field.disabled}
          required={field.required}
          aria-labelledby={ids.labelId}
          aria-describedby={ids.describedBy}
          aria-invalid={!!field.error || undefined}
          {...stylex.props(
            styles.box,
            checked && styles.checked,
            !!field.error && controls.invalid,
          )}
        >
          <Checkbox.Indicator {...stylex.props(styles.indicator)}>
            <CheckIcon size={18} weight="bold" aria-hidden="true" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span id={ids.labelId}>
          {field.label}
          {field.required && <span aria-hidden="true"> *</span>}
        </span>
      </label>
      <FieldFeedback hint={field.hint} error={field.error} ids={ids} />
    </div>
  );
}
const styles = stylex.create({
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    cursor: 'pointer',
  },
  box: {
    display: 'inline-flex',
    flexShrink: 0,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.line,
    backgroundColor: tokens.surface,
    borderRadius: 5,
    outlineColor: tokens.focus,
  },
  checked: {
    backgroundColor: tokens.accent,
    borderColor: tokens.accent,
    color: 'white',
  },
  indicator: { display: 'flex' },
});
