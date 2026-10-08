import { useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { ArrowRightIcon } from '@phosphor-icons/react';
import WorkbenchShell from '../workbench/WorkbenchShell';
import type { LabMessages as Messages } from './messages';
import { controls as c } from '../styles/controls';
import { simulateText } from './demo-logic';
export default function FormDemo({
  t,
  header,
}: {
  t: Messages;
  header: ReactNode;
}) {
  const [text, setText] = useState(t.sampleText);
  const [prefix, setPrefix] = useState('✦ ');
  const [uppercase, setUppercase] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState(false);
  return (
    <WorkbenchShell
      mode="form"
      labels={t}
      header={header}
      right={
        <section {...stylex.props(c.card, c.stack)} aria-label={t.output}>
          <h2 {...stylex.props(c.heading)}>{t.output}</h2>
          <span {...stylex.props(c.muted)}>{t.preview}</span>
          <output aria-live="polite" {...stylex.props(s.output)}>
            {result ?? t.outputHint}
          </output>
        </section>
      }
    >
      <form
        {...stylex.props(c.card, c.stack)}
        onSubmit={(event) => {
          event.preventDefault();
          const next = simulateText(text, prefix, uppercase);
          setError(next === null);
          setResult(next);
        }}
      >
        <h2 {...stylex.props(c.heading)}>{t.input}</h2>
        <label {...stylex.props(c.field)}>
          {t.input}
          <textarea
            rows={5}
            maxLength={2000}
            value={text}
            aria-invalid={error}
            aria-describedby={error ? 'form-error' : undefined}
            onChange={(event) => {
              setText(event.target.value);
              setError(false);
            }}
            {...stylex.props(c.input, s.textarea)}
          />
        </label>
        <label {...stylex.props(c.field)}>
          {t.prefix}
          <input
            maxLength={40}
            value={prefix}
            onChange={(event) => setPrefix(event.target.value)}
            {...stylex.props(c.input)}
          />
        </label>
        <label {...stylex.props(c.row, s.checkbox)}>
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(event) => setUppercase(event.target.checked)}
          />
          {t.uppercase}
        </label>
        {error && (
          <p id="form-error" role="alert">
            {t.required}
          </p>
        )}
        <button type="submit" {...stylex.props(c.button, c.primary)}>
          {t.run}
          <ArrowRightIcon size={18} aria-hidden />
        </button>
        <p {...stylex.props(c.muted)}>{t.formNote}</p>
      </form>
    </WorkbenchShell>
  );
}
const s = stylex.create({
  textarea: { resize: 'vertical' },
  checkbox: { minHeight: 44 },
  output: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', minHeight: 160 },
});
