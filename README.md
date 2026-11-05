# MCmods

A dark-green Minecraft mod browser that pulls live data from **Modrinth** and **CurseForge**.

![theme](https://img.shields.io/badge/theme-dark%20green-1bd96a)

## What it does

- **Five project types** — **mods, resource packs, data packs, shaders and modpacks**, each
  with its own search, filters, feed and project pages (`project_type` on Modrinth,
  `classId` on CurseForge).
- **Live feed** — a fresh batch of **10 projects every 60 seconds** for the selected type,
  drawn from randomised slices of both platforms so the feed keeps rotating (duplicates are
  excluded for you).
- **Search + facets** — full-text search, source (Modrinth / CurseForge / both),
  sort by relevance / downloads / followers / newest / updated, project loader (mods,
  modpacks, shaders), game version and category filters.
- **Project pages** — summary, statistics, rendered description, gallery, plus a version
  list with per-file download links and changelog metadata.
- **Favorites** — saved in `localStorage`, so they survive reloads without an account.
- **Deep links** — `/#/mod/modrinth/sodium` opens a mod page directly.
- Keyboard: `/` focuses search, `Esc` closes the mod dialog.

## Run it locally

No dependencies, no build step — Node 18+ is enough.

```bash
npm run dev      # http://0.0.0.0:3000
```

`dev-server.mjs` imports `worker.js` and gives it a filesystem `ASSETS` binding, so the
preview executes exactly the same code that ships to the edge.

### Enabling CurseForge

Modrinth needs no key. CurseForge's API requires one (`x-api-key`), otherwise it answers
`403`. Without a key MCmods simply runs on Modrinth and shows a banner saying so.

1. Create a key at <https://console.curseforge.com/> (API Keys section).
2. Locally: `CURSEFORGE_API_KEY=... npm run dev`.
3. On Cloudflare Sites: add a `CURSEFORGE_API_KEY` secret in **Sites → Secrets**.

The key is only ever read server-side from the environment binding.

## API

All endpoints are same-origin, cache-friendly JSON.

| Route | Description |
| --- | --- |
| `GET /api/health` | Service status, feed size/interval, whether CurseForge is configured |
| `GET /api/feed?type=mods&cursor=0&exclude=a:b,c:d` | 10 rotating mods + the next cursor |
| `GET /api/search?type=shaders&q=&source=all&sort=downloads&loaders=iris&version=1.21.1&categories=fantasy&offset=0&limit=24` | Search across both sources |
| `GET /api/tags?type=resourcepacks` | Categories, loaders and game versions for the selected type |
| `GET /api/mod/modrinth/:slugOrId` | Project, description and latest 30 versions |
| `GET /api/mod/curseforge/:modId` | Same shape for CurseForge (needs the key) |

`type` accepts `mods` (default), `resourcepacks`, `datapacks`, `shaders` and `modpacks`
(singular forms such as `shader` also work).

Responses are normalised to one shape (`id`, `source`, `projectType`, `title`, `summary`,
`icon`, `downloads`, `follows`, `categories`, `loaders`, `versions`, `updated`, `published`,
`url`), so the UI does not care where a project came from or which type it is.

## Deploy

`deploy.json` is a Sites manifest: the Worker (`worker.js`, self-contained ES module) plus
`public/` as static assets with SPA fallback. Publish it from the Sites panel, or point your
own Wrangler config at `worker.js` with the same compatibility date.

## Notes

- Upstream calls are cached for 30–3600 s via the Workers Cache API (with an in-memory
  fallback in Node), which keeps well inside Modrinth's rate limit.
- Downloads always resolve to the original file on the source platform; every card links
  back to the project page. MCmods hosts no mod files.
- Not affiliated with Mojang, Microsoft, Modrinth or CurseForge.
