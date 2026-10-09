import type { Region } from '../config/region';
import { getPublishedTools, tools } from '../tools/registry';

const categories: Record<string, Record<Region, string>> = {
  images: { cn: '图像与素材', global: 'Images & Assets' },
  creative: { cn: '创作与设计', global: 'Creative & Design' },
  characters: { cn: '角色与设定', global: 'Characters & Worldbuilding' },
  text: { cn: '文本与写作', global: 'Text & Writing' },
  files: { cn: '文件与效率', global: 'Files & Productivity' },
};

// Presentation metadata only. The existing registry remains the publication gate.
export function getCatalogEntries(region: Region, registry = tools) {
  return getPublishedTools(region, registry).map((tool) => ({
    id: tool.id,
    href: `/tools/${tool.slug}/`,
    ...tool.copy[region],
    category: Object.hasOwn(categories, tool.category)
      ? categories[tool.category][region]
      : undefined,
  }));
}
