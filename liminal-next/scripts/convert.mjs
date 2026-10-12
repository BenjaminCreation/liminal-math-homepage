// Converts the v5 `.dc.html` design-runtime pages into Next.js/React components.
// Usage: node scripts/convert.mjs   (reads ../v5, writes src/dc/generated)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFragment } from 'parse5'

const here = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(here, '../../v5')
const OUT = path.resolve(here, '../src/dc/generated')
fs.mkdirSync(OUT, { recursive: true })

const FILES = {
  'Liminal Home v20.dc.html': 'HomeDesktop',
  'Liminal Home Mobile.dc.html': 'HomeMobile',
  'Chapter Zero v2.dc.html': 'ChapterZeroDesktop',
  'Chapter Zero Mobile.dc.html': 'ChapterZeroMobile',
  'Careers.html': 'Careers',
  'Community.html': 'Community',
  'Problem of the Day.html': 'ProblemOfTheDay',
  'Programs.html': 'Programs',
  'HeroStage.dc.html': 'HeroStage',
  'Limi.dc.html': 'Limi',
  'LimiPose.dc.html': 'LimiPose',
}
// dc-import names (file basenames) -> generated component names
const IMPORTS = { HeroStage: 'HeroStage', Limi: 'Limi', LimiPose: 'LimiPose' }

// internal links in the templates -> Next routes
const ROUTES = {
  'Liminal Home v20.dc.html': '/',
  'Liminal Home Mobile.dc.html': '/',
  'Chapter Zero v2.dc.html': '/chapter-zero',
  'Chapter Zero Mobile.dc.html': '/chapter-zero',
  'Careers.html': '/careers',
  'Community.html': '/community',
  'Problem of the Day.html': '/problem-of-the-day',
  'Programs.html': '/programs',
}

const EVENT_MAP = {
  onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onsubmit: 'onSubmit', onkeydown: 'onKeyDown',
  onkeyup: 'onKeyUp', onkeypress: 'onKeyPress', onmousedown: 'onMouseDown', onmouseup: 'onMouseUp',
  onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', onfocus: 'onFocus', onblur: 'onBlur',
  ondoubleclick: 'onDoubleClick', oncontextmenu: 'onContextMenu', onmousemove: 'onMouseMove',
  onmouseover: 'onMouseOver', onmouseout: 'onMouseOut', onpointerdown: 'onPointerDown', onpointerup: 'onPointerUp',
  onpointermove: 'onPointerMove', onpointerenter: 'onPointerEnter', onpointerleave: 'onPointerLeave',
  onpointercancel: 'onPointerCancel', onpointerover: 'onPointerOver', onpointerout: 'onPointerOut',
  ongotpointercapture: 'onGotPointerCapture', onlostpointercapture: 'onLostPointerCapture',
  ontouchstart: 'onTouchStart', ontouchend: 'onTouchEnd', ontouchmove: 'onTouchMove', ontouchcancel: 'onTouchCancel',
  ondragstart: 'onDragStart', ondragend: 'onDragEnd', ondragenter: 'onDragEnter', ondragleave: 'onDragLeave',
  ondragover: 'onDragOver', onanimationstart: 'onAnimationStart', onanimationend: 'onAnimationEnd',
  onanimationiteration: 'onAnimationIteration', ontransitionend: 'onTransitionEnd',
}

const PROP_FIX = {
  tabindex: 'tabIndex', colspan: 'colSpan', rowspan: 'rowSpan', maxlength: 'maxLength', autocomplete: 'autoComplete',
  autofocus: 'autoFocus', readonly: 'readOnly', inputmode: 'inputMode', srcset: 'srcSet', crossorigin: 'crossOrigin',
  contenteditable: 'contentEditable', spellcheck: 'spellCheck', autoplay: 'autoPlay', playsinline: 'playsInline',
  enterkeyhint: 'enterKeyHint', referrerpolicy: 'referrerPolicy', datetime: 'dateTime', accesskey: 'accessKey',
}

