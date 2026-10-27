const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Escapes text and keeps its line breaks when placed in an HTML email. */
export function textToHtml(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}
