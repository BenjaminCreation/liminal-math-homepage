# Liminal Math — Homepage & Product Design

Static, self-contained pages for the Liminal Math site: homepage, product app, LMS, Problem of the Day, and Community. Each page is a standalone `.dc.html` file that boots its own client-side renderer (`support.js`) — no build step required.

## Pages

| Route | File |
| --- | --- |
| `/` | `Liminal Home v2.dc.html` |
| Learn / Practice app | `Liminal App.dc.html` |
| LMS | `Liminal LMS.dc.html`, `LmsModule.dc.html` |
| Problem of the Day | `Liminal POD.dc.html` |
| Community | `Liminal Community.dc.html` |

## Local development

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

## Deploy

Deployed on Vercel as a static site. The root path rewrites to `Liminal Home v2.dc.html` (see `vercel.json`); every other page is served at its own filename.
