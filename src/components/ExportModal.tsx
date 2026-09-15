import React, { useState } from 'react';
import { X, Download, Copy, Check, CheckCircle2, Rocket, Globe, Share2, ExternalLink, Sparkles } from 'lucide-react';
import { GeneratedProject } from '../types';

interface ExportModalProps {
  project: GeneratedProject;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(project.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([project.code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_') || 'project'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateShareLink = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: project.id,
          title: project.title,
          type: project.type,
          code: project.code,
        }),
      });
      const data = await res.json();
      if (data.shareUrl) {
        const full = `${window.location.origin}${data.shareUrl}`;
        setPublicUrl(full);
        navigator.clipboard.writeText(full);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      }
    } catch (e) {
      console.warn('Share link generation notice:', e);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تصدير ونشر المشروع (Export &amp; Share)</h3>
              <p className="text-xs text-slate-400">{project.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viral Share Link Generator */}
        <div className="bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/30 text-purple-300 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">رابط نشر ترويجي مجاني (Viral Share Link)</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
              ترويج تلقائي
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            أنشئ رابطاً فورياً لمشروعك يمكنك مشاركته مع أي شخص. سيحتوي الموقع المشترك على شارة <strong>Made with GameForge</strong> التي تروج لمنصتك مجاناً!
          </p>

          {publicUrl ? (
            <div className="flex items-center gap-2 bg-[#120b24] border border-purple-500/40 rounded-xl p-1.5 pl-3">
              <span className="text-xs text-purple-200 truncate flex-1 font-mono">{publicUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }}
                className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{shareCopied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 hover:bg-purple-500/20 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                title="فتح الرابط في نافذة جديدة"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <button
              onClick={handleGenerateShareLink}
              disabled={isPublishing}
              className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isPublishing ? 'animate-spin' : ''}`} />
              <span>{isPublishing ? 'جارٍ توليد الرابط...' : 'توليد رابط النشر والمشاركة الفوري'}</span>
            </button>
          )}
        </div>

        {/* Project Features Summary */}
        <div className="bg-slate-800/60 border border-slate-700/70 p-4 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-slate-300">مواصفات الحزمة البرمجية:</span>
          <div className="grid grid-cols-1 gap-1.5 pt-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>ملف HTML5 متكامل ومستقل – يعمل فوراً بدون خادم أو اتصال</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>تنسيق Tailwind CSS مع تجاوب كامل للهواتف والحواسيب</span>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-2xl transition text-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>تحميل ملف HTML</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl border border-slate-700 transition text-xs cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
            <span>{copied ? 'تم نسخ الكود!' : 'نسخ الكود المصدري'}</span>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
