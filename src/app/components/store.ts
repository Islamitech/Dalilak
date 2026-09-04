export interface WarningItem {
  id: string;
  date: string;
  reason: string;
  issuedBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  status?: 'active' | 'stopped' | 'break';
  activityStatus?: 'active' | 'break' | 'offline'; // Live auto status: متصل متفاعل / في استراحة / أوفلاين
  adminStatus: 'authorized' | 'suspended' | 'under_review'; // Admin control status: مصرح له / موقوف إدارياً / تحت المراجعة والإنذار
  todayCount: number;
  warnings?: WarningItem[];
  phone?: string;
  lastActiveTime?: string;
}

export interface ServiceOffer {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface RejectionDetails {
  metOwner: boolean; // التقيت بالمسؤول الأساسي؟
  ownerReaction: 'استمع لي واهتم' | 'رفض الإنصات نهائياً'; // ردة فعل المسؤول
  customerVolume: 'يوجد زبائن كثر' | 'المحل شبه فارغ'; // عدد الزبائن
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'admin_directive' | 'admin_warning' | 'account_status' | 'reminder';
  targetPlaceId?: string;
  read: boolean;
  createdAt: string;
}

export interface PlaceItem {
  id: string;
  businessName: string;
  exteriorPhoto?: string;
  facadeImage?: string;
  internalImage?: string;
  additionalImages?: string[];
  adminRequest?: string;
  category?: string;
  status?: string;
  date?: string;
  time?: string;
  nameEn?: string;
  customCategory?: string;
  landmark?: string;
  dms?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  isActiveStreet?: boolean;
  hasCompetitor?: boolean;
  similarStoresCount?: number;
  operatingStatus?: 'مفتوح (يعمل حالياً)' | 'مغلق مؤقتاً' | 'مغلق نهائياً';
  mainCategory?: string;
  subCategory?: string;
  currentCustomers?: number;
  interiorPhotos?: string[];
  offeredServices?: string[];
  acceptedServices?: string[];
  merchantName?: string;
  phone?: string;
  whatsapp?: string;
  googleEmail?: string;
  notes?: string;
  rejectionDetails?: RejectionDetails;
  visitResult?: 'accepted' | 'rejected';
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentStatus?: 'مدفوعة بالكامل' | 'دفع جزء من المبلغ (عربون)' | 'غير مدفوعة';
  documenterName?: string;
  documenterId?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  reminderDateTime?: string; // ISO date or time string for follow-up timer
  reminderNote?: string; // Custom reminder text (e.g., "زيارة متابعة ثانية لتحصيل المبلغ المتبقي")
  reminderCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppStoreData {
  currentUser: User | null;
  employees: User[];
  places: PlaceItem[];
  notifications: NotificationItem[];
  dailyTarget: number;
  lastActivityNote: string;
  activeVisitDraft: Partial<PlaceItem> | null;
  lastCompletedVisit: PlaceItem | null;
}

const INITIAL_EMPLOYEES: User[] = [
  { id: 'emp-1', name: 'أحمد عزالدين', email: 'ahmed@daleelak.com', role: 'employee', status: 'active', activityStatus: 'active', adminStatus: 'authorized', todayCount: 6, lastActiveTime: 'منذ 3 دقائق' },
  { id: 'emp-2', name: 'محمد مصطفى', email: 'mohamed@daleelak.com', role: 'employee', status: 'active', activityStatus: 'active', adminStatus: 'authorized', todayCount: 4, lastActiveTime: 'منذ 15 دقيقة' },
  { id: 'emp-3', name: 'محمود حسن', email: 'mahmoud@daleelak.com', role: 'employee', status: 'break', activityStatus: 'break', adminStatus: 'authorized', todayCount: 3, lastActiveTime: 'منذ ساعة' },
  { id: 'emp-4', name: 'سارة طارق', email: 'sara@daleelak.com', role: 'employee', status: 'stopped', activityStatus: 'offline', adminStatus: 'suspended', todayCount: 0, lastActiveTime: 'غير متصل' },
];

const INITIAL_PLACES: PlaceItem[] = [
  {
    id: 'PLACE-909500',
    businessName: 'عيادات ومراكز طبية — عيادة عيون وجراحة عيون',
    exteriorPhoto: '',
    dms: `N 31°05'46.9" E 23°9'29"58`,
    latitude: 31.0963,
    longitude: 23.1582,
    address: 'الجيزة — منطقة ح — شارع 10',
    isActiveStreet: true,
    hasCompetitor: false,
    similarStoresCount: 2,
    operatingStatus: 'مفتوح (يعمل حالياً)',
    mainCategory: 'عيادة',
    subCategory: 'عيادة عيون وجراحة عيون',
    currentCustomers: 5,
    interiorPhotos: [],
    offeredServices: ['خدمة إضافة وتوثيق المنشأة التجارية ونقل الملكية على خرائط جوجل الرسمية'],
    acceptedServices: ['خدمة إضافة وتوثيق المنشأة التجارية ونقل الملكية على خرائط جوجل الرسمية'],
    merchantName: 'د. وائل مؤمن',
    phone: '01143888355',
    notes: 'تم الدفع بنصف المبلغ وتأكيد التوثيق الميداني.',
    visitResult: 'accepted',
    totalAmount: 300,
    paidAmount: 150,
    remainingAmount: 150,
    paymentStatus: 'دفع جزء من المبلغ (عربون)',
    documenterName: 'أحمد عزالدين',
    documenterId: 'emp-1',
    city: 'الجيزة',
    neighborhood: 'منطقة ح',
    street: 'شارع 10',
    createdAt: new Date().toISOString()
  },
  {
    id: 'PLACE-909501',
    businessName: 'سوبرماركت البركة للغذائيات',
    exteriorPhoto: '',
    dms: `N 30°02'12.4" E 31°14'05"12`,
    latitude: 30.0367,
    longitude: 31.2347,
    address: 'القاهرة — الدقي — شارع التحرير',
    isActiveStreet: true,
    hasCompetitor: true,
    similarStoresCount: 4,
    operatingStatus: 'مفتوح (يعمل حالياً)',
    mainCategory: 'بقالة',
    subCategory: 'سوبرماركت متكامل',
    currentCustomers: 12,
    interiorPhotos: [],
    offeredServices: ['خدمة التوثيق الميداني والإعلان الرقمي'],
    acceptedServices: ['خدمة التوثيق الميداني والإعلان الرقمي'],
    merchantName: 'الحاج إبراهيم',
    phone: '01009876543',
    notes: 'مدفوعة بالكامل نقدياً.',
    visitResult: 'accepted',
    totalAmount: 300,
    paidAmount: 300,
    remainingAmount: 0,
    paymentStatus: 'مدفوعة بالكامل',
    documenterName: 'أحمد عزالدين',
    documenterId: 'emp-1',
    city: 'القاهرة',
    neighborhood: 'الدقي',
    street: 'شارع التحرير',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'PLACE-909502',
    businessName: 'مطعم كشري ومأكولات الشعبية',
    exteriorPhoto: '',
    dms: `N 30°03'45.1" E 31°12'30"88`,
    latitude: 30.0625,
    longitude: 31.2085,
    address: 'القاهرة — العجوزة — شارع النيل',
    isActiveStreet: true,
    hasCompetitor: true,
    similarStoresCount: 3,
    operatingStatus: 'مفتوح (يعمل حالياً)',
    mainCategory: 'مطاعم',
    subCategory: 'مأكولات شعبية',
    currentCustomers: 8,
    interiorPhotos: [],
    offeredServices: ['خدمة الإعلان الرقمي وتحديث الخرائط'],
    acceptedServices: [],
    merchantName: 'أستاذ كمال',
    phone: '01223344556',
    notes: 'التاجر رفض العرض بسبب انشغاله.',
    rejectionDetails: {
      metOwner: true,
      ownerReaction: 'رفض الإنصات نهائياً',
      customerVolume: 'يوجد زبائن كثر',
      notes: 'انشغال المحل بالزبائن أوقات الذروة.'
    },
    visitResult: 'rejected',
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
    paymentStatus: 'غير مدفوعة',
    documenterName: 'محمد مصطفى',
    documenterId: 'emp-2',
    city: 'القاهرة',
    neighborhood: 'العجوزة',
    street: 'شارع النيل',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export const AVAILABLE_SERVICES: ServiceOffer[] = [
  {
    id: 'srv-1',
    title: 'خدمة إضافة وتوثيق المنشأة ونقل الملكية رسمياً',
    description: 'تشمل المعاينة الميدانية، التقاط الصور الاحترافية، تسجيل الإحداثيات، وإصدار التقرير الرقمي المعتمد.',
    price: 300
  },
  {
    id: 'srv-2',
    title: 'حزمة الإعلانات والتسويق الرقمي المحلي على الخريطة',
    description: 'إظهار النشاط في صدارة نتائج البحث المحلية واستهداف العملاء المجاورين.',
    price: 500
  },
  {
    id: 'srv-3',
    title: 'خدمة التقييمات والرد الآلي الذكي على المراجعات',
    description: 'تحسين سمعة المنشأة وزيادة التفاعل والرد السريع على استفسارات العملاء.',
    price: 250
  }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'توجيه إداري جديد من الإدارة 📩',
    message: 'توجيه بشأن منشأة مؤسسة البركة: يرجى إرفاق صورة واضحة للافتة الخارجية عند الزيارة القادمة.',
    type: 'admin_directive',
    targetPlaceId: 'PLACE-909500',
    read: false,
    createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'notif-2',
    title: 'تنبيه موعد تذكير تجاري (مر الموعد المحدد) ⏰',
    message: 'مر الموعد المحدد لمتابعة عيادات ومراكز طبية — تذكير بمراجعة التاجر لتحصيل المتبقي (عربون).',
    type: 'reminder',
    targetPlaceId: 'PLACE-909500',
    read: false,
    createdAt: new Date(Date.now() - 1800000).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  }
];

const STORAGE_KEY = 'daleelak_field_system_v3';

export function getStoredData(): AppStoreData {
  if (typeof window === 'undefined') {
    return {
      currentUser: INITIAL_EMPLOYEES[0],
      employees: INITIAL_EMPLOYEES,
      places: INITIAL_PLACES,
      notifications: INITIAL_NOTIFICATIONS,
      dailyTarget: 10,
      lastActivityNote: 'عيادات ومراكز طبية — منذ 15 دقيقة',
      activeVisitDraft: null,
      lastCompletedVisit: null
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        notifications: parsed.notifications || INITIAL_NOTIFICATIONS
      };
    }
  } catch (e) {
    console.error('Error reading localStorage', e);
  }

  const initialData: AppStoreData = {
    currentUser: INITIAL_EMPLOYEES[0],
    employees: INITIAL_EMPLOYEES,
    places: INITIAL_PLACES,
    notifications: INITIAL_NOTIFICATIONS,
    dailyTarget: 10,
    lastActivityNote: 'عيادات ومراكز طبية — منذ 15 دقيقة',
    activeVisitDraft: null,
    lastCompletedVisit: null
  };

  saveStoredData(initialData);
  return initialData;
}

export function saveStoredData(data: AppStoreData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving localStorage', e);
  }
}
