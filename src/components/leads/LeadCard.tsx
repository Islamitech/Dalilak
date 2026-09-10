import React, { useState } from 'react';
import { InterestedLead, LeadInterestLevel, LeadStatus } from '../../types';
import { Badge, Button, ConfirmDialog } from '../ui';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { sanitizeExternalUrl } from '../../utils/urlSanitizer';
import { formatActivityDateTime } from '../../utils/dateFormatters';
import {
  Phone,
  MessageSquare,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Share2,
  Trash2,
  Edit,
  MapPin,
  ExternalLink,
  Navigation,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LeadCardProps {
  lead: InterestedLead;
  onEdit: (lead: InterestedLead) => void;
  onDelete: (leadId: string) => void;
  onOpenWhatsAppModal: (lead: InterestedLead) => void;
  onOpenFollowUpModal: (lead: InterestedLead) => void;
  onConvertToBusiness: (lead: InterestedLead) => void;
  onDirectConvertLead?: (lead: InterestedLead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onEdit,
  onDelete,
  onOpenWhatsAppModal,
  onOpenFollowUpModal,
  onConvertToBusiness,
  onDirectConvertLead,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const { copy, copied } = useCopyToClipboard();

  const cleanBizName = (lead.businessName && lead.businessName !== 'عميل مهتم' && lead.businessName !== 'عملاء مهتمون')
    ? lead.businessName
    : '';
  const cleanClientName = (lead.clientName && lead.clientName !== 'عميل مهتم' && lead.clientName !== 'عملاء مهتمون')
    ? lead.clientName
    : '';

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'pending_followup':
        return (
          <Badge variant="warning" size="xs" dot>
            بانتظار المتابعة
          </Badge>
        );
      case 'contacted':
        return (
          <Badge variant="info" size="xs" dot>
            تم التواصل
          </Badge>
        );
      case 'converted':
        return (
          <Badge variant="success" size="xs" dot>
            مسجل ومعتمد
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="xs">
            ملغي / غير مهتم
          </Badge>
        );
    }
  };

  const getInterestBadge = (level: LeadInterestLevel) => {
    switch (level) {
      case 'trending_free':
        return (
          <Badge variant="warning" size="xs">
            منشأة رائجة (إدراج مجاني)
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="danger" size="xs">
            مهتم جداً
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="warning" size="xs">
            يحتاج متابعة
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="neutral" size="xs">
            متردد / استفسار
          </Badge>
        );
      case 'intro_sent':
        return (
          <Badge variant="info" size="xs">
            أُرسلت رسالة
          </Badge>
        );
      case 'need_visit':
        return (
          <Badge variant="purple" size="xs">
            طلب زيارة
          </Badge>
        );
    }
  };

  const mapUrl = lead.locationUrl || (lead.lat && lead.lng ? `https://www.google.com/maps?q=${lead.lat},${lead.lng}` : '');

  return (
    <>
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm hover:border-amber-500/40 transition-all overflow-hidden text-xs">
        {/* Header Bar / Collapsed View */}
        <div className="p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shrink-0 mt-0.5">
              <MapPin className="w-5 h-5" />
            </div>

            <div className="min-w-0 space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm text-[var(--text-primary)] truncate">
                  {cleanBizName || cleanClientName || 'منشأة قيد المتابعة'}
                </h4>

                {cleanClientName && cleanBizName && cleanClientName !== cleanBizName && (
                  <span className="text-[11px] font-bold text-[var(--text-muted)]">
                    ({cleanClientName})
                  </span>
                )}

                <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--input-bg)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">
                  {lead.governorate} {lead.city ? `• ${lead.city}` : ''}
                </span>

                {lead.businessCategory && (
                  <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">
                    {lead.businessCategory}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] flex-wrap">
                <a
                  href={`tel:${lead.phone}`}
                  className="font-mono font-bold text-amber-600 hover:underline dir-ltr"
                >
                  {lead.phone}
                </a>

                {lead.followUpDate && (
                  <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--input-bg)] px-1.5 py-0.5 rounded border border-[var(--border-color)] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>متابعة: {lead.followUpDate}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions & Badges */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
            {(lead.isTrending || lead.interestLevel === 'trending_free') && (
              <Badge variant="warning" size="xs">
                رائجة
              </Badge>
            )}

            {getStatusBadge(lead.status)}

            <Button
              variant="success"
              size="sm"
              onClick={() => onOpenWhatsAppModal(lead)}
              icon={<Share2 className="w-3.5 h-3.5" />}
            >
              واتساب
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              icon={isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            >
              {isExpanded ? 'أقل' : 'المزيد'}
            </Button>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="border-t border-[var(--border-color)] p-3.5 sm:p-4 bg-[var(--bg-card)]/40 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cleanClientName && cleanClientName !== cleanBizName && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold text-[11px]">المسؤول / صاحب المكان:</span>
                  <span className="font-bold text-[var(--text-primary)]">{cleanClientName}</span>
                </div>
              )}

              <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-bold text-[11px]">المندوب المسجل:</span>
                <span className="font-bold text-[var(--text-secondary)] truncate max-w-[140px]">{lead.repName}</span>
              </div>

              <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[var(--text-muted)] font-bold text-[11px]">مستوى الاهتمام:</span>
                <div>{getInterestBadge(lead.interestLevel)}</div>
              </div>

              {lead.street && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between sm:col-span-2">
                  <span className="text-[var(--text-muted)] font-bold text-[11px]">الشارع / العنوان:</span>
                  <span className="font-bold text-[var(--text-primary)]">{lead.street}</span>
                </div>
              )}
            </div>

            {/* Map Location Link */}
            {mapUrl && (
              <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300">نقطة الخريطة الجغرافية محددة:</span>
                <a
                  href={sanitizeExternalUrl(mapUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-[11px] inline-flex items-center gap-1 mr-auto"
                >
                  <span>فتح الرابط في خرائط Google</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-xl text-xs text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-amber-600 dark:text-amber-400 font-bold block text-[10px] mb-0.5">ملاحظات الزيارة الميدانية:</strong>
                {lead.notes}
              </div>
            )}

            {/* Follow-ups */}
            {lead.adminFollowUps && lead.adminFollowUps.length > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/25 p-2.5 rounded-xl text-xs text-purple-950 dark:text-purple-300 space-y-1">
                <div className="flex items-center justify-between font-bold text-[10px] text-purple-700 dark:text-purple-400">
                  <span>آخر متابعة إدارية: <strong className="text-[var(--text-primary)]">{lead.adminFollowUps[0].authorName}</strong></span>
                  <span className="font-mono text-[9px]">{formatActivityDateTime(lead.adminFollowUps[0].createdAt)}</span>
                </div>
                <p className="line-clamp-2 font-medium">{lead.adminFollowUps[0].text}</p>
              </div>
            )}

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={`tel:${lead.phone}`}
                  className="bg-[var(--input-bg)] hover:bg-slate-200 text-[var(--text-primary)] font-bold px-3 py-1.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1.5 transition-colors text-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>اتصال</span>
                </a>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenFollowUpModal(lead)}
                  icon={<FileText className="w-3.5 h-3.5 text-purple-500" />}
                  className="bg-purple-500/10 text-purple-700 dark:text-purple-400"
                >
                  متابعات ({lead.adminFollowUps?.length || 0})
                </Button>

                {onDirectConvertLead && lead.status !== 'converted' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => onDirectConvertLead(lead)}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    تحويل فوري لتسجيل معتمد
                  </Button>
                )}

                {lead.status !== 'converted' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onConvertToBusiness(lead)}
                    icon={<FileText className="w-3.5 h-3.5 text-amber-500" />}
                  >
                    فتح بالنموذج الكامل
                  </Button>
                )}

                {lead.status === 'converted' && (
                  <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                    تم التحويل لمشترك معتمد
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 mr-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(lead)}
                  icon={<Edit className="w-4 h-4 text-amber-500" />}
                  title="تعديل بيانات المنشأة"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                  title="حذف هذا السجل"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(lead.id);
          setShowDeleteConfirm(false);
        }}
        title="تأكيد حذف الشخص المهتم"
        message={`هل أنت متأكد من حذف سجل الشخص المهتم "${lead.clientName || lead.businessName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="تأكيد الحذف"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </>
  );
};
