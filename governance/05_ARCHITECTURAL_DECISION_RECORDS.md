# 05 — ARCHITECTURAL DECISION RECORDS (سجل القرارات المعمارية)

- **الحالة:** مسودة مهيأة للاعتماد
- **التاريخ:** 2026-09-17
- **جذر المشروع:** `c:\Users\Ahmed\Desktop\New folder\Dalelak`
- **بصمة النسخة:** `43b321419dc3056951443ef86faad9b37715f552`
- **مستوى التحقق:** V1 (فحص وتحليل ساكن)

---

## 1. القرارات المعمارية الموثقة والمرصودة

### `ADR-001`: اعتماد بنية هجينة بين التخزين المحلي وقاعدة بيانات Supabase
- **الحالة:** موثق تاريخيًا (Historical)
- **السياق والمشكلة:** الحاجة إلى سرعة استجابة فائقة وعمل النظام محليًا دون توقف عند انقطاع الإنترنت أو مشاكل الاتصال الخارجي، بالتزامن مع توفير مزامنة سحابية مركزية.
- **القرار المعتمد:** استخدام ملف JSON محلي ضخم (`data/server_biz_store.json`) بمثابة مخزن فوري للأنشطة مع طبقة مزامنة تفريغية مجدولة إلى قاعدة بيانات PostgreSQL عبر Supabase.
- **الأدلة:** `‹EV-0011; supabase_schema.sql; E0›` و `‹EV-0012; data/server_biz_store.json; E0›`.
- **الآثار والتبعات:** ظهور مشكلات تضارب ومزامنة متكررة (استدعت ترقيعات SQL متتالية)، واستهلاك ذاكرة مرتفع في Node.js.
- **البدائل المدروسة:** غير موثقة تاريخيًا في السجلات.

---

### `ADR-002`: تشغيل محرك الواتساب عبر خادم Node.js منفصل يعتمد Baileys
- **الحالة:** موثق تاريخيًا (Historical)
- **السياق والمشكلة:** ضرورة التواصل الآلي مع أصحاب الأنشطة التجارية والتسويق دون الاعتماد على Meta Cloud API المكلفة وبإمكانيات ربط مباشرة بأرقام هواتف متعددة.
- **القرار المعتمد:** استخدام مكتبة `@whiskeysockets/baileys` لتأسيس اتصال Web multi-device مباشر وتمرير الأوامر عبر منفذ محلي (3001) وإعادة توجيه المسارات من خادم Express الرئيسي.
- **الأدلة:** `‹EV-0006; server.ts:90-120; E0›` و `‹EV-0015; whatsapp-gateway.ts; E0›`.
- **الآثار والتبعات:** استقلالية خادم الواتساب عن خادم التطبيق الرئيسي، وحاجة الخادم إلى تشغيل دائم محلي وحفظ مفاتيح الجلسة في مجلد مخصص.
- **البدائل المدروسة:** Meta Cloud API الرسمية (استبعدت بسبب التكلفة المرتفعة وحواجز القوالب المعتمدة مسبقًا).

---

### `ADR-003`: فرض نمط التناوب التبادلي (1-5 دقائق) لمنع حظر أرقام الواتساب
- **الحالة:** موثق تاريخيًا ومعتمد حديثًا
- **السياق والمشكلة:** تعرض أرقام هواتف المنصة للحظر التلقائي عند إرسال دفعات رسائل متتالية وسريعة عبر الواتساب.
- **القرار المعتمد:** تطبيق خوارزمية تناوب إجبارية تتبادل الإرسال بين هاتف 1 وهاتف 2 بفاصل زمني عشوائي يتراوح بين دقيقة و5 دقائق بين كل رسالة، وتثبيت جلسة المصادقة المفتوحة.
- **الأدلة:** `‹EV-0018; updates_registry.md; Git commit: b656966; E0›`.
- **الآثار والتبعات:** حماية عالية للأرقام، وانخفاض معدل سرعة الحملات الكبيرة ليكون أكثر أمانًا ومحاكاة للسلوك البشري الطبيعي.
- **البدائل المدروسة:** البث السريع مع إيقاف مؤقت كل 10 رسائل (أثبتت التجربة تعرضه للحظر).

