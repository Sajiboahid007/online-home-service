import { describe, it, expect } from 'vitest';
import { SeedDataService } from '../services/seed-data.service';
import {
  CATEGORY_DEFAULTS,
  getSuggestedSkillsForCategories,
  syncSkillsWithCategories
} from './category-defaults';

describe('Category defaults & worker consistency', () => {
  const seed = new SeedDataService();

  it('has defaults defined for every default category', () => {
    for (const cat of seed.defaultCategories) {
      const def = CATEGORY_DEFAULTS[cat.id];
      expect(def, `Missing CATEGORY_DEFAULTS for ${cat.id}`).toBeDefined();
      expect(def.suggestedSkills.length).toBeGreaterThan(0);
      expect(def.rateUnit).toBe(cat.pricingType);
    }
  });

  it('keeps every default worker aligned with valid categories, areas, and rateUnit', () => {
    const validCatIds = new Set(seed.defaultCategories.map(c => c.id));
    const validAreaIds = new Set(seed.defaultAreas.map(a => a.id));

    for (const worker of seed.defaultWorkers) {
      expect(worker.categoryIds.length).toBeGreaterThan(0);
      for (const cid of worker.categoryIds) {
        expect(validCatIds.has(cid), `Unknown categoryId ${cid} on ${worker.uid}`).toBe(true);
      }
      expect(validAreaIds.has(worker.areaId), `Unknown areaId ${worker.areaId} on ${worker.uid}`).toBe(true);
      expect(worker.skills.length).toBeGreaterThan(0);

      const primaryCat = seed.defaultCategories.find(c => c.id === worker.categoryIds[0]);
      expect(worker.rateUnit, `rateUnit mismatch on ${worker.uid}`).toBe(primaryCat?.pricingType);
    }
  });

  it('syncs skills when switching categories while preserving custom skills', () => {
    const customSkill = 'কাস্টম বিশেষ দক্ষতা';
    const initial = [...CATEGORY_DEFAULTS['electrician'].suggestedSkills.slice(0, 2), customSkill];
    const next = syncSkillsWithCategories(initial, ['electrician'], ['plumber']);

    for (const elecSkill of CATEGORY_DEFAULTS['electrician'].suggestedSkills) {
      expect(next).not.toContain(elecSkill);
    }
    expect(next).toContain(customSkill);
    for (const plumbSkill of CATEGORY_DEFAULTS['plumber'].suggestedSkills.slice(0, 3)) {
      expect(next).toContain(plumbSkill);
    }
  });

  it('aggregates unique suggested skills across multiple categories', () => {
    const skills = getSuggestedSkillsForCategories(['plumber', 'electrician']);
    expect(skills.length).toBe(
      CATEGORY_DEFAULTS['plumber'].suggestedSkills.length +
      CATEGORY_DEFAULTS['electrician'].suggestedSkills.length
    );
  });
});
