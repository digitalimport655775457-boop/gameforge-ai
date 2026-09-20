import React, { useRef, useEffect } from 'react';
import { DeviceViewport, GeneratedProject } from '../types';
import { ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { preparePreviewHtml, openInNewWindow } from '../utils/previewSanitizer';

interface PreviewPanelProps {
  project: GeneratedProject;
  viewport: DeviceViewport;
  refreshKey: number;
  onRefresh: () => void;
  isGenerating: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  project,
  viewport,
  refreshKey,
  onRefresh,
  isGenerating
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // When code changes or refreshKey changes, we can reload or let srcDoc update
  }, [project.code, refreshKey]);

  const handleOpenNewWindow = () => {
    openInNewWindow(project.code, project.title, project.id);
  };

  const getContainerWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[400px] h-[820px] rounded-[40px] border-[10px] border-slate-800 shadow-2xl my-4';
      case 'tablet':
        return 'max-w-[800px] h-[95%] rounded-[28px] border-[8px] border-slate-800 shadow-2xl my-4';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  const sanitizedHtml = preparePreviewHtml(project.code, project.title, project.type);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Top Preview Bar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-slate-300 truncate max-w-xs">{project.title}</span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
            {project.type === 'game' ? 'Interactive Canvas' : 'Responsive Web App'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            title="Reload Preview"
            className="hover:text-slate-200 transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-[11px]">Reload</span>
          </button>
          <button
            onClick={handleOpenNewWindow}
            title="Full Screen / Open in New Tab"
            className="hover:text-slate-200 transition flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Full Screen</span>
          </button>
        </div>
      </div>

      {/* Main Iframe Canvas */}
      <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-0 md:p-4">
        <div className={`transition-all duration-300 relative flex flex-col overflow-hidden bg-slate-900 ${getContainerWidth()}`}>
          {/* Mobile/Tablet Speaker Bar Fake Notch */}
          {viewport !== 'desktop' && (
            <div className="h-6 bg-slate-800 flex items-center justify-center">
              <div className="w-16 h-3 bg-slate-900 rounded-full"></div>
            </div>
          )}

          <iframe
            key={refreshKey}
            ref={iframeRef}
            srcDoc={sanitizedHtml}
            title={project.title}
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            className="w-full flex-1 border-0 bg-transparent"
          />

          {isGenerating && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 text-white z-20">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 animate-bounce">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Building and updating project...</h3>
              <p className="text-xs text-slate-300 max-w-sm">
                Gemini is crafting code, styles, and interactive state directly into the live preview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
