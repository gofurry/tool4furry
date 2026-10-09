import { useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { TrashIcon } from '@phosphor-icons/react';
import WorkbenchShell from '../workbench/WorkbenchShell';
import { FileDropzone } from '../ui/FileDropzone';
import { ScrollDock } from '../ui/ScrollDock';
import { CheckboxField } from '../ui/CheckboxField';
import { Button, IconButton } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { controls as c } from '../styles/controls';
import { tokens } from '../styles/tokens.stylex';
import type { LabMessages } from './messages';

export default function FilesLab({
  t,
  header,
}: {
  t: LabMessages;
  header: ReactNode;
}) {
  const [entries, setEntries] = useState<{ id: number; file: File }[]>([]);
  const [rounds, setRounds] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [multiple, setMultiple] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nextId = useRef(1);
  const toast = useToast();
  const guides = [
    [t.fileGuideTitle, t.fileGuide],
    [t.fileCountGuideTitle, t.fileCountGuide],
    [t.fileScrollGuideTitle, t.fileScrollGuide],
    [t.filePrivacyGuideTitle, t.filePrivacyGuide],
  ];
  return (
    <WorkbenchShell mode="custom" labels={t} header={header}>
      <div data-files-lab {...stylex.props(c.stack, s.page)}>
        <p {...stylex.props(c.muted)}>{t.filesIntro}</p>
        <section {...stylex.props(c.card, c.stack)} aria-label={t.files}>
          <div {...stylex.props(c.row)}>
            <CheckboxField
              label={t.fileDisable}
              checked={disabled}
              onCheckedChange={setDisabled}
            />
            <CheckboxField
              label={t.fileMultiple}
              checked={multiple}
              onCheckedChange={setMultiple}
            />
          </div>
          <FileDropzone
            label={t.fileChoose}
            hint={t.fileHint}
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            multiple={multiple}
            maxFiles={3}
            maxSizeBytes={2 * 1024 * 1024}
            disabled={disabled}
            issueMessages={{
              type: t.fileTypeIssue,
              size: t.fileSizeIssue,
              count: t.fileCountIssue,
            }}
            onFilesSelected={(files) => {
              const added = files.map((file) => ({
                id: nextId.current++,
                file,
              }));
              setEntries((current) => [...current, ...added]);
              setRounds((value) => value + 1);
              toast.notify({
                id: 'file-selection',
                type: 'success',
                title: t.fileSelected,
              });
            }}
            onRejected={() =>
              toast.notify({
                id: 'file-rejection',
                type: 'warning',
                title: t.fileRejected,
              })
            }
          />
        </section>
        <section {...stylex.props(c.card, c.stack)} aria-label={t.fileList}>
          <div {...stylex.props(c.row)}>
            <h2 {...stylex.props(c.heading)}>{t.fileList}</h2>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title={t.fileClearTitle}
              description={t.fileClearDescription}
              cancelLabel={t.cancel}
              confirmLabel={t.fileClear}
              danger
              trigger={
                <Button disabled={entries.length === 0}>{t.fileClear}</Button>
              }
              onConfirm={() => setEntries([])}
            />
          </div>
          <p role="status" {...stylex.props(c.muted)}>
            {t.fileCount}: {entries.length} · {t.fileRounds}: {rounds}
          </p>
          {entries.length === 0 ? (
            <p {...stylex.props(c.muted)}>{t.fileEmpty}</p>
          ) : (
            <ul {...stylex.props(s.list)}>
              {entries.map(({ id, file }) => (
                <li key={id} {...stylex.props(s.item)}>
                  <dl {...stylex.props(s.metadata)}>
                    <dt>{t.fileName}</dt>
                    <dd {...stylex.props(s.value)}>{file.name}</dd>
                    <dt>{t.fileSize}</dt>
                    <dd {...stylex.props(s.value)}>{file.size} B</dd>
                    <dt>{t.fileType}</dt>
                    <dd {...stylex.props(s.value)}>
                      {file.type || t.fileUnknownType}
                    </dd>
                  </dl>
                  <IconButton
                    label={`${t.remove} ${file.name}`}
                    onClick={() =>
                      setEntries((current) =>
                        current.filter((entry) => entry.id !== id),
                      )
                    }
                  >
                    <TrashIcon size={18} aria-hidden="true" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section {...stylex.props(c.stack)} aria-label={t.scrollTitle}>
          <h2 {...stylex.props(c.heading)}>{t.scrollTitle}</h2>
          <p {...stylex.props(c.muted)}>{t.scrollIntro}</p>
          {guides.map(([title, body], index) => (
            <article key={title} {...stylex.props(c.card, s.guide)}>
              <span {...stylex.props(c.muted)}>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </section>
      </div>
      <ScrollDock
        getLabel={(progress) =>
          t.scrollStep.replace('{progress}', String(progress))
        }
      />
    </WorkbenchShell>
  );
}
const s = stylex.create({
  page: { maxWidth: 960, marginInline: 'auto', paddingBottom: 80 },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderRadius: tokens.radiusMd,
    backgroundColor: tokens.page,
  },
  metadata: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap: '6px 12px',
    minWidth: 0,
    margin: 0,
    fontSize: 14,
  },
  value: { margin: 0, overflowWrap: 'anywhere' },
  guide: {
    minHeight: 300,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    lineHeight: 1.8,
    overflowWrap: 'anywhere',
  },
});
