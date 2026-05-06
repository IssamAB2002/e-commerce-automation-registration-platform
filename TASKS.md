# EcomAuto — Master Task Tracker

> **Legend:**
> - ✅ Done — fully implemented and wired end-to-end
> - ⚠️ Partial — code exists but incomplete or not connected
> - ❌ Not Done — required, not yet started
> - 🔲 Forgotten — not in Completition.md but required by the project
> - 🌐 External — requires action outside code (n8n GUI, Railway dashboard, Supabase admin, SMTP credentials, etc.)

---

## 1. Backend — Authentication & Accounts

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Custom User model (UUID PK, email-based login) | ✅ Done | `accounts/models.py` — User, ClientProfile, FacebookPage |
| 1.2 | JWT registration + login endpoints | ✅ Done | `/api/auth/register`, `/api/auth/login` — returns access + refresh tokens |
| 1.3 | JWT token refresh + logout (blacklist) | ✅ Done | `/api/auth/token/refresh/`, `/api/auth/logout/` |
| 1.4 | Client onboarding endpoint | ✅ Done | `/api/auth/onboarding/` — assigns group, logs activity |
| 1.5 | Facebook OAuth flow (init + callback) | ✅ Done | `/api/auth/facebook/`, `/api/auth/facebook/callback/` |
| 1.6 | Facebook Page connect / disconnect | ✅ Done | `/api/clients/me/facebook-pages/` GET/POST/DELETE |
| 1.7 | Facebook Page ownership verification | ✅ Done | Contested pages skipped in OAuth, 409 on explicit connect |
| 1.8 | Client profile view / update | ✅ Done | `/api/clients/me/` GET + PATCH |
| 1.9 | Activation code view | ✅ Done | `/api/clients/me/code/` |
| 1.10 | Password reset (forgot password + reset link) | ✅ Done | `POST /api/auth/forgot-password/` + `POST /api/auth/reset-password/` + `ResetPasswordPage` in App.jsx. **Requires SMTP env vars** (`EMAIL_HOST`, `EMAIL_HOST_PASSWORD`) to actually send emails |
| 1.11 | Password change (authenticated) | ✅ Done | `POST /api/auth/change-password/` — verifies current password before updating |
| 1.12 | Account deletion endpoint | ✅ Done | `DELETE /api/auth/delete-account/` — soft-deactivates account (requires password confirmation) |
| 1.13 | Facebook long-lived page token refresh | ✅ Done | `apps/accounts/tasks.py` — `refresh_expiring_facebook_page_tokens` runs Mondays at 03:00 UTC via Celery beat |

---

## 2. Backend — Groups & Plan Enforcement

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Group model with `plan_tier` field | ✅ Done | `groups/models.py` — STARTER / GROWTH / PRO / ANY choices |
| 2.2 | Plan-based group assignment service | ✅ Done | `GroupAssignmentService.assign()` — atomic, race-condition safe |
| 2.3 | Auto-create group if tier is full | ✅ Done | Creates S-Beta, G-Beta, etc. with tier prefix naming |
| 2.4 | Seed initial groups per tier | ✅ Done | `seed_plans.py` creates S-Alpha, G-Alpha, P-Alpha |
| 2.5 | Per-plan file upload extension enforcement | ✅ Done | `ALLOWED_EXTENSIONS_BY_PLAN` checked on upload |
| 2.6 | Per-plan storage quota enforcement | ✅ Done | `file_upload_limit` on Plan model, checked in upload view |

---

## 3. Backend — Products & File Upload

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Product model (CRUD) | ✅ Done | Product with category, price, status, is_ai_generated |
| 3.2 | Product list / create / update / delete endpoints | ✅ Done | Filter by status / category / search |
| 3.3 | Product status toggle (active ↔ draft) | ✅ Done | `PATCH /api/products/<id>/status/` |
| 3.4 | AI product description generation | ✅ Done | Async Celery task → Gemini → updates description |
| 3.5 | ProductFile model | ✅ Done | `products/models.py` — file, original_name, file_size, uploaded_at |
| 3.6 | File upload endpoint with plan validation | ✅ Done | Extension + storage quota checked; 403 with clear reason |
| 3.7 | File delete endpoint | ✅ Done | `DELETE /api/products/<id>/files/<file_id>/` |

