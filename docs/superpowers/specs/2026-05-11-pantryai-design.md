# PantryAI — Design Spec
**Date:** 2026-05-11  
**Status:** Approved for implementation planning

---

## 1. Overview

PantryAI is a cross-platform mobile app (iOS first, Android ready) that lets users photograph their fridge and cabinet contents, receive AI-generated detailed recipes from what they have, track pantry inventory with smart expiry alerts, plan weekly meals, and generate grocery lists — all in one app.

### Market Position

| Feature | Supercook | Yummly | Mealime | Fridgely | BigOven | ChefGPT | **PantryAI** |
|---|---|---|---|---|---|---|---|
| Multi-photo AI fridge scan | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Pantry + expiry tracking | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Smart auto-cleanup | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| AI recipes with macros + tips | ❌ | ❌ | ❌ | ❌ | ❌ | Partial | ✅ |
| Barcode scanning | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Grocery list generation | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Weekly meal planner | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Recipe sharing | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Community trending recipes | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Recipe ratings | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Price | Free | $4.99/mo | $5.99/mo | Free | $2.99/mo | $4.99/mo | **$3.99/mo** |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| App | Expo (React Native + TypeScript) |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (Tailwind for RN) |
| Auth | Firebase Auth — Apple Sign-In + email/password |
| Database | Firestore |
| File Storage | Firebase Storage (scan images) |
| API Proxy | Firebase Cloud Functions (holds Claude API key server-side) |
| Scheduled Jobs | Firebase Cloud Functions (expiry notifications, scan quota reset, stale item cleanup) |
| Push Notifications | Expo Notifications (local, scheduled at item creation) + Firebase Cloud Messaging (server-driven backup) |
| Subscriptions | RevenueCat |
| Barcode Lookup | Open Food Facts API (free, no key required) |
| AI | Claude API — `claude-haiku-4-5` for ingredient detection, `claude-sonnet-4-6` for recipe generation |
| Camera | expo-image-picker (multi-photo, native camera) |
| Barcode Scanner | expo-barcode-scanner |
| Safe Areas | react-native-safe-area-context |
| Responsive | React Native Flexbox + useWindowDimensions |

### Cost Model
- Cloud Functions: free up to 2M invocations/month (negligible at launch scale)
- Claude API: ~$0.005–0.01 per scan session (haiku detection + sonnet recipes)
- Per free user: ~$0.08–0.15/month maximum (15 sessions)
- Pro margin: ~95%+ at $3.99/month against ~$0.20 average Claude cost
- Open Food Facts: free, no usage limits

---

## 3. Screen Structure

### Onboarding (one-time flow)
1. Welcome + value prop
2. Sign Up / Sign In (Apple or email/password)
3. Dietary preferences (multi-select: vegetarian, vegan, gluten-free, dairy-free, keto, halal, kosher, nut allergy, low-sodium)
4. Cuisine preferences (multi-select: Italian, Asian, Mexican, Mediterranean, American, Indian, Middle Eastern, Japanese)
5. Done — enter main app

### Main App (5 tabs)
1. **Scanner** — multi-photo capture, session quota, recent sessions
2. **Recipes** — last session results + saved + trending, with filter/sort bar and video import
3. **Pantry** — tracked items, expiry color coding, barcode add, manual add
4. **Planner** — weekly meal calendar, combined grocery list
5. **Profile** — account, subscription, dietary prefs, appearance settings

---

## 4. Data Models

### `users/{uid}`
```
email: string
displayName: string
dietaryRestrictions: string[]
cuisinePreferences: string[]
sessionCount: number           // scans used this billing cycle
sessionResetDate: timestamp    // rolling 30 days from activation/signup
subscriptionTier: 'free' | 'pro'
themeColor: string             // 'forest' | 'ocean' | 'sunset' | 'berry' | 'blossom' | 'slate' | 'crimson' | 'gold' | 'teal'
darkMode: boolean
createdAt: timestamp
```

### `users/{uid}/pantry/{itemId}`
```
name: string
category: 'fridge' | 'freezer' | 'pantry'
expiryDate: timestamp | null
quantity: string                // freeform: '2 cups', '1 bunch'
addedFromSessionId: string | null
addedAt: timestamp
lastUpdatedAt: timestamp
notificationIds: string[]       // expo notification IDs for cancellation on edit/delete
barcodeData: string | null      // from Open Food Facts if added via barcode
```

