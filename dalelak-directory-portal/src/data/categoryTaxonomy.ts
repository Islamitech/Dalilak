import { CATEGORY_GROUPS } from './mockData';
import { normalizeArabicText } from '../utils/arabicSearch';

export interface CategorySubcategory {
  id: string;
  label: string;
  aliases: string[];
  exclusions?: string[];
}

export interface CategoryTaxonomyGroup {
  id: string;
  label: string;
  icon: string;
  aliases: string[];
  children: CategorySubcategory[];
}

const GROUP_META: Record<string, { id: string; aliases: string[] }> = {
  'المطاعم والكافيهات والمأكولات': { id: 'food', aliases: ['مطاعم', 'مأكولات', 'مطاعم وكافيهات'] },
  'السوبر ماركت والبقالة والتموين': { id: 'grocery', aliases: ['سوبر ماركت', 'سوبرماركت', 'بقالة', 'تموين', 'تسوق وبقالة'] },
  'العيادات والرعاية الصحية والطبية': { id: 'health', aliases: ['صحة', 'رعاية طبية', 'طبي وصيدلي', 'عيادات'] },
  'الملابس والأزياء والإكسسوارات': { id: 'fashion', aliases: ['ملابس', 'أزياء', 'اكسسوارات'] },
  'الهواتف والإلكترونيات والكمبيوتر': { id: 'electronics', aliases: ['هواتف', 'الكترونيات', 'كمبيوتر'] },
  'السيارات والمركبات والصيانة': { id: 'automotive', aliases: ['سيارات', 'مركبات', 'سيارات وصيانة', 'خدمات سيارات'] },
  'التجميل والعناية الشخصية واللياقة': { id: 'beauty-fitness', aliases: ['تجميل', 'عناية شخصية', 'لياقة'] },
  'الأثاث والديكور والمنزل': { id: 'home', aliases: ['أثاث', 'ديكور', 'منزل'] },
  'الشركات والخدمات والمكاتب المهنية': { id: 'professional-services', aliases: ['شركات', 'خدمات مهنية', 'مكاتب'] },
  'المكتبات والأدوات المدرسية والطباعة': { id: 'stationery-printing', aliases: ['مكتبات', 'أدوات مدرسية', 'طباعة'] },
  'التعليم والتدريب وتنمية المهارات': { id: 'education', aliases: ['تعليم', 'تدريب', 'مدارس وحضانات'] },
  'الحرف والورش والصيانة الفنية': { id: 'crafts', aliases: ['حرفيين', 'حرف وورش', 'صيانة منزلية', 'خدمات منزلية', 'صيانة'] },
  'السياحة والفنادق والمناسبات': { id: 'travel-events', aliases: ['سياحة', 'فنادق', 'مناسبات'] },
  'أنشطة وخدمات عامة أخرى': { id: 'other', aliases: ['خدمات عامة', 'أنشطة أخرى'] },
};

type SubMeta = { id: string; aliases: string[]; exclusions?: string[] };

const SUBCATEGORY_META: Record<string, SubMeta> = {
  'مطعم / مأكولات ومشويات': { id: 'restaurant', aliases: ['مطعم', 'مطاعم', 'مشويات', 'مأكولات'] },
  'كافيه / مقهى وكوفي شوب': { id: 'cafe', aliases: ['كافيه', 'كافيهات', 'مقهى', 'كوفي شوب'] },
  'مخبز / حلواني ومعجنات': { id: 'bakery', aliases: ['مخبز', 'فرن', 'حلواني', 'معجنات'] },
  'عصائر ومثلجات / آيس كريم': { id: 'juice-icecream', aliases: ['عصائر', 'ايس كريم', 'مثلجات'] },
  'سوبر ماركت / هايبر وبقالة': { id: 'supermarket-grocery', aliases: ['سوبر ماركت', 'سوبرماركت', 'هايبر ماركت', 'هايبر', 'بقالة', 'تموينات', 'ميني ماركت'] },
  'خضروات وفواكه طازجة': { id: 'fruit-vegetables', aliases: ['خضار', 'خضروات', 'فاكهة', 'فواكه', 'خضار وفاكهة'] },
  'جزارة / لحوم ودواجن وأسماك': { id: 'meat-poultry-fish', aliases: ['جزارة', 'جزار', 'لحوم', 'دواجن', 'طيور', 'اسماك', 'أسماك'] },
  'عطارة وتوابل / أعشاب طبيعية': { id: 'spices-herbs', aliases: ['عطارة', 'عطار', 'توابل', 'اعشاب', 'أعشاب'] },
  'محامص ومكسرات وتسالي / بن وقهوة': { id: 'roastery-nuts', aliases: ['محمصة', 'محامص', 'مكسرات', 'تسالي', 'بن وقهوة'] },
  'صيدلية وخدمات دوائية': { id: 'pharmacy', aliases: ['صيدلية', 'صيدليات', 'دواء', 'خدمات دوائية'] },
  'عيادة طبية / مركز تخصصي': { id: 'medical-clinic', aliases: ['عيادة', 'عيادات', 'مركز طبي', 'طبيب', 'دكتور'] },
  'فني سباكة وتأسيس صحي': { id: 'plumber', aliases: ['سباك', 'فني سباكة', 'سباكة', 'تأسيس صحي'], exclusions: ['أدوات سباكة', 'ادوات سباكة', 'أدوات صحية', 'ادوات صحية'] },
  'فني كهرباء وصيانة منزلية': { id: 'electrician', aliases: ['كهربائي', 'فني كهرباء', 'كهرباء منزلية', 'صيانة كهربائية'], exclusions: ['أدوات كهربائية', 'ادوات كهربائية', 'أجهزة كهربائية', 'اجهزة كهربائية'] },
  'ورشة نجارة ومصنوعات خشبية': { id: 'carpenter', aliases: ['نجار', 'نجارة', 'مصنوعات خشبية'] },
  'ورشة حدادة وكريتال': { id: 'blacksmith', aliases: ['حداد', 'حدادة', 'كريتال'] },
  'ورشة ألوميتال وزجاج ومطابخ': { id: 'aluminum-glass', aliases: ['الوميتال', 'ألوميتال', 'زجاج', 'واجهات زجاج'] },
  'فني صيانة تكييف وتبريد وأجهزة': { id: 'ac-refrigeration', aliases: ['فني تكييف', 'صيانة تكييف', 'تبريد', 'صيانة أجهزة', 'صيانة اجهزة'] },
  'مغسلة ملابس ودراي كلين ومكوجي': { id: 'laundry', aliases: ['مغسلة ملابس', 'دراي كلين', 'مكوجي'] },
  'أدوات صحية وسيراميك ورخام': { id: 'building-plumbing-supplies', aliases: ['أدوات صحية', 'ادوات صحية', 'أدوات سباكة', 'ادوات سباكة', 'سيراميك', 'رخام'] },
  'إضاءة ونجف وتأسيس كهرباء': { id: 'lighting-electrical-supplies', aliases: ['إضاءة', 'اضاءة', 'نجف', 'أدوات كهربائية', 'ادوات كهربائية', 'مستلزمات كهرباء'] },
};