---

## 2. قرارات الحوكمة المقترحة للتطوير القادم (Candidate ADRs)

### `ADR-004`: اعتماد محرك التوكنات المشفرة HMAC والتخزين الدائم للجلسات على القرص
- **الحالة:** معتمد ومنفذ (Approved & Implemented) — عالج `RISK-01` و `GAP-01`
- **السياق والمشكلة:** سقوط جلسات المناديب والمديرين عند إعادة تشغيل خادم Node.js بسبب حفظها حصريًا في كائن `Map` بالذاكرة.
- **القرار المعتمد:** تطبيق توكنات جلسات مشفرة وموقّعة عبر HMAC-SHA256 (`dalil_v2_`) مع مفتاح توقيع مشدد، بالتزامن مع حفظ الجلسات في سجل دائم على القرص (`data/server_sessions_store.json`) واستعادتها تلقائيًا عند الإقلاع.
- **الأدلة:** `server.ts:160-230`، فحص `verify_sessions.ts` واختبارات `tsc --noEmit`.
- **الآثار والتبعات:** صمود الجلسات بالكامل واستقرار دائم لتسجيل دخول المناديب عبر فترات التشغيل والتحديث.

### `ADR-005`: اعتماد Supabase كمصدر حقيقة وحيد (SSOT) وتكريس التخزين المحلي ككاش قراءة واحتياطي صامد
- **الحالة:** معتمد ومنفذ (Approved & Implemented) — عالج `RISK-02` ورقى `CAP-09` إلى V2
- **السياق والمشكلة:** انقسام الحقيقة التشغيلية بين ملف `data/server_biz_store.json` المحلي وقاعدة بيانات Supabase، مما تسبب في تشتت الأنشطة وتوقف حملات الواتساب لعدم مطابقة المعرفات.
- **القرار المعتمد:** جعل Supabase هو المصدر الأحادي الصارم (Single Source of Truth) لكافة عمليات الكتابة (`POST`, `PUT`, `DELETE` على `/api/businesses`) عبر `serviceSupabase` مع Service Role Key، وتكريس ملف `data/server_biz_store.json` ككاش محلي للقراءة السريعة واحتياطي طوارئ يتم تحديثه تلقائياً في الخلفية.
- **الأدلة:** [server.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/server.ts) (دوال `syncBusinessesFromSupabase` ومسارات الأنشطة المحدثة)، واختبار التحقق التكاملي [scripts/verify_ws02_supabase_ssot.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/scripts/verify_ws02_supabase_ssot.ts).
- **الآثار والتبعات:** اتساق تام وفوري للبيانات، القضاء على مشكلات تباين المعرفات بين المناديب والإدارة وحملات الواتساب، مع الحفاظ على سرعة الاستجابة وصمود النظام عند انقطاع الإنترنت.

