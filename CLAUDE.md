# Fridai — CLAUDE.md

AI-powered pantry and recipe app for iOS (Android-ready). Scan your fridge, get personalized recipes, manage your pantry, and plan your week — powered by Claude AI.

---

## What It Does

| Feature | Description |
|---|---|
| **Fridge Scanner** | Multi-photo AI scan detects ingredients, adds to pantry automatically |
| **Recipe Generation** | Claude generates personalized recipes from detected ingredients, with macros, tips, and food photography |
| **Recipe Archive** | Global cache of generated recipes — avoids repeat Claude calls, powers Trending tab |
| **Video Import** | iOS Share Extension imports recipes from TikTok, Instagram, YouTube via Claude extraction |
| **Smart Pantry** | Tracks items with expiry dates, barcode lookup, auto-removes on cook/expiry/stale |
| **Meal Planner** | Weekly calendar with drag-to-plan and combined grocery list |
| **Subscriptions** | 15 free sessions/month → $3.99/month or $29.99/year via RevenueCat (rolling 30-day reset) |

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Mobile** | Expo (React Native + TypeScript), Expo Router, NativeWind |
| **Backend** | Firebase Auth, Firestore, Storage, Cloud Functions |
| **AI — ingredient detection** | Claude Haiku 4.5 (`claude-haiku-4-5`) |
| **AI — recipe generation** | Claude Sonnet 4.6 (`claude-sonnet-4-6`) |
| **AI — video import extraction** | Claude Sonnet 4.6 |
| **Recipe images** | Replicate API (Flux Schnell), stored in Firebase Storage |
| **Subscriptions** | RevenueCat SDK + webhooks |
| **Auth** | Firebase Auth — Apple Sign-In + email/password |
| **Notifications** | expo-notifications (local) + FCM via Cloud Functions (server-side cron) |
| **Barcode** | expo-barcode-scanner + Open Food Facts API (free, no key) |

---

## Project Structure (target — set up via Expo init)

```
/                        ← Expo React Native project root
  app/                   ← Expo Router screens
    (tabs)/
      scanner.tsx
      recipes.tsx
      pantry.tsx
      planner.tsx
      profile.tsx
  components/            ← shared UI components
  hooks/                 ← custom React hooks
  lib/                   ← Firebase, Claude, Replicate clients
  functions/             ← Firebase Cloud Functions (Node.js)
  assets/                ← fonts, images, icons
  docs/                  ← design specs and plans
  trading/               ← separate day trading algorithms (Python)
  pokemon-bot/           ← legacy ScalpBot code (Pokemon TCG reporter)
```

---

## Design Spec

Full design spec at `docs/superpowers/specs/2026-05-11-fridai-design.md`. Covers all 23 sections: screen structure, data models, scan flow, recipe images, filter/sort, video import, Cooked It, pantry auto-removal, notifications, barcode, grocery list, meal planner, community trending, sharing, monetization, auth, appearance, responsive design, and key UX decisions.

---

## Key Decisions

- **One session = recipe generation**, not photo capture. `sessionCount` increments only when Claude is called, not per photo.
- **Recipe archive is global** — `recipeArchive` Firestore collection shared across all users. Cache-first before calling Claude.
- **Rolling 30-day billing** — subscription quota resets 30 days after activation date (RevenueCat webhook), not calendar month.
- **iPhone only v1** — `supportsTablet: false` in Expo config. Android added in v2.
- **Two-layer notifications** — local scheduled at item creation + FCM server cron daily. Not dependent on app open.
- **Images generated async** — shimmer placeholder on cards, crossfade on load. `imageStatus` field drives UI state.

---

## Legacy / Other Projects

| Folder | Description |
|---|---|
| `pokemon-bot/` | ScalpBot — Pokemon TCG market intelligence bot (GitHub Actions, Node.js, no npm packages) |
| `trading/` | Day trading algorithms — QQQ Alpaca (Python) + NAS100 OANDA (Python) |
