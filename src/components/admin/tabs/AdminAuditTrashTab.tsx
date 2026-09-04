import React, { useState, useMemo } from 'react';
import { Business, Representative, InterestedLead, AdminFollowUpNote } from '../../../types';
import {
  Trash2,
  RotateCcw,
  ShieldAlert,
  Store,
  Users,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
  Eye,
  Filter,
  Calendar,
  Lock,
} from 'lucide-react';

interface AdminAuditTrashTabProps {
  deletedBusinesses: Business[];
  deletedRepresentatives: Representative[];
  allBusinesses: Business[];
  allLeads: InterestedLead[];
  onRestoreBusiness: (biz: Business) => void;
  onHardDeleteBusiness: (id: string) => void;
  onRestoreRepresentative: (rep: Representative) => void;
  onHardDeleteRepresentative: (id: string) => void;
  onShowNotification?: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const AdminAuditTrashTab: React.FC<AdminAuditTrashTabProps> = ({
  deletedBusinesses,
  deletedRepresentatives,
  allBusinesses,
  allLeads,
  onRestoreBusiness,
  onHardDeleteBusiness,
  onRestoreRepresentative,
  onHardDeleteRepresentative,
  onShowNotification,
}) => {
  const [subSection, setSubSection] = useState<'trash_biz' | 'trash_reps' | 'followups_audit'>('trash_biz');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Filtered Deleted Businesses
  const filteredBusinesses = useMemo(() => {
    return deletedBusinesses.filter((b) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        b.nameAr?.toLowerCase().includes(q) ||
        b.nameEn?.toLowerCase().includes(q) ||
        b.phone?.includes(q) ||
        b.governorate?.toLowerCase().includes(q) ||
        b.deletedBy?.toLowerCase().includes(q)
      );
    });
  }, [deletedBusinesses, searchQuery]);

  // 2. Filtered Deleted Reps
  const filteredReps = useMemo(() => {
    return deletedRepresentatives.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.deletedBy?.toLowerCase().includes(q)
      );
    });
  }, [deletedRepresentatives, searchQuery]);

  // 3. Central Flattened Follow-Ups across all Businesses & Leads
  const allFollowUps = useMemo(() => {
    interface FollowUpItem {
      note: AdminFollowUpNote;
      sourceType: 'business' | 'lead';
      sourceId: string;
      sourceName: string;
      sourceGovernorate?: string;
    }

    const list: FollowUpItem[] = [];

    allBusinesses.forEach((b) => {
      if (Array.isArray(b.adminFollowUps)) {
        b.adminFollowUps.forEach((note) => {
          list.push({
            note,
            sourceType: 'business',
            sourceId: b.id,
            sourceName: b.nameAr || 'نشاط تجاري',
            sourceGovernorate: b.governorate,
          });
        });
      }
    });

    allLeads.forEach((l) => {
      if (Array.isArray(l.adminFollowUps)) {
        l.adminFollowUps.forEach((note) => {
          list.push({
            note,
            sourceType: 'lead',
            sourceId: l.id,
            sourceName: l.clientName || l.businessName || 'عميل محتمل',
            sourceGovernorate: l.governorate,
          });
        });
      }
    });

    list.sort((a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime());
    return list;
  }, [allBusinesses, allLeads]);

  const filteredFollowUps = useMemo(() => {
    if (!searchQuery.trim()) return allFollowUps;
    const q = searchQuery.toLowerCase().trim();
    return allFollowUps.filter(
      (item) =>
        item.sourceName.toLowerCase().includes(q) ||
        item.note.authorName?.toLowerCase().includes(q) ||
        item.note.text?.toLowerCase().includes(q) ||
        item.note.authorRole?.toLowerCase().includes(q)
    );
  }, [allFollowUps, searchQuery]);

  return (
    <div className="space-y-4">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-amber-400">
                  سجل الرقابة العليا وسلة المحذوفات (أثر السيرفر)
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>خاص وسري للغاية</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5">
                تظهر هنا كافة العناصر التي تم حذفها بواسطة المدراء الآخرين مع إمكانية استرجاعها فوراً أو تأكيد حذفها النهائي، بالإضافة لكافة المتابعات الإدارية الخفية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800 self-stretch sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setSubSection('trash_biz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                subSection === 'trash_biz'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>أنشطة محذوفة ({deletedBusinesses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubSection('trash_reps')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                subSection === 'trash_reps'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>حسابات محذوفة ({deletedRepresentatives.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubSection('followups_audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                subSection === 'followups_audit'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>سجل المتابعات الخفي ({allFollowUps.length})</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، رقم الهاتف، أو اسم من قام بالحذف / التدوين..."
              className="w-full bg-slate-950/80 border border-slate-700 text-white text-xs rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:border-amber-500 placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* 1. SUB-TAB: DELETED BUSINESSES */}
      {subSection === 'trash_biz' && (
        <div className="space-y-3">
          {filteredBusinesses.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
              <p className="font-black text-sm text-[var(--text-primary)]">سلة الأنشطة المحذوفة فارغة تماماً</p>
              <p className="text-xs text-[var(--text-muted)]">
                لا توجد أي أنشطة محذوفة معلقة. عندما يقوم أي مدير بحذف نشاط، سيبقى أثره محفوظاً هنا لاتخاذ القرار.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBusinesses.map((biz) => {
                const deletedDate = biz.deletedAt
                  ? new Date(biz.deletedAt).toLocaleString('ar-EG')
                  : 'تاريخ غير محدد';

                return (
                  <div
                    key={biz.id}
                    className="bg-[var(--bg-card)] border-2 border-rose-500/30 hover:border-rose-500/50 rounded-2xl p-4 shadow-sm space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-[var(--border-color)] pb-2.5">
                      <div>
                        <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-amber-500" />
                          <span>{biz.nameAr || biz.nameEn}</span>
                        </h4>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                          {biz.category} • {biz.governorate} • {biz.phone}
                        </span>
                      </div>
                      <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[10px] px-2 py-0.5 rounded-md border border-rose-500/30 shrink-0">
                        محذوف ناعم (أثر السيرفر)
                      </span>
                    </div>

                    <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="font-bold">من قام بالحذف:</span>
                        <span className="font-black text-rose-600 dark:text-rose-400">
                          {biz.deletedBy || 'مدير النظام'} {biz.deletedByRole ? `(${biz.deletedByRole})` : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="font-bold">تاريخ الحذف:</span>
                        <span className="font-mono text-[var(--text-primary)]">{deletedDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="font-bold">المندوب المسجل:</span>
                        <span className="font-bold text-[var(--text-primary)]">{biz.repName || biz.repId}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل ترغب في استرجاع نشاط "${biz.nameAr}" وإعادته نشطاً بالمنظومة فوراً؟`)) {
                            onRestoreBusiness(biz);
                            onShowNotification?.(`تم استرجاع نشاط "${biz.nameAr}" بنجاح 🟢`, 'success');
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>استرجاع النشاط 🟢</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`⚠️ تحذير حرج: هل أنت متأكد تماماً من الحذف النهائي البات لنشاط "${biz.nameAr}"؟\nسيتم مسحه نهائياً من قاعدة بيانات Supabase والسيرفر دون إمكانية استرجاع.`)) {
                            onHardDeleteBusiness(biz.id);
                            onShowNotification?.(`تم الحذف النهائي البات لنشاط "${biz.nameAr}" 🗑️`, 'warning');
                          }
                        }}
                        className="bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white font-black text-xs px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>تأكيد الحذف البات 🔴</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. SUB-TAB: DELETED ACCOUNTS */}
      {subSection === 'trash_reps' && (
        <div className="space-y-3">
          {filteredReps.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
              <p className="font-black text-sm text-[var(--text-primary)]">سلة الحسابات المحذوفة فارغة تماماً</p>
              <p className="text-xs text-[var(--text-muted)]">
                لا توجد أي حسابات محذوفة معلقة. عند قيام أي مدير بحذف حساب، سيبقى أثره وبياناته محفوظة هنا.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredReps.map((rep) => {
                const deletedDate = rep.deletedAt
                  ? new Date(rep.deletedAt).toLocaleString('ar-EG')
                  : 'تاريخ غير محدد';

                return (
                  <div
                    key={rep.id}
                    className="bg-[var(--bg-card)] border-2 border-rose-500/30 hover:border-rose-500/50 rounded-2xl p-4 shadow-sm space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-[var(--border-color)] pb-2.5">
                      <div>
                        <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-amber-500" />
                          <span>{rep.name}</span>
                        </h4>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                          {rep.roleTitle || rep.role} • {rep.governorate} • {rep.phone}
                        </span>
                      </div>
                      <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[10px] px-2 py-0.5 rounded-md border border-rose-500/30 shrink-0">
                        حساب محذوف ناعم
                      </span>
                    </div>

                    <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="font-bold">من قام بالحذف:</span>
                        <span className="font-black text-rose-600 dark:text-rose-400">
                          {rep.deletedBy || 'مدير النظام'} {rep.deletedByRole ? `(${rep.deletedByRole})` : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="font-bold">تاريخ الحذف:</span>
                        <span className="font-mono text-[var(--text-primary)]">{deletedDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-secondary)]">
                        <span className="font-bold">البريد الإلكتروني:</span>
                        <span className="font-mono text-[var(--text-primary)]">{rep.email || 'غير مسجل'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل ترغب في استرجاع حساب "${rep.name}" وإعادته نشطاً بالمنظومة فوراً؟`)) {
                            onRestoreRepresentative(rep);
                            onShowNotification?.(`تم استرجاع حساب "${rep.name}" بنجاح 🟢`, 'success');
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>استرجاع الحساب 🟢</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`⚠️ تحذير حرج: هل أنت متأكد تماماً من الحذف النهائي البات لحساب "${rep.name}"؟\nسيتم مسح الحساب وملفاته نهائياً من قاعدة بيانات Supabase والسيرفر.`)) {
                            onHardDeleteRepresentative(rep.id);
                            onShowNotification?.(`تم الحذف النهائي البات لحساب "${rep.name}" 🗑️`, 'warning');
                          }
                        }}
                        className="bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white font-black text-xs px-3 py-1.5 rounded-xl border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>تأكيد الحذف البات 🔴</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. SUB-TAB: CENTRAL FOLLOW-UPS AUDIT LOG */}
      {subSection === 'followups_audit' && (
        <div className="space-y-3">
          {filteredFollowUps.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-10 text-center space-y-2">
              <ClipboardList className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
              <p className="font-black text-sm text-[var(--text-primary)]">لا توجد متابعات مسجلة مطابقة للبحث</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredFollowUps.map((item) => {
                const dateStr = new Date(item.note.createdAt).toLocaleString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.note.id}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-xs transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          {item.sourceType === 'business' ? <Store className="w-3.5 h-3.5 text-amber-500" /> : <Users className="w-3.5 h-3.5 text-blue-500" />}
                          <span>{item.sourceName}</span>
                          {item.sourceGovernorate ? <span className="text-[10px] text-[var(--text-muted)]">({item.sourceGovernorate})</span> : null}
                        </span>

                        <span className="text-[11px] font-black text-purple-600 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                          ✍️ كاتب المتابعة: {item.note.authorName} ({item.note.authorRole || 'إدارة'})
                        </span>

                        {item.note.status && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.note.status === 'urgent'
                              ? 'bg-rose-500/20 text-rose-600'
                              : item.note.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-700'
                              : 'bg-emerald-500/20 text-emerald-700'
                          }`}>
                            {item.note.status === 'urgent' ? 'عاجل' : item.note.status === 'pending' ? 'معلق' : 'منجز'}
                          </span>
                        )}
                      </div>

                      <span className="text-[10.5px] font-mono text-[var(--text-muted)] font-bold">
                        {dateStr}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed whitespace-pre-wrap">
                      {item.note.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