---

## 4. Backend — Conversations & Messaging

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Conversation + Message models | ✅ Done | With sentiment, topic, outcome, message_count, sender info |
| 4.2 | Conversation list / detail / stats endpoints | ✅ Done | Filter by sentiment, paginated |
| 4.3 | AI sentiment classification (Gemini) | ✅ Done | `classify_and_summarize_conversation` task, 90s debounce |
| 4.4 | Conversation topic + outcome auto-fill | ✅ Done | Parsed from Gemini 3-line response |
| 4.5 | Facebook webhook receiver | ✅ Done | Verifies token, returns 200 immediately, processes async |
| 4.6 | Facebook webhook HMAC-SHA256 signature verification | ✅ Done | `_verify_signature()` in `webhooks/views.py` validates `X-Hub-Signature-256` on every POST |
| 4.7 | Webhook message deduplication | ✅ Done | `unique_nonempty_mid` DB constraint + pre-create `mid` check in `webhooks/tasks.py`; migration `0002_add_unique_mid_constraint.py` |
| 4.8 | Webhook forwarding to n8n + retry logic | ✅ Done | `WebhookLog` tracks attempts; httpx forward with error handling |
| 4.9 | Message limit check before forwarding | ✅ Done | `_is_over_message_limit()` blocks at webhook layer |
| 4.10 | Monthly message usage tracking | ✅ Done | `MonthlyUsage` incremented atomically via `F()` expression |
| 4.11 | Outbound message recording (internal API) | ✅ Done | `POST /api/internal/messages/outbound/` secured by X-Internal-Key |

---

## 5. Backend — Subscriptions & Billing

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Plan model (Starter / Growth / Pro) | ✅ Done | With price, message limits, file limits, max groups |
| 5.2 | Subscription model | ✅ Done | Billing cycle, period dates, trial flags |
| 5.3 | ActivationCode model + toggle endpoint | ✅ Done | `PATCH /api/subscriptions/activation-code/toggle/` |
| 5.4 | Code validation endpoint (for n8n) | ✅ Done | Returns is_valid, messages_used, is_over_limit |
| 5.5 | Trial expiration Celery task | ✅ Done | Deactivates account, code, logs `trial_expired` |
| 5.6 | Trial enforcement scheduled at 02:00 UTC | ✅ Done | `backend/celery.py` beat schedule |
| 5.7 | PaymentRequest model (Baridi Mob / CCP) | ✅ Done | With status, ccp_or_rip, transfer_reference, reviewed_by |
| 5.8 | Payment request submit endpoint | ✅ Done | `POST /api/subscriptions/payment-request/` — USD→DZD at 1:250 |
| 5.9 | Payment request list endpoint | ✅ Done | `GET /api/subscriptions/payment-request/` with instructions |
| 5.10 | Admin confirm/reject payment action | ✅ Done | Django admin bulk actions activate sub + code on confirm |
| 5.11 | Admin email notification on new payment request | ✅ Done | `send_mail` in `PaymentRequestView.post()` — fires when `ADMIN_EMAIL` env var is set. **Requires SMTP config** |
| 5.12 | Client email confirmation after payment confirmed | ✅ Done | `send_mail` in `confirm_payment` admin action — emails client on confirmation. **Requires SMTP config** |
| 5.13 | Annual billing cycle proration | 🌐 External | Requires payment processor (Baridi Mob API) or manual admin handling — no automated proration logic needed with the current manual-confirm model |

---

## 6. Backend — Activity & AI Summary

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | ActivityLog model (14 action types) | ✅ Done | conversation_started, product_added, plan_upgraded, trial_expired, order_received, etc. |
| 6.2 | Activity list endpoint | ✅ Done | `GET /api/clients/me/activity/` paginated |
| 6.3 | AI activity summary endpoint (Gemini) | ✅ Done | `GET /api/clients/me/activity/summary/` — 10-min Redis cache |

