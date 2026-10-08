import type { Region } from '../config/region';

const cn = {
  notifications: '通知',
  dismissToast: '关闭通知',
  toastSuccess: '成功',
  toastInfo: '提示',
  toastWarning: '注意',
  toastError: '错误',
  home: '首页',
  source: '源代码',
  skip: '跳到主要内容',
  tagline: '给毛茸茸的灵感，一点实用的帮助。',
  intro:
    'Tool4Furry 是一个正在起步的开源工具站，为兽圈创作与日常需求准备轻巧的浏览器工具。',
  tools: '工具箱',
  empty: '工具正在准备中',
  emptyDetail:
    '目前还没有正式发布的工具。我们正在搭建基础工作空间，让每一个小工具都好用一点。',
  footer: '浏览器本地处理优先 · BSD-3-Clause 开源',
  foundation: '基础建设中',
  notFound: '这里还没有页面',
  notFoundDetail: '这个地址不存在，或内容尚未发布。',
  back: '返回首页',
  loading: '正在加载工作区…',
  unavailable: '工作区暂时不可用，请稍后重试。',
};
export type Messages = { [K in keyof typeof cn]: string };
const global: Messages = {
  notifications: 'Notifications',
  dismissToast: 'Dismiss notification',
  toastSuccess: 'Success',
  toastInfo: 'Info',
  toastWarning: 'Warning',
  toastError: 'Error',
  home: 'Home',
  source: 'Source code',
  skip: 'Skip to content',
  tagline: 'A little help for furry ideas.',
  intro:
    'Tool4Furry is a growing open-source toolbox for furry creativity and everyday tasks, built for the browser.',
  tools: 'Toolbox',
  empty: 'Tools are on the way',
  emptyDetail:
    'No tools have been published yet. We are building the workspace that will give each small tool a useful home.',
  footer: 'Local processing first · BSD-3-Clause open source',
  foundation: 'Foundation in progress',
  notFound: 'Nothing here yet',
  notFoundDetail:
    'This address does not exist, or the content has not been published.',
  back: 'Back to home',
  loading: 'Loading workspace…',
  unavailable: 'The workspace is unavailable. Please try again.',
};
export const messages: Record<Region, Messages> = { cn, global };