### `users/{uid}/sessions/{sessionId}`
```
imageUrls: string[]             // Firebase Storage URLs (multiple photos)
detectedIngredients: string[]
timestamp: timestamp
```

### `users/{uid}/savedRecipes/{recipeId}`
```
title: string
ingredients: { name: string, amount: string, inPantry: boolean }[]  // inPantry = snapshot at save time
steps: { instruction: string, tip: string | null }[]
macros: { calories: number, protein: number, carbs: number, fat: number, fiber: number }
prepTime: number
cookTime: number
servings: number
dietaryTags: string[]
sourceIngredients: string[]
rating: number | null           // 1–5, set when user taps Cooked It
savedAt: timestamp
isPublic: boolean               // reserved for future explicit sharing; community pool driven by recipeArchive
substitutionNote: string | null
```

### `users/{uid}/groceryList/{itemId}`
```
name: string
quantity: string | null
checked: boolean
addedAt: timestamp
sourceRecipeId: string | null
```

### `users/{uid}/weeklyPlan/{weekId}`
```
weekStartDate: date             // Monday of that week
days: {
  monday: string | null         // savedRecipe ID or null
  tuesday: string | null
  wednesday: string | null
  thursday: string | null
  friday: string | null
  saturday: string | null
  sunday: string | null
}
```

### `recipeArchive/{recipeId}` (global, replaces communityRecipes)
The recipe archive serves two purposes: (1) cache to reduce Claude API calls, (2) community recipe pool for trending. Every Claude-generated recipe is written here. Before generating recipes, the Cloud Function queries this collection first.

```
title: string
ingredients: { name: string, amount: string }[]
ingredientKeys: string[]        // normalized lowercase sorted array — used for lookup queries
steps: { instruction: string, tip: string | null }[]
macros: { calories: number, protein: number, carbs: number, fat: number, fiber: number }
prepTime: number
cookTime: number
servings: number
dietaryTags: string[]           // used to filter by user dietary restrictions
substitutionNote: string | null
usageCount: number              // incremented each time served to any user
averageRating: number | null    // rolling average across all user ratings
ratingCount: number
createdAt: timestamp
lastServedAt: timestamp
```

---

## 5. Scan Session Flow

**One scan session = one recipe generation = one credit consumed, regardless of photo count.**

1. **Quota check (Cloud Function)** — checks `sessionCount` against tier limit (free: 15, pro: unlimited). Checks if `now > sessionResetDate` and resets count if so before checking. Returns `quota_exceeded` if limit hit → paywall sheet shown client-side.

2. **Photo capture** — `expo-image-picker` opens native camera. User takes photos one at a time. Each captured photo appears as a thumbnail with a ✓ check. A `+` button adds more. "Done ✓" button appears in the header after first photo. Tip prompt shown: *"Open drawers, shelves, and door panels for full coverage. All photos count as one session."*

3. **Upload** — on Done tap, all photos compressed client-side and uploaded to Firebase Storage in parallel.

4. **Ingredient detection (Cloud Function)** — all image URLs sent in a single Claude haiku call. Prompt instructs Claude to return a structured JSON list of detected ingredients. User's `dietaryRestrictions` passed for context.

5. **Review screen** — ingredient chips displayed. Each chip shows status:
   - Default grey: detected, not in pantry
   - Blue ✓: already in pantry (cross-referenced against Firestore pantry)
   - Green ✦: new item not previously tracked
   - Tap chip to remove (false positive). `+ Add` chip to add missing items manually.

