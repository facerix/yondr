import { validateHttpUrl } from './jobPathModel.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function inline(text) {
  const tokens = [];
  const saved = html => `\u0000${tokens.push(html) - 1}\u0000`;
  let result = escapeHtml(text);
  result = result.replace(/`([^`]+)`/g, (_, code) => saved(`<code>${code}</code>`));
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    try { return saved(`<a href="${escapeHtml(validateHttpUrl(url.replace(/&amp;/g, '&')))}" target="_blank" rel="noopener noreferrer">${label}</a>`); }
    catch { return match; }
  });
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return result.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
}

export function renderNoteMarkdown(source) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let list = [];
  const flushParagraph = () => { if (paragraph.length) blocks.push(`<p>${inline(paragraph.join(' '))}</p>`); paragraph = []; };
  const flushList = () => { if (list.length) blocks.push(`<ul>${list.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`); list = []; };
  for (const line of lines) {
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    const bullet = /^\s*[-*] (.+)$/.exec(line);
    if (bullet) { flushParagraph(); list.push(bullet[1]); continue; }
    flushList();
    const heading = /^(#{1,3}) (.+)$/.exec(line);
    if (heading) { flushParagraph(); blocks.push(`<h${heading[1].length + 3}>${inline(heading[2])}</h${heading[1].length + 3}>`); }
    else paragraph.push(line.trim());
  }
  flushParagraph(); flushList();
  return blocks.join('');
}
