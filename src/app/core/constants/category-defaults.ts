import { RateUnit } from '../models/worker.model';

export interface CategoryDefaultConfig {
  suggestedSkills: string[];
  defaultBio: string;
  defaultRate: number;
  rateUnit: RateUnit;
}

export const CATEGORY_DEFAULTS: Record<string, CategoryDefaultConfig> = {
  plumber: {
    suggestedSkills: [
      'পাইপ লিকেজ মেরামত',
      'বেসিন ও কমোড ফিটিং',
      'পাম্প মোটর স্থাপন',
      'ট্যাপ ও শাওয়ার মেরামত',
      'গিজার লাইন কানেকশন'
    ],
    defaultBio: 'অভিজ্ঞ প্লাম্বার। পানির পাইপ, স্যানিটারি ফিটিংস ও মোটর পাম্পের সব কাজ যত্নসহকারে সম্পন্ন করি।',
    defaultRate: 350,
    rateUnit: 'job'
  },
  electrician: {
    suggestedSkills: [
      'হাউজ ওয়্যারিং',
      'শর্ট সার্কিট চেক',
      'সুইচ ও সকেট ফিটিং',
      'সিলিং ফ্যান স্থাপন',
      'সার্কিট ব্রেকার মেরামত'
    ],
    defaultBio: 'দক্ষ ইলেকট্রিশিয়ান। বাসা-বাড়ির ওয়্যারিং, ডিবি বক্স, ফ্যান ও লাইট ফিটিংসহ সব বৈদ্যুতিক কাজ নিরাপদভাবে সম্পন্ন করি।',
    defaultRate: 400,
    rateUnit: 'job'
  },
  ac_technician: {
    suggestedSkills: [
      'এসি গ্যাস চার্জ',
      'মাস্টার ওয়াশ',
      'ইনস্টলেশন ও রি-ইনস্টলেশন',
      'কম্প্রেসার চেক',
      'লিকেজ রিপেয়ার'
    ],
    defaultBio: 'সার্টিফাইড এসি টেকনিশিয়ান। সব ব্র্যান্ডের স্প্লিট ও ইনভার্টার এসি সার্ভিসিং, গ্যাস চার্জ ও ইনস্টলেশন সেবা দেই।',
    defaultRate: 900,
    rateUnit: 'job'
  },
  cleaner: {
    suggestedSkills: [
      'বাথরুম ডিপ ক্লিনিং',
      'কিচেন ডিপ ক্লিনিং',
      'ফ্লোর পলিশ',
      'সোফা ও কার্পেট ওয়াশ',
      'পানি ট্যাংক পরিষ্কার'
    ],
    defaultBio: 'পেশাদার ক্লিনার। বাসাবাড়ি, বাথরুম, কিচেন ও পানির ট্যাংক যত্নসহকারে গভীরভাবে পরিষ্কার করি।',
    defaultRate: 250,
    rateUnit: 'hour'
  },
  painter: {
    suggestedSkills: [
      'ওয়াল পুটিং ও পেইন্টিং',
      'ড্যাম্প প্রটেকশন',
      'রং ডিজাইন ও টেক্সচার',
      'দরজা-জানালা বার্নিশ'
    ],
    defaultBio: 'অভিজ্ঞ পেইন্টার ও রংমিস্ত্রি। ইন্টেরিয়র ও এক্সটেরিয়র দেয়াল রং, ড্যাম্প সলিউশন এবং বার্নিশের কাজ নিখুঁতভাবে করি।',
    defaultRate: 800,
    rateUnit: 'day'
  },
  day_laborer: {
    suggestedSkills: [
      'ভারী মালামাল বহন',
      'বাসা বদল সহায়তা',
      'লোডিং-আনলোডিং',
      'নির্মাণ সহায়তা'
    ],
    defaultBio: 'পরিশ্রমী ও বিশ্বস্ত কর্মী। বাসা বদল, মালামাল লোডিং-আনলোডিং এবং নির্মাণ সহায়তার কাজ দ্রুত সম্পন্ন করি।',
    defaultRate: 700,
    rateUnit: 'day'
  },
  mason: {
    suggestedSkills: [
      'দেওয়াল গাঁথুনি',
      'প্লাস্টার কাজ',
      'টাইলস ফিটিং',
      'ঢালাই ও মেরামত'
    ],
    defaultBio: 'দক্ষ রাজমিস্ত্রি। ইটের গাঁথুনি, প্লাস্টার, টাইলস বসানো ও ভবন মেরামতের সব কাজ মজবুতভাবে সম্পন্ন করি।',
    defaultRate: 850,
    rateUnit: 'day'
  },
  carpenter: {
    suggestedSkills: [
      'দরজা-জানালা মেরামত',
      'ফার্নিচার তৈরি ও ফিটিং',
      'কব্জা ও লক পরিবর্তন',
      'ওয়ারড্রব ও কেবিনেট'
    ],
    defaultBio: 'অভিজ্ঞ কাঠমিস্ত্রি। দরজা-জানালা, ওয়ারড্রব, কেবিনেট ও সব ধরনের ফার্নিচার মেরামত ও ফিটিং কাজ করি।',
    defaultRate: 450,
    rateUnit: 'job'
  },
  appliance_repair: {
    suggestedSkills: [
      'ফ্রিজ ও ডিপ ফ্রিজ মেরামত',
      'ওয়াশিং মেশিন সার্ভিসিং',
      'মাইক্রোওয়েভ ওভেন মেরামত',
      'টিভি ও এলইডি প্যানেল'
    ],
    defaultBio: 'হোম অ্যাপ্লায়েন্স টেকনিশিয়ান। ফ্রিজ, ওয়াশিং মেশিন, ওভেন ও টিভির ত্রুটি নির্ণয় ও মেরামত সেবা দেই।',
    defaultRate: 500,
    rateUnit: 'job'
  },
  pest_control: {
    suggestedSkills: [
      'তেলাপোকা ও ছারপোকা দমন',
      'উইপোকা ট্রিটমেন্ট',
      'ইঁদুর ও মশা নিয়ন্ত্রণ',
      'বাসাবাড়ি ফিউমিগেশন'
    ],
    defaultBio: 'পেস্ট কন্ট্রোল বিশেষজ্ঞ। নিরাপদ ও পরিবেশবান্ধব উপায়ে বাসা-অফিসের তেলাপোকা, ছারপোকা ও উইপোকা দমন করি।',
    defaultRate: 1000,
    rateUnit: 'job'
  },
  shifting_moving: {
    suggestedSkills: [
      'বাসা বদল প্যাকিং',
      'ফার্নিচার ডিসঅ্যাসেম্বল ও সেটআপ',
      'পিকআপ লোডিং-আনলোডিং',
      'অফিস শিফটিং'
    ],
    defaultBio: 'বাসা ও অফিস শিফটিং বিশেষজ্ঞ। আসবাবপত্র নিরাপদ প্যাকিং, পরিবহন ও নতুন বাসায় সেটআপের কাজ করি।',
    defaultRate: 1200,
    rateUnit: 'job'
  },
  locksmith: {
    suggestedSkills: [
      'দরজার লক খোলা ও মেরামত',
      'ডুপ্লিকেট চাবি তৈরি',
      'স্মার্ট ডোর লক ইনস্টলেশন',
      'সেফ ও আলমারি লক'
    ],
    defaultBio: 'দক্ষ তালা-চাবি ও লক টেকনিশিয়ান। জরুরি দরজার লক খোলা, সিলিন্ডার লক পরিবর্তন ও স্মার্ট লক ইনস্টল করি।',
    defaultRate: 350,
    rateUnit: 'job'
  },
  gardener: {
    suggestedSkills: [
      'ছাদ বাগান পরিচর্যা',
      'গাছ ছাঁটাই ও কলম',
      'লন মেইনটেন্যান্স',
      'টব ও মাটি প্রস্তুতি'
    ],
    defaultBio: 'অভিজ্ঞ মালী ও বাগান পরিচর্যাকারী। ছাদ বাগান, লন, গাছ ছাঁটাই ও সার-মাটি ব্যবস্থাপনার কাজ যত্নসহকারে করি।',
    defaultRate: 300,
    rateUnit: 'hour'
  },
  welder: {
    suggestedSkills: [
      'গ্রিল ও গেট ওয়েল্ডিং',
      'জানালার রড মেরামত',
      'সিঁড়ির রেলিং তৈরি',
      'টিনের শেড মেরামত'
    ],
    defaultBio: 'দক্ষ ওয়েল্ডিং ও গ্রিল মিস্ত্রি। লোহার গেট, জানালার গ্রিল, সিঁড়ির রেলিং ও শেড মেরামতের কাজ করি।',
    defaultRate: 550,
    rateUnit: 'job'
  },
  car_wash: {
    suggestedSkills: [
      'কার ফুল বডি ওয়াশ',
      'ইন্টেরিয়র ভ্যাকুয়াম ক্লিনিং',
      'বাইক ওয়াশ ও পলিশ',
      'ইঞ্জিন বে ক্লিনিং'
    ],
    defaultBio: 'ডোরস্টেপ গাড়ি ও বাইক ওয়াশ বিশেষজ্ঞ। বাসার সামনেই প্রেশার ওয়াশ, ইন্টেরিয়র ক্লিনিং ও পলিশ সেবা দেই।',
    defaultRate: 400,
    rateUnit: 'job'
  },
  cctv_it: {
    suggestedSkills: [
      'সিসিটিভি ক্যামেরা ইনস্টলেশন',
      'ওয়াইফাই রাউটার কনফিগারেশন',
      'এনভিআর ও ক্যাবলিং',
      'ইন্টারনেট লাইন ট্রাবলশুটিং'
    ],
    defaultBio: 'সিসিটিভি ও নেটওয়ার্ক টেকনিশিয়ান। বাসা-অফিসের সিসিটিভি ক্যামেরা সেটআপ, রাউটার ও ইন্টারনেট সমস্যার সমাধান করি।',
    defaultRate: 600,
    rateUnit: 'job'
  }
};

