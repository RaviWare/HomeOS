# HomeOS go-live status

Last updated: 2026-07-10

## Ready (soft launch)

| Area | Status | Notes |
|------|--------|--------|
| Auth (Clerk sign-in / sign-up) | ✅ | SPA + `ClerkSessionBridge` |
| Command Deck + modules | ✅ | Properties, leases, utilities, maintenance, documents |
| Empty-deck first-run guide | ✅ | Income, assets, net worth, payments intents |
| Multi-currency display | ✅ | Static FX rates; display currency in Settings |
| Legal / privacy (compact) | ✅ | No local-first claims |
| Device session log | ✅ | UA + geojs in Settings |
| Vault crypto (export encrypt) | ✅ | AES-GCM passphrase backups |
| MFA path | ✅ | Via Clerk user profile when configured |
| Deep links `/app/*` | ✅ | Preserved across session restore |
| Marketing pages | ✅ | Features, roles, how-it-works, pricing copy |

## Payment & billing (integrated this pass)

| Item | Status | Notes |
|------|--------|--------|
| Clerk Billing **enabled** (user plans) | ✅ | `clerk enable billing --for user` |
| Plans in Clerk: **personal / pro / team** | ✅ | $4.99 / $14.99 / $39.99 · annual discounts · 14-day trial flags |
| Feature entitlements in Clerk | ✅ | exports, unlimited_properties, expense_tax, finance_hub, team_seats, priority_support |
| Live `<PricingTable />` on `/pricing` | ✅ | Real checkout drawer when signed in |
| Settings → Plan & billing | ✅ | `ClerkBillingPanel` + manage billing profile |
| Stop free plan grant from localStorage | ✅ | Checkout preference is hint-only; paid plan from Clerk `has({ plan })` |
| Plan sync after login / checkout | ✅ | `ClerkSessionBridge` + billing panel mirror to local session |

### Two different “payments” (do not confuse)

1. **SaaS subscription (HomeOS plan)** — Clerk Billing / Stripe. Card checkout on `/pricing` and Settings.
2. **Ledger & Payments hub** — records rent, utilities, deposits, etc. **Not** card processing for tenants/landlords. Marking a row “Paid” updates your vault ledger only.

## Still pending (hard go-live / production money)

| Item | Priority | Action |
|------|----------|--------|
| **Connect Stripe** on production Clerk instance | 🔴 Blocker for real money | Dashboard → Billing → Settings → production gateway |
| Production Clerk instance + live publishable key | 🔴 | `clerk` production keys in deploy env |
| Billing **webhooks** (`subscription.*`, `paymentAttempt.*`) | 🟡 | Add Express route + `CLERK_WEBHOOK_SIGNING_SECRET` if you need server-side plan DB |
| Hard **feature gates** (`has({ feature })` / plan) on modules | 🟡 | Soft mirror only today; gate Pro/Team modules when product-ready |
| Annual “+3 months free” promo | 🟢 Optional | Not natively on Clerk plans — use Stripe coupon / Clerk promo or drop claim |
| Live FX API (vs static rates) | 🟢 | Optional |
| CI E2E for full checkout | 🟢 | Needs Clerk test cards + billing enabled in CI instance |
| Bundle split / perf | 🟢 | Optional |

## How to test payment now (dev)

1. `npm run dev` with `VITE_CLERK_PUBLISHABLE_KEY` set.
2. Sign in → open `/pricing` → scroll to **Secure checkout**.
3. Select Personal / Pro / Team in Clerk’s PricingTable → complete checkout with **Clerk test card** (dev gateway).
4. Confirm Settings → Plan & billing shows the paid plan.
5. Confirm you can **no longer** get Pro just by clicking the old fake “Continue to signup” flow.

## Verdict

- **Soft launch (auth + product, trial):** ready.
- **Soft launch with real test checkout:** ready on **development** Clerk (dev payment gateway).
- **Hard launch taking real customer cards:** blocked until **production Stripe** is connected and prod Clerk keys are deployed.
