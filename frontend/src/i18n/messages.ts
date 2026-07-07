import type { Locale } from './locales';
import { KR } from './kr';
import { US } from './locale/us';
import { JP } from './locale/jp';
import { CH } from './locale/ch';
import { TH } from './locale/th';

export type MessageKey = keyof typeof KR;

export const messages = { KR, US, JP, CH, TH };

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const dict = messages[locale] ?? messages.US;
  let text = dict[key] ?? messages.US[key] ?? messages.KR[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}