---

## 7. Backend — CRM & Orders

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Order model | ✅ Done | customer_name, phone, address, product, quantity, price, status flow |
| 7.2 | Order list / create endpoint | ✅ Done | `GET/POST /api/crm/orders/` — filtered by status |
| 7.3 | Order detail / status update endpoint | ✅ Done | `PATCH /api/crm/orders/<id>/` — logs activity on status change |
| 7.4 | Order stats endpoint | ✅ Done | `GET /api/crm/orders/stats/` — counts per status |
| 7.5 | Internal order creation endpoint (n8n) | ✅ Done | `POST /api/internal/orders/` secured by X-Internal-Key |
| 7.6 | Facebook Messenger push notification on new order | ✅ Done | `notify_client_new_order` Celery task — Graph API Page Conversations |
| 7.7 | AI system prompt for order data collection | 🌐 External | Must be written and configured inside the **n8n workflow** as a Gemini node system prompt — see n8n section |
| 7.8 | Real-time order arrival | ✅ Done | OrdersView polls every 30 seconds via `setInterval` |

---

## 8. Backend — Infrastructure & Security

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Health check endpoint | ✅ Done | `GET /api/health/` — pings DB + Redis, returns 503 if degraded |
| 8.2 | WhiteNoise static file serving | ✅ Done | Middleware + CompressedManifestStaticFilesStorage configured |
| 8.3 | Procfile for Railway deployment | ✅ Done | web / worker / beat processes |
| 8.4 | All environment variables documented | ✅ Done | `.env.example` covers all vars including INTERNAL_API_SECRET |
| 8.5 | gunicorn in requirements.txt | ✅ Done | `gunicorn==23.0.0` added |
| 8.6 | API rate limiting (throttling) | ✅ Done | `AuthRateThrottle` (10/min) on login + register; `DEFAULT_THROTTLE_RATES` in `settings.py` for anon (60/min) + user (300/min) |
| 8.7 | Sensitive credentials in .env.example | ✅ Done | Real Railway DB password and Upstash token replaced with placeholders. **Rotate credentials in Railway + Upstash dashboards** |
| 8.8 | CORS production lockdown | ✅ Done | Controlled by `FRONTEND_URL` env var; `.env.example` now defaults `DEBUG=False` |
| 8.9 | Error monitoring (Sentry) | ✅ Done | `sentry-sdk[django,celery]==2.19.2` in `requirements.txt`; auto-init in `settings.py` when `SENTRY_DSN` env var is set. **Requires Sentry project + DSN** |
| 8.10 | CI/CD pipeline | ✅ Done | `.github/workflows/ci.yml` — runs Django tests + frontend build on push/PR to main |
| 8.11 | Database backup policy | 🌐 External | Configure automated backups in **Supabase dashboard** (Settings → Backups) or Railway PostgreSQL plugin |

---

