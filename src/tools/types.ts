import type { Region } from '../config/region';
export type WorkspaceMode = 'canvas' | 'form' | 'batch' | 'custom';
export type ToolDefinition = {
  id: string;
  slug: string;
  category: string;
  mode: WorkspaceMode;
  status: 'draft' | 'published';
  regions: readonly Region[];
  copy: Record<Region, { title: string; description: string }>;
};
export type ToolProps = { region: Region };
