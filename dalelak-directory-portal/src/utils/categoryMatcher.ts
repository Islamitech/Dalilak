import { normalizeArabicText } from './arabicSearch';
import {
  CATEGORY_TAXONOMY,
  CategorySubcategory,
  CategoryTaxonomyGroup,
  getCategoryGroupById,
  getSubcategoryById,
} from '../data/categoryTaxonomy';

export interface BusinessOrLeadEntity {
  category?: string | null;
  mainCategoryId?: string | null;
  subcategoryId?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  notes?: string | null;
  services?: string[] | null;
}

export interface CategorySelection {
  mainCategoryId: string;
  subcategoryId: string;
}

export interface CategoryClassification extends CategorySelection {
  confidence: number;
  needsReview: boolean;
  source: 'structured' | 'category' | 'services' | 'name' | 'description' | 'unknown';
}

type Candidate = {
  group: CategoryTaxonomyGroup;
  child: CategorySubcategory;
  score: number;
  source: CategoryClassification['source'];
};

const SOURCE_SCORE = {
  category: { exact: 950, contains: 760 },
  services: { exact: 780, contains: 620 },
  name: { exact: 440, contains: 320 },
  description: { exact: 180, contains: 120 },
} as const;

function containsPhrase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack === needle || ` ${haystack} `.includes(` ${needle} `);
}

function bestAliasScore(text: string, child: CategorySubcategory, source: keyof typeof SOURCE_SCORE): number {
  if (!text) return 0;
  if (child.exclusions?.some((term) => containsPhrase(text, term))) return -1000;
  let best = 0;
  for (const alias of child.aliases) {
    if (text === alias) best = Math.max(best, SOURCE_SCORE[source].exact + Math.min(alias.length, 40));
    else if (containsPhrase(text, alias)) best = Math.max(best, SOURCE_SCORE[source].contains + Math.min(alias.length, 40));
  }
  return best;
}

export function resolveCategorySelection(filter?: string | null): CategorySelection {
  if (!filter || filter === 'all') return { mainCategoryId: 'all', subcategoryId: 'all' };
  const groupById = getCategoryGroupById(filter);
  if (groupById) return { mainCategoryId: groupById.id, subcategoryId: 'all' };
  const childById = getSubcategoryById(filter);
  if (childById) return { mainCategoryId: childById.groupId, subcategoryId: childById.id };

  const normalized = normalizeArabicText(filter);
  const exactGroup = CATEGORY_TAXONOMY.find((group) => normalizeArabicText(group.label) === normalized);
  if (exactGroup) return { mainCategoryId: exactGroup.id, subcategoryId: 'all' };
  for (const group of CATEGORY_TAXONOMY) {
    const child = group.children.find((item) => item.aliases.includes(normalized));
    if (child) return { mainCategoryId: group.id, subcategoryId: child.id };
  }
  const aliasGroup = CATEGORY_TAXONOMY.find((group) => group.aliases.includes(normalized));
  if (aliasGroup) return { mainCategoryId: aliasGroup.id, subcategoryId: 'all' };
  return { mainCategoryId: 'all', subcategoryId: 'all' };
}