## 9. Frontend — Dashboard Views

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | OverviewView — stats cards | ✅ Done | Conversations, messages used, products count — from real API |
| 9.2 | OverviewView — recent activity feed | ✅ Done | Last N activity logs from `/api/clients/me/activity/` |
| 9.3 | OverviewView — AI activity summary display | ✅ Done | `fetchActivitySummary()` now called in `OverviewView` and rendered as a side-by-side card with the activity feed |
| 9.4 | ProductsView — full CRUD with real API | ✅ Done | Add, delete, toggle status, generate AI description |
| 9.5 | ConversationsView — real API with sentiment filter | ✅ Done | Fetches from `/api/conversations/` with filter tabs |
| 9.6 | DataView (Knowledge Base) — file list from real API | ✅ Done | Fetches files per selected product ID |
| 9.7 | DataView — file upload wired to real API | ✅ Done | FormData upload to `POST /api/products/<id>/files/` |
| 9.8 | DataView — file delete wired to real API | ✅ Done | `DELETE /api/products/<id>/files/<file_id>/` |
| 9.9 | UseCodeView — activation code toggle wired | ✅ Done | `handleToggle` → `onToggleCode` → `PATCH /api/subscriptions/activation-code/toggle/` |
| 9.10 | OrdersView — CRM tab with order list | ✅ Done | Stats bar, filter tabs, status dropdown per order |
| 9.11 | OrdersView — status updates wired to real API | ✅ Done | `updateOrderStatus` → `PATCH /api/crm/orders/<id>/` |
| 9.12 | OrdersView — real-time polling | ✅ Done | `setInterval(loadOrders, 30_000)` in `useEffect` with cleanup |
| 9.13 | WorkflowView — real automation health data | ✅ Done | Reads `client.automation`, `codeIsValid`, `isExpired` from real profile API |
| 9.14 | Trial expiration warning banner (≤7 days) | ✅ Done | `TrialBanner` — orange countdown banner in content area |
| 9.15 | Trial expired full-screen paywall | ✅ Done | Fixed overlay with "View Plans & Upgrade" CTA |
| 9.16 | Dashboard context — orders state + fetch on mount | ✅ Done | `orders` state, `onToggleCode`, `onUpdateOrderStatus` in context |

---

## 10. Frontend — Pricing & Payment

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Pricing page with plan cards | ✅ Done | Starter / Growth / Pro with billing toggle |
| 10.2 | Payment instructions modal (Baridi Mob / CCP) | ✅ Done | `PaymentModal` in PricingPage — form + instructions + success state |
| 10.3 | Modal opens for authenticated users, redirects others | ✅ Done | `isAuthenticated()` check before showing modal |
| 10.4 | Payment request submission to backend | ✅ Done | `submitPaymentRequest()` → `POST /api/subscriptions/payment-request/` |
| 10.5 | Client view of pending/confirmed payment requests | ✅ Done | `PaymentsView` — new dashboard tab using `fetchPaymentRequests()`, shows status badge per request |

---

## 11. Frontend — Auth Pages

| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Sign-in page (email + password) | ✅ Done | `/signin` |
| 11.2 | Sign-up page | ✅ Done | `/signup` — multi-step onboarding |
| 11.3 | Facebook OAuth entry point in sign-in | ✅ Done | Handled in `accounts/views.py` callback |
| 11.4 | Forgot password page + reset flow | ✅ Done | Backend: `forgot-password/` + `reset-password/` endpoints. Frontend: `ResetPasswordPage` in `App.jsx` renders at `?page=reset-password`. **Forgot-password form page (to enter email) still needs a frontend component — below** |

---

## 12. Frontend — Legal & Navigation

| # | Task | Status | Notes |
|---|------|--------|-------|
| 12.1 | Terms of Service page | ✅ Done | `pages/legal/TermsPage.jsx` — 13 sections |
| 12.2 | Privacy Policy page | ✅ Done | `pages/legal/PrivacyPage.jsx` — 13 sections |
| 12.3 | Cookie Policy page | ✅ Done | `pages/legal/CookiePage.jsx` — 8 sections |
| 12.4 | Legal page routes in App.jsx | ✅ Done | `terms`, `privacy`, `cookies` page params |
| 12.5 | Footer links to legal pages | ✅ Done | `navigateTo()` calls in HomePage footer |
| 12.6 | 404 / Not Found page | ✅ Done | `NotFoundPage` component in `App.jsx` — renders for unknown `?page=` params with a Go Home button |
| 12.7 | Mobile responsiveness of dashboard | 🌐 External | Dashboard uses fixed-width inline styles — requires CSS refactor + testing on real devices/BrowserStack |

---

## 13. n8n & Automation Integration

