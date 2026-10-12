// @ts-nocheck
'use client'
/* eslint-disable */
import * as React from 'react'

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/
const NUMBER_RE = /^-?\d+(\.\d+)?$/

function parensWrapWhole(expr: string) {
  let depth = 0
  for (let i = 0; i < expr.length - 1; i++) {
    if (expr[i] === '(') depth++
    else if (expr[i] === ')') {
      depth--
      if (depth === 0) return false
    }
  }
  return true
}

function findTopLevelEquality(expr: string) {
  let depth = 0
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i]
    if (c === '[' || c === '(') depth++
    else if (c === ']' || c === ')') depth--
    else if (depth === 0 && (c === '=' || c === '!') && expr[i + 1] === '=') {
      if (i > 0 && (expr[i - 1] === '=' || expr[i - 1] === '!')) continue
      if (!expr.slice(0, i).trim()) continue
      const op = expr[i + 2] === '=' ? c + '==' : c + '='
      return { index: i, op }
    }
  }
  return null
}

function resolvePath(vals: any, expr: string) {
  const head = expr.match(IDENT_RE)
  if (!head) return undefined
  let cur = vals == null ? undefined : vals[head[0]]
  let i = head[0].length
  while (i < expr.length) {
    if (expr[i] === '.') {
      const m = expr.slice(i + 1).match(IDENT_RE) || expr.slice(i + 1).match(/^\d+/)
      if (!m) return undefined
      cur = cur == null ? undefined : cur[m[0]]
      i += 1 + m[0].length
    } else if (expr[i] === '[') {
      let depth = 1
      let j = i + 1
      while (j < expr.length && depth > 0) {
        if (expr[j] === '[') depth++
        else if (expr[j] === ']') {
          depth--
          if (depth === 0) break
        }
        j++
      }
      if (depth !== 0) return undefined
      const key = rv(vals, expr.slice(i + 1, j))
      cur = cur == null ? undefined : cur[key]
      i = j + 1
    } else return undefined
  }
  return cur
}

/** Resolve a template expression (`a.b`, `!a`, `a == "x"`, literals) against `vals`. */
export function rv(vals: any, src: string): any {
  const expr = String(src).trim()
  if (!expr) return undefined
  if (expr[0] === '(' && expr[expr.length - 1] === ')' && parensWrapWhole(expr)) {
    return rv(vals, expr.slice(1, -1))
  }
  const eq = findTopLevelEquality(expr)
  if (eq) {
    const lv = rv(vals, expr.slice(0, eq.index))
    const r = rv(vals, expr.slice(eq.index + eq.op.length))
    switch (eq.op) {
      case '===': return lv === r
      case '!==': return lv !== r
      case '==': return lv == r
      default: return lv != r
    }
  }
  if (expr[0] === '!') return !rv(vals, expr.slice(1))
  if (expr === 'true') return true
  if (expr === 'false') return false
  if (expr === 'null') return null
  if (expr === 'undefined') return undefined
  if (NUMBER_RE.test(expr)) return Number(expr)
  if (expr.length >= 2 && (expr[0] === '"' || expr[0] === "'") && expr[expr.length - 1] === expr[0]) {
    return expr.slice(1, -1)
  }
  return resolvePath(vals, expr)
}

/** Interpolated attribute value: odd parts are expressions. */
export function ja(vals: any, parts: string[]) {
  return parts.map((s, i) => (i & 1 ? rv(vals, s) ?? '' : s)).join('')
}

/** Interpolated text node: odd parts are expressions. */
export function tx(vals: any, parts: string[]) {
  return parts.map((p, i) => {
    if (!(i & 1)) return p
    const v = rv(vals, p)
    if (v === undefined) return null
    if (React.isValidElement(v) || Array.isArray(v)) return <React.Fragment key={i}>{v}</React.Fragment>
    if (v === null || typeof v === 'boolean') return null
    return <span key={i} className="sc-interp">{String(v)}</span>
  })
}

export const arr = (v: any) => (Array.isArray(v) ? v : [])

function kebabToCamel(s: string) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

/** Inline style string -> React style object. */
export function st(css: any) {
  if (css && typeof css === 'object') return css
  const o: Record<string, string> = {}
  for (const decl of String(css ?? '').split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const prop = decl.slice(0, i).trim()
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim()
  }
  return o
}

export function cx(...c: any[]) {
  return c.filter(Boolean).join(' ')
}

export const ud = (x: any, d: any) => (x === undefined ? d : x)

const HOST_STYLE_PROPS = new Set([
  'position', 'left', 'right', 'top', 'bottom', 'inset', 'width', 'height', 'z-index', 'transform',
])
export function hostStyle(style: any) {
  const all = typeof style === 'string' ? st(style) : style && typeof style === 'object' ? style : null
  if (!all) return undefined
  const out: any = {}
  for (const [k, v] of Object.entries(all)) {
    const kebab = k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())
    if (HOST_STYLE_PROPS.has(kebab)) out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

export class DCLogic {
  props: any
  state: any = {}
  __host: any
  constructor(props?: any) {
    this.props = props || {}
  }
  setState(update: any, cb?: () => void) {
    this.__host && this.__host.__setLogicState(update, cb)
  }
  forceUpdate() {
    this.__host && this.__host.forceUpdate()
  }
  componentDidMount() {}
  componentDidUpdate(_prev?: any) {}
  componentWillUnmount() {}
  renderVals(): any {
    return {}
  }
}

export function makeDC(name: string, opts: { template: (v: any) => any; Logic?: any; defaults?: any }) {
  const { template, Logic, defaults } = opts
  const L = Logic || DCLogic

  class Host extends React.Component<any, any> {
    logic: any
    constructor(props: any) {
      super(props)
      this.state = { __v: 0 }
      this.logic = new L(this.userProps())
      this.logic.__host = this
    }
    userProps() {
      const { __hostStyle, ...rest } = this.props
      return rest
    }
    __setLogicState(update: any, cb?: () => void) {
      const prev = this.logic.state
      const patch = typeof update === 'function' ? update(prev) : update
      this.logic.state = { ...prev, ...patch }
      this.setState((s: any) => ({ __v: s.__v + 1 }), cb)
    }
    componentDidMount() {
      this.logic.componentDidMount()
    }
    componentDidUpdate(prev: any) {
      this.logic.props = this.userProps()
      this.logic.componentDidUpdate(prev)
    }
    componentWillUnmount() {
      this.logic.componentWillUnmount()
    }
    render() {
      const userProps = this.userProps()
      this.logic.props = userProps
      const vals = { ...userProps, ...(this.logic.renderVals() || {}) }
      return (
        <div className="sc-host" style={this.props.__hostStyle} data-sc-name={name}>
          {template(vals)}
        </div>
      )
    }
  }

  function DC(props: any) {
    return <Host {...props} />
  }
  DC.displayName = name

  function Root(props: any) {
    return <Host {...(defaults || {})} {...props} />
  }
  Root.displayName = name + 'Root'
  DC.Root = Root
  return DC
}