/**
 * Returns suggested skills aggregated for the given category IDs (deduplicated).
 */
export function getSuggestedSkillsForCategories(categoryIds: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const catId of categoryIds) {
    const skills = CATEGORY_DEFAULTS[catId]?.suggestedSkills || [];
    for (const s of skills) {
      if (!seen.has(s)) {
        seen.add(s);
        result.push(s);
      }
    }
  }
  return result;
}

/**
 * Syncs a worker's skills list when their selected categories change:
 * - Removes suggested skills that belong ONLY to deselected categories (preserving custom skills).
 * - Adds top suggested skills for newly added categories (or when skills become empty).
 */
export function syncSkillsWithCategories(
  currentSkills: string[],
  prevCategoryIds: string[],
  nextCategoryIds: string[]
): string[] {
  const validSuggestedSet = new Set(getSuggestedSkillsForCategories(nextCategoryIds));
  const removedCategoryIds = prevCategoryIds.filter(id => !nextCategoryIds.includes(id));
  const removedOnlySuggestedSet = new Set(
    getSuggestedSkillsForCategories(removedCategoryIds).filter(s => !validSuggestedSet.has(s))
  );

  // Keep custom skills and skills still relevant to remaining categories
  const filtered = currentSkills.filter(s => !removedOnlySuggestedSet.has(s));

  // Add top 3 skills for any newly added categories (or if filtered is empty)
  const addedCategoryIds = nextCategoryIds.filter(id => !prevCategoryIds.includes(id));
  const categoriesToSeed = filtered.length === 0 ? nextCategoryIds : addedCategoryIds;
  const result = [...filtered];
  for (const catId of categoriesToSeed) {
    const defaults = (CATEGORY_DEFAULTS[catId]?.suggestedSkills || []).slice(0, 3);
    for (const s of defaults) {
      if (!result.includes(s)) {
        result.push(s);
      }
    }
  }
  return result;
}
