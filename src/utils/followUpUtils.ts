import { Business, AdminFollowUpNote } from '../types';

export type FollowUpUrgency = 'overdue' | 'due_today' | 'upcoming' | 'completed' | 'none';

export interface FollowUpUrgencyInfo {
  urgency: FollowUpUrgency;
  label: string;
  badgeClass: string;
  daysDiff: number;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getLocalTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the calendar days difference between a target YYYY-MM-DD and today
 * Positive = future (N days remaining)
 * Zero = today
 * Negative = past (N days overdue)
 */
export function getDaysDifferenceFromToday(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const todayStr = getLocalTodayString();
  const [tY, tM, tD] = targetDateStr.split('-').map(Number);
  const [cY, cM, cD] = todayStr.split('-').map(Number);

  const targetUtc = Date.UTC(tY, tM - 1, tD);
  const currentUtc = Date.UTC(cY, cM - 1, cD);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - currentUtc) / msPerDay);
}

/**
 * Classifies an individual follow-up note into traffic-light urgency
 */
export function getFollowUpUrgency(note: AdminFollowUpNote): FollowUpUrgencyInfo {
  if (note.status === 'completed') {
    return {
      urgency: 'completed',
      label: 'تم الإنجاز ✓',
      badgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      daysDiff: 0,
    };
  }

  if (note.nextFollowUpDate) {
    const diff = getDaysDifferenceFromToday(note.nextFollowUpDate);

    if (diff < 0) {
      const absDiff = Math.abs(diff);
      const daysText = absDiff === 1 ? 'يوم واحد' : absDiff === 2 ? 'يومين' : `${absDiff} أيام`;
      return {
        urgency: 'overdue',
        label: `🔴 متأخرة منذ ${daysText}`,
        badgeClass: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 animate-pulse font-black',
        daysDiff: diff,
      };
    }

    if (diff === 0) {
      return {
        urgency: 'due_today',
        label: '🟡 مستحقة اليوم',
        badgeClass: 'bg-amber-500/25 text-amber-900 dark:text-amber-200 border-amber-500/50 font-black',
        daysDiff: 0,
      };
    }

    const daysText = diff === 1 ? 'غداً' : diff === 2 ? 'بعد يومين' : `بعد ${diff} أيام`;
    return {
      urgency: 'upcoming',
      label: `🟢 مجدولة (${daysText})`,
      badgeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 font-bold',
      daysDiff: diff,
    };
  }

  // If no specific date was set:
  if (note.status === 'urgent') {
    return {
      urgency: 'overdue',
      label: '🔴 عاجل وهام',
      badgeClass: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/50 font-black animate-pulse',
      daysDiff: 0,
    };
  }

  return {
    urgency: 'none',
    label: '⏳ معلق للمتابعة',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold',
    daysDiff: 0,
  };
}

export interface BusinessFollowUpSummary {
  hasOverdue: boolean;
  isOverdue: boolean;
  hasDueToday: boolean;
  isDueToday: boolean;
  hasUpcoming: boolean;
  overdueCount: number;
  dueTodayCount: number;
  pendingCount: number;
  completedCount: number;
  totalNotes: number;
  latestNote?: AdminFollowUpNote;
}

/**
 * Returns a full CRM urgency summary for a business
 */
export function getBusinessFollowUpSummary(biz: Business): BusinessFollowUpSummary {
  const notes = biz.adminFollowUps || [];
  let overdueCount = 0;
  let dueTodayCount = 0;
  let pendingCount = 0;
  let completedCount = 0;

  for (const note of notes) {
    if (note.status === 'completed') {
      completedCount++;
      continue;
    }
    const { urgency } = getFollowUpUrgency(note);
    if (urgency === 'overdue') {
      overdueCount++;
    } else if (urgency === 'due_today') {
      dueTodayCount++;
    } else {
      pendingCount++;
    }
  }

  // Find latest note (most recently created)
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    hasOverdue: overdueCount > 0,
    isOverdue: overdueCount > 0,
    hasDueToday: dueTodayCount > 0,
    isDueToday: dueTodayCount > 0,
    hasUpcoming: pendingCount > 0,
    overdueCount,
    dueTodayCount,
    pendingCount,
    completedCount,
    totalNotes: notes.length,
    latestNote: sortedNotes[0],
  };
}

/**
 * Returns true if the business has any overdue follow-up notes
 */
export function isBusinessFollowUpOverdue(biz: Business): boolean {
  const notes = biz.adminFollowUps || [];
  const todayStr = getLocalTodayString();
  return notes.some((n) => {
    if (n.status === 'completed') return false;
    if (n.status === 'urgent') return true;
    if (n.nextFollowUpDate && n.nextFollowUpDate < todayStr) return true;
    return false;
  });
}
