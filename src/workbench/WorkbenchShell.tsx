import { useId, useRef, useState, type ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import {
  SlidersHorizontalIcon,
  SidebarSimpleIcon,
  XIcon,
} from '@phosphor-icons/react';
import * as stylex from '@stylexjs/stylex';
import type { WorkspaceMode } from '../tools/types';
import { controls as c } from '../styles/controls';
import { tokens } from '../styles/tokens.stylex';
import { useCompact } from './useCompact';

export interface WorkbenchShellProps {
  mode: WorkspaceMode;
  labels: Record<
    | 'parameters'
    | 'close'
    | 'showParameters'
    | 'hideParameters'
    | 'showTools'
    | 'hideTools'
    | 'main'
    | 'toolbar',
    string
  >;
  header?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  bottom?: ReactNode;
  children: ReactNode;
}

export default function WorkbenchShell({
  mode,
  labels,
  header,
  left,
  right,
  bottom,
  children,
}: WorkbenchShellProps) {
  const canvas = mode === 'canvas';
  const compact = useCompact();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const panelHost = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const toolbarId = useId();
  const open = compact ? sheetOpen : desktopOpen;

  return (
    <section
      data-workbench={mode}
      {...stylex.props(s.shell, canvas && s.canvas)}
    >
      {header != null && <header {...stylex.props(s.header)}>{header}</header>}
      <Dialog.Root
        open={canvas && right != null && open}
        modal={compact}
        disablePointerDismissal={!compact}
        onOpenChange={(next) =>
          compact ? setSheetOpen(next) : setDesktopOpen(next)
        }
      >
        {canvas && (left != null || right != null) && (
          <div {...stylex.props(s.switches)}>
            {left != null && (
              <button
                type="button"
                {...stylex.props(c.button, s.desktopOnly)}
                aria-expanded={leftOpen}
                aria-controls={toolbarId}
                onClick={() => setLeftOpen((value) => !value)}
              >
                <SidebarSimpleIcon size={18} aria-hidden />
                {leftOpen ? labels.hideTools : labels.showTools}
              </button>
            )}
            {right != null && (
              <Dialog.Trigger ref={trigger} {...stylex.props(c.button)}>
                <SlidersHorizontalIcon size={18} aria-hidden />
                {open ? labels.hideParameters : labels.showParameters}
              </Dialog.Trigger>
            )}
          </div>
        )}
        <div
          {...stylex.props(
            s.body,
            canvas
              ? s.canvasBody
              : mode === 'form'
                ? s.formBody
                : mode === 'batch'
                  ? s.batchBody
                  : s.customBody,
          )}
        >
          {left != null && (
            <div
              id={toolbarId}
              aria-label={labels.toolbar}
              {...stylex.props(
                s.left,
                canvas && s.canvasLeft,
                canvas && !leftOpen && s.closedLeft,
              )}
            >
              {left}
            </div>
          )}
          <div
            aria-label={labels.main}
            {...stylex.props(s.main, canvas && s.canvasMain)}
          >
            {children}
          </div>
          {right != null &&
            (canvas ? (
              <>
                <div
                  ref={panelHost}
                  {...stylex.props(s.panelHost, !desktopOpen && s.closedHost)}
                />
                <Dialog.Portal
                  container={panelHost}
                  keepMounted
                  {...stylex.props(s.portal)}
                >
                  {compact && <Dialog.Backdrop {...stylex.props(s.backdrop)} />}
                  <Dialog.Popup
                    initialFocus={compact}
                    finalFocus={trigger}
                    role={compact ? 'dialog' : 'region'}
                    {...stylex.props(s.panel, !open && s.closedPanel)}
                  >
                    <div {...stylex.props(s.panelHeading)}>
                      <Dialog.Title {...stylex.props(c.heading)}>
                        {labels.parameters}
                      </Dialog.Title>
                      <Dialog.Close
                        {...stylex.props(c.button)}
                        aria-label={labels.close}
                      >
                        <XIcon size={18} aria-hidden />
                      </Dialog.Close>
                    </div>
                    {right}
                  </Dialog.Popup>
                </Dialog.Portal>
              </>
            ) : (
              <aside {...stylex.props(s.flowRight)}>{right}</aside>
            ))}
        </div>
      </Dialog.Root>
      {bottom != null && <footer {...stylex.props(s.bottom)}>{bottom}</footer>}
    </section>
  );
}

const s = stylex.create({
  shell: { minWidth: 0, color: tokens.ink },
  canvas: {
    height: '100dvh',
    minHeight: 540,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: { default: '16px 24px', '@media (max-width: 600px)': '12px 16px' },
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.line,
    backgroundColor: tokens.surface,
  },
  switches: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    padding: '8px 16px',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.line,
  },
  desktopOnly: {
    display: { default: 'inline-flex', '@media (max-width: 900px)': 'none' },
  },
  body: { minWidth: 0 },
  canvasBody: {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: {
      default: 'auto minmax(0, 1fr) auto',
      '@media (max-width: 900px)': 'minmax(0, 1fr)',
    },
    gridTemplateRows: {
      default: 'minmax(0, 1fr)',
      '@media (max-width: 900px)': 'minmax(0, 1fr) auto',
    },
  },
  formBody: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    padding: { default: 32, '@media (max-width: 600px)': 16 },
    maxWidth: 1120,
    marginInline: 'auto',
    alignItems: 'flex-start',
  },
  batchBody: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
    padding: { default: 32, '@media (max-width: 600px)': 16 },
    maxWidth: 1280,
    marginInline: 'auto',
    alignItems: 'flex-start',
  },
  customBody: { display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16 },
  left: { minWidth: 0 },
  canvasLeft: {
    gridColumn: { default: '1', '@media (max-width: 900px)': '1' },
    gridRow: { default: '1', '@media (max-width: 900px)': '2' },
    padding: 12,
    overflowY: 'auto',
    backgroundColor: tokens.surface,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: tokens.line,
  },
  closedLeft: {
    display: { default: 'none', '@media (max-width: 900px)': 'block' },
  },
  main: { minWidth: 0, flex: '1 1 400px' },
  canvasMain: {
    gridColumn: { default: '2', '@media (max-width: 900px)': '1' },
    gridRow: '1',
    minHeight: 0,
    overflow: 'auto',
    padding: { default: 24, '@media (max-width: 900px)': 12 },
  },
  panelHost: {
    gridColumn: '3',
    gridRow: '1',
    minWidth: 0,
    minHeight: 0,
    width: { default: 290, '@media (max-width: 900px)': 0 },
  },
  closedHost: { width: 0 },
  portal: { height: '100%' },
  panel: {
    width: { default: 290, '@media (max-width: 900px)': '100%' },
    height: { default: '100%', '@media (max-width: 900px)': 'auto' },
    maxHeight: { default: '100%', '@media (max-width: 900px)': '80dvh' },
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    padding: 20,
    paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    borderLeftWidth: 1,
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.line,
    backgroundColor: tokens.surface,
    position: { default: 'relative', '@media (max-width: 900px)': 'fixed' },
    bottom: { default: null, '@media (max-width: 900px)': 0 },
    left: { default: null, '@media (max-width: 900px)': 0 },
    zIndex: { default: null, '@media (max-width: 900px)': tokens.layerSheet },
    borderRadius: { default: 0, '@media (max-width: 900px)': '16px 16px 0 0' },
  },
  closedPanel: { display: 'none' },
  panelHeading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: tokens.overlay,
    zIndex: tokens.layerBackdrop,
  },
  flowRight: { minWidth: 0, flex: '1 1 300px' },
  bottom: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 20px',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    backgroundColor: tokens.surface,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: tokens.line,
  },
});