6. **Recipe generation (Cloud Function)** — on "Find Recipes" tap:

   **Step 6a — Archive lookup (before Claude):**
   Normalize the confirmed ingredient list (lowercase, sorted). Query `recipeArchive` for recipes where:
   - All recipe `ingredientKeys` are present in the user's ingredient list (user has every required ingredient)
   - `dietaryTags` are compatible with user's `dietaryRestrictions`
   
   Return top matches ranked by `averageRating` then `usageCount`. Increment `usageCount` and `lastServedAt` on each served recipe.

   **Step 6b — Claude fallback (cache miss):**
   If fewer than 3 archive matches are found, call Claude sonnet for the remaining recipes needed. Prompt specifies: return recipes as structured JSON, ranked by ingredient match percentage, each including full step-by-step instructions with inline tips, macros per serving, prep/cook time, dietary tags, and a substitution note. Claude instructed to include 2–4 general best-practice cooking tips per recipe (e.g., resting meat, lid for even cooking, tasting as you go).

   **Step 6c — Archive write:**
   Every Claude-generated recipe is immediately written to `recipeArchive` with `usageCount: 1`. Before writing, check for an existing recipe with the same title to avoid near-duplicates. Over time, the archive grows and Claude is called only for truly novel ingredient combinations.

7. **Results displayed** — recipe cards shown with match bar, macro pills (calories, protein, carbs, fat), and three action buttons: Save, View Recipe, Cooked It.

8. **Pantry prompt** — bottom sheet slides up: detected new ingredients listed with optional expiry date picker per item. Date picker defaults closed (opt-in). "Skip All" button available. On confirm: batch write to Firestore. `sessionCount` incremented server-side.

---

## 6. Recipe Images

Every recipe in the app has a hero food photograph. Images are generated once per unique recipe and reused from the archive — never regenerated for the same dish.

### Generation Pipeline

1. **Archive hit** — if a matching recipe already exists in `recipeArchive`, its `imageUrl` is used directly (no generation cost)
2. **New recipe** — after Claude generates the recipe text, a Cloud Function triggers image generation asynchronously via **Replicate API** (Flux Schnell or SDXL food photography LoRA). Prompt format: `"[dish name], professional food photography, natural lighting, shallow depth of field, rustic table setting, appetizing plating, ultra-realistic"`
3. **Image stored** — uploaded to Firebase Storage at `recipeImages/{recipeId}.jpg`. `imageUrl` written to `recipeArchive` entry.
4. **Video imports** — for imported recipes, attempt to extract the OG image / video thumbnail from the source URL first. Fall back to generation if no usable image found.

### Loading States

While image is generating (typically 3–8 seconds), recipe cards show a shimmer placeholder. Recipe detail screen shows a blurred low-res placeholder that crossfades to the full image on load. `imageStatus: 'pending' | 'ready' | 'failed'` field on `recipeArchive` drives this.

### Data Model Addition (`recipeArchive`)
```
imageUrl: string | null       // Firebase Storage URL
imageStatus: 'pending' | 'ready' | 'failed'
```

### Cost
Replicate Flux Schnell: ~$0.003/image. One generation per unique recipe title. Given recipe archive caching, most users trigger no more than 3–5 new generations per session. Marginal cost well within the $3.99/month subscription margin.

### Recipe Cards (Recipes Tab)
All recipe cards display the hero image as a full-bleed background with a bottom gradient overlay for text legibility. Cards are tall-format (roughly 3:4 ratio) — scannable at a glance, visually rich, no cluttered text walls.

---

## 7. Recipe Detail

Each recipe displays:

**Hero image:** full-width food photo (generated or imported thumbnail) at top of screen with parallax scroll effect. Tapping opens full-screen lightbox.

**Header:** title, prep time, cook time, servings, dietary tags, "Keeps X days" note

**Macros grid (per serving):**
- Calories (red)
- Protein (green)
- Carbs (amber)
- Fat (purple)
- Fiber (teal)
- Flagged as *"estimated — varies by ingredient size and brand"*

**Ingredients:** name + measurement with wiggle room (e.g. *"4 cloves garlic — 3 to 5 is fine"*, *"2 cups spinach — a big handful works"*)

**Instructions:** numbered steps, each optionally followed by a 💡 tip callout. Tips include:
- Step-specific technique (e.g. *"Don't move the chicken — letting it sit builds the crust"*)
- General best practices woven in contextually (e.g. *"Cover with lid to trap steam and cook meat evenly through without drying it out"*, *"Always rest meat before slicing — juices redistribute instead of running out on the board"*, *"Taste as you go — a recipe is a guide, your palate is the final judge"*)
- Common mistake callout on the trickiest step

**Footer:** substitution note for any missing ingredient, "Keeps X days" storage tip