const EXTRA_SUBCATEGORIES: Record<string, Array<{ id: string; label: string; aliases: string[]; exclusions?: string[] }>> = {
  grocery: [
    { id: 'dairy-products', label: 'ألبان وأجبان ومنتجات غذائية', aliases: ['ألبان', 'البان', 'أجبان', 'اجبان', 'منتجات ألبان'] },
    { id: 'frozen-foods', label: 'مجمدات وأغذية جاهزة', aliases: ['مجمدات', 'أغذية مجمدة', 'اغذية مجمدة'] },
  ],
  crafts: [
    { id: 'painting-finishing', label: 'نقاشة وتشطيبات منزلية', aliases: ['نقاش', 'نقاشة', 'تشطيبات منزلية', 'محارة', 'جبس بورد'] },
    { id: 'building-tools', label: 'مواد وأدوات بناء', aliases: ['مواد بناء', 'أدوات بناء', 'ادوات بناء', 'أسمنت', 'اسمنت', 'جبس'] },
  ],
};

function normalizedUnique(values: string[]): string[] {
  return Array.from(new Set(values.map(normalizeArabicText).filter((value) => value.length >= 2)));
}

function fallbackSubcategoryId(groupId: string, label: string): string {
  return `${groupId}:${normalizeArabicText(label).replace(/\s+/g, '-')}`;
}

export const CATEGORY_TAXONOMY: CategoryTaxonomyGroup[] = CATEGORY_GROUPS.map((group) => {
  const meta = GROUP_META[group.group] || { id: `group:${normalizeArabicText(group.group).replace(/\s+/g, '-')}`, aliases: [] };
  return {
    id: meta.id,
    label: group.group,
    icon: group.icon,
    aliases: normalizedUnique([group.group, ...meta.aliases]),
    children: [...group.items.map((label) => {
      const childMeta = SUBCATEGORY_META[label];
      return {
        id: childMeta?.id || fallbackSubcategoryId(meta.id, label),
        label,
        aliases: normalizedUnique([label, ...(childMeta?.aliases || [])]),
        exclusions: childMeta?.exclusions ? normalizedUnique(childMeta.exclusions) : undefined,
      };
    }), ...(EXTRA_SUBCATEGORIES[meta.id] || []).map((child) => ({
      ...child,
      aliases: normalizedUnique([child.label, ...child.aliases]),
      exclusions: child.exclusions ? normalizedUnique(child.exclusions) : undefined,
    }))],
  };
});

export function getCategoryGroupById(id?: string | null): CategoryTaxonomyGroup | undefined {
  if (!id) return undefined;
  return CATEGORY_TAXONOMY.find((group) => group.id === id);
}

export function getSubcategoryById(id?: string | null): (CategorySubcategory & { groupId: string }) | undefined {
  if (!id) return undefined;
  for (const group of CATEGORY_TAXONOMY) {
    const child = group.children.find((item) => item.id === id);
    if (child) return { ...child, groupId: group.id };
  }
  return undefined;
}

export function getCategoryLabel(idOrLabel: string): string {
  return getCategoryGroupById(idOrLabel)?.label || getSubcategoryById(idOrLabel)?.label || idOrLabel;
}
