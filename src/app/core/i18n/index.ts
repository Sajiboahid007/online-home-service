/**
 * English translations keyed by the original Bangla text.
 *
 * Usage in templates:  {{ 'ম্যাপ' | t }}   or   [title]="'প্রোফাইল দেখুন' | t"
 * Text without an entry stays in Bangla, so screens can be translated gradually.
 *
 * Add one dictionary file per feature area under ./dict and register it below.
 */
import { COMMON_EN } from './dict/common';
import { CUSTOMER_LAYOUT_EN } from './dict/customer-layout';
import { HOME_MAP_EN } from './dict/home-map';
import { STAFF_LAYOUTS_EN } from './dict/staff-layouts';

export const EN_DICTIONARY: Readonly<Record<string, string>> = {
  ...COMMON_EN,
  ...CUSTOMER_LAYOUT_EN,
  ...HOME_MAP_EN,
  ...STAFF_LAYOUTS_EN,
};
