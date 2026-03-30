# VSTEP Listening Practice

> A full-featured VSTEP listening exam platform built with **Next.js**, **TypeScript**, and **Tailwind CSS**. Supports timed exams, pause/resume, audio caching, bilingual UI, and an admin panel for exam management.

**Live Demo:** [vstep-listening-app.vercel.app](https://vstep-listening-app.vercel.app)
**Admin Demo (YouTube):** [Watch admin walkthrough](https://www.youtube.com/watch?v=PCVYfDU6Fxk)

---

## Features

### Exam Experience
- Timed listening exams with per-part audio (Part 1, 2, 3)
- Pause & resume — progress and time are saved server-side
- Custom exit modal instead of native browser dialog
- Browser back button intercepted to show save prompt
- Auto-save on tab close/page reload via `fetch` with `keepalive`
- Answer grid for quick navigation between questions
- Review page after submission showing correct/incorrect answers

### Audio Caching
- Client-side audio caching using the **Cache API**
- Audio files cached after first load — subsequent plays served from cache
- Reduces Cloudinary bandwidth on repeat visits
- Blob URLs used to serve cached audio without network requests
- Cache triggered via `onCanPlay` to avoid double-downloading

### Authentication & Authorization
- JWT-based auth with role support (`user` / `admin`)
- All `/admin` routes protected by layout-level route guard
- Non-admin users redirected to home; unauthenticated to login
- Bilingual UI (Vietnamese / English) with language toggle in navbar

### Admin Panel
- Create and manage listening exams
- Add parts with audio upload (Cloudinary)
- Add passages and questions per part
- Add answer options with correct answer marking
- Load existing exam data for editing

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **HTTP Client** | Axios |
| **Audio Storage** | Cloudinary |
| **Database** | MySQL (via PHP REST API) |
| **Deployment** | Vercel |

---

## Project Structure

```
vstep-listening/
├── app/
│   ├── page.tsx                  # Homepage with exam list
│   ├── login/ register/          # Auth pages
│   ├── profile/                  # User exam history
│   ├── test/[id]/
│   │   ├── page.tsx              # Exam taking page
│   │   └── review/page.tsx       # Post-submission review
│   └── admin/
│       ├── layout.tsx            # Admin route guard
│       ├── exams/[id]/
│       │   ├── add-part/         # Add audio parts
│       │   └── add-options/      # Add questions & options
│       └── ...
├── components/
│   ├── Navbar.tsx                # Navigation with auth dropdown
│   └── CachedAudio.tsx           # Drop-in audio with Cache API
├── lib/
│   ├── api.ts                    # All API calls (Axios)
│   ├── auth-context.tsx          # Auth state + isAdmin flag
│   ├── audio-cache.ts            # Cache API helpers
│   └── lang.ts                  # i18n (vi/en)
└── types/index.ts                # TypeScript interfaces
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variable
echo 'NEXT_PUBLIC_API_URL=https://your-api.com' > .env.local

# Run dev server
npm run dev
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the PHP REST API backend |

---

## Key Implementation Notes

**Audio Caching** — `lib/audio-cache.ts` + `components/CachedAudio.tsx`
- On mount: check Cache API for existing blob, use it if found
- On `onCanPlay`: cache the file (already in browser HTTP cache at this point, no double download)
- On unmount: revoke blob URL to prevent memory leaks

**Pause/Resume** — `app/test/[id]/page.tsx`
- On exam init: detects "Resuming existing exam" response, restores answers + remaining time
- `beforeunload`: silent auto-save with `fetch keepalive` (no native dialog)
- `popstate`: intercepts browser back button, pushes state back, shows custom exit modal
- Refs used for all state accessed in event handlers (avoids stale closures)

**Admin Guard** — `app/admin/layout.tsx`
- Wraps all `/admin/**` routes automatically via Next.js App Router layout
- Shows spinner while auth loads; redirects based on `user.isAdmin`
