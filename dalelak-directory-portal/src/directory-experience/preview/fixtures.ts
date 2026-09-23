import { HADAYEK_OFFICIAL_DISTRICTS, HADAYEK_OFFICIAL_GATES } from '../../data/hadayekDistrictsGeoData';
import type { DirectoryPlace, DirectoryCatalog } from '../contracts/directory';
import lounge from './assets/hq-lounge.jpg';
import meeting from './assets/hq-meeting.jpg';
import executive from './assets/hq-executive.jpg';
import workspace from './assets/hq-workspace.jpg';

/** ALL SAMPLE CONTENT. Fictional places, illustrative local photographs, no live records. */
export const DEMO_CATEGORIES = ['مطاعم ومأكولات','صحة ورعاية','تسوق وبقالة','خدمات منزلية','كافيهات','خدمات سيارات'];
export const DEMO_CITIES = ['حدائق الأهرام','الشيخ زايد','المعادي'];
// Geographic labels/rings come from the existing local atlas, not a live service.
export const DEMO_AREAS = HADAYEK_OFFICIAL_DISTRICTS.map(d => d.nameAr);
export const DEMO_GATES = HADAYEK_OFFICIAL_GATES.map(g => ({id:g.id,name:g.nameAr,road:g.accessRoadAr,areas:g.servedZones.join('، '),servedZones:g.servedZones,lat:g.lat,lng:g.lng}));
export const DEMO_PLACES: DirectoryPlace[] = [
  {id:'demo-01',name:'بيت القهوة',category:'كافيهات',city:'حدائق الأهرام',area:'منطقة أ',address:'١٢٤ منطقة أ، بجوار الممشى',description:'مساحة هادئة لقهوتك الصباحية، جلسات مريحة للعمل واللقاءات، وقائمة من المخبوزات الطازجة. تتوفر أماكن داخلية وخارجية. هذا وصف تجريبي لمراجعة طريقة عرض المعلومات.',hours:'يوميًا، ٨ ص – ١١ م',open:true,phone:'01000000000',verified:true,rating:4.8,reviewCount:124,distance:'٣٥٠ م',photos:[lounge,meeting],hasVideo:true,mapPoint:{x:68,y:34}},
  {id:'demo-02',name:'عيادات العافية',category:'صحة ورعاية',city:'حدائق الأهرام',area:'منطقة ب',address:'٨٦ منطقة ب، الدور الأول',description:'عيادات تخصصية بمواعيد معلنة. تواصل مع الاستقبال للاستفسار عن التخصصات والمواعيد المتاحة. بيانات توضيحية وليست توصية طبية.',hours:'السبت – الخميس، ١٠ ص – ٩ م',open:true,phone:'01000000000',verified:true,rating:4.7,reviewCount:86,distance:'٦٠٠ م',photos:[],mapPoint:{x:40,y:45}},
  {id:'demo-03',name:'مائدة الحي',category:'مطاعم ومأكولات',city:'حدائق الأهرام',area:'منطقة ج',address:'٢١٠ منطقة ج، الشارع الرئيسي',description:'وجبات منزلية ومأكولات شرقية في جلسات عائلية. قائمة متنوعة وخيارات للطلبات الخارجية. مكان افتراضي لعرض تجربة الدليل.',hours:'يوميًا، ١٢ ظ – ١٢ م',open:true,phone:'01000000000',verified:true,rating:4.6,reviewCount:58,distance:'٨٥٠ م',photos:[executive],mapPoint:{x:58,y:62}},
  {id:'demo-04',name:'سوق الجيران',category:'تسوق وبقالة',city:'حدائق الأهرام',area:'منطقة د',address:'٣٢ منطقة د، بجوار البوابة',description:'احتياجات المنزل اليومية والمنتجات الطازجة في مكان واحد. بيانات عرض افتراضية.',hours:'يوميًا، ٧ ص – ١ صباحًا',open:true,phone:'01000000000',verified:true,rating:4.5,reviewCount:42,distance:'١٫٢ كم',photos:[],mapPoint:{x:26,y:66}},
  {id:'demo-05',name:'ورشة إتقان',category:'خدمات منزلية',city:'حدائق الأهرام',area:'منطقة هـ',address:'١٧٧ منطقة هـ',description:'صيانة منزلية وتركيبات بموعد مسبق. اتفق على نطاق العمل والتكلفة مع مقدم الخدمة. نشاط افتراضي.',hours:'السبت – الخميس، ٩ ص – ٦ م',open:false,phone:'01000000000',verified:true,distance:'١٫٥ كم',photos:[],mapPoint:{x:77,y:74}},
  {id:'demo-06',name:'مركز الطريق',category:'خدمات سيارات',city:'حدائق الأهرام',area:'منطقة و',address:'٢٤٤ منطقة و، شارع الخدمات',description:'خدمات صيانة وفحص للسيارات. تواصل لمعرفة الخدمات المتاحة. بيانات توضيحية فقط.',hours:'يوميًا، ٩ ص – ٨ م',open:false,phone:'01000000000',verified:true,rating:4.4,reviewCount:32,photos:[],mapPoint:{x:18,y:30}},
  {id:'demo-07',name:'مساحة اللقاء',category:'كافيهات',city:'الشيخ زايد',area:'الحي الأول',address:'الممشى التجاري، الطابق الأرضي',description:'جلسات عمل واجتماعات صغيرة في أجواء مريحة. صور توضيحية من أصول المشروع وليست صور منشأة فعلية.',hours:'يوميًا، ٨ ص – ١٠ م',open:true,phone:'01000000000',verified:true,rating:4.9,reviewCount:73,photos:[workspace],hasVideo:true},
  {id:'demo-08',name:'حديقة المذاق',category:'مطاعم ومأكولات',city:'المعادي',area:'المعادي الجديدة',address:'شارع الحديقة',description:'نموذج لنشاط لا تتوفر له كل المعلومات؛ الواجهة لا تفترض ساعات العمل أو رقم الهاتف.',hours:'',open:null,verified:false,photos:[]},
];
export const DEMO_PACKAGES = [
  {id:'foundation',track:'التوثيق والتأسيس',name:'توثيق الموقع',price:'٢٥٠',unit:'ج.م · مرة واحدة',description:'بداية واضحة لظهور نشاطك.',features:['تثبيت موقع النشاط','تنظيم بيانات التواصل','صور ومعلومات المنشأة'],duration:'٢ – ٣ أيام عمل'},
  {id:'presence',track:'التوثيق والتأسيس',name:'حضور متكامل',price:'٥٠٠',unit:'ج.م · مرة واحدة',description:'صفحة تساعد عملاءك على التعرف عليك.',features:['جميع خدمات التوثيق','جلسة تصوير تعريفية','رابط ورمز QR للنشاط'],duration:'٣ – ٥ أيام عمل',popular:true},
  {id:'growth',track:'التسويق والنمو',name:'انطلاقة النمو',price:'١٬٥٠٠',unit:'ج.م · شهريًا',description:'خطة تواصل ومحتوى تناسب نشاطك.',features:['خطة محتوى شهرية','تصميم منشورات تعريفية','تقرير متابعة مبسط'],duration:'خطة شهرية'},
  {id:'campaign',track:'التسويق والنمو',name:'حملة متكاملة',price:'٣٬٠٠٠',unit:'ج.م · للحملة',description:'عرض منظم لخدمات نشاطك.',features:['إعداد الحملة','تصميم المواد','مراجعة النتائج'],duration:'بحسب نطاق الحملة'},
  {id:'digital',track:'الحلول الرقمية',name:'واجهة رقمية',price:'حسب النطاق',unit:'عرض مخصص',description:'حضور رقمي يتناسب مع احتياجاتك.',features:['صفحة تعريفية','كتالوج الخدمات','تجربة متجاوبة'],duration:'بعد تحديد المتطلبات'},
  {id:'media',track:'التوثيق والتأسيس',name:'تعريف مرئي',price:'٧٥٠',unit:'ج.م · مرة واحدة',description:'صور وجولة تعريفية تساعد الناس على معرفة المكان.',features:['صور للمنشأة','مقطع تعريفي','تنسيق معرض الصور'],duration:'٣ – ٥ أيام عمل'},
  {id:'business',track:'الحلول الرقمية',name:'حلول الشركات',price:'حسب النطاق',unit:'عرض مخصص',description:'تجربة موحدة للأنشطة متعددة الفروع.',features:['عرض الفروع','هيكل خدمات موحد','دراسة احتياجات مخصصة'],duration:'بعد تحديد المتطلبات'},
];
// Fixed additional sample places cover all sixteen districts. All remain fictional.
const extraNames=['صيدلية الندى','مخبز الصباح','قهوة الممشى','سوق الواحة','خدمات البيت','ورشة المسار','عيادة الحياة','مائدة العائلة','متجر الجوار','قهوة الساحة'];
const missingDistricts=HADAYEK_OFFICIAL_DISTRICTS.filter(d=>!DEMO_PLACES.some(p=>p.area===d.nameAr));
missingDistricts.forEach((d,index)=>DEMO_PLACES.push({id:`demo-area-${d.letterAr}`,name:extraNames[index],category:[DEMO_CATEGORIES[1],DEMO_CATEGORIES[0],DEMO_CATEGORIES[4],DEMO_CATEGORIES[2],DEMO_CATEGORIES[3],DEMO_CATEGORIES[5],DEMO_CATEGORIES[1],DEMO_CATEGORIES[0],DEMO_CATEGORIES[2],DEMO_CATEGORIES[4]][index],city:'حدائق الأهرام',area:d.nameAr,address:`شارع الخدمات، ${d.nameAr}`,description:'نشاط افتراضي لعرض تجربة استكشاف المناطق. موقع الدبوس تقريبي داخل بيانات المعاينة فقط.',hours:'يوميًا، ٩ ص – ١٠ م',open:index%3!==0,phone:'01000000000',verified:true,photos:[],coordinates:{lat:d.centerLat-.0003,lng:d.centerLng+.0003}}));
DEMO_PLACES.forEach(place=>{const d=HADAYEK_OFFICIAL_DISTRICTS.find(d=>d.nameAr===place.area);if(d&&!place.coordinates)place.coordinates={lat:d.centerLat-.00045,lng:d.centerLng+.00035};});
// Three fixed examples per district support the featured-card exploration flow.
// Order is curated demo input, not a production ranking or promotion algorithm.
HADAYEK_OFFICIAL_DISTRICTS.forEach(d=>{
  DEMO_PLACES.push(
    {id:`demo-coffee-${d.id}`,name:`قهوة الجوار ${d.letterAr}`,category:'كافيهات',city:'حدائق الأهرام',area:d.nameAr,address:`ممشى الخدمات، ${d.nameAr}`,description:'جلسات هادئة وقائمة مشروبات ومخبوزات. نشاط افتراضي يوضح تجربة استكشاف المكان على الخريطة.',hours:'يوميًا، ٨ ص – ١١ م',open:true,phone:'01000000000',verified:true,rating:4.6,reviewCount:24,photos:[lounge],coordinates:{lat:d.centerLat+.0005,lng:d.centerLng-.00055}},
    {id:`demo-market-${d.id}`,name:`سوق المنطقة ${d.letterAr}`,category:'تسوق وبقالة',city:'حدائق الأهرام',area:d.nameAr,address:`شارع السوق، ${d.nameAr}`,description:'احتياجات يومية ومنتجات طازجة بالقرب من المنزل. معلومات وموقع تجريبيان لعرض الواجهة فقط.',hours:'يوميًا، ٩ ص – ١٢ م',open:true,phone:'01000000000',verified:false,rating:4.4,reviewCount:18,photos:[],coordinates:{lat:d.centerLat-.0008,lng:d.centerLng-.00065}}
  );
});
export const DEMO_CATALOG:DirectoryCatalog={places:DEMO_PLACES,categories:DEMO_CATEGORIES,cities:DEMO_CITIES,areas:DEMO_AREAS,gates:DEMO_GATES,districts:HADAYEK_OFFICIAL_DISTRICTS,packages:DEMO_PACKAGES};

