import type { Region } from '../config/region';
import type { ToolDefinition } from './types';
// Metadata only. Lab demos are intentionally not registered as tools.
export const tools: readonly ToolDefinition[] = [];
export function getPublishedTools(region: Region, registry = tools) {
  return registry.filter(
    (tool) => tool.status === 'published' && tool.regions.includes(region),
  );
}
