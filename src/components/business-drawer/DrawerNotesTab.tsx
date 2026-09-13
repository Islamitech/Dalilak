import React from 'react';
import { Send, Calendar, ShieldAlert } from 'lucide-react';
import { Business } from '../../types';
import { Button } from '../design-system/Button';

interface DrawerNotesTabProps {
  business: Business;
  newNoteText: string;
  setNewNoteText: (text: string) => void;
  onAddNoteSubmit: (e: React.FormEvent) => void;
}

export const DrawerNotesTab: React.FC<DrawerNotesTabProps> = ({
  business,
  newNoteText,
  setNewNoteText,
  onAddNoteSubmit
}) => {
  const followUps = business.adminFollowUps || [];
  const legacyNotes = business.notes ? business.notes.split('\n').filter(Boolean) : [];

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <form onSubmit={onAddNoteSubmit} className="flex gap-2">
        <input
          type="text"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="اكتب ملاحظة متابعة أو عملية جديدة..."
          className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!newNoteText.trim()}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          إضافة
        </Button>
      </form>

      {/* Timeline */}
      <div className="space-y-3 pt-2">
        {followUps.length === 0 && legacyNotes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            لا توجد ملاحظات أو تتبعات سابقة لهذا المكان
          </div>
        ) : (
          <>
            {/* Structured Follow-ups / Audit trail */}
            {followUps.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  note.type === 'payment'
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : note.type === 'verification'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{note.authorName || 'مسؤول المنصة'}</span>
                    {note.authorRole && (
                      <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded font-medium">
                        {note.authorRole === 'rep'
                          ? 'مندوب'
                          : note.authorRole === 'accountant'
                          ? 'حسابات'
                          : 'إدارة'}
                      </span>
                    )}
                    {note.type === 'payment' && (
                      <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-800 text-[10px] rounded font-bold">
                        سند مالي
                      </span>
                    )}
                    {note.type === 'verification' && (
                      <span className="px-1.5 py-0.2 bg-amber-200 text-amber-800 text-[10px] rounded font-bold">
                        توثيق
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">{note.text}</p>
              </div>
            ))}

            {/* Fallback for legacy text notes */}
            {legacyNotes.length > 0 && followUps.length === 0 && (
              <div className="space-y-2">
                {legacyNotes.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium"
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