**Actions:**
- ♡ Save — writes to `savedRecipes`
- Share — generates shareable recipe card image + link
- ✓ Mark as Cooked — triggers pantry deduction flow + rating prompt

---

## 8. Recipes Tab — Filter, Sort & Layout

### Filter Bar
Persistent chip bar at the top of the Recipes tab. Filters apply across all three sections (Last Session, Saved, Trending).

**Cuisine filters (horizontal scroll):**
All · Italian · Asian · Mexican · Mediterranean · American · Indian · Middle Eastern · Japanese

**Dietary filters (horizontal scroll, second row):**
All · Vegetarian · Vegan · Gluten-Free · Dairy-Free · Keto · Low-Carb · Halal · Kosher

Multiple filters can be active simultaneously. Active chips highlighted in accent color.

### Sort Options
Accessible via a sort icon (top-right of each section). Options per section:

| Section | Sort options |
|---|---|
| Last Session | Best Match (default) · Quickest · Highest Rated |
| Saved Recipes | Recently Saved (default) · Highest Rated · Quickest · Cuisine · Alphabetical |
| Trending | Most Popular (default) · Highest Rated · Quickest |

### Section Layout
1. **From Last Session** — recipe cards with match bar + macro pills. Shown only after a scan session.
2. **Saved Recipes** — persisted collection. Searchable via search bar at top. Grouped by cuisine tag if cuisine filter active.
3. **Trending This Week** — top recipes from `recipeArchive` by activity, filtered to match user's dietary restrictions automatically.

---

## 9. Video Recipe Import (Share Extension)

Users can share any recipe video from TikTok, Instagram Reels, YouTube Shorts, or any website directly to PantryAI via the native iOS share sheet.

### How It Works

**iOS Share Extension** registered with the app. When user taps Share in TikTok (or any app) and selects PantryAI:

1. **URL received** — extension captures the shared URL
2. **Metadata fetch (Cloud Function)** — backend fetches the video/page metadata: title, description, caption, and any structured text content via oEmbed or HTML scrape
3. **Claude extraction** — metadata sent to Claude with prompt: *"Extract any recipe from this content. Return structured JSON with title, ingredients + amounts, steps, estimated macros, prep time, cook time, servings, and dietary tags. If information is missing or unclear, mark those fields as null."*
4. **Recipe preview screen** — user sees the extracted recipe with editable fields. Any `null` fields highlighted in amber — user fills gaps manually before saving.
5. **Save** — writes to `savedRecipes` and `recipeArchive`. Flagged with `source: 'import'` and `sourceUrl` for reference.

### Data Model Addition (savedRecipes)
```
source: 'generated' | 'import'   // origin of recipe
sourceUrl: string | null          // original video/page URL if imported
```

### Limitations & Handling
- **Caption-only recipes** (no full ingredient list in description) — Claude extracts what it can, remaining fields are null and user fills in manually
- **Fully spoken recipes with no text** — Claude receives only the title/caption. Preview screen opens mostly blank. User prompted: *"We couldn't extract full recipe details from this video. Fill in what you know and save."*
- **Non-recipe content** — Claude returns no recipe data → user shown: *"No recipe found in this content."* with option to enter manually
- **Platform support** — any URL shared via the iOS share sheet. TikTok, Instagram, YouTube, recipe websites all supported identically

### Implementation Note
iOS Share Extensions in Expo managed workflow require a custom native config plugin (`expo-share-extension` or equivalent). This is a known complexity — flagged for implementation planning. The extension runs as a lightweight process that hands off to the main app for the preview/save screen.

---

## 10. "Cooked It" Flow

1. User taps "Mark as Cooked"
2. Confirmation screen shows ingredient deductions with quantities. User can adjust amounts before confirming.
3. Firestore pantry updated — quantities reduced. Items reaching zero quantity removed.
4. Rating prompt: *"How did it turn out?"* — 1 to 5 stars. Optional, dismissable.
5. If recipe is saved and `isPublic: true`, rating averaged into `communityRecipes` document.

---

## 11. Smart Pantry Auto-Removal

Four removal triggers — no manual cleanup required from the user:

