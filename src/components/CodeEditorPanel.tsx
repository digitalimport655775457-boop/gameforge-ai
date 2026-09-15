import React, { useState } from 'react';
import { Copy, Check, Download, Play, FileCode, CheckCircle2 } from 'lucide-react';
import { GeneratedProject } from '../types';

interface CodeEditorPanelProps {
  project: GeneratedProject;
  onCodeChange: (newCode: string) => void;
  onApplyCode: () => void;
}

export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  project,
  onCodeChange,
  onApplyCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [appliedToast, setAppliedToast] = useState(false);

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

  const handleApply = () => {
    onApplyCode();
    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 2500);
  };

  const linesCount = project.code.split('\n').length;
  const sizeKb = (new Blob([project.code]).size / 1024).toFixed(1);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 font-mono text-xs select-none">
      {/* Editor Header */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-sans font-bold">
            <FileCode className="w-4 h-4" />
            <span>index.html</span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans">
            {linesCount} lines • {sizeKb} KB
          </span>
        </div>

        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Apply Changes</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Download standalone HTML file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {appliedToast && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-4 py-1.5 flex items-center gap-2 font-sans text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Updated code successfully applied to preview!</span>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers Bar */}
        <div className="w-12 bg-slate-900/60 border-l border-slate-800 py-3 text-slate-600 text-right pr-3 pl-1 select-none overflow-hidden text-[11px] leading-6">
          {Array.from({ length: Math.min(linesCount, 500) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={project.code}
          onChange={(e) => onCodeChange(e.target.value)}
          spellCheck={false}
          dir="ltr"
          className="flex-1 p-3 bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-6 selection:bg-cyan-500/30 overflow-auto"
        />
      </div>
    </div>
  );
};
