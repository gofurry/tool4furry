import { Menu } from '@base-ui/react/menu';
import { FlaskIcon } from '@phosphor-icons/react';
import * as stylex from '@stylexjs/stylex';
import { labModes, type LabMode } from './routes';
import type { LabMessages } from './messages';
import { controls as c } from '../styles/controls';
import { menuStyles as s } from '../styles/menu';

export default function LabMenu({
  mode,
  t,
}: {
  mode: LabMode;
  t: LabMessages;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`${t.lab} · DEV ONLY`}
        {...stylex.props(c.button, c.ghost, c.small)}
      >
        <FlaskIcon size={18} aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="end"
          sideOffset={8}
          collisionPadding={16}
          {...stylex.props(s.positioner)}
        >
          <Menu.Popup aria-label={t.lab} {...stylex.props(s.popup)}>
            <Menu.Group>
              <Menu.GroupLabel {...stylex.props(s.label)}>
                DEV ONLY · {t.lab}
              </Menu.GroupLabel>
              <p {...stylex.props(s.note)}>{t.labNote}</p>
              {labModes.map((item) => (
                <Menu.LinkItem
                  key={item}
                  href={`/lab/${item}`}
                  aria-current={mode === item ? 'page' : undefined}
                  {...stylex.props(s.item)}
                >
                  {t[item]}
                </Menu.LinkItem>
              ))}
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
