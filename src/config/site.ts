import { parseRegion, regions } from './region';
export const region = parseRegion(import.meta.env.SITE_REGION);
export const regionConfig = regions[region];
