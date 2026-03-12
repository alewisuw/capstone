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

export const normalizeTag = (tag: string): string =>
  tag
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[(),.:/]/g, ' ')
    .replace(/\s+/g, ' ');

const categoryAliases: Record<string, string> = {
  'social and civil rights': 'Civil Rights',
  'economic issues': 'Economics',
  'environmental policy': 'Environment',
  'technology and innovation': 'Technology and Science',
  'technology science and innovation': 'Technology and Science',
  'transportation and mobility': 'Transportation',
  'crime justice and public safety': 'Crime and Justice',
};

const legacyTagCategoryLookup: Record<string, string> = {
  'human rights': 'Civil Rights',
  'youth justice': 'Civil Rights',
  'disability rights': 'Civil Rights',
  'hate speech': 'Civil Rights',
  'labor rights': 'Labor and Employment',
  'income inequality': 'Economics',
  'wealth redistribution': 'Economics',
  'universal basic income ubi': 'Economics',
  'employment standards': 'Labor and Employment',
  'biodiversity': 'Environment',
  'plastic waste': 'Environment',
  'clean energy': 'Environment',
  'universal healthcare': 'Healthcare',
  'access to abortion': 'Healthcare',
  'pharmaceutical pricing': 'Healthcare',
  'online harms': 'Technology and Science',
  'government investment in innovation': 'Technology and Science',
  'digital governance': 'Technology and Science',
  'research and development': 'Technology and Science',
  'globalization': 'Foreign Policy',
  'diplomacy': 'Foreign Policy',
  'government transparency and accountability': 'Democracy & Governance',
  'federalism and intergovernmental relations': 'Democracy & Governance',
  'political financing': 'Democracy & Governance',
  'public services': 'Democracy & Governance',
  'parliamentary reform': 'Democracy & Governance',
  'rural broadband': 'Housing & Infrastructure',
  'crime': 'Crime and Justice',
  'infrastructure resilience': 'Transportation',
  'biking': 'Transportation',
};

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

  const exactCategoryName = Object.keys(categoryColors).find(
    (category) => category === tag || normalizeTag(category) === normalized
  );
  if (exactCategoryName) {
    return exactCategoryName;
  }

  const aliasCategory = categoryAliases[normalized];
  if (aliasCategory) {
    return aliasCategory;
  }

  const directTagMatch = tagCategoryLookup[normalized];
  if (directTagMatch) {
    return directTagMatch;
  }

  const legacyTagMatch = legacyTagCategoryLookup[normalized];
  if (legacyTagMatch) {
    return legacyTagMatch;
  }

  // Fallback to approximate matching for minor punctuation/plural variations from backend labels.
  const approxDynamic = Object.keys(tagCategoryLookup).find(
    (known) => normalized.includes(known) || known.includes(normalized)
  );
  if (approxDynamic) {
    return tagCategoryLookup[approxDynamic];
  }

  const approxLegacy = Object.keys(legacyTagCategoryLookup).find(
    (known) => normalized.includes(known) || known.includes(normalized)
  );
  if (approxLegacy) {
    return legacyTagCategoryLookup[approxLegacy];
  }

  return null;
};

export const getTagColor = (tag: string): string | null => {
  const category = getTagCategory(tag);
  return category ? categoryColors[category] : null;
};
