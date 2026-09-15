import React, { useState } from 'react';
import { Download, Smartphone, Share, X, Sparkles, CheckCircle2, Monitor, ExternalLink, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { CosmicLogo } from './CosmicLogo';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'hero' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install, openStandaloneWindow } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed and running standalone, hide the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleModalInstall = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setShowModal(false);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isInIframe) {
      openStandaloneWindow();
    }
  };

  const buttonContent = () => {
    if (installSuccess) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تم التثبيت بنجاح!</span>
        </div>
      );
    }

    if (variant === 'sidebar') {
      return (
        <button
          onClick={handleClick}
          className={`w-full py-2.5 px-3 text-xs font-semibold text-purple-200 hover:text-white bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-blue-900/40 hover:from-purple-800/60 hover:to-indigo-800/60 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition flex items-center justify-between shadow-sm cursor-pointer ${className}`}
          title="تثبيت التطبيق على جهازك بشعار GameForge الرسمي"
        >
          <div className="flex items-center gap-2">
            <CosmicLogo size="sm" />
            <div className="text-right">
              <div className="font-bold text-white text-xs">تثبيت التطبيق (PWA)</div>
              <div className="text-[10px] text-purple-300">تشغيل مستقل بدون شريط متصفح</div>
            </div>
          </div>
          <Download className="w-4 h-4 text-purple-300 shrink-0" />
        </button>
      );
    }

    if (variant === 'hero') {
      return (
        <button
          onClick={handleClick}
          className={`px-4 py-2 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 rounded-xl shadow-lg shadow-purple-500/25 border border-white/20 transition flex items-center gap-2 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>تثبيت التطبيق</span>
          <span className="text-[10px] uppercase font-bold bg-white/20 px-1.5 py-0.5 rounded-full">PWA</span>
        </button>
      );
    }

    // Default 'header' variant
    return (
      <button
        onClick={handleClick}
        className={`px-3 py-1.5 text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-400 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer ${className}`}
        title="تثبيت التطبيق على الشاشة الرئيسية بشعار GameForge"
      >
        <Download className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
        <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/20 px-1 py-0.2 rounded">PWA</span>
      </button>
    );
  };

  return (
    <>
      {buttonContent()}

      {/* Guided Install Modal for browsers without direct prompt or inside iframe */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-md bg-[#130d24] border border-purple-500/40 rounded-2xl p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* App Icon preview */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="relative">
                <img
                  src="/pwa-192x192.png"
                  alt="GameForge Logo"
                  className="w-14 h-14 rounded-2xl shadow-lg border border-purple-400/40 object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  تثبيت تطبيق GameForge
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-purple-300">
                  سيتم تثبيته بشعار التطبيق الرسمي على شاشتك الرئيسية
                </p>
              </div>
            </div>

            {/* If in iframe: prompt user to open in standalone window */}
            {isInIframe && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  أنت تتصفح المعاينة داخل إطار مدمج (Iframe)
                </p>
                <p className="text-[11px] text-amber-200/80">
                  متصفح كروم يمنع تثبيت تطبيقات الويب من داخل إطارات المعاينة. انقر الزر بالأسفل لفتح التطبيق في نافذة مستقلة وتثبيته بضغطة واحدة مع الشعار الكامل!
                </p>
              </div>
            )}

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-300 bg-[#1c1436] p-4 rounded-xl border border-purple-500/20">
                <div className="font-semibold text-purple-200 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>خطوات التثبيت على آيفون / آيباد (iOS Safari):</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold shrink-0">
                    1
                  </span>
                  <div>
                    اضغط على زر <strong>المشاركة (Share)</strong> في شريط سفلي بسفاري (<Share className="w-3.5 h-3.5 inline text-blue-400 mx-1" />).
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold shrink-0">
                    2
                  </span>
                  <div>
                    انزل للأسفل واضغط على <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold shrink-0">
                    3
                  </span>
                  <div>
                    سيظهر شعار <strong>GameForge</strong> النجمي تلقائياً، اضغط <strong>إضافة (Add)</strong> في الأعلى.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-300 bg-[#1c1436] p-4 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
                  <Monitor className="w-4 h-4" />
                  <span>متصفح Chrome / Edge / أندرويد:</span>
                </div>
                <p className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-200 flex items-center justify-center text-[10px] shrink-0">1</span>
                  اضغط على أيقونة <strong>التثبيت</strong> (<Download className="w-3.5 h-3.5 inline text-purple-400 mx-0.5" />) الظاهرة في شريط عنوان المتصفح.
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-200 flex items-center justify-center text-[10px] shrink-0">2</span>
                  أو من قائمة المتصفح (<strong>الثلاث نقاط ⋮</strong>) اختر <strong>"تثبيت التطبيق" (Install App)</strong> وليس اختصاراً عادياً.
                </p>
                <div className="mt-2 pt-2 border-t border-purple-500/20 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>يتم تثبيت التطبيق بملف WebAPK مستقل مع الشعار الفلكي عالي الدقة.</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex items-center gap-3">
              {isInIframe ? (
                <button
                  onClick={openStandaloneWindow}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح في نافذة مستقلة للتثبيت 🚀</span>
                </button>
              ) : isInstallable ? (
                <button
                  onClick={handleModalInstall}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت الآن فورياً ⚡</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-purple-900/60 hover:bg-purple-800/80 text-white font-bold rounded-xl text-xs transition cursor-pointer border border-purple-500/30"
                >
                  حسناً، فهمت
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="py-2.5 px-4 text-slate-400 hover:text-white rounded-xl text-xs hover:bg-white/5 transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

