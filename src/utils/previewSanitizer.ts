/**
 * GameForge Studio - Live Preview Sanitizer & Resilient HTML Engine
 * Handles markdown code fences, incomplete HTML, runtime error boundaries,
 * and reliable external window opening without white screens.
 */

/**
 * Strips markdown code blocks (```html ... ```), backticks, and extraneous text
 * from AI model generation to extract valid, executable HTML.
 */
export function cleanMarkdownFences(rawCode: string): string {
  if (!rawCode || typeof rawCode !== 'string') return '';

  let code = rawCode.trim();

  // 1. Check if the code is wrapped in markdown code blocks: ```html ... ``` or ```xml ... ``` or ``` ... ```
  const codeBlockRegex = /^```(?:html|htm|xml|javascript|js|typescript|ts)?\s*([\s\S]*?)```$/i;
  const match = code.match(codeBlockRegex);
  if (match && match[1]) {
    code = match[1].trim();
  } else {
    // If there is conversational text before the opening code fence:
    // e.g. "Here is your game code:\n```html\n<!DOCTYPE html>..."
    const openingFenceIndex = code.indexOf('```');
    if (openingFenceIndex !== -1) {
      const closingFenceIndex = code.lastIndexOf('```');
      if (closingFenceIndex > openingFenceIndex) {
        // Extract content between the fences
        const snippet = code.substring(openingFenceIndex, closingFenceIndex + 3);
        const snippetMatch = snippet.match(/^```(?:html|htm|xml)?\s*([\s\S]*?)```$/i);
        if (snippetMatch && snippetMatch[1]) {
          code = snippetMatch[1].trim();
        }
      }
    }
  }

  // 2. Remove any remaining leading ``` or ```html or trailing ```
  code = code.replace(/^```[a-zA-Z]*\n?/i, '').replace(/\n?```$/g, '').trim();

  // 3. If there is conversational text before <!DOCTYPE html> or <html
  const docTypeMatch = code.match(/<!DOCTYPE\s+html/i);
  const htmlTagMatch = code.match(/<html[\s>]/i);

  if (docTypeMatch && docTypeMatch.index && docTypeMatch.index > 0) {
    code = code.substring(docTypeMatch.index);
  } else if (!docTypeMatch && htmlTagMatch && htmlTagMatch.index && htmlTagMatch.index > 0) {
    code = code.substring(htmlTagMatch.index);
  }

  // 4. If there is conversational text after </html>
  const closeHtmlMatch = code.match(/<\/html>/i);
  if (closeHtmlMatch && closeHtmlMatch.index !== undefined) {
    const endPos = closeHtmlMatch.index + 7;
    // Only trim if there is significant non-whitespace text after </html>
    const afterHtml = code.substring(endPos).trim();
    if (afterHtml.length > 0 && !afterHtml.startsWith('<')) {
      code = code.substring(0, endPos);
    }
  }

  return code.trim();
}

/**
 * Repairs unclosed tags caused by cut-off AI token generation
 * (e.g. streaming stopped mid-script).
 */
export function repairIncompleteHtml(code: string): string {
  if (!code) return '';

  let repaired = code;

  // Check for unclosed <script> tag
  const scriptOpens = (repaired.match(/<script\b[^>]*>/gi) || []).length;
  const scriptCloses = (repaired.match(/<\/script>/gi) || []).length;
  if (scriptOpens > scriptCloses) {
    repaired += '\n</script>';
  }

  // Check for unclosed <style> tag
  const styleOpens = (repaired.match(/<style\b[^>]*>/gi) || []).length;
  const styleCloses = (repaired.match(/<\/style>/gi) || []).length;
  if (styleOpens > styleCloses) {
    repaired += '\n</style>';
  }

  // Check for unclosed <body> tag
  const bodyOpens = (repaired.match(/<body\b[^>]*>/gi) || []).length;
  const bodyCloses = (repaired.match(/<\/body>/gi) || []).length;
  if (bodyOpens > bodyCloses) {
    repaired += '\n</body>';
  }

  // Check for unclosed <html> tag
  const htmlOpens = (repaired.match(/<html\b[^>]*>/gi) || []).length;
  const htmlCloses = (repaired.match(/<\/html>/gi) || []).length;
  if (htmlOpens > htmlCloses) {
    repaired += '\n</html>';
  }

  return repaired;
}

/**
 * Generates an elegant fallback page when project code is empty,
 * preventing a blank white screen.
 */
