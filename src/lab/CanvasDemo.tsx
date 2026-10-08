import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  CursorIcon,
  StarIcon,
  ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import * as stylex from '@stylexjs/stylex';
import WorkbenchShell from '../workbench/WorkbenchShell';
import type { LabMessages as Messages } from './messages';
import { controls as c } from '../styles/controls';
import { tokens } from '../styles/tokens.stylex';

export default function CanvasDemo({
  t,
  header,
}: {
  t: Messages;
  header: ReactNode;
}) {
  const [action, setAction] = useState<'select' | 'stamp'>('select');
  const [label, setLabel] = useState(t.sampleLabel);
  const [size, setSize] = useState(48);
  const [accent, setAccent] = useState('green');
  const [marks, setMarks] = useState(0);
  const [selected, setSelected] = useState(false);
  const reduce = useReducedMotion();
  const reset = () => {
    setAction('select');
    setLabel(t.sampleLabel);
    setSize(48);
    setAccent('green');
    setMarks(0);
    setSelected(false);
  };
  return (
    <WorkbenchShell
      mode="canvas"
      labels={t}
      header={header}
      left={
        <div {...stylex.props(s.toolbar)}>
          <button
            type="button"
            aria-pressed={action === 'select'}
            {...stylex.props(c.button, action === 'select' && c.active)}
            onClick={() => setAction('select')}
          >
            <CursorIcon size={20} aria-hidden />
            {t.select}
          </button>
          <button
            type="button"
            aria-pressed={action === 'stamp'}
            {...stylex.props(c.button, action === 'stamp' && c.active)}
            onClick={() => setAction('stamp')}
          >
            <StarIcon size={20} aria-hidden />
            {t.stamp}
          </button>
        </div>
      }
      right={
        <div {...stylex.props(c.stack)}>
          <label {...stylex.props(c.field)}>
            {t.label}
            <input
              maxLength={80}
              {...stylex.props(c.input)}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>
          <label {...stylex.props(c.field)}>
            {t.size}: {size}px
            <input
              type="range"
              min="24"
              max="96"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              {...stylex.props(s.range)}
            />
          </label>
          <label {...stylex.props(c.field)}>
            {t.accent}
            <select
              {...stylex.props(c.input)}
              value={accent}
              onChange={(event) => setAccent(event.target.value)}
            >
              <option value="green">{t.green}</option>
              <option value="orange">{t.orange}</option>
            </select>
          </label>
          <p {...stylex.props(c.muted)}>{t.canvasHint}</p>
        </div>
      }
      bottom={
        <>
          <span role="status" {...stylex.props(c.muted)}>
            {t.marks}: {marks}
            {selected ? ` · ${t.selected}` : ''}
          </span>
          <button type="button" {...stylex.props(c.button)} onClick={reset}>
            <ArrowCounterClockwiseIcon size={18} aria-hidden />
            {t.reset}
          </button>
        </>
      }
    >
      <div {...stylex.props(s.stage)}>
        <span {...stylex.props(s.caption)}>
          {t.preview} / {t[action]}
        </span>
        <button
          type="button"
          aria-label={t.canvasAction}
          {...stylex.props(s.canvasButton, selected && s.selected)}
          onClick={() =>
            action === 'stamp'
              ? setMarks((value) => value + 1)
              : setSelected((value) => !value)
          }
        >
          <motion.span
            key={marks}
            initial={false}
            animate={{ scale: reduce || marks === 0 ? 1 : [1, 1.06, 1] }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            {...stylex.props(s.symbol, accent === 'orange' && s.orange)}
          >
            <StarIcon size={size} weight="duotone" aria-hidden />
          </motion.span>
          <strong {...stylex.props(s.label)}>{label || '—'}</strong>
          <span {...stylex.props(c.muted)}>
            {t.marks}: {marks}
          </span>
        </button>
        <p {...stylex.props(c.muted)}>{t.canvasHint}</p>
      </div>
    </WorkbenchShell>
  );
}
const s = stylex.create({
  toolbar: {
    display: 'flex',
    flexDirection: { default: 'column', '@media (max-width: 900px)': 'row' },
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  range: { width: '100%', minHeight: 44, accentColor: tokens.accent },
  stage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    minHeight: '100%',
    padding: 16,
    backgroundImage: 'radial-gradient(#ced8cf 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    borderRadius: 8,
  },
  caption: { fontSize: 12, color: tokens.muted },
  canvasButton: {
    width: 'min(100%, 320px)',
    minHeight: 220,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: tokens.surface,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.line,
    borderRadius: 16,
    color: tokens.ink,
  },
  selected: { outline: `2px solid ${tokens.accent}`, outlineOffset: 4 },
  symbol: { display: 'flex', color: tokens.accent },
  orange: { color: '#a74b2b' },
  label: { maxWidth: '100%', overflowWrap: 'anywhere', fontSize: 20 },
});
