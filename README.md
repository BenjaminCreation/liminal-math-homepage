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

## Versions

| Route | Version | File |
| --- | --- | --- |
| `/versions` | Index of all versions | `versions.html` |
| `/v1` | Version 1: first homepage concept | `Liminal Home v1.dc.html` |
| `/v2` | Version 2: previous live site (still served at `/`) | `Liminal Home v2.dc.html` |
| `/v4` | Version 4: homepage v19 (desktop + mobile) and Chapter Zero v2, self-contained | `v4/` |
| `/v3` | Version 3: homepage v18 + Chapter Zero + registration flow | `Liminal Home v3.dc.html`, `Chapter Zero.dc.html`, `Limi.dc.html` |

Version 3's "Take Chapter Zero" buttons open `Chapter Zero.dc.html#register` (the registration flow); "How Chapter Zero works" opens the Chapter Zero page. All versions share the same App, POD and Community pages. To make a different version the default, change the `/` rewrite in `vercel.json`.

## Local development

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

## Deploy

Deployed on Vercel as a static site. The root path rewrites to `Liminal Home v2.dc.html` (see `vercel.json`); every other page is served at its own filename.
