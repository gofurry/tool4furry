export const domains = {
  images: { cn: '图像与素材', global: 'Images & Assets' },
  creative: { cn: '创作与设计', global: 'Creative & Design' },
  characters: { cn: '角色与设定', global: 'Characters & Worldbuilding' },
  text: { cn: '文本与写作', global: 'Text & Writing' },
  documents: { cn: '文档与办公', global: 'Documents & Office' },
  development: { cn: '开发与数据', global: 'Development & Data' },
  files: { cn: '文件与效率', global: 'Files & Productivity' },
} as const;
export type DomainId = keyof typeof domains;
export const groups = {
  'image-processing': {
    category: 'images',
    cn: '图片处理',
    global: 'Image Processing',
  },
} as const satisfies Record<
  string,
  { category: DomainId; cn: string; global: string }
>;
export type GroupId = keyof typeof groups;
export const audiences = {
  creator: {
    cn: '创作者',
    global: 'Creator',
    reason: {
      cn: '查找为素材与作品创作提供帮助的工具。',
      global: 'Find tools for assets and creative work.',
    },
  },
  developer: {
    cn: '开发者',
    global: 'Developer',
    reason: {
      cn: '查找适用于开发流程与格式处理的工具。',
      global: 'Find tools for development workflows and formats.',
    },
  },
  operator: {
    cn: '运营与管理',
    global: 'Operations',
    reason: {
      cn: '查找适用于内容运营和日常管理的工具。',
      global: 'Find tools for content operations and everyday management.',
    },
  },
} as const;
export type AudienceId = keyof typeof audiences;
export const contexts = {
  studio: {
    cn: '工作室',
    global: 'Studio',
    reason: {
      cn: '查找适用于作品生产与客户交付的工具。',
      global: 'Find tools for production and client delivery.',
    },
  },
  community: {
    cn: '社群',
    global: 'Community',
    reason: {
      cn: '查找适用于社群内容和资源组织的工具。',
      global: 'Find tools for community content and resources.',
    },
  },
} as const;
export type ContextId = keyof typeof contexts;
