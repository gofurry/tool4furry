export function simulateText(
  text: string,
  prefix: string,
  uppercase: boolean,
): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return prefix + (uppercase ? trimmed.toUpperCase() : trimmed);
}
export type DemoTask = {
  id: number;
  status: 'waiting' | 'running' | 'done';
  format: string;
};
export function advanceTasks(tasks: readonly DemoTask[]): DemoTask[] {
  return tasks.map((task) => ({
    ...task,
    status: task.status === 'waiting' ? 'running' : 'done',
  }));
}