| Trigger | Behavior |
|---|---|
| **Cooked It confirmed** | Ingredient quantities deducted. Zero quantity = item deleted. |
| **Expiry passed** | 1 day grace period, then item silently removed. Notification sent: *"Spinach was removed from your pantry — it expired yesterday."* |
| **Stale item (no expiry)** | Items with no expiry date untouched for 60 days receive a *"Still have this?"* prompt. No response in 7 days = auto-removed. |
| **Swipe to remove** | Manual escape valve, always available on any pantry item. |

---

## 12. Expiry Notifications — Two-Layer System

**Layer 1 — Local notifications (scheduled at item creation):**
When an expiry date is set, two local notifications are immediately scheduled via `expo-notifications`:
- 2 days before expiry: *"🟡 Your [item] expires in 2 days — need a recipe?"*
- Day of expiry: *"🔴 Your [item] expires today — use it up!"*
Notifications stored by ID in Firestore. On item edit or deletion, existing notifications cancelled and rescheduled if applicable.
Notification permission requested after first pantry item is added (not on app launch).

**Layer 2 — Firebase Cloud Function (server-side daily cron):**
Runs daily, queries all pantry items expiring within 2 days across all users, sends FCM push notifications as a grouped summary: *"You have 3 items expiring soon — tap to see recipes."* Catches cases where local notifications were cleared, app reinstalled, or notification permissions reset.

---

## 10. Barcode Scanning

Available as an add method in the Pantry tab and on the ingredient review screen.

Flow:
1. User taps barcode icon → `expo-barcode-scanner` opens
2. Barcode scanned → EAN/UPC sent to Open Food Facts API (free, no key)
3. Response returns: product name, nutritional info (calories, macros per 100g)
4. Pre-filled pantry entry shown: name auto-filled, nutrition stored, user sets quantity and optional expiry date
5. Item added to pantry

---

## 11. Grocery List

Generated from missing ingredients in recipes, or manually added.

**From recipe:** Tap "I Need This" next to any missing ingredient on the recipe detail screen → added to grocery list with quantity.

**From weekly planner:** "Generate Grocery List" button combines all missing ingredients across the week's planned meals into a single deduplicated list.

**List features:**
- Check items off as purchased (strikethrough)
- Swipe to delete
- "Share List" — plain text export (iMessage, Notes, etc.)
- "Clear Checked" button
- Organized by pantry category (produce, dairy, meat, dry goods)

---

## 12. Weekly Meal Planner

Accessible via the Planner tab.

**Layout:** 7-day calendar (Mon–Sun). Each day shows a recipe card slot.

**Adding meals:**
- Tap an empty day slot → browse saved recipes or trending community recipes → select one → assigned to that day
- Long press a slot to remove or swap

**Grocery list generation:**
- "Generate Grocery List for This Week" button — cross-references all 7 days' recipe ingredients against current pantry, adds only missing items to the grocery list

**View:** Compact recipe name + cook time shown in each day slot. Tap to open full recipe detail.

---

## 13. Community Trending Recipes

Surfaces in the Recipes tab under a "Trending This Week" section. Powered by the `recipeArchive` collection — no separate community collection needed.

**How it works:**
- Every recipe served from the archive accumulates `usageCount` and `averageRating` automatically — no explicit opt-in required from users
- Trending = recipes with the highest `usageCount` + `averageRating` activity in the last 7 days (`lastServedAt` within window), filtered by user's dietary restrictions
- As the archive grows, trending becomes a genuine signal of what's popular and well-rated across the entire user base

**On a community recipe:**
- Same recipe detail view as personal recipes
- Save to personal `savedRecipes` collection
- "Cooked It" + rating (rating averaged back into archive `averageRating`)
- No attribution to any user (fully anonymous)

---

## 14. Recipe Sharing

Tap "Share" on any recipe detail screen.

- Generates a styled recipe card image (title, macros, key ingredients, cook time, app branding)
- Native iOS share sheet — iMessage, Instagram Stories, copy link, save to Photos
- Deep link: if recipient has the app, opens to that recipe. If not, opens a simple web preview page.

---

## 15. Monetization

**Products (RevenueCat):**
- `pantryai_monthly` — $3.99/month
- `pantryai_annual` — $29.99/year (37% savings, shown prominently)
- Entitlement: `pro` — unlimited scan sessions

