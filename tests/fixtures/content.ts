import { publicationFixtures } from './publication';
import type { ToolContentMap } from '../../src/site/tool-content';

export const fixtureContents: ToolContentMap = Object.fromEntries(
  publicationFixtures.map((tool) => [
    tool.id,
    Object.fromEntries(
      tool.regions.map((region) => [
        region,
        {
          title: `${tool.copy[region].title} — Tool4Furry`,
          description: tool.copy[region].description,
          h1:
            region === 'cn' ? `测试标题 ${tool.id}` : `Test heading ${tool.id}`,
          intro:
            region === 'cn'
              ? '静态简介，仅用于验证页面组合。'
              : 'Static introduction for composition verification only.',
          steps: [`STATIC_GUIDE_ONLY_${tool.id}_${region}`],
          limitations: [
            region === 'cn'
              ? '没有图片处理或下载功能。'
              : 'No image processing or download functionality.',
          ],
          faq: [
            {
              question:
                region === 'cn' ? '这是正式工具吗？' : 'Is this a real tool?',
              answer:
                region === 'cn'
                  ? '不是。仅为测试样本。'
                  : 'No. This is a test fixture.',
            },
          ],
        },
      ]),
    ),
  ]),
);
