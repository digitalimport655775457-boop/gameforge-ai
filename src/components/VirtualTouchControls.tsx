import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Gamepad2, 
  Volume2, 
  Maximize2 
} from 'lucide-react';

interface VirtualTouchControlsProps {
  onKeyPress: (key: string, code: string) => void;
  onKeyUp: (key: string, code: string) => void;
  onActionClick?: (action: 'A' | 'B' | 'SPACE' | 'ENTER') => void;
}

export const VirtualTouchControls: React.FC<VirtualTouchControlsProps> = ({
  onKeyPress,
  onKeyUp,
  onActionClick,
}) => {
  const triggerKey = (key: string, code: string) => {
    onKeyPress(key, code);
  };

  const releaseKey = (key: string, code: string) => {
    onKeyUp(key, code);
  };

  // Helper for touch & mouse events on buttons
  const createKeyHandlers = (key: string, code: string) => ({
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      triggerKey(key, code);
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.preventDefault();
      releaseKey(key, code);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      e.preventDefault();
      releaseKey(key, code);
    },
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      triggerKey(key, code);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      releaseKey(key, code);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      releaseKey(key, code);
    },
  });

  return (
    <div className="w-full bg-[#110b24]/95 border-t border-purple-500/25 px-4 py-3 select-none touch-none shrink-0 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Left Side: D-Pad Directional Arrows */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          {/* Center decorative hub */}
          <div className="absolute w-8 h-8 rounded-full bg-[#1f153d] border border-purple-500/30 flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]/50" />
          </div>

          {/* Up */}
          <button
            type="button"
            {...createKeyHandlers('ArrowUp', 'ArrowUp')}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl bg-[#231745] hover:bg-[#342266] active:bg-[#7C3AED] active:scale-95 border border-purple-500/40 flex items-center justify-center text-purple-200 active:text-white shadow-lg shadow-purple-950/50 transition-transform cursor-pointer"
            aria-label="Up"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Down */}
          <button
            type="button"
            {...createKeyHandlers('ArrowDown', 'ArrowDown')}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl bg-[#231745] hover:bg-[#342266] active:bg-[#7C3AED] active:scale-95 border border-purple-500/40 flex items-center justify-center text-purple-200 active:text-white shadow-lg shadow-purple-950/50 transition-transform cursor-pointer"
            aria-label="Down"
          >
            <ArrowDown className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Left */}
          <button
            type="button"
            {...createKeyHandlers('ArrowLeft', 'ArrowLeft')}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#231745] hover:bg-[#342266] active:bg-[#7C3AED] active:scale-95 border border-purple-500/40 flex items-center justify-center text-purple-200 active:text-white shadow-lg shadow-purple-950/50 transition-transform cursor-pointer"
            aria-label="Left"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Right */}
          <button
            type="button"
            {...createKeyHandlers('ArrowRight', 'ArrowRight')}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#231745] hover:bg-[#342266] active:bg-[#7C3AED] active:scale-95 border border-purple-500/40 flex items-center justify-center text-purple-200 active:text-white shadow-lg shadow-purple-950/50 transition-transform cursor-pointer"
            aria-label="Right"
          >
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Center: Quick Space / Enter Keys */}
        <div className="flex flex-col items-center justify-center gap-2 flex-1 max-w-[200px]">
          <button
            type="button"
            {...createKeyHandlers(' ', 'Space')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#231745] hover:bg-[#342266] active:bg-[#7C3AED] border border-purple-500/30 text-purple-200 active:text-white text-xs font-bold tracking-wider uppercase transition shadow-md shadow-purple-950/40 flex items-center justify-center gap-2"
          >
            <span>SPACE (مسافة)</span>
          </button>

          <button
            type="button"
            {...createKeyHandlers('Enter', 'Enter')}
            className="w-full py-1.5 px-3 rounded-lg bg-[#18112e] hover:bg-[#251747] active:bg-[#6D28D9] border border-purple-500/20 text-slate-300 text-[10px] font-semibold transition flex items-center justify-center gap-1.5"
          >
            <span>ENTER (إدخال / ابدأ)</span>
          </button>
        </div>

        {/* Right Side: Action Buttons A & B (Arcade Style) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Button B (Secondary / Special) */}
          <button
            type="button"
            {...createKeyHandlers('x', 'KeyX')}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ec4899] to-[#be185d] active:scale-90 border-2 border-pink-400/50 flex flex-col items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-pink-900/50 transition-transform cursor-pointer"
            title="زر B / Key X"
          >
            <span>B</span>
            <span className="text-[8px] opacity-70 font-mono">X</span>
          </button>

          {/* Button A (Primary Action / Jump / Shoot) */}
          <button
            type="button"
            {...createKeyHandlers('z', 'KeyZ')}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] active:scale-90 border-2 border-purple-300/60 flex flex-col items-center justify-center text-white font-extrabold text-base shadow-xl shadow-purple-900/60 transition-transform cursor-pointer"
            title="زر A / Key Z"
          >
            <span>A</span>
            <span className="text-[9px] opacity-70 font-mono">Z</span>
          </button>
        </div>
      </div>
    </div>
  );
};