**Free tier:** 15 scan sessions per rolling 30-day billing cycle.

**Quota enforcement:** Server-side in Cloud Function. Client-side UI shows session count badge on Scanner tab.

**Billing cycle:** Rolling 30 days from account creation (free) or subscription activation (pro). Driven by RevenueCat webhooks:
- `INITIAL_PURCHASE` → `sessionCount = 0`, `sessionResetDate = now + 30 days`
- `RENEWAL` → `sessionCount = 0`, `sessionResetDate = now + 30 days`
- `CANCELLATION` → `subscriptionTier = 'free'`, keep current reset date
- `EXPIRATION` → `subscriptionTier = 'free'`

Quota check logic (Cloud Function):
```
if now > sessionResetDate:
    sessionCount = 0
    sessionResetDate += 30 days
if sessionCount >= limit (15 free / unlimited pro):
    return quota_exceeded
```

**Paywall:** Bottom sheet (not full-screen interrupt). Shown when quota exceeded. Monthly/annual toggle. 3-day free trial on annual plan only. Restore purchases link.

---

## 16. Authentication

**Sign Up / Sign In options:**
- Sign in with Apple (one tap, no password)
- Email + password

**Profile persistence:** Dietary preferences, cuisine preferences, pantry, saved recipes, weekly plan, grocery list all stored in Firestore under `users/{uid}`. Restored automatically on any device after sign-in.

**Restore Purchases:** One tap on Profile tab — RevenueCat handles across reinstalls and devices.

---

## 17. Appearance

**Light/Dark Mode:**
- Light is the default
- Moon/sun icon in the header of every main tab for instant toggle (one tap)
- Also togglable via Profile → Appearance → Dark Mode switch
- Stored in Firestore under user profile

**Color Themes (9 presets):**
Accessible via Profile → Appearance → Color Theme. Accent color applied across buttons, highlights, active tab indicators, and progress bars.

| Name | Color |
|---|---|
| 🌿 Forest (default) | #38a169 |
| 🌊 Ocean | #3182ce |
| 🌅 Sunset | #dd6b20 |
| 🫐 Berry | #805ad5 |
| 🌸 Blossom | #d53f8c |
| 🖤 Slate | #4a5568 |
| 🔥 Crimson | #c53030 |
| ✨ Gold | #b7791f |
| 🩵 Teal | #2c7a7b |

Live preview shown when browsing presets.

---

## 18. Responsive Design

- Built with React Native Flexbox — scales dynamically across all iPhone sizes (SE through Pro Max)
- `react-native-safe-area-context` handles notch, Dynamic Island, and home indicator
- `useWindowDimensions` used for components that need explicit width (photo strip, macro grid)
- Dynamic Type (iOS accessibility font scaling) respected by default
- `supportsTablet: false` in `app.json` for v1 — iPad support added in a future version
- Android supported from the same codebase via Expo; review and test after iOS launch

---

## 19. Pantry Item Color Coding

| Color | Condition |
|---|---|
| 🟢 Green | More than 5 days remaining |
| 🟡 Yellow | 2–5 days remaining |
| 🔴 Red | Expiring today or tomorrow |
| ⚫ Grey | No expiry date set |
| 🔴 Red border (stale) | No expiry, not updated in 60+ days — "Still have it?" prompt |

---

## 20. Key UX Decisions

- **Session = recipe generation, not photo count.** All photos in one session consume one credit.
- **Expiry date opt-in.** Date picker defaults closed. "Skip All" always available. No nags.
- **Pantry cross-reference.** Ingredient review screen shows which detected items are already in pantry (blue ✓) vs new (green ✦).
- **Barcode always available.** Barcode scan accessible from Pantry tab and from the ingredient review screen.
- **Stale cleanup is gentle.** 60-day prompt + 7-day grace before any auto-removal. User always in control.
- **Rating is optional.** Prompted after "Cooked It" but fully dismissable. No forced feedback.
- **Recipe archive is automatic.** Every Claude-generated recipe is archived globally. No user opt-in needed — the archive grows passively and reduces API costs over time.
- **Notification permission deferred.** Requested after first pantry item added, not on first launch.