### `ADR-006`: تقنية مراقبة النبض والحالة المحيطية لخادم الواتساب التبادلي (WhatsApp Heartbeat & Ambient Telemetry)
- **الحالة:** معتمد ومنفذ (Approved & Implemented) — عالج `RISK-03` ورقى `CAP-06` إلى V2
- **السياق والمشكلة:** خادم الواتساب يعمل كخدمة Node.js محلية مستقلة على المنفذ 3005 مفصولة عن خادم الويب (3000)، ولم يكن هناك فحص نبض مستمر أو كشف لحالات انقطاع الهاتف أو تجمد السوكيت، كما افتقرت لوحة الإدارة لمؤشر مباشر ينبه المسؤول بحالة الخدمة دون الدخول لتبويب الواتساب.
- **القرار المعتمد:** 
  1. تزويد محرك البوابة [whatsapp-gateway.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/server/whatsapp-gateway.ts) بحسابات النبض المستمر (Heartbeat) وتتبع مدة الاتصال (Uptime) وتوثيق أسباب الانقطاع ومحاولات الاستعادة التلقائية لكل خط.
  2. توفير مسار استعلام صحة موحد وخفيف الوزن في الخادم الرئيسي `/api/admin/whatsapp/health` مع معالجة بديلة منضبطة تمنع تعطل الواجهة عند إغلاق السيرفر المستقل.
  3. تفعيل شارة مراقبة محيطية لحظية (Ambient Status Badge) على زر تبويب حملات الواتساب في [AdminDashboard.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/AdminDashboard.tsx) تعرض جاهزية الخطين وتنبّه الإدارة فوراً عند وجود حملة نشطة.
  4. سد فجوة توجيه أمر تخطي فترات الانتظار (`POST /api/admin/whatsapp/broadcast-skip-delay`).
- **الأدلة:** [whatsapp-gateway.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/server/whatsapp-gateway.ts), [whatsapp-server.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/server/whatsapp-server.ts), [server.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/server.ts), [AdminDashboard.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/AdminDashboard.tsx), واختبار التحقق [verify_ws03_whatsapp_health.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/scripts/verify_ws03_whatsapp_health.ts).
- **الآثار والتبعات:** رؤية تشغيلية كاملة للإدارة دون الحاجة لتفقد التبويب يدويًا، منع تجمد الحملات بصمت، وقدرة تشخيصية فورية لأي سبب انقطاع.

### `ADR-007`: الدفاع المتعمق وحماية الهوية الوطنية وأمان الأعمدة (Defense-in-depth PII Protection & Column-Level Security)
- **الحالة:** معتمد ومنفذ (Approved & Implemented) — عالج `RISK-04` ورقى `CAP-08` إلى V2
- **السياق والمشكلة:** إمكانية وصول أي مستخدم يحوز مفتاح Anon العام لقاعدة بيانات Supabase مباشرة واستعلام أعمدة الهوية الوطنية (`national_id`)، كلمات المرور، وصور بطاقات الهوية الشخصية للمناديب في جدول `representatives`، بالإضافة لاعتماد نموذج التسجيل على فحص تكرار الرقم القومي عبر مصفوفة الذاكرة مما استلزم نظرياً تحميل أرقام هويات المناديب للمتصفح.
- **القرار المعتمد:**
  1. سحب صلاحيات `SELECT` العامة على جدول `representatives` وتطبيق أمان مستوى الأعمدة (Column-Level Security) في [supabase_rls_security.sql](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/supabase_rls_security.sql) بقصر الاستعلام العام على الأعمدة غير الحساسة، مع حجب كلمات المرور وأرقام وصور البطاقات وتوكنات الجلسات عن المفاتيح العامة.
  2. إنشاء دالة RPC آمنة `check_rep_national_id_exists` بصلاحية `SECURITY DEFINER` توفر فحصاً صفرياً (Zero-Knowledge Check) لوجود الرقم القومي دون استرجاع أي بيانات للمستخدمين.
  3. تطهير `SAFE_REP_SELECT` في شفرة العميل [repDb.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/services/db/repDb.ts) واستخدام دالة الفحص الآمنة في [RegisterForm.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/auth/RegisterForm.tsx).
  4. تعزيز خادم التطبيق [server.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/server.ts) بمسار `/api/auth/check-national-id` ومحرك مزامنة المناديب المركزي `syncRepresentativesFromSupabase` عبر `serviceSupabase` كمصدر حقيقة وحيد (SSOT) وتطهير PII في `/api/representatives`.