const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '))
const RAW_WRAP = { select: 'sc-raw-select', table: 'sc-raw-table', tbody: 'sc-raw-tbody', thead: 'sc-raw-thead', tfoot: 'sc-raw-tfoot', tr: 'sc-raw-tr', td: 'sc-raw-td', th: 'sc-raw-th', caption: 'sc-raw-caption' }
const RAW_UNWRAP = Object.fromEntries(Object.entries(RAW_WRAP).map(([k, v]) => [v, k]))
const CAMEL_ATTR = 'sc-camel-'
const ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*`
const IMPORT_SELF_CLOSE_RE = new RegExp('<(x-import|dc-import)(' + ATTRS + ')/>', 'gi')
const CAMEL_ATTR_RE = /(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g

const kebabToCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function encodeCase(html) {
  html = html.replace(IMPORT_SELF_CLOSE_RE, (_, t, a) => '<' + t + a + '></' + t + '>')
  html = html.replace(CAMEL_ATTR_RE, (_, sp, name, eq) => sp + CAMEL_ATTR + name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) + eq)
  for (const [real, alias] of Object.entries(RAW_WRAP)) {
    html = html.replace(new RegExp('(</?)' + real + '(?=[\\s>])', 'gi'), '$1' + alias)
  }
  return html
}

function cssToObj(css) {
  const o = {}
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const prop = decl.slice(0, i).trim()
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim()
  }
  return o
}

// ---- pseudo-class (style-hover etc.) helpers, ported from the design runtime ----
function scanUnquotedUrl(css, i) {
  if ((css[i] !== 'u' && css[i] !== 'U') || css.slice(i, i + 4).toLowerCase() !== 'url(' || /[a-z0-9_-]/i.test(css[i - 1] ?? '')) return -1
  let j = i + 4
  while (j < css.length && /\s/.test(css[j])) j++
  if (css[j] === '"' || css[j] === "'") return -1
  while (j < css.length && css[j] !== ')') {
    if (css[j] === '\\') j++
    j++
  }
  return j < css.length ? j + 1 : css.length
}
function stripComments(css) {
  let out = ''
  let quote = ''
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (quote) {
      if (c === '\\') { out += c + (css[i + 1] ?? ''); i++; continue }
      if (c === quote) quote = ''
      out += c
    } else if (c === "'" || c === '"') { quote = c; out += c }
    else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? css.length : end + 1
      out += ' '
    } else {
      const end = scanUnquotedUrl(css, i)
      if (end === -1) out += c
      else { out += css.slice(i, end); i = end - 1 }
    }
  }
  return out
}
function importantify(css) {
  css = stripComments(css)
  const decls = []
  let start = 0, depth = 0, quote = ''
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = ''
    } else if (c === "'" || c === '"') quote = c
    else if (c === '(') depth++
    else if (c === ')') depth = Math.max(0, depth - 1)
    else if (c === ';' && depth === 0) { decls.push(css.slice(start, i)); start = i + 1 }
    else {
      const end = scanUnquotedUrl(css, i)
      if (end !== -1) i = end - 1
    }
  }
  decls.push(css.slice(start))
  return decls.map((d) => d.trim()).filter(Boolean).map((d) => (/!\s*important$/i.test(d) ? d : d + ' !important')).join(';')
}

const HOST_STYLE_PROPS = new Set(['position', 'left', 'right', 'top', 'bottom', 'inset', 'width', 'height', 'z-index', 'transform'])
function hostPosObj(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    const kebab = k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
    if (HOST_STYLE_PROPS.has(kebab)) out[k] = v
  }
  return out
}

const J = JSON.stringify
const decodeEntities = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

function fixPaths(s) {
  // relative asset / font / route references -> absolute
  s = s.replace(/url\((['"]?)fonts\//g, 'url($1/fonts/')
  s = s.replace(/(['"`])assets\//g, '$1/assets/')
  s = s.replace(/(['"])((?:stroke|fill|clip|stop|flood|marker|font|text|dominant|alignment|baseline|shape|vector|letter|word|pointer|color|paint)-[a-z-]+)\1(\s*:)/g, (_, q, k, c) => kebabToCamel(k) + c)
  return s
}

function mapHref(v) {
  const m = v.match(/^(?:\.\/)?([^#?]+\.html)(#.*)?$/)
  if (m) {
    const target = decodeURIComponent(m[1])
    if (ROUTES[target]) return ROUTES[target] + (m[2] ? m[2] : '')
  }
  if (/^(?:\.\/)?assets\//.test(v)) return '/' + v.replace(/^\.\//, '')
  return v
}

function convertFile(file, compName) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8')
  const open = /<x-dc(?:\s[^>]*)?>/.exec(src)
  const close = src.lastIndexOf('</x-dc>')
  let tpl = src.slice(open.index + open[0].length, close)

  // helmet
  let helmetLinks = []
  let helmetCss = ''
  let title = ''
  const hm = tpl.match(/<helmet>([\s\S]*?)<\/helmet>/)
  const extra = { scripts: [] }
  if (hm) {
    const body = hm[1]
    tpl = tpl.replace(hm[0], '')
    title = decodeEntities((body.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]).trim()
    helmetCss = (body.match(/<style[^>]*>([\s\S]*?)<\/style>/) || [, ''])[1]
    for (const l of body.matchAll(/<link\b([^>]*)>/g)) {
      const attrs = Object.fromEntries([...l[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], decodeEntities(m[2])]))
      helmetLinks.push(attrs)
    }
    for (const s of body.matchAll(/<script\b([^>]*)>\s*<\/script>/g)) {
      const attrs = Object.fromEntries([...s[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], decodeEntities(m[2])]))
      extra.scripts.push(attrs)
    }
  }

  // logic script
  const sm = src.match(/<script type="text\/x-dc" data-dc-script([^>]*)>([\s\S]*)<\/script>/)
  let logicSrc = sm ? sm[2] : ''
  const propsRaw = sm ? (sm[1].match(/data-props="([^"]*)"/) || [, ''])[1] : ''
  let defaults = {}
  if (propsRaw) {
    try {
      const meta = JSON.parse(decodeEntities(propsRaw))
      for (const k of Object.keys(meta)) if (k[0] !== '$' && meta[k] && meta[k].default !== undefined) defaults[k] = meta[k].default
    } catch (e) { /* ignore */ }
  }
  logicSrc = fixPaths(logicSrc)

  const frag = parseFragment(encodeCase(tpl))

  const imports = new Set()
  const pseudoRules = []
  const pseudoCache = new Map()
  let uid = 0
  const clsPrefix = 'p' + compName.slice(0, 3).toLowerCase()
  const pseudoClass = (pseudo, css) => {
    const k = pseudo + '|' + css
    if (pseudoCache.has(k)) return pseudoCache.get(k)
    const cls = clsPrefix + (uid++).toString(36)
    const isEl = pseudo === 'before' || pseudo === 'after'
    pseudoRules.push((isEl ? '.' + cls + '::' + pseudo : '.' + cls + ':' + pseudo) + '{' + (isEl ? css : importantify(css)) + '}')
    pseudoCache.set(k, cls)
    return cls
  }

  // expression helpers
  const MUSTACHE = /\{\{([\s\S]+?)\}\}/g
  const splitParts = (raw) => raw.split(/\{\{([\s\S]+?)\}\}/g)
  const attrExpr = (V, raw) => {
    const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/)
    if (whole) return `rv(${V}, ${J(whole[1])})`
    if (raw.includes('{{')) return `ja(${V}, ${J(splitParts(raw))})`
    return null // static
  }

  let depth = 0
  const nameOf = (n) => (RAW_UNWRAP[n.nodeName] || n.nodeName)

  function genChildren(node, V) {
    return (node.childNodes || []).map((c) => gen(c, V)).filter((x) => x != null && x !== '').join('')
  }

  function gen(node, V) {
    if (node.nodeName === '#text') {
      const txt = node.value
      if (!txt.includes('{{')) {
        if (!txt.trim() && !txt.includes(' ')) return null
        return `{${J(txt)}}`
      }
      return `{tx(${V}, ${J(splitParts(txt))})}`
    }
    if (node.nodeName === '#comment' || !node.tagName) return null
    const tag = node.nodeName
    const attrs = node.attrs || []
    const get = (n) => (attrs.find((a) => a.name === n) || {}).value

    if (tag === 'sc-if') {
      const e = attrExpr(V, get('value') || '') ?? J(get('value') || '')
      return `{${e} ? (<>${genChildren(node, V)}</>) : null}`
    }
    if (tag === 'sc-for') {
      const list = attrExpr(V, get('list') || '') ?? J(get('list') || '')
      const as = get('as') || 'item'
      const n = ++depth
      const V2 = 'v' + n
      const out = `{arr(${list}).map((it${n}, i${n}) => { const ${V2} = { ...${V}, [${J(as)}]: it${n}, $index: i${n} }; return (<React.Fragment key={i${n}}>${genChildren(node, V2)}</React.Fragment>) })}`
      return out
    }
    if (tag === 'dc-import') {
      const name = get('name') || get('component')
      if (!IMPORTS[name]) throw new Error(`${file}: unknown dc-import ${name}`)
      imports.add(IMPORTS[name])
      const props = []
      let hostStyleCode = null
      for (const { name: an, value } of attrs) {
        if (an === 'name' || an === 'component' || an === 'sc-name' || an === 'data-dc-tpl' || an === 'hint-size') continue
        let key = an
        if (key.startsWith(CAMEL_ATTR)) key = kebabToCamel(key.slice(CAMEL_ATTR.length))
        if (key.startsWith('style-')) continue
        if (key === 'style') {
          const e = attrExpr(V, value)
          hostStyleCode = e ? `hostStyle(${e})` : J(hostPosObj(cssToObj(value)))
          continue
        }
        if (key.includes('-')) key = kebabToCamel(key)
        const e = attrExpr(V, value)
        if (key === 'dcProps') { props.push(`{...${e}}`); continue }
        props.push(`${key}={${e ?? J(value)}}`)
      }
      if (hostStyleCode) props.push(`__hostStyle={${hostStyleCode}}`)
      const kids = genChildren(node, V)
      return kids ? `<${IMPORTS[name]} ${props.join(' ')}>${kids}</${IMPORTS[name]}>` : `<${IMPORTS[name]} ${props.join(' ')} />`
    }

    const real = nameOf(node)
    const custom = real.includes('-')
    const pseudo = []
    const props = []
    let classStatic = null
    let classDyn = null
    for (const { name: an, value } of attrs) {
      if (an === 'sc-name' || an === 'data-dc-tpl' || an === 'hint-size') continue
      let key = an
      if (key.startsWith(CAMEL_ATTR)) key = kebabToCamel(key.slice(CAMEL_ATTR.length))
      if (key.startsWith('style-')) { pseudo.push(pseudoClass(key.slice(6), value)); continue }
      if (key === 'class') {
        const e = attrExpr(V, value)
        if (e) classDyn = e; else classStatic = value
        continue
      }
      if (key === 'for') key = 'htmlFor'
      else if (key.startsWith('on') && key.length > 2) key = EVENT_MAP[key] || 'on' + key[2].toUpperCase() + key.slice(3)
      else if (PROP_FIX[key] && !custom) key = PROP_FIX[key]
      else if (!custom && key.includes('-') && !/^(data|aria)-/.test(key)) key = kebabToCamel(key)
      else if (!custom && key.includes(':')) key = key.replace(/:([a-z])/g, (_, c) => c.toUpperCase())
      let e = attrExpr(V, value)
      let code
      if (key === 'style') code = e ? `st(${e})` : J(cssToObj(value))
      else if (key === 'href' && e == null) code = J(mapHref(value))
      else if (key === 'src' && e == null) code = J(mapHref(value))
      else if (key === 'value' || key === 'checked') code = e ? `ud(${e}, ${key === 'checked' ? 'false' : "''"})` : J(value)
      else code = e ?? J(value)
      if (key === 'style') props.push(`style={${code}}`)
      else if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(key)) props.push(`${key}={${code}}`)
      else props.push(`{...{ ${J(key)}: ${code} }}`)
    }
    const cname = custom ? 'class' : 'className'
    if (classDyn || pseudo.length) {
      const parts = [classDyn || (classStatic ? J(classStatic) : null), ...pseudo.map(J)].filter(Boolean)
      props.push(`${cname}={cx(${parts.join(', ')})}`)
    } else if (classStatic != null) props.push(`${cname}=${J(classStatic)}`)

    const children = real === 'template' ? genChildren(node.content, V) : genChildren(node, V)
    if (real === 'style') {
      const css = (node.childNodes || []).map((c) => c.value || '').join('')
      return `<style dangerouslySetInnerHTML={{ __html: ${J(fixPaths(css))} }} />`
    }
    if (VOID.has(real)) return `<${real} ${props.join(' ')} />`
    return children ? `<${real} ${props.join(' ')}>${children}</${real}>` : `<${real} ${props.join(' ')}></${real}>`
  }

  const body = genChildren(frag, 'v')

  // helmet -> JSX hoisted into <head> by React 19
  const helmetJsx = []
  for (const l of helmetLinks) {
    const href = l.href || ''
    if (href.includes('tokens/fonts.css')) continue // provided globally by the root layout
    if (href.includes('fonts.googleapis.com/css2')) continue // provided globally by the root layout
    helmetJsx.push(`<link rel=${J(l.rel || 'stylesheet')} href=${J(href)} precedence="default" />`)
  }
  for (const s of extra.scripts) {
    const srcAttr = (s.src || '').replace(/^\.\//, '/')
    helmetJsx.push(`<script src=${J(srcAttr)} async />`)
  }

  const css = fixPaths(helmetCss) + '\n' + pseudoRules.join('\n') + '\n'
  fs.writeFileSync(path.join(OUT, compName + '.css'), css)

  const importLines = [...imports].map((n) => `import ${n} from './${n}'`).join('\n')
  const out = `// @ts-nocheck
// Generated by scripts/convert.mjs from v5/${file} — do not edit by hand.
'use client'
import * as React from 'react'
import { DCLogic, makeDC, rv, ja, tx, arr, st, cx, ud, hostStyle } from '../runtime'
${importLines}
import './${compName}.css'

const Logic = (function (DCLogic, StreamableLogic, React) {
${logicSrc}
return typeof Component !== 'undefined' && Component || undefined
})(DCLogic, DCLogic, React)

function template(v) {
  return (
    <>
      ${helmetJsx.join('\n      ')}
      ${body}
    </>
  )
}

const DC = makeDC(${J(compName)}, { template, Logic, defaults: ${J(defaults)} })
export default DC
export const Root = DC.Root
`
  fs.writeFileSync(path.join(OUT, compName + '.tsx'), out)
  return { compName, title, defaults }
}

const manifest = {}
for (const [file, name] of Object.entries(FILES)) {
  try {
    manifest[name] = convertFile(file, name)
    console.log('ok  ', file, '->', name)
  } catch (e) {
    console.error('FAIL', file, e)
    process.exitCode = 1
  }
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), J(manifest, null, 2))