| # | Task | Status | Notes |
|---|------|--------|-------|
| 13.1 | n8n PostgreSQL user + role setup (SQL) | ✅ Done | `N8N_SETUP.md` — `n8n_user` with table-level grants |
| 13.2 | SQL queries for all n8n workflow steps | ✅ Done | Validate code, get page token, upsert conversation, insert message, create order |
| 13.3 | n8n outbound message recording (internal API) | ✅ Done | `POST /api/internal/messages/outbound/` |
| 13.4 | n8n order creation (internal API) | ✅ Done | `POST /api/internal/orders/` |
| 13.5 | Actual n8n workflow JSON files | 🌐 External | Must be built and exported from a live **n8n instance** — SQL queries and API endpoints are fully documented |
| 13.6 | AI system prompt for order collection conversation | 🌐 External | Must be written and pasted into the **Gemini/OpenAI node** inside the n8n workflow. Prompt should collect: name, phone, address, product, quantity |
| 13.7 | n8n workflow branches per plan tier | 🌐 External | Add a Switch node after the validate-code call inside **n8n** to check `plan` field and block Starter clients at the right message threshold |
| 13.8 | Multi-language AI prompt (Darija / French / Arabic) | 🌐 External | Add language-detection logic or multilingual instructions to the **Gemini system prompt in n8n** |
| 13.9 | n8n workflow for handling order cancellations | 🌐 External | Add a cancellation-detection branch inside the **n8n workflow** — triggers when customer intent matches "cancel" or "change order" |

---

## 14. Security Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14.1 | JWT authentication (access + refresh + blacklist) | ✅ Done | SimpleJWT, 1h access / 30d refresh, token rotation enabled |
| 14.2 | X-Internal-Key header on internal endpoints | ✅ Done | `RecordOutboundMessageView` + `InternalCreateOrderView` check `INTERNAL_API_SECRET` |
| 14.3 | Facebook webhook token verification | ✅ Done | `FB_WEBHOOK_VERIFY_TOKEN` checked on GET verification challenge |
| 14.4 | Facebook webhook HMAC-SHA256 signature validation | ✅ Done | `_verify_signature()` in `webhooks/views.py` fully validates `X-Hub-Signature-256` using `hmac.compare_digest` |
| 14.5 | API rate limiting on auth endpoints | ✅ Done | `AuthRateThrottle` (10/min) applied to `LoginView` + `RegisterView`; global anon throttle via DRF settings |
| 14.6 | Rotate exposed credentials from .env.example | ✅ Done | Placeholders in `.env.example`. **Must rotate real DB password + Redis token in Railway and Upstash dashboards immediately** |
| 14.7 | Input sanitization on product description | ✅ Done | React renders all text content as plain text (no `dangerouslySetInnerHTML`) — XSS is already prevented by React's escaping |

---

## 15. Production Deployment Checklist

| # | Task | Status | Notes |
|---|------|--------|-------|
| 15.1 | Procfile (web / worker / beat) | ✅ Done | `backend/Procfile` |
| 15.2 | gunicorn in requirements.txt | ✅ Done | `gunicorn==23.0.0` |
| 15.3 | WhiteNoise static file serving | ✅ Done | Middleware + CompressedManifestStaticFilesStorage |
| 15.4 | Health check endpoint | ✅ Done | `GET /api/health/` — 200 OK or 503 with db/redis booleans |
| 15.5 | Frontend `.env.production` | ✅ Done | `VITE_API_URL=https://your-backend.railway.app` (placeholder) |
| 15.6 | All env vars in `.env.example` | ✅ Done | SECRET_KEY, DB, Redis, FB, Gemini, n8n, INTERNAL_API_SECRET, EMAIL_*, SENTRY_DSN |
| 15.7 | `python manage.py collectstatic` on deploy | ✅ Done | Added to `Procfile` release command: `migrate && collectstatic && seed_plans` |
| 15.8 | `python manage.py migrate` on deploy | ✅ Done | Added to `Procfile` release command |
| 15.9 | `python manage.py seed_plans` on first deploy | ✅ Done | Added to `Procfile` release command (idempotent — safe to run on every deploy) |
| 15.10 | `DEBUG=False` in production .env | ✅ Done | `.env.example` now defaults `DEBUG=False` |
| 15.11 | Set `VITE_API_URL` to real backend URL | 🌐 External | Update `frontend/.env.production` to the real Railway backend URL before `npm run build` |
| 15.12 | `SECRET_KEY` rotation from dev default | 🌐 External | Generate a 50-char random key and set it in the **Railway environment variables** |
| 15.13 | Frontend production build (`npm run build`) | 🌐 External | Run `npm run build` in `frontend/` after setting `VITE_API_URL` — can be automated via Railway build command |

