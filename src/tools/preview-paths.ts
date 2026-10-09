import { tools } from './registry';
import type { Region } from '../config/region';
export function getToolPreviewPaths(dev: boolean, region: Region) {
  return dev
    ? tools
        .filter(
          (tool) => tool.status === 'draft' && tool.regions.includes(region),
        )
        .map((tool) => ({ params: { slug: tool.slug }, props: { tool } }))
    : [];
}
