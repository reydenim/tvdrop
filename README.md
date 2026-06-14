<p align="center">
  <img src="public/logo.png" alt="TVDROP" width="400" />
</p>

<p align="center">
  <strong>Nonton 5.500+ channel TV Indonesia & Internasional — gratis, tanpa buffering.</strong>
</p>

<p align="center">
  <a href="https://tv.drop.my.id">🌐 tv.drop.my.id</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/channels-5.522-red?style=flat-square" alt="Channels" />
  <img src="https://img.shields.io/badge/countries-163-blue?style=flat-square" alt="Countries" />
  <img src="https://img.shields.io/badge/genres-30-green?style=flat-square" alt="Genres" />
  <img src="https://img.shields.io/badge/stack-Next.js_16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" alt="License" />
</p>

---

## Features

### 📺 Player
- **HLS + DASH + Raw** — 3 stream format support (98%+ channel pake HLS)
- **Custom controls** — SVG icons (no emoji), play/pause, seek, volume, quality selector
- **Keyboard shortcuts** — Space (play/pause), F (fullscreen), M (mute), arrow keys
- **Picture-in-Picture** — tonton sambil scrolling
- **Fullscreen with orientation lock** — landscape on mobile
- **Buffering spinner** — visible feedback pas loading

### 🏠 Homepage
- **Hero carousel** — 6 curated channel, auto-rotate 6s, touch swipe
- **Favorites** — heart button, localStorage, row di homepage + filter di semua page
- **Genre sections** — 30 genre rows (News, Sports, Music, dll)
- **Recently watched** — dari localStorage
- **Indonesia section** — 36 channel lokal

### 🔍 Search & Discovery
- **Unified search** — satu search bar untuk cari channel, browse kategori
- **Inline dropdown** — hasil real-time + kategori pills
- **Genre filter** — 30 genre pills di /semua
- **Country filter** — dropdown 163 negara
- **Skeleton loading** — animated placeholder cards

### 🛡️ Security
- **Turnstile challenge** — Cloudflare Turnstile invisible (auto-solve) sebelum akses
- **24h session cookie** — gak perlu verify ulang
- **Admin basic auth** — nginx password protection
- **CF Proxy** — semua traffic lewat Cloudflare

### 🔧 Admin Panel
- **Dashboard** — stats real-time (total channel, logo, negara, health)
- **Channel Manager** — search, filter, sort, pagination, edit, delete
- **Curated Manager** — drag-and-drop urutkan hero carousel
- **Visitor Monitor** — traffic analytics (requests, unique visitors, top pages, hourly chart)
- **Health Check** — stream validation (live/dead/geo-blocked)

---

## Tech Stack

| Category | Tech |
|----------|------|
| **Frontend** | Next.js 16.2.9 + TypeScript + Tailwind CSS |
| **Streaming** | HLS.js, Dash.js |
| **Deployment** | PM2 + Nginx + Cloudflare Proxy |
| **Logging** | GoAccess (log analyzer) |
| **Security** | Cloudflare Turnstile, HTTP Basic Auth |
| **Font** | Geist (Vercel) |

### Data Sources
- **iptv-org** — 5000+ channel from community-maintained playlists
- **famelack-data** — curated, validated, categorized channel data
- **Free-TV/IPTV** — logo sources (861/876 matched)
- **Health checker** — batch stream validation tiap 6 jam

---

## Architecture

```
Cloudflare (Proxy + Turnstile)
  └─ Nginx (reverse proxy + basic auth + real-ip)
       └─ Next.js 16 (SSR + API routes)
            ├─ /api/channels — data API (search, filter, genre)
            ├─ /api/admin/* — admin CRUD operations
            ├─ /api/verify-turnstile — captcha verification
            └─ /api/health — stream health status
```

**Data flow:**
```
channels.json (1.8MB, 5500+ channel)
  ├─ Bundled at build → /api/channels
  ├─ Runtime read/write → /api/admin/*
  └─ Health status → /api/health
```

---

## Screenshots

_Coming soon — tambahin screenshot dari tv.drop.my.id_

---

## Deployment

### Requirements
- Node.js 20+
- Nginx (for production)
- Cloudflare account (for Turnstile + proxy)
- PM2 (process manager)

### Quick Start

```bash
# Clone
git clone https://github.com/reydenim/tvdrop.git
cd tvdrop

# Install
npm install

# Development
npm run dev

# Production build
npm run build
pm2 start npm --name "tv-web" -- start
```

### Environment Variables

Create `.env.local`:

```env
TURNSTILE_SECRET_KEY=your_secret_key
TURNSTILE_SITE_KEY=your_site_key
```

### Nginx Configuration

Refer to [`/etc/nginx/sites-enabled/tv`](https://github.com/reydenim/tvdrop) for the full nginx config with:
- Cloudflare real-ip
- SSL via Let's Encrypt
- Auth basic untuk /admin
- Turnstile bypass routes

---

## Credits

- **iptv-org** — global IPTV channel index
- **famelack** — curated category data
- **Free-TV/IPTV** — logo sources
- **Cloudflare** — Turnstile + proxy protection

---

<p align="center">
  <b>TVDROP</b> — by <a href="https://github.com/reydenim">Rey Denim Osborn</a>
  <br>
  <sub>Built with ❤️ and Next.js</sub>
</p>


## 🏆 Achievements
[![Quickdraw](https://img.shields.io/badge/Quickdraw-Closed%20Issue-green)]()
[![YOLO](https://img.shields.io/badge/YOLO-Merged%20PR-orange)]()


⭐ **Love this project? Give it a star!** 🦦
