import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  CheckCircle2, 
  Gamepad2, 
  Building2, 
  Globe, 
  Cpu,
  RefreshCw,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, QuickPrompt, ProjectType } from '../types';
import { QUICK_PROMPTS } from '../data/defaultProjects';
import { CosmicLogo } from './CosmicLogo';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, projectType?: ProjectType) => void;
  isGenerating: boolean;
  activeProjectTitle: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  activeProjectTitle
}) => {
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectType | 'all'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    const text = input.trim();
    setInput('');
    onSendMessage(text);
  };

  const handleQuickPrompt = (qp: QuickPrompt) => {
    if (isGenerating) return;
    onSendMessage(qp.promptAr || qp.prompt, qp.category);
  };

  const filteredPrompts = selectedCategory === 'all'
    ? QUICK_PROMPTS
    : QUICK_PROMPTS.filter(p => p.category === selectedCategory);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100">
      {/* Panel Top Title with Cosmic Branding */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <CosmicLogo size="sm" />
          <div>
            <h2 className="text-xs font-bold text-slate-200">Gemini Live Studio Engine</h2>
            <p className="text-[10px] text-slate-400">Instant AI generation with auto-cascade resilience</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online &amp; Active</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}
          >
            <div className="flex items-start gap-2.5 max-w-[92%]">
              {msg.sender === 'user' ? (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <div className="shrink-0 mt-0.5">
                  <CosmicLogo size="sm" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600/90 text-white rounded-tr-none'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.projectTitle && (
                  <div className="mb-2 pb-2 border-b border-slate-700/60 flex items-center justify-between">
                    <span className="font-bold text-indigo-300 text-xs">{msg.projectTitle}</span>
                    {msg.projectType && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 capitalize">
                        {msg.projectType}
                      </span>
                    )}
                  </div>
                )}

                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Extracted Features */}
                {msg.features && msg.features.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400">Integrated Features:</div>
                    {msg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Suggested next prompts */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1.5">
                    <div className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      <span>Suggested Next Steps:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedPrompts.map((sp, idx) => (
                        <button
                          key={idx}
                          disabled={isGenerating}
                          onClick={() => onSendMessage(sp)}
                          className="text-[10px] bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-600/50 transition text-left"
                        >
                          + {sp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-9">{msg.timestamp}</span>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-start gap-2.5 text-slate-400 text-xs">
            <CosmicLogo size="sm" className="animate-pulse" />
            <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
              <div>
                <span className="text-white font-medium">Gemini is writing and crafting your project...</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Building code, styles, and interactive state</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Category Quick Prompts */}
      <div className="p-3 bg-slate-900/80 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400">Quick Inspiration:</span>
          <div className="flex items-center gap-1 text-slate-400">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                selectedCategory === 'all' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('game')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                selectedCategory === 'game' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              Games
            </button>
            <button
              onClick={() => setSelectedCategory('platform')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                selectedCategory === 'platform' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              Platforms
            </button>
            <button
              onClick={() => setSelectedCategory('website')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                selectedCategory === 'website' ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:text-slate-300'
              }`}
            >
              Websites
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {filteredPrompts.map((qp) => (
            <button
              key={qp.id}
              onClick={() => handleQuickPrompt(qp)}
              disabled={isGenerating}
              className="shrink-0 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 p-2 rounded-xl text-left transition max-w-[210px] group"
            >
              <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-bold mb-1">
                {qp.category === 'game' ? <Gamepad2 className="w-3 h-3" /> :
                 qp.category === 'platform' ? <Building2 className="w-3 h-3" /> :
                 qp.category === 'website' ? <Globe className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                <span className="truncate">{qp.titleAr || qp.title || qp.category}</span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight group-hover:text-slate-300">
                {qp.promptAr || qp.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-950 border-t border-slate-800">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask Gemini to build an app, educational game, or website..."
            rows={2}
            disabled={isGenerating}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute left-2 p-2 bg-gradient-to-tr from-indigo-500 to-blue-600 hover:opacity-90 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 px-1">
          <span>Press Enter to send to Gemini</span>
          <span>Active Project: <strong className="text-slate-400">{activeProjectTitle}</strong></span>
        </div>
      </form>
    </div>
  );
};
