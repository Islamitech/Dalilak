import React from 'react';
import { FileText } from 'lucide-react';
import { TEMPLATE_DEFINITIONS } from '../constants';

interface CampaignMessageComposerProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  customText: string;
  setCustomText: (text: string) => void;
}

export const CampaignMessageComposer: React.FC<CampaignMessageComposerProps> = ({
  selectedTemplate,
  onTemplateChange,
  customText,
  setCustomText,
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="font-black text-sm sm:text-base">2. اختيار وصياغة قالب الرسالة</h3>
        </div>
      </div>

      {/* Template Selector Radio Cards */}
      <div className="space-y-2.5">
        {TEMPLATE_DEFINITIONS.map((tmpl) => (
          <div
            key={tmpl.id}
            onClick={() => onTemplateChange(tmpl.id)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
              selectedTemplate === tmpl.id
                ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                : 'bg-white/5 border-[var(--border-color)] hover:border-emerald-500/40'
            }`}
          >
            <div className="pt-0.5">
              <input
                type="radio"
                name="templateSelect"
                checked={selectedTemplate === tmpl.id}
                onChange={() => onTemplateChange(tmpl.id)}
                className="accent-emerald-500"
              />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-[var(--text-primary)]">{tmpl.name}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${tmpl.badgeColor}`}>
                  {tmpl.badge}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{tmpl.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Body Editor */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-black text-[var(--text-secondary)]">نص الرسالة المرسلة (يدعم التنسيق والرموز):</label>
          <span className="text-[10px] text-amber-400 font-mono">
            المتغيرات: {'{name}'} | {'{owner}'} | {'{location}'} | {'{url}'}
          </span>
        </div>
        <textarea
          rows={7}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 text-xs leading-relaxed font-sans text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
          placeholder="اكتب نص الرسالة هنا..."
        />
      </div>
    </div>
  );
};
