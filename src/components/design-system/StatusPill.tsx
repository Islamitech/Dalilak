import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Banknote,
  Sparkles,
  Globe,
  FileEdit,
} from 'lucide-react';
import { VerificationStatus, PaymentStatus } from '../../types';

interface VerificationPillProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

export const VerificationPill: React.FC<VerificationPillProps> = ({ status, size = 'sm' }) => {
  const configs = {
    verified: {
      label: 'موثق ومعتمد',
      icon: ShieldCheck,
      classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    },
    pending: {
      label: 'قيد المراجعة',
      icon: Clock,
      classes: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    },
    in_progress: {
      label: 'جاري الفحص الميداني',
      icon: Clock,
      classes: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    },
    needs_action: {
      label: 'يتطلب إجراء',
      icon: AlertCircle,
      classes: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    },
    rejected: {
      label: 'مرفوض',
      icon: XCircle,
      classes: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    },
  }[status] || {
    label: status,
    icon: Clock,
    classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const Icon = configs.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${configs.classes} ${padding} transition-colors`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{configs.label}</span>
    </span>
  );
};

interface PaymentPillProps {
  status: PaymentStatus;
  isFeeExempt?: boolean;
  size?: 'sm' | 'md';
}

export const PaymentPill: React.FC<PaymentPillProps> = ({
  status,
  isFeeExempt = false,
  size = 'sm',
}) => {
  if (isFeeExempt) {
    const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full border bg-purple-500/10 text-purple-500 border-purple-500/30 ${padding}`}
      >
        <Sparkles className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>إدراج مجاني (رائج)</span>
      </span>
    );
  }

  const configs = {
    fully_paid: {
      label: 'مسدد بالكامل',
      icon: CheckCircle2,
      classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    },
    partially_paid: {
      label: 'مسدد جزئياً',
      icon: Banknote,
      classes: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    },
    unpaid: {
      label: 'غير مسدد',
      icon: AlertCircle,
      classes: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
    },
  }[status] || {
    label: status,
    icon: Banknote,
    classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const Icon = configs.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${configs.classes} ${padding} transition-colors`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{configs.label}</span>
    </span>
  );
};

interface PublishedPillProps {
  status?: 'published' | 'draft' | 'unlisted';
  size?: 'sm' | 'md';
}

export const PublishedPill: React.FC<PublishedPillProps> = ({ status = 'published', size = 'sm' }) => {
  const configs = {
    published: {
      label: 'منشور بالدليل',
      icon: Globe,
      classes: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    },
    draft: {
      label: 'مسودة داخلية',
      icon: FileEdit,
      classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    },
    unlisted: {
      label: 'غير مدرج',
      icon: AlertCircle,
      classes: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    },
  }[status];

  const Icon = configs.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${configs.classes} ${padding} transition-colors`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{configs.label}</span>
    </span>
  );
};
