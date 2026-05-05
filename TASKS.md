# Frontend ↔ Backend Connection Tasks

## Phase 1 — API Layer
- [x] ~~Create base API client `frontend/src/api/client.js` (JWT storage, token refresh, base `request()`)~~
- [x] ~~Create auth module `frontend/src/api/auth.js` (register, login, onboarding, facebook, logout)~~
- [x] ~~Create dashboard module `frontend/src/api/dashboard.js` (fetch + data transformers for profile, products, conversations, activity)~~
- [x] ~~Configure Vite dev proxy — `/api/*` → `http://localhost:8000` in `vite.config.js`~~
- [x] ~~Handle Facebook OAuth callback in `App.jsx` (read `?access=&refresh=&page=` from URL, save tokens, redirect)~~

---

## Phase 2 — Auth Pages

### SignUpPage.jsx
- [ ] Wire email/password register form → `POST /api/auth/register/`
- [ ] Wire Facebook button → `GET /api/auth/facebook/` then redirect to returned `auth_url`
- [ ] Wire onboarding form → `POST /api/auth/onboarding/` then navigate to dashboard

### SignInPage.jsx
- [ ] Wire email/password login form → `POST /api/auth/login/`
- [ ] Wire Facebook button → `GET /api/auth/facebook/` then redirect to returned `auth_url`

---

## Phase 3 — Dashboard Page

### Data fetching
- [ ] Add `DashboardContext` to `DashboardPage.jsx` to share fetched data with all sub-components
- [ ] Fetch real profile data on load → replace `CLIENT` mock
- [ ] Fetch real products on load → replace `MOCK_PRODUCTS`
- [ ] Fetch real conversations on load → replace `MOCK_CONVOS`
- [ ] Fetch real activity on load → replace `MOCK_ACTIVITY`

### Product actions
- [ ] Wire "Add Product" modal → `POST /api/products/`
- [ ] Wire delete button → `DELETE /api/products/{id}/`
- [ ] Wire Pause/Activate toggle → `PATCH /api/products/{id}/status/`
- [ ] Wire "Generate with AI" button → `POST /api/products/{id}/generate-description/`

### Other
- [ ] Wire logout button in Sidebar → `POST /api/auth/logout/` then redirect to home

---

## Phase 4 — External Setup (manual actions required)

- [ ] Set `ANTHROPIC_API_KEY` in `backend/.env` (needed for AI product description generation)
- [ ] Create Make.com scenario that receives webhook payload → calls AI → replies via Messenger API
- [ ] Set the Make.com webhook URL on Group Alpha (via Django admin at `http://localhost:8000/admin/`)
- [ ] Register Facebook App webhook in Meta Developer Console → point to `https://yourdomain.com/api/webhooks/facebook/`
- [ ] Set verify token in Meta console to match `FB_WEBHOOK_VERIFY_TOKEN` in `.env`
