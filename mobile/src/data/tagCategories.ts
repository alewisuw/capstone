import { interestGroups } from './interestGroups';

export const categoryColors: Record<string, string> = {
  'Civil Rights': '#b91c1c',
  'Economics': '#1d4ed8',
  'Environment': '#0f766e',
  'Healthcare': '#9d174d',
  'Education': '#6d28d9',
  'Technology and Science': '#0f172a',
  'Foreign Policy': '#a16207',
  'Democracy & Governance': '#374151',
  'Housing & Infrastructure': '#7c2d12',
  'Indigenous Affairs': '#7f1d1d',
  'Public Safety & Emergency Response': '#0b1324',
  'Transportation': '#047857',
  'Crime and Justice': '#4b5563',
  'Culture, Heritage, and Holidays': '#c2410c',
  'Labor and Employment': '#0e7490',
  'Consumer Protection & Product Safety': '#334155',
  'Taxation & Government Revenue': '#7e22ce',
  'Workplace Safety': '#065f46',
  'Veterans & Military Service': '#78350f',
  'Electoral Boundaries & Administration': '#1f2937',
  'Commemorative Days & National Recognition': '#9a3412',
  'Agriculture, Fisheries & Food': '#365314',
  'Government Finance & Budget': '#1e40af',
};

export const normalizeTag = (tag: string): string => tag.trim().toLowerCase();

const tagCategoryLookup: Record<string, string> = {};
interestGroups.forEach((group) => {
  group.tags.forEach((tag) => {
    const normalized = normalizeTag(tag);
    if (!tagCategoryLookup[normalized]) {
      tagCategoryLookup[normalized] = group.title;
    }
  });
});

export const getTagCategory = (tag: string): string | null => {
  const normalized = normalizeTag(tag);

  if (categoryColors[tag]) {
    return tag;
  }

  const categoryByName = Object.keys(categoryColors).find(
    (category) => normalizeTag(category) === normalized
  );
  if (categoryByName) {
    return categoryByName;
  }

  return tagCategoryLookup[normalized] || null;
};

export const getTagColor = (tag: string): string | null => {
  const category = getTagCategory(tag);
  return category ? categoryColors[category] : null;
};
