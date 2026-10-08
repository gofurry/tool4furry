export const labModes = ['canvas', 'form', 'batch', 'ui'] as const;
export type LabMode = (typeof labModes)[number];
export function getLabPaths(dev: boolean) {
  return dev
    ? labModes.map((mode) => ({ params: { mode }, props: { mode } }))
    : [];
}
