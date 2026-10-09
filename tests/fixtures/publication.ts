import { fixtureTools, fixtureTool } from './tools';

export const publicationFixtures = [
  ...fixtureTools(20),
  fixtureTool('cn-only', { regions: ['cn'] }),
  fixtureTool('global-only', { regions: ['global'] }),
  fixtureTool('draft-only', { status: 'draft' }),
];
