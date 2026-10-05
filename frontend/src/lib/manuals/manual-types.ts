import type { ManualLocale } from './version';

export type ManualSection = {
  id: string;
  title: Record<ManualLocale, string>;
  bodyHtml: Record<ManualLocale, string>;
};

export type ManualDoc = {
  id: string;
  coverTitle: Record<ManualLocale, string>;
  coverSubtitle: Record<ManualLocale, string>;
  sections: ManualSection[];
};
