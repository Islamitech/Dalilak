# 00 — CONTINUITY INDEX (فهرس الاستمرارية والحوكمة السيادية)

- **المشروع:** دليلك (Dalilak) — منصة التسويق ودليل الأنشطة والمناديب
- **جذر المشروع المعتمد:** `c:\Users\Ahmed\Desktop\New folder\Dalelak`
- **بصمة النسخة (Git Commit):** `43b321419dc3056951443ef86faad9b37715f552`
- **حالة الاعتماد:** معتمد بالكامل للبوابات الثلاث (`GEN-GATE-01`, `GEN-GATE-02`, `GEN-GATE-03`)
- **تاريخ التكوين والتحديث:** 2026-09-17
- **مستوى التحقق العام:** V2 (تحقق تشغيلي واختبارات آلية 100%)

---

## 1. فهرس وثائق منظومة الحوكمة (Governance Suite Index)

| الرقم | الوثيقة | الوصف والدور الحوكمي |
| :---: | :--- | :--- |
| **00** | [00_CONTINUITY_INDEX.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/00_CONTINUITY_INDEX.md) | الفهرس المركزي، خريطة الروابط، وقواعد الاستمرارية |
| **01** | [01_PRODUCT_VISION_AND_CONSTRAINTS.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/01_PRODUCT_VISION_AND_CONSTRAINTS.md) | تعريف المنتج، الأدوار الأربعة، والقيود الحاكمة الصارمة |
| **02** | [02_CORE_FUNCTIONAL_INVENTORY.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/02_CORE_FUNCTIONAL_INVENTORY.md) | الجرد الوظيفي لجميع المداخل (18 مدخلاً ومسار استدعاء) |
| **03** | [03_TARGET_UX_SPECIFICATION.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/03_TARGET_UX_SPECIFICATION.md) | أسطح الواجهات، تجربة الاستخدام، ومعالجة الحالات الاستثنائية |
| **04** | [04_CAPABILITY_MAPPING_MATRIX.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/04_CAPABILITY_MAPPING_MATRIX.md) | مصفوفة القدرات العشر ونسب استيفاء معايير القبول (85%) |
| **05** | [05_ARCHITECTURAL_DECISION_RECORDS.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/05_ARCHITECTURAL_DECISION_RECORDS.md) | سجل القرارات التاريخية (ADR-001 إلى 003) والمقترحة (004 إلى 005) |
| **06** | [06_PHASE_STATUS_TRACKER.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/06_PHASE_STATUS_TRACKER.md) | متتبع الحالة الحية للمسارات، مصفوفة المخاطر، والفجوات |
| **07** | [07_MASTER_BACKLOG.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/07_MASTER_BACKLOG.md) | سجل بنود العمل والمهام المرتبة بالأولوية (TASK-01 إلى TASK-05) |
| **08** | [08_CONVERSATION_COMMANDS_PLAYBOOK.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/08_CONVERSATION_COMMANDS_PLAYBOOK.md) | كتالوج الأوامر التشغيلية وسكربتات البيئة الحقيقية للمشروع |
| **09** | [09_CURRENT_DELIVERY_CONTRACT.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/09_CURRENT_DELIVERY_CONTRACT.md) | عقد الحقيقة التشغيلية الراهنة وفصل القائم عن المأمول |
| **10** | [10_OPERATIONAL_RELEASE_GUIDE.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/10_OPERATIONAL_RELEASE_GUIDE.md) | دليل التشغيل والإنتاج وآليات التراجع وحماية الأسرار |
| **11** | [11_AUTONOMOUS_TRANSITION_ENGINE.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/governance/11_AUTONOMOUS_TRANSITION_ENGINE.md) | محرك الانتقال وقواعد اختيار المحطة التنفيذية التالية (WS-05) |

---

## 2. السجلات المساندة ونقطة الاستئناف
- **نقطة الاستئناف الحية:** [_audit/CHECKPOINT.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/_audit/CHECKPOINT.md)
- **سجل الأدلة والمشاهدات المباشرة:** [_audit/EVIDENCE_REGISTRY.md](file:///c:/Users/Ahmed/Desktop/New%20folder/Dalelak/_audit/EVIDENCE_REGISTRY.md)

---

## 3. الترتيب الموصى به لقراءة المنظومة
`00_CONTINUITY_INDEX` ← `09_CURRENT_DELIVERY_CONTRACT` ← `06_PHASE_STATUS_TRACKER` ← `07_MASTER_BACKLOG` ثم بقية الوثائق بحسب النطاق المستهدف.

---

## 4. آلية فض التعارض وتحديث الوثائق
- الحقيقة المستخرجة من الشيفرة المصدرية المباشرة تعلو دائمًا على أي ادعاء نظري مجرد.
- لا يجوز تحويل أي قدرة إلى «مكتملة» ما لم يتم التحقق منها عبر اختبارات تشغيلية (V2 على الأقل).
- عند حدوث أي تعديل في الكود المصدري، يتم تحديث الوثائق المتأثرة وسجل الاستئناف مع الحفاظ على الأرقام الثابتة للأدلة والقدرات.