export function getEmptyProjectFallbackHtml(title: string, type = 'game'): string {
  const safeTitle = title || 'مشروع جديد';
  const typeLabel = type === 'game' ? 'لعبة تفاعلية' : 'تطبيق ويب ذكي';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | GameForge</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Cairo', sans-serif; background-color: #0d091a; color: #f8fafc; }
    .pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
    @keyframes pulseGlow { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-6 bg-[#0d091a] text-slate-100 selection:bg-purple-500">
  <div class="max-w-md w-full text-center p-8 bg-[#17102e]/90 border border-purple-500/30 rounded-3xl shadow-2xl backdrop-blur-xl">
    <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-3xl pulse-glow">
      ✨
    </div>
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
      <span>●</span>
      <span>${typeLabel}</span>
    </div>
    <h1 class="text-xl font-bold text-white mb-2">${safeTitle}</h1>
    <p class="text-sm text-slate-300 mb-6 leading-relaxed">
      كود المشروع قيد التوليد حالياً أو بانتظار أمرك الأول عبر الاستوديو.
      اكتب وصفاً في صندوق المحادثة أو اضغط "توليد" للبدء فوراً!
    </p>
    <div class="p-4 rounded-2xl bg-[#201445]/60 border border-purple-500/20 text-xs text-purple-200 text-right space-y-1.5">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
        <span>محرك المعاينة الحية نشط وجاهز لاستقبال التعديلات</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
        <span>يدعم HTML5, Canvas 2D, Three.js, Tailwind وWeb Audio</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * If the code is just an HTML fragment or body content without DOCTYPE,
 * wraps it in a valid, responsive HTML5 document structure.
 */
export function wrapFragmentInHtml(fragment: string, title: string): string {
  const safeTitle = title || 'معاينة المشروع';
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Cairo', sans-serif; margin: 0; min-height: 100vh; background: #0b0819; color: #fff; }
  </style>
</head>
<body>
  ${fragment}
</body>
</html>`;
}

/**
 * Builds the runtime sandbox script:
 * 1. Prevents form submissions from navigating parent window.
 * 2. Safely handles link clicks (external links open in new tab).
 * 3. Catches runtime JavaScript errors and displays a clear, dismissible
 *    in-iframe banner instead of leaving a silent white screen.
 */
function createPreviewIsolationHarness(projectTitle: string): string {
  const safeTitle = (projectTitle || 'المشروع').replace(/["'<>]/g, '');

  return `
<!-- GameForge Live Preview Isolation & Error Boundary Shield -->
<script>
(function() {
  // Prevent forms from navigating or reloading iframe
  document.addEventListener('submit', function(e) {
    e.preventDefault();
  }, true);

  // Link safety: handle external vs relative links
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target.tagName !== 'A' && target.tagName !== 'BUTTON') {
      target = target.parentElement;
    }
    if (target && target.tagName === 'A') {
      var href = target.getAttribute('href');
      if (!href || href === '#' || href === '/' || href.startsWith('#') || href.startsWith('javascript:')) {
        e.preventDefault();
      } else if (href.startsWith('http://') || href.startsWith('https://')) {
        target.setAttribute('target', '_blank');
        target.setAttribute('rel', 'noopener noreferrer');
      } else {
        e.preventDefault();
      }
    }
    if (target && target.tagName === 'BUTTON' && !target.getAttribute('type')) {
      target.setAttribute('type', 'button');
    }
  }, true);

  // In-Iframe Runtime Error Boundary:
  // Catches syntax and runtime errors and displays an informative banner
  // instead of leaving the user staring at a blank white screen.
  function displayRuntimeError(errorMsg, source, line, col) {
    // Avoid duplicate error banners
    if (document.getElementById('gf-error-boundary-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'gf-error-boundary-banner';
    banner.style.cssText = [
      'position: fixed',
      'top: 12px',
      'left: 12px',
      'right: 12px',
      'z-index: 2147483647',
      'background: rgba(26, 12, 38, 0.95)',
      'backdrop-filter: blur(16px)',
      'border: 1px solid rgba(244, 63, 94, 0.5)',
      'border-radius: 16px',
      'padding: 14px 18px',
      'box-shadow: 0 16px 40px rgba(0,0,0,0.6)',
      'font-family: "Cairo", system-ui, -apple-system, sans-serif',
      'color: #fecdd3',
      'direction: rtl',
      'text-align: right',
      'font-size: 13px',
      'line-height: 1.5'
    ].join(';');

    var locationText = line ? (' (السطر ' + line + (col ? (':' + col) : '') + ')') : '';
    var cleanMsg = (errorMsg || 'خطأ غير معروف').toString();

    banner.innerHTML = 
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;">' +
          '<span style="font-size:20px;line-height:1;margin-top:2px;">⚠️</span>' +
          '<div>' +
            '<div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:3px;">' +
              'تنبيه برمجي في كود المشروع: ${safeTitle}' +
            '</div>' +
            '<div style="color:#fda4af;font-size:12px;word-break:break-word;font-family:monospace;background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:8px;margin-top:4px;">' +
              cleanMsg + locationText +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;shrink:0;">' +
          '<button id="gf-dismiss-err-btn" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit;">' +
            'تجاهل وعرض المحتوى' +
          '</button>' +
        '</div>' +
      '</div>';

    if (document.body) {
      document.body.appendChild(banner);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(banner);
      });
    }

    setTimeout(function() {
      var btn = document.getElementById('gf-dismiss-err-btn');
      if (btn) {
        btn.onclick = function() {
          banner.remove();
        };
      }
    }, 100);
  }

  window.onerror = function(msg, url, line, col, error) {
    displayRuntimeError(msg, url, line, col);
    return false;
  };

  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var msg = reason ? (reason.message || reason) : 'Unhandled Promise Rejection';
    displayRuntimeError(msg, '', 0, 0);
  });
})();
</script>
`;
}

/**
 * Main Master Function:
 * Prepares robust, sanitized HTML for live preview and external window rendering.
 * 1. Strips markdown fences
 * 2. Provides fallback for empty code
 * 3. Repairs incomplete tags
 * 4. Injects isolation and runtime error handling
 */
export function preparePreviewHtml(
  rawCode: string | undefined | null,
  projectTitle = 'المشروع',
  projectType = 'game'
): string {
  // 1. Guard against empty/undefined code
  if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
    return getEmptyProjectFallbackHtml(projectTitle, projectType);
  }

  // 2. Strip markdown fences and conversational wrappers
  let code = cleanMarkdownFences(rawCode);

  if (!code.trim()) {
    return getEmptyProjectFallbackHtml(projectTitle, projectType);
  }

  // 3. Repair incomplete HTML tags
  code = repairIncompleteHtml(code);

  // 4. Wrap non-document fragments in complete HTML5 structure
  const hasDoctype = /<!DOCTYPE\s+html/i.test(code);
  const hasHtmlTag = /<html[\s>]/i.test(code);

  if (!hasDoctype && !hasHtmlTag) {
    code = wrapFragmentInHtml(code, projectTitle);
  }

  // 5. Inject the isolation harness & error boundary
  const harness = createPreviewIsolationHarness(projectTitle);

  if (code.includes('<head>')) {
    code = code.replace('<head>', '<head>' + harness);
  } else if (/<!DOCTYPE\s+html>/i.test(code)) {
    code = code.replace(/<!DOCTYPE\s+html>/i, '<!DOCTYPE html>' + harness);
  } else if (code.includes('<html')) {
    code = code.replace(/<html[^>]*>/i, '$&' + harness);
  } else {
    code = harness + code;
  }

  return code;
}

/**
 * Safely opens a project in a new window/tab via Blob URL,
 * with fallback handling to prevent popup-blocked white screens.
 */
export function openInNewWindow(
  rawCode: string | undefined | null,
  projectTitle = 'GameForge Project',
  projectId?: string
): void {
  const cleanHtml = preparePreviewHtml(rawCode, projectTitle);

  try {
    const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const win = window.open(url, '_blank');

    if (!win || win.closed || typeof win.closed === 'undefined') {
      // If popup blocker blocked the window, try fallback via a temporary link click
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    // Revoke object URL after a reasonable time to free memory
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  } catch (err) {
    console.error('Failed to open project in new window via Blob:', err);
    // Fallback: If Blob URL fails, attempt document.write on new window or /view/:id
    if (projectId) {
      window.open(`/view/${projectId}`, '_blank');
    } else {
      const fallbackWin = window.open('', '_blank');
      if (fallbackWin) {
        fallbackWin.document.open();
        fallbackWin.document.write(cleanHtml);
        fallbackWin.document.close();
      }
    }
  }
}
