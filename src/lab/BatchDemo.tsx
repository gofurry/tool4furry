import { useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { PlusIcon, PlayIcon, TrashIcon } from '@phosphor-icons/react';
import WorkbenchShell from '../workbench/WorkbenchShell';
import type { LabMessages as Messages } from './messages';
import { controls as c } from '../styles/controls';
import { tokens } from '../styles/tokens.stylex';
import { advanceTasks, type DemoTask } from './demo-logic';
import { Button, IconButton } from '../ui/Button';
import { SelectField } from '../ui/SelectField';
export default function BatchDemo({
  t,
  header,
}: {
  t: Messages;
  header: ReactNode;
}) {
  const [tasks, setTasks] = useState<DemoTask[]>([
    { id: 1, status: 'waiting', format: 'PNG' },
  ]);
  const [format, setFormat] = useState('PNG');
  const nextId = useRef(2);
  const complete = tasks.filter((task) => task.status === 'done').length;
  return (
    <WorkbenchShell
      mode="batch"
      labels={t}
      header={header}
      right={
        <section {...stylex.props(c.card, c.stack)}>
          <h2 {...stylex.props(c.heading)}>{t.parameters}</h2>
          <SelectField
            label={t.batchSetting}
            value={format}
            onValueChange={setFormat}
            options={[
              { value: 'PNG', label: 'PNG' },
              { value: 'WEBP', label: 'WEBP' },
            ]}
          />
          <p {...stylex.props(c.muted)}>{t.batchNote}</p>
          <p role="status">
            {t.completed}: {complete} / {tasks.length}
          </p>
        </section>
      }
    >
      <section {...stylex.props(c.card, c.stack)} aria-label={t.tasks}>
        <h2 {...stylex.props(c.heading)}>{t.tasks}</h2>
        <div {...stylex.props(c.row)}>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              const id = nextId.current++;
              setTasks((current) => [
                ...current,
                { id, status: 'waiting', format },
              ]);
            }}
          >
            <PlusIcon size={18} aria-hidden />
            {t.add}
          </Button>
          <Button
            type="button"
            disabled={!tasks.some((task) => task.status !== 'done')}
            onClick={() => setTasks(advanceTasks)}
          >
            <PlayIcon size={18} aria-hidden />
            {t.advance}
          </Button>
          <Button
            type="button"
            disabled={tasks.length === 0}
            onClick={() => setTasks([])}
          >
            {t.clear}
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p {...stylex.props(c.muted)}>{t.queueEmpty}</p>
        ) : (
          <ul {...stylex.props(s.list)}>
            {tasks.map((task) => (
              <li key={task.id} {...stylex.props(s.task)}>
                <div {...stylex.props(s.taskText)}>
                  <strong>
                    Demo {String(task.id).padStart(2, '0')} · {task.format}
                  </strong>
                  <span {...stylex.props(c.muted)}>{t[task.status]}</span>
                </div>
                <IconButton
                  type="button"
                  label={`${t.remove} Demo ${task.id}`}
                  onClick={() =>
                    setTasks((current) =>
                      current.filter((item) => item.id !== task.id),
                    )
                  }
                >
                  <TrashIcon size={18} aria-hidden />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    </WorkbenchShell>
  );
}
const s = stylex.create({
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 },
  task: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 14,
    backgroundColor: tokens.page,
    borderRadius: 8,
  },
  taskText: { display: 'grid', gap: 4, minWidth: 0, overflowWrap: 'anywhere' },
});
