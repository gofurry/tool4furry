import { useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { PlusIcon, PlayIcon, TrashIcon } from '@phosphor-icons/react';
import WorkbenchShell from '../workbench/WorkbenchShell';
import type { LabMessages as Messages } from './messages';
import { controls as c } from '../styles/controls';
import { tokens } from '../styles/tokens.stylex';
import { advanceTasks, type DemoTask } from './demo-logic';
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
          <label {...stylex.props(c.field)}>
            {t.batchSetting}
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              {...stylex.props(c.input)}
            >
              <option>PNG</option>
              <option>WEBP</option>
            </select>
          </label>
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
          <button
            type="button"
            {...stylex.props(c.button, c.primary)}
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
          </button>
          <button
            type="button"
            {...stylex.props(c.button)}
            disabled={!tasks.some((task) => task.status !== 'done')}
            onClick={() => setTasks(advanceTasks)}
          >
            <PlayIcon size={18} aria-hidden />
            {t.advance}
          </button>
          <button
            type="button"
            {...stylex.props(c.button)}
            disabled={tasks.length === 0}
            onClick={() => setTasks([])}
          >
            {t.clear}
          </button>
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
                <button
                  type="button"
                  aria-label={`${t.remove} Demo ${task.id}`}
                  {...stylex.props(c.button)}
                  onClick={() =>
                    setTasks((current) =>
                      current.filter((item) => item.id !== task.id),
                    )
                  }
                >
                  <TrashIcon size={18} aria-hidden />
                </button>
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
    backgroundColor: tokens.paper,
    borderRadius: 8,
  },
  taskText: { display: 'grid', gap: 4, minWidth: 0, overflowWrap: 'anywhere' },
});
