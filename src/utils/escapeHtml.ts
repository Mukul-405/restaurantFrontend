// Escape user-controlled values before interpolating into print HTML
// (document.write executes <script>; iframe.innerHTML executes <img onerror>).
const MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (v: unknown): string =>
  String(v ?? '').replace(/[&<>"']/g, (c) => MAP[c]);

// Check (browser-safe, no CommonJS): escapeHtml('<img src=x onerror=alert(1)>')
// => '&lt;img src=x onerror=alert(1)&gt;'  (verified in escapeHtml.test.ts)