export function classifyBusinessCategory(entity: BusinessOrLeadEntity): CategoryClassification {
  const structuredGroup = getCategoryGroupById(entity.mainCategoryId);
  const structuredChild = getSubcategoryById(entity.subcategoryId);
  if (structuredChild && (!structuredGroup || structuredChild.groupId === structuredGroup.id)) {
    return { mainCategoryId: structuredChild.groupId, subcategoryId: structuredChild.id, confidence: 1, needsReview: false, source: 'structured' };
  }

  const rawCategory = normalizeArabicText(entity.category || '');
  const services = normalizeArabicText((entity.services || []).join(' '));
  const name = normalizeArabicText(`${entity.nameAr || ''} ${entity.nameEn || ''}`);
  const description = normalizeArabicText(`${entity.description || ''} ${entity.notes || ''}`);
  let lockedGroup = structuredGroup;

  if (!lockedGroup && rawCategory) {
    lockedGroup = CATEGORY_TAXONOMY.find(
      (group) => normalizeArabicText(group.label) === rawCategory || group.aliases.includes(rawCategory)
    );
  }

  const directChild = CATEGORY_TAXONOMY.flatMap((group) => group.children.map((child) => ({ group, child }))).find(
    ({ group, child }) => (!lockedGroup || lockedGroup.id === group.id) && normalizeArabicText(child.label) === rawCategory
  );
  if (directChild) {
    return { mainCategoryId: directChild.group.id, subcategoryId: directChild.child.id, confidence: 0.99, needsReview: false, source: 'category' };
  }

  const candidates: Candidate[] = [];
  for (const group of CATEGORY_TAXONOMY) {
    if (lockedGroup && lockedGroup.id !== group.id) continue;
    for (const child of group.children) {
      const scored = [
        { source: 'category' as const, score: bestAliasScore(rawCategory, child, 'category') },
        { source: 'services' as const, score: bestAliasScore(services, child, 'services') },
        { source: 'name' as const, score: bestAliasScore(name, child, 'name') },
        { source: 'description' as const, score: bestAliasScore(description, child, 'description') },
      ].filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
      if (scored[0]) candidates.push({ group, child, ...scored[0] });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.child.id.localeCompare(b.child.id));
  const first = candidates[0];
  const second = candidates[1];
  if (!first) {
    return {
      mainCategoryId: lockedGroup?.id || 'other',
      subcategoryId: 'all',
      confidence: lockedGroup ? 0.75 : 0,
      needsReview: !lockedGroup,
      source: lockedGroup ? (structuredGroup ? 'structured' : 'category') : 'unknown',
    };
  }

  const gap = first.score - (second?.score || 0);
  const confidence = Math.min(0.98, Math.max(0.35, first.score / 1000));
  return {
    mainCategoryId: first.group.id,
    subcategoryId: first.child.id,
    confidence,
    needsReview: confidence < 0.55 || (Boolean(second) && gap < 70 && second.group.id !== first.group.id),
    source: first.source,
  };
}

export function matchesCategorySelection(entity: BusinessOrLeadEntity, mainCategoryId = 'all', subcategoryId = 'all'): boolean {
  if ((!mainCategoryId || mainCategoryId === 'all') && (!subcategoryId || subcategoryId === 'all')) return true;
  const main = resolveCategorySelection(mainCategoryId);
  const sub = resolveCategorySelection(subcategoryId);
  const targetMain = sub.mainCategoryId !== 'all' ? sub.mainCategoryId : main.mainCategoryId;
  const targetSub = sub.subcategoryId !== 'all' ? sub.subcategoryId : main.subcategoryId;
  const classification = classifyBusinessCategory(entity);
  return (targetMain === 'all' || classification.mainCategoryId === targetMain) &&
    (targetSub === 'all' || classification.subcategoryId === targetSub);
}

export function matchesCategoryFilter(entity: BusinessOrLeadEntity, categoryFilter: string): boolean {
  const selection = resolveCategorySelection(categoryFilter);
  if (selection.mainCategoryId === 'all' && selection.subcategoryId === 'all') return !categoryFilter || categoryFilter === 'all';
  return matchesCategorySelection(entity, selection.mainCategoryId, selection.subcategoryId);
}

export function resolveCanonicalCategoryGroup(categoryInput: string): string {
  const selection = resolveCategorySelection(categoryInput);
  return getCategoryGroupById(selection.mainCategoryId)?.label || categoryInput;
}

export function getCategoryGroupFor(category?: string | null, description?: string | null): string {
  const classification = classifyBusinessCategory({ category, description });
  return getCategoryGroupById(classification.mainCategoryId)?.label || 'أنشطة وخدمات عامة أخرى';
}

export const CATEGORY_ALIASES: Record<string, string> = Object.fromEntries(
  CATEGORY_TAXONOMY.flatMap((group) => group.aliases.map((alias) => [alias, group.label]))
);

export const GROUP_KEYWORDS: Record<string, string[]> = Object.fromEntries(
  CATEGORY_TAXONOMY.map((group) => [group.label, Array.from(new Set(group.children.flatMap((child) => child.aliases)))])
);
