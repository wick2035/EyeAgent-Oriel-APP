/**
 * 轻量级 Markdown → HTML 转换器
 * 专为 AI 问诊对话消息设计，输出带语义类名的 HTML 字符串
 * 供 <rich-text> 组件渲染，配合 MessageBubble.vue 的 :deep() SCSS 样式使用
 */

// HTML 实体转义，防 XSS
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 行内格式处理（在 block 文本上二次处理）
// 顺序：代码 → 加粗斜体 → 加粗 → 斜体（从长到短防冲突）
function parseInline(text) {
  // 先保护行内代码，避免其内容被其他规则处理
  const codeSegments = []
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    const idx = codeSegments.length
    codeSegments.push(`<code class="md-code-i">${escapeHtml(code)}</code>`)
    return `\x00CODE${idx}\x00`
  })

  // 加粗 + 斜体
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  // 加粗
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>')
  // 斜体
  text = text.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
  text = text.replace(/_([^_\n]+?)_/g, '<em>$1</em>')

  // 还原行内代码
  text = text.replace(/\x00CODE(\d+)\x00/g, (_, idx) => codeSegments[parseInt(idx)])

  return text
}

/**
 * 将 Markdown 文本转换为 HTML 字符串
 * @param {string} text - 原始 Markdown 文本
 * @returns {string} HTML 字符串
 */
export function markdownToHtml(text) {
  if (!text || typeof text !== 'string') return ''

  const lines = text.split('\n')
  let html = ''
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // ── 代码块 ````lang` ──
    if (trimmed.startsWith('```')) {
      let codeLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]))
        i++
      }
      i++ // 跳过闭合 ```
      html += `<pre class="md-pre"><code>${codeLines.join('\n')}</code></pre>`
      continue
    }

    // ── H2 ##  ──
    const h2 = trimmed.match(/^##\s+(.+)/)
    if (h2 && !trimmed.startsWith('###')) {
      html += `<h2 class="md-h2">${parseInline(escapeHtml(h2[1].trim()))}</h2>`
      i++
      continue
    }

    // ── H3 ###  ──
    const h3 = trimmed.match(/^###\s+(.+)/)
    if (h3 && !trimmed.startsWith('####')) {
      html += `<h3 class="md-h3">${parseInline(escapeHtml(h3[1].trim()))}</h3>`
      i++
      continue
    }

    // ── H4 ####  ──
    const h4 = trimmed.match(/^####\s+(.+)/)
    if (h4) {
      html += `<h4 class="md-h4">${parseInline(escapeHtml(h4[1].trim()))}</h4>`
      i++
      continue
    }

    // ── 分割线 --- ──
    if (trimmed.match(/^-{3,}\s*$/) && !trimmed.match(/^[-*]\s/)) {
      html += '<hr class="md-hr">'
      i++
      continue
    }

    // ── 引用块 > ──
    if (trimmed.startsWith('> ')) {
      let quoteLines = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2))
        i++
      }
      const quoteText = parseInline(escapeHtml(quoteLines.join(' ')))
      html += `<blockquote class="md-blockquote"><p>${quoteText}</p></blockquote>`
      continue
    }

    // ── 无序列表 - / * ──
    if (trimmed.match(/^[-*]\s+/)) {
      html += '<ul class="md-ul">'
      while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
        const content = lines[i].trim().replace(/^[-*]\s+/, '')
        const inner = parseInline(escapeHtml(content))
        html += `<li class="md-li"><span class="md-dot">•</span><span>${inner}</span></li>`
        i++
      }
      html += '</ul>'
      continue
    }

    // ── 有序列表 1. ──
    if (trimmed.match(/^\d+\.\s+/)) {
      let olIdx = 1
      html += '<ol class="md-ol">'
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        const content = lines[i].trim().replace(/^\d+\.\s+/, '')
        const inner = parseInline(escapeHtml(content))
        html += `<li class="md-li">${inner}</li>`
        i++
        olIdx++
      }
      html += '</ol>'
      continue
    }

    // ── 空行 ──
    if (trimmed === '') {
      i++
      continue
    }

    // ── 普通段落（连续非空行合并） ──
    let paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().match(/^[-*]\s+/) &&
      !lines[i].trim().match(/^\d+\.\s+/) &&
      !lines[i].trim().match(/^-{3,}\s*$/) &&
      !lines[i].trim().startsWith('```')
    ) {
      paraLines.push(lines[i].trim())
      i++
    }
    if (paraLines.length) {
      const paraText = parseInline(escapeHtml(paraLines.join(' ')))
      html += `<p class="md-p">${paraText}</p>`
    }
  }

  return html
}