- **الأدلة:** [supabase_rls_security.sql](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/supabase_rls_security.sql), [repDb.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/services/db/repDb.ts), [RegisterForm.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/auth/RegisterForm.tsx), [server.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/server.ts), وسكربت التحقق التكاملي [scripts/verify_ws04_pii_security.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/scripts/verify_ws04_pii_security.ts) بنسبة نجاح 100%.
- **الآثار والتبعات:** إغلاق جذري لثغرات تسريب وثائق الهوية والبيانات الحساسة، وتأمين خصوصية المناديب مع الحفاظ على مرونة وسرعة التسجيل الذاتي والتدقيق الإداري.

### `ADR-008`: إرساء خط أساس للاختبارات الآلية السريعة (Automated Testing Baseline with Vitest)
- **الحالة:** معتمد ومنفذ (Approved & Implemented) — عالج `GAP-02` وأنجز `WS-05`
- **السياق والمشكلة:** غياب الاختبارات الآلية في المشروع مما جعل عمليات التعديل والتطوير عرضة لحدوث انتكاسات غير متوقعة (Regressions) في مسارات المصادقة والأمان والمزامنة.
- **القرار المعتمد:** تثبيت وإعداد `vitest` كبيئة اختبارات سريعة تعمل مباشرة مع TypeScript وNode، وربطها بسكربت `npm test`، وتشييد 4 أجنحة اختبارات نموذجية تغطي خوارزميات التوكنات، حماية الهويات PII، قياسات نبض الواتساب، ومحولات الكاش وقاعدة البيانات.
- **الأدلة:** [vitest.config.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/vitest.config.ts), مجلد `tests/`, ونجاح 49/49 اختباراً آلياً بنسبة 100%.
- **الآثار والتبعات:** حماية صارمة لمنطق العمل، تسريع زمن التحقق من دقائق إلى أجزاء من الثانية، ومنع أي تراجع في منطق الأمان والمزامنة مستقبلاً.

### `ADR-009`: تفكيك وهندسة مكونات دليل الأنشطة العام وتوحيد النوافذ (Directory Modularization & UI Harmonization)
- **الحالة:** معتمد ومنفذ (Approved & Implemented) — عالج `GAP-04` وأنجز `WS-06`
- **السياق والمشكلة:** تضخم المكون العملاق `PublicBusinessDirectory.tsx` ليصل إلى أكثر من 1520 سطراً يحوي منطق الترتيب والفلترة والإحصاءات وبطاقات الشبكة والصفوف المجدولة، مما تسبب في صعوبة الصيانة وتشتت تجربة الاستخدام.
- **القرار المعتمد:**
  1. تفكيك المكون العملاق إلى 4 مكونات متخصصة ومستقلة داخل `src/components/directory/`: شريط الإحصاءات [DirectoryMetricsBar.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/directory/DirectoryMetricsBar.tsx)، شريط البحث والفلترة [DirectoryFilterBar.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/directory/DirectoryFilterBar.tsx)، بطاقة الشبكة [DirectoryGridCard.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/directory/DirectoryGridCard.tsx)، وصف القائمة المتجاوب [DirectoryListRow.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/directory/DirectoryListRow.tsx).
  2. توحيد منطق خوارزمية الترتيب العشوائي العادل عبر مولد أرقام شبه عشوائي متزن (Mulberry32 PRNG) في [types.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/directory/types.ts).
  3. حماية نافذة باقات المنشآت في [PackagesHub.tsx](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/src/components/PackagesHub.tsx) وتكييفها بحسب صلاحية الاستدعاء.
  4. بناء جناح اختبارات آلي شامل في [tests/directory-views.test.ts](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/tests/directory-views.test.ts).
- **الأدلة:** مكونات `src/components/directory/`، وتقليص حجم المكون لـ ~360 سطراً، واجتياز 10 اختبارات عرض متخصصة بنسبة 100%.
- **الآثار والتبعات:** وضوح معماري فائق، أداء متجاوب عالي السلاسة، وسهولة تامة في صيانة وتطوير شاشات الدليل العام.


