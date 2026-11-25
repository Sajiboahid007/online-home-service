/**
 * English translations keyed by the original Bangla text, plus reverse index for BN.
 *
 * Usage in templates:  {{ 'ম্যাপ' | t }}   or   [title]="'প্রোফাইল দেখুন' | t"
 */
import { COMMON_EN } from './dict/common';
import { CUSTOMER_LAYOUT_EN } from './dict/customer-layout';
import { HOME_MAP_EN } from './dict/home-map';
import { STAFF_LAYOUTS_EN } from './dict/staff-layouts';
import { DOORSTEP_PIN_EN } from './dict/doorstep-pin';
import { DOORSTEP_WORKER_EN } from './dict/doorstep-worker';
import { CONTENT_EN } from './dict/content';
import { SCREENS_EN } from './dict/screens';

export const EN_DICTIONARY: Readonly<Record<string, string>> = {
  ...COMMON_EN,
  ...CUSTOMER_LAYOUT_EN,
  ...HOME_MAP_EN,
  ...STAFF_LAYOUTS_EN,
  ...DOORSTEP_PIN_EN,
  ...DOORSTEP_WORKER_EN,
  ...CONTENT_EN,
  ...SCREENS_EN,
};

export const BN_REVERSE_DICTIONARY: Readonly<Record<string, string>> = Object.entries(EN_DICTIONARY)
  .reduce<Record<string, string>>((acc, [bn, en]) => {
    const key = en.trim();
    if (key && !acc[key]) {
      acc[key] = bn;
    }
    return acc;
  }, {});
