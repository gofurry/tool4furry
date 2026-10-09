import type { ComponentType } from 'react';
import type { ToolProps } from './types';
export type ToolLoader = () => Promise<{ default: ComponentType<ToolProps> }>;
// Add a literal () => import('./my-tool/MyTool') when implementing a real tool.
export const toolLoaders: Readonly<Partial<Record<string, ToolLoader>>> = {
  // Draft-only: direct DEV guard excludes the import before chunk discovery.
  // On approved publication, remove this guard together with status promotion.
  'image-converter': import.meta.env.DEV
    ? () => import('./image-converter/ImageConverter')
    : undefined,
};
