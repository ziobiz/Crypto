export { CURRENT_LIVE_VERSION } from './version';
export type { ManualLocale, PlatformReleaseNote, ReleaseKind } from './version';
export { PLATFORM_RELEASE_NOTES } from './release-notes';
export {
  MANUAL_CATALOG,
  manualsForRole,
  audiencesForRole,
  localeFromApp,
  type ManualAudience,
  type ManualCatalogItem,
  type AppRole,
} from './catalog';
export { getManualDoc } from './content';
export {
  buildManualHtml,
  openManualWindow,
  openManualPlaceholderWindow,
  resolveManualBrandAssets,
  type ManualBrand,
} from './build-html';
