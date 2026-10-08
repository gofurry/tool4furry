import type { Region } from '../config/region';
import { labModes, type LabMode } from './routes';
import { messages } from './messages';
import * as stylex from '@stylexjs/stylex';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { controls as c } from '../styles/controls';
import { tokens } from '../styles/tokens.stylex';
import CanvasDemo from './CanvasDemo';
import FormDemo from './FormDemo';
import BatchDemo from './BatchDemo';
import UILab from './UILab';

export default function WorkbenchLab({
  mode,
  region,
}: {
  mode: LabMode;
  region: Region;
}) {
  const t = messages[region];
  const header = (
    <div {...stylex.props(c.stack, s.header)}>
      <div {...stylex.props(s.top)}>
        <a href="/" {...stylex.props(c.button)}>
          <ArrowLeftIcon size={18} aria-hidden />
          Tool4Furry
        </a>
        <h1 {...stylex.props(c.heading)}>
          {t.lab} / {t[mode]}
        </h1>
        <nav aria-label={t.lab} {...stylex.props(c.row)}>
          {labModes.map((item) => (
            <a
              key={item}
              href={`/lab/${item}`}
              aria-current={mode === item ? 'page' : undefined}
              {...stylex.props(c.button, mode === item && c.active)}
            >
              {t[item]}
            </a>
          ))}
        </nav>
      </div>
      <p {...stylex.props(c.muted)}>
        <span {...stylex.props(s.demo)}>DEMO</span> {t.labNote}
      </p>
    </div>
  );
  if (mode === 'canvas') return <CanvasDemo t={t} header={header} />;
  if (mode === 'form') return <FormDemo t={t} header={header} />;
  if (mode === 'ui') return <UILab t={t} header={header} />;
  return <BatchDemo t={t} header={header} />;
}
const s = stylex.create({
  header: { gap: 10 },
  top: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demo: {
    color: tokens.accent,
    fontSize: 11,
    fontWeight: 750,
    letterSpacing: '0.08em',
  },
});
