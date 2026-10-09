import { describe, expect, it } from 'vitest';
import { getCatalogEntries } from '../src/site/catalog';
import type { ToolDefinition } from '../src/tools/types';

// Test-only metadata; never registered as a real tool or given a loader.
function fixture(
  id: string,
  overrides: Partial<ToolDefinition> = {},
): ToolDefinition {
  return {
    id,
    slug: id,
    category: 'images',
    mode: 'canvas',
    status: 'published',
    regions: ['cn', 'global'],
    copy: {
      cn: { title: `${id} 中文`, description: '中文说明' },
      global: { title: `${id} English`, description: 'English description' },
    },
    ...overrides,
  };
}

describe('static tool discovery', () => {
  it('supports an empty registry in both regions', () => {
    expect(getCatalogEntries('cn', [])).toEqual([]);
    expect(getCatalogEntries('global', [])).toEqual([]);
  });

  it.each(['cn', 'global'] as const)(
    'includes only published tools for %s, with localized card data and real route shapes',
    (region) => {
      const registry = [
        fixture('both', { slug: 'actual-route' }),
        fixture('draft', { status: 'draft' }),
        fixture('cn-only', { regions: ['cn'] }),
        fixture('global-only', { regions: ['global'] }),
      ];
      const cards = getCatalogEntries(region, registry);
      expect(cards.map((card) => card.id)).toEqual(['both', `${region}-only`]);
      expect(cards[0]).toEqual({
        id: 'both',
        href: '/tools/actual-route/',
        title: region === 'cn' ? 'both 中文' : 'both English',
        description: region === 'cn' ? '中文说明' : 'English description',
        category: region === 'cn' ? '图像与素材' : 'Images & Assets',
      });
      expect(registry.map((tool) => tool.status)).toEqual([
        'published',
        'draft',
        'published',
        'published',
      ]);
    },
  );

  it('returns an empty catalog when only drafts or another region are available', () => {
    expect(
      getCatalogEntries('cn', [
        fixture('draft', { status: 'draft' }),
        fixture('global', { regions: ['global'] }),
      ]),
    ).toEqual([]);
  });

  it('omits unknown categories safely, including inherited property names', () => {
    for (const category of ['new-category', 'constructor', '__proto__']) {
      expect(
        getCatalogEntries('cn', [fixture('new', { category })])[0],
      ).toMatchObject({
        href: '/tools/new/',
        category: undefined,
      });
    }
  });

  it('uses topic categories independently of workbench modes', () => {
    const registry = [
      fixture('canvas-text', { category: 'text', mode: 'canvas' }),
      fixture('form-files', { category: 'files', mode: 'form' }),
    ];
    expect(
      getCatalogEntries('global', registry).map((card) => card.category),
    ).toEqual(['Text & Writing', 'Files & Productivity']);
  });
});
