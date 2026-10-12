# Liminal Math — Next.js frontend (v5)

Frontend-only Next.js (App Router) port of the final v5 design. No backend.

## Routes

| Route | Source (v5) |
| --- | --- |
| `/` | `Liminal Home v20` (desktop) / `Liminal Home Mobile` (≤760px) |
| `/chapter-zero` | `Chapter Zero v2` (desktop) / `Chapter Zero Mobile` (≤760px) |
| `/programs` | `Programs.html` |
| `/problem-of-the-day` | `Problem of the Day.html` |
| `/community` | `Community.html` |
| `/careers` | `Careers.html` |

## How it is built

The v5 pages were authored as `.dc.html` templates (HTML + `{{ }}` bindings + a logic class). `scripts/convert.mjs` compiles each one into a React component in `src/dc/generated/` (JSX template, the original logic class verbatim, and a CSS file). `src/dc/runtime.tsx` is the small runtime those components share (expression resolver, logic-class host with `setState` and lifecycle).

```bash
npm install
npm run convert   # regenerate src/dc/generated from ../v5 (only needed if v5 changes)
npm run dev       # http://localhost:3100
npm run build && npm start
```

Generated files carry a "do not edit" header; change the v5 source and re-run `convert`, or edit the generated component directly if v5 is retired.

Verified against the original v5: identical document height and element/SVG/image counts on all 8 route variants, and the same interactions (login dialog, registration flow).