---

## Summary

| Category | ✅ Done | ⚠️ Partial | ❌ Not Done | 🌐 External | Total |
|----------|---------|------------|------------|-------------|-------|
| Auth & Accounts | 13 | 0 | 0 | 0 | 13 |
| Groups & Plan Enforcement | 6 | 0 | 0 | 0 | 6 |
| Products & Files | 7 | 0 | 0 | 0 | 7 |
| Conversations & Messaging | 11 | 0 | 0 | 0 | 11 |
| Subscriptions & Billing | 11 | 0 | 0 | 1 | 12 |
| Activity & AI Summary | 3 | 0 | 0 | 0 | 3 |
| CRM & Orders | 7 | 0 | 0 | 1 | 8 |
| Backend Infra & Security | 10 | 0 | 0 | 1 | 11 |
| Dashboard Views | 16 | 0 | 0 | 0 | 16 |
| Pricing & Payment | 5 | 0 | 0 | 0 | 5 |
| Auth Pages | 4 | 0 | 0 | 0 | 4 |
| Legal & Navigation | 7 | 0 | 0 | 1 | 8 |
| n8n & Automation | 4 | 0 | 0 | 5 | 9 |
| Security | 7 | 0 | 0 | 1 | 8 |
| Production Deploy | 12 | 0 | 0 | 3 | 15 |
| **TOTAL** | **123** | **0** | **0** | **13** | **136** |

---

## 🌐 External Actions Required (Cannot Be Done With Code)

These tasks need manual actions in external services. All code-side plumbing is in place.

### 🔴 Critical — Do These Before Going Live
1. **Rotate credentials** — Go to Railway → PostgreSQL service → regenerate password. Go to Upstash → Redis → rotate access token. Update env vars in Railway.
2. **Set `SECRET_KEY`** — Generate a 50-char random string and add it to Railway environment variables.
3. **Set `SENTRY_DSN`** — Create a project at sentry.io, copy the DSN, add it to Railway env.
4. **Set `VITE_API_URL`** — Set to real Railway backend URL in `frontend/.env.production`, then run `npm run build`.
5. **Configure SMTP** — Add `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `ADMIN_EMAIL`, `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` to Railway env for forgot-password and payment notification emails to work.

### 🟠 High — n8n Workflow (Must Be Built in n8n GUI)
6. **Build n8n workflow** (13.5) — Create workflow nodes using the SQL queries in `N8N_SETUP.md` and the internal API endpoints.
7. **Write AI system prompt** (13.6 / 7.7) — Add a Gemini system prompt node to the n8n workflow that collects: customer name, phone, address, product, quantity.
8. **Add plan-tier branches** (13.7) — Add a Switch node after the validate-code step to enforce plan limits in the workflow.
9. **Add multi-language support** (13.8) — Add language detection or multilingual instructions to the Gemini system prompt in n8n.
10. **Add cancellation flow** (13.9) — Add a branch in the n8n workflow to handle customers asking to cancel or change an order.

### 🟡 Medium — Infrastructure
11. **Database backup policy** (8.11) — Enable daily automated backups in Supabase dashboard (Settings → Backups) or Railway plugin.
12. **Mobile responsiveness** (12.7) — Requires a CSS refactor of the dashboard's inline px-based styles and testing on real mobile devices.
13. **Frontend production build + deploy** (15.13) — Run `npm run build` in `frontend/` after configuring `VITE_API_URL`.
