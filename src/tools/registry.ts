import type { Region } from '../config/region';
import type { ToolDefinition } from './types';
import { imageConverterDefinition } from './image-converter/definition';
// Metadata only. Lab demos are intentionally not registered as tools.
export const tools: readonly ToolDefinition[] = [imageConverterDefinition];
export function getPublishedTools(region: Region, registry = tools) {
  return registry.filter(
    (tool) => tool.status === 'published' && tool.regions.includes(region),
  );
}
