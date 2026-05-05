# EcomAuto — Django Backend Plan

## 1. Overview

This backend fully serves the existing React frontend (all mock data replaced by real API calls) and implements the core SaaS automation logic: clients register, get auto-assigned to a group (1 group = 1 Make.com workflow = 1 Meta App = 15 clients max), and their Facebook Pages receive AI-powered auto-replies via Make.com.

**Runtime**: Django 6.0 + Django REST Framework  
**Database**: PostgreSQL  
**Auth**: JWT (SimpleJWT) + Facebook OAuth  
**Async tasks**: Celery + Redis  
**AI**: Claude API (Anthropic) for product description generation  
**Webhook source**: Meta Graph API  
**Automation target**: Make.com (webhook per group)

---

## 2. Tech Stack — Full Dependency List

```
# backend/requirements.txt

# Core
Django==6.0.4
djangorestframework==3.16.x
psycopg2-binary==2.9.x          # PostgreSQL driver
django-environ==0.11.x           # .env loading

# Auth
djangorestframework-simplejwt==5.4.x
social-auth-app-django==5.4.x    # Facebook OAuth (python-social-auth)
django-cors-headers==4.6.x

# Async
celery==5.4.x
redis==5.0.x
django-celery-results==2.5.x     # Store task results in DB
django-celery-beat==2.7.x        # Periodic tasks (optional for stats refresh)

# File uploads
django-storages==1.14.x          # S3 or local storage abstraction
Pillow==11.x                     # Image processing

# HTTP client (forwarding to Make.com)
httpx==0.27.x                    # Async-capable HTTP client

# AI
anthropic==0.40.x                # Claude API for product descriptions

# Utilities
django-filter==24.x              # Filtering on list endpoints
drf-spectacular==0.28.x          # OpenAPI/Swagger docs
django-redis==5.4.x              # Cache backend
whitenoise==6.8.x                # Static files in prod

# Dev
django-debug-toolbar==4.4.x
```

---

## 3. Django Project Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env                          # never commit
├── .env.example
├── backend/                      # Django project package
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py               # Shared settings
│   │   ├── development.py        # DEBUG=True, SQLite fallback allowed
│   │   └── production.py         # DEBUG=False, S3, strict CORS
│   ├── urls.py                   # Root URL config
│   ├── celery.py                 # Celery app init
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/                 # Users, auth, Facebook OAuth, onboarding
│   ├── subscriptions/            # Plans, client subscriptions, activation codes
│   ├── groups/                   # Group management, Make.com integration
│   ├── products/                 # Product CRUD + AI description
│   ├── conversations/            # Conversation & message storage
│   ├── activity/                 # Activity log per client
│   ├── webhooks/                 # Facebook webhook verification & routing
│   └── analytics/                # Usage stats aggregation
└── shared/
    ├── permissions.py            # DRF permission classes
    ├── pagination.py             # Custom pagination
    ├── exceptions.py             # Global exception handler
    └── tasks.py                  # Shared Celery helpers
```

---

## 4. PostgreSQL Configuration

### 4.1 `.env` Variables

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
DB_NAME=ecomauto
DB_USER=ecomauto_user
DB_PASSWORD=your_strong_password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Facebook
FB_APP_ID=your_meta_app_id
FB_APP_SECRET=your_meta_app_secret
FB_WEBHOOK_VERIFY_TOKEN=your_random_verify_token
FB_REDIRECT_URI=http://localhost:8000/api/auth/facebook/callback/

# Make.com (default fallback; per-group URLs stored in DB)
MAKE_DEFAULT_WEBHOOK=https://hook.make.com/xxxxx

# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-xxxxxxx

# Frontend URL (for CORS and OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

### 4.2 `settings/base.py` — Database Block

```python
import environ
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 60,      # persistent connections
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL'),
        'OPTIONS': {'CLIENT_CLASS': 'django_redis.client.DefaultClient'},
    }
}

# Celery
CELERY_BROKER_URL = env('REDIS_URL')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_TASK_SERIALIZER = 'json'
```

### 4.3 PostgreSQL Setup Commands

```sql
-- Run once as superuser
CREATE DATABASE ecomauto;
CREATE USER ecomauto_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE ecomauto TO ecomauto_user;
ALTER DATABASE ecomauto OWNER TO ecomauto_user;

-- Extensions
\c ecomauto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fast text search on products/conversations
```

---

## 5. Database Models (Full Schema)

### 5.1 `apps/accounts/models.py`

```python
# --- CustomUser ---
class User(AbstractBaseUser, PermissionsMixin):
    id            = UUIDField(primary_key=True, default=uuid4, editable=False)
    email         = EmailField(unique=True)
    first_name    = CharField(max_length=100)
    last_name     = CharField(max_length=100)
    is_active     = BooleanField(default=True)
    is_staff      = BooleanField(default=False)
    date_joined   = DateTimeField(auto_now_add=True)
    # Facebook OAuth fields
    facebook_id   = CharField(max_length=100, null=True, blank=True, unique=True)
    facebook_token= TextField(null=True, blank=True)   # user-level token
    avatar_url    = URLField(null=True, blank=True)
    # Flags
    marketing_opt_in = BooleanField(default=False)

    USERNAME_FIELD = 'email'

# --- ClientProfile (extends User 1:1) ---
class ClientProfile(Model):
    user           = OneToOneField(User, on_delete=CASCADE, related_name='profile')
    # Business info (collected during onboarding step 2)
    company_name   = CharField(max_length=200)
    business_type  = CharField(max_length=100)         # e.g. "E-commerce"
    business_niche = CharField(max_length=100)         # Fashion, Beauty, Electronics…
    monthly_ad_spend = CharField(max_length=50)        # "$500–$2k" etc (range label)
    primary_goal   = CharField(max_length=100)         # Leads, Sales, Support…
    team_size      = CharField(max_length=50)          # Solo, 2-5, 6-20…
    phone          = CharField(max_length=30)
    website_url    = URLField(null=True, blank=True)
    # Subscription link
    plan           = ForeignKey('subscriptions.Plan', on_delete=PROTECT, null=True)
    group          = ForeignKey('groups.Group', on_delete=SET_NULL, null=True, blank=True)
    # State flags
    is_onboarded   = BooleanField(default=False)
    is_active      = BooleanField(default=True)
    created_at     = DateTimeField(auto_now_add=True)
    updated_at     = DateTimeField(auto_now=True)

# --- FacebookPage ---
class FacebookPage(Model):
    client         = ForeignKey(ClientProfile, on_delete=CASCADE, related_name='pages')
    page_id        = CharField(max_length=100, unique=True)
    page_name      = CharField(max_length=200)
    page_token     = TextField()                       # long-lived page token
    is_connected   = BooleanField(default=True)
    connected_at   = DateTimeField(auto_now_add=True)
    last_activity  = DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [Index(fields=['page_id'])]
```

### 5.2 `apps/subscriptions/models.py`

```python
# --- Plan ---
class Plan(Model):
    STARTER = 'starter'
    GROWTH  = 'growth'
    PRO     = 'pro'
    PLAN_CHOICES = [(STARTER,'Starter'),(GROWTH,'Growth'),(PRO,'Pro')]

    id             = UUIDField(primary_key=True, default=uuid4, editable=False)
    name           = CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    tagline        = CharField(max_length=200)
    monthly_price  = DecimalField(max_digits=8, decimal_places=2)  # USD
    annual_price   = DecimalField(max_digits=8, decimal_places=2)  # USD/mo equiv
    max_groups     = IntegerField()      # Starter=1, Growth=3, Pro=None(null)
    max_workflows  = IntegerField()      # same as max_groups
    max_meta_apps  = IntegerField()      # same as max_groups
    messages_limit = IntegerField()      # per month: 2000/15000/100000
    file_uploads_limit = IntegerField()  # KB, Starter=5MB, Growth=50MB, Pro=500MB
    is_active      = BooleanField(default=True)

# --- Subscription ---
class Subscription(Model):
    MONTHLY = 'monthly'
    ANNUAL  = 'annual'
    BILLING_CHOICES = [(MONTHLY,'Monthly'),(ANNUAL,'Annual')]

    id             = UUIDField(primary_key=True, default=uuid4, editable=False)
    client         = OneToOneField('accounts.ClientProfile', on_delete=CASCADE)
    plan           = ForeignKey(Plan, on_delete=PROTECT)
    billing_cycle  = CharField(max_length=10, choices=BILLING_CHOICES)
    started_at     = DateTimeField(auto_now_add=True)
    current_period_start = DateField()
    current_period_end   = DateField()
    is_active      = BooleanField(default=True)
    amount_paid    = DecimalField(max_digits=8, decimal_places=2)
    # Trial
    trial_ends_at  = DateField(null=True, blank=True)
    is_trial       = BooleanField(default=False)

# --- ActivationCode ---
class ActivationCode(Model):
    id             = UUIDField(primary_key=True, default=uuid4, editable=False)
    client         = OneToOneField('accounts.ClientProfile', on_delete=CASCADE)
    code           = CharField(max_length=20, unique=True)  # ECA-XXXX-XXXX-XXXX
    is_valid       = BooleanField(default=True)
    created_at     = DateTimeField(auto_now_add=True)
    expires_at     = DateTimeField(null=True, blank=True)

    # Code format: ECA-{4 alphanum}-{4 alphanum}-{4 alphanum}
    # Generated on: subscription activation
    # Purpose: client pastes this into their messaging flow on Make.com to verify identity
```

### 5.3 `apps/groups/models.py`

```python
# --- Group ---
class Group(Model):
    id             = UUIDField(primary_key=True, default=uuid4, editable=False)
    name           = CharField(max_length=100)     # "Alpha", "Beta", "Gamma"…
    capacity       = IntegerField(default=15)       # max clients per group
    make_webhook_url = URLField()                   # the Make.com webhook for this group
    meta_app_id    = CharField(max_length=100)      # associated Meta App ID
    is_active      = BooleanField(default=True)
    created_at     = DateTimeField(auto_now_add=True)

    @property
    def current_count(self):
        return self.clients.filter(is_active=True).count()

    @property
    def is_full(self):
        return self.current_count >= self.capacity

    class Meta:
        ordering = ['name']

# Group auto-assignment logic (service layer, not model):
# 1. Find the first non-full active group
# 2. If all full, create a new Group automatically and alert admin
# 3. Assign client.group = that group
```

### 5.4 `apps/products/models.py`

```python
# --- Product ---
class Product(Model):
    CATEGORIES = [
        ('fashion','Fashion'), ('beauty','Beauty'), ('electronics','Electronics'),
        ('kids','Kids'), ('home','Home & Living'), ('sports','Sports'),
        ('food','Food & Beverages'), ('other','Other'),
    ]
    STATUS = [('active','Active'), ('draft','Draft')]

    id             = UUIDField(primary_key=True, default=uuid4, editable=False)
    client         = ForeignKey('accounts.ClientProfile', on_delete=CASCADE, related_name='products')
    name           = CharField(max_length=300)
    price          = DecimalField(max_digits=10, decimal_places=2)
    category       = CharField(max_length=50, choices=CATEGORIES)
    description    = TextField(blank=True)
    image          = ImageField(upload_to='products/%Y/%m/', null=True, blank=True)
    status         = CharField(max_length=10, choices=STATUS, default='draft')
    is_ai_generated= BooleanField(default=False)   # True if description was AI-generated
    created_at     = DateTimeField(auto_now_add=True)
    updated_at     = DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            Index(fields=['client', 'status']),
            Index(fields=['client', 'category']),
        ]
```

### 5.5 `apps/conversations/models.py`

```python
# --- Conversation ---
class Conversation(Model):
    SENTIMENT = [('positive','Positive'),('neutral','Neutral'),('negative','Negative')]

    id             = UUIDField(primary_key=True, default=uuid4, editable=False)
    client         = ForeignKey('accounts.ClientProfile', on_delete=CASCADE, related_name='conversations')
    facebook_page  = ForeignKey('accounts.FacebookPage', on_delete=CASCADE)
    sender_fb_id   = CharField(max_length=100)       # FB PSID of the customer
    sender_name    = CharField(max_length=200, blank=True)
    topic          = CharField(max_length=300, blank=True)  # inferred by AI or Make.com
    outcome        = CharField(max_length=300, blank=True)  # e.g. "Order placed"
    sentiment      = CharField(max_length=10, choices=SENTIMENT, default='neutral')
    message_count  = IntegerField(default=0)
    last_message_at= DateTimeField(null=True, blank=True)
    created_at     = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_message_at']
        indexes  = [Index(fields=['client', 'sentiment']),
                    Index(fields=['client', 'last_message_at'])]

# --- Message ---
class Message(Model):
    DIRECTION = [('inbound','Inbound'),('outbound','Outbound')]

    id             = UUIDField(primary_key=True, default=uuid4, editable=False)
    conversation   = ForeignKey(Conversation, on_delete=CASCADE, related_name='messages')
    direction      = CharField(max_length=10, choices=DIRECTION)
    text           = TextField()
    mid            = CharField(max_length=200, blank=True)  # Meta message ID
    timestamp      = DateTimeField()
    delivered_at   = DateTimeField(null=True, blank=True)
    created_at     = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
```

### 5.6 `apps/activity/models.py`

```python
# --- ActivityLog ---
class ActivityLog(Model):
    ACTION_TYPES = [
        ('conversation_started', 'Conversation Started'),
        ('product_added',        'Product Added'),
        ('product_updated',      'Product Updated'),
        ('product_deleted',      'Product Deleted'),
        ('code_verified',        'Activation Code Verified'),
        ('page_connected',       'Facebook Page Connected'),
        ('page_disconnected',    'Facebook Page Disconnected'),
        ('plan_upgraded',        'Plan Upgraded'),
        ('ai_description',       'AI Description Generated'),
        ('message_sent',         'Message Sent'),
    ]

    id          = UUIDField(primary_key=True, default=uuid4, editable=False)
    client      = ForeignKey('accounts.ClientProfile', on_delete=CASCADE, related_name='activity')
    action_type = CharField(max_length=50, choices=ACTION_TYPES)
    description = CharField(max_length=500)
    metadata    = JSONField(default=dict)    # extra details (product id, sender id, etc.)
    created_at  = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [Index(fields=['client', 'created_at'])]
```

### 5.7 `apps/webhooks/models.py`

```python
# --- WebhookLog ---
class WebhookLog(Model):
    STATUS = [('received','Received'),('forwarded','Forwarded'),
              ('failed','Failed'),('retrying','Retrying')]

    id           = UUIDField(primary_key=True, default=uuid4, editable=False)
    page_id      = CharField(max_length=100)
    sender_id    = CharField(max_length=100, blank=True)
    payload      = JSONField()                      # full Meta webhook payload
    forwarded_to = URLField(blank=True)             # Make.com URL used
    status       = CharField(max_length=20, choices=STATUS, default='received')
    attempts     = IntegerField(default=0)
    error_detail = TextField(blank=True)
    received_at  = DateTimeField(auto_now_add=True)
    forwarded_at = DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [Index(fields=['page_id', 'received_at']),
                   Index(fields=['status'])]
```

### 5.8 `apps/analytics/models.py`

```python
# --- DailyUsageSnapshot ---
# Stores pre-aggregated daily stats so dashboard loads fast
class DailyUsageSnapshot(Model):
    id              = UUIDField(primary_key=True, default=uuid4, editable=False)
    client          = ForeignKey('accounts.ClientProfile', on_delete=CASCADE)
    date            = DateField()
    messages_sent   = IntegerField(default=0)
    conversations   = IntegerField(default=0)
    products_listed = IntegerField(default=0)
    avg_reply_time_seconds = FloatField(null=True)

    class Meta:
        unique_together = [['client', 'date']]
        ordering = ['-date']
```

---

## 6. API Endpoints (Full Map)

All endpoints are prefixed with `/api/`.

### 6.1 Authentication — `apps/accounts/`

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/register/` | Public | Email/password registration (Step 1 of SignUpPage) |
| POST | `/api/auth/onboarding/` | JWT | Complete onboarding (Step 2: niche, ad spend, goal, team size, phone, website) |
| POST | `/api/auth/login/` | Public | Email/password login → returns access + refresh JWT |
| POST | `/api/auth/token/refresh/` | Public | Refresh JWT |
| POST | `/api/auth/logout/` | JWT | Blacklist refresh token |
| GET | `/api/auth/facebook/` | Public | Redirect to Facebook OAuth consent screen |
| GET | `/api/auth/facebook/callback/` | Public | Handle OAuth callback → store token → return JWT |
| GET | `/api/auth/facebook/pages/` | JWT | List all pages found in user's Facebook account (for page selection) |
| POST | `/api/auth/facebook/pages/connect/` | JWT | User selects which page to connect |
| POST | `/api/auth/password/forgot/` | Public | Trigger password reset email |
| POST | `/api/auth/password/reset/` | Public | Complete password reset |

**Registration Request Body** (POST `/api/auth/register/`):
```json
{
  "first_name": "Issam",
  "last_name": "AB",
  "email": "user@example.com",
  "company_name": "My Store",
  "business_type": "E-commerce",
  "password": "SecurePass123",
  "marketing_opt_in": true
}
```

**Onboarding Request Body** (POST `/api/auth/onboarding/`):
```json
{
  "business_niche": "Fashion",
  "monthly_ad_spend": "$500–$2k",
  "primary_goal": "Sales",
  "team_size": "2–5",
  "phone": "+213 555 000 000",
  "website_url": "https://mystore.dz"
}
```
On success: auto-assigns client to a group, creates activation code, creates subscription (trial).

**Registration → Onboarding → Group Assignment flow**:
1. User registers → `User` + `ClientProfile` (is_onboarded=False) created
2. JWT returned, frontend navigates to onboarding step
3. User completes onboarding → `ClientProfile` filled + `is_onboarded=True`
4. Backend calls `GroupAssignmentService.assign(client)` → finds first non-full group
5. Backend generates activation code → `ActivationCode` created
6. Backend creates `Subscription` (Starter trial by default)
7. Return updated profile with group & code info

### 6.2 Client Profile — `apps/accounts/`

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/clients/me/` | JWT | Get own full profile (plan, group, subscription, usage) |
| PATCH | `/api/clients/me/` | JWT | Update profile fields (company, niche, phone, etc.) |
| GET | `/api/clients/me/code/` | JWT | Get activation code details |
| GET | `/api/clients/me/usage/` | JWT | Get current period usage stats |
| GET | `/api/clients/me/group/` | JWT | Get group details (name, capacity, make_url) |
| GET | `/api/clients/me/activity/` | JWT | Paginated activity log |
| GET | `/api/clients/me/facebook-pages/` | JWT | List connected Facebook pages |
| DELETE | `/api/clients/me/facebook-pages/{page_id}/` | JWT | Disconnect a page |

**`/api/clients/me/` Response Shape** (matches DashboardPage CLIENT object):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "Issam",
  "last_name": "AB",
  "avatar_url": null,
  "company_name": "My Store",
  "plan": { "name": "growth", "display": "Growth" },
  "group": { "name": "Alpha", "capacity": 15, "current_count": 9 },
  "use_code": "ECA-G7X2-9KMN-4QPR",
  "subscription": {
    "billing_cycle": "monthly",
    "current_period_end": "2026-06-01",
    "is_trial": false
  },
  "usage": {
    "messages_sent": 8420,
    "messages_limit": 15000,
    "conversations": 127,
    "products_listed": 2,
    "avg_reply_time_seconds": 1.4
  },
  "automation_status": {
    "ai_agent": "online",
    "facebook_page_connected": true,
    "message_handler": "running",
    "group_capacity_used": 9,
    "group_capacity_max": 15
  }
}
```

### 6.3 Products — `apps/products/`

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/products/` | JWT | List own products (filter: status, category, search) |
| POST | `/api/products/` | JWT | Create product (with image upload) |
| GET | `/api/products/{id}/` | JWT | Get single product |
| PATCH | `/api/products/{id}/` | JWT | Update product fields |
| DELETE | `/api/products/{id}/` | JWT | Delete product |
| PATCH | `/api/products/{id}/status/` | JWT | Toggle active/draft |
| POST | `/api/products/{id}/generate-description/` | JWT | Trigger Claude AI description generation |

**Product Request Body** (POST `/api/products/`):
```json
{
  "name": "Summer Kaftan Collection",
  "price": 1250.00,
  "category": "fashion",
  "description": "Optional manual description",
  "status": "active"
}
```
Image uploaded as multipart form field `image`.

**AI Description Generation** (POST `.../generate-description/`):
- Calls Anthropic Claude API (claude-sonnet-4-6)
- Prompt: product name + category → returns 2–3 sentence marketing description
- Sets `is_ai_generated=True`
- Task handled by Celery (async) so endpoint returns 202 + task_id
- Frontend polls `/api/products/{id}/` to get updated description

**Query params for list**:
- `?status=active|draft`
- `?category=fashion`
- `?search=kaftan`
- `?page=1&page_size=20`

### 6.4 Conversations — `apps/conversations/`

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/conversations/` | JWT | List own conversations (filter: sentiment, date range) |
| GET | `/api/conversations/{id}/` | JWT | Get conversation + all messages |
| GET | `/api/conversations/stats/` | JWT | Sentiment breakdown, avg reply time |

**Query params**: `?sentiment=positive|neutral|negative`, `?page=1`

**Conversation Detail Response**:
```json
{
  "id": "uuid",
  "sender_name": "Ahmed B.",
  "topic": "Product inquiry about kaftan",
  "outcome": "Link sent",
  "sentiment": "positive",
  "message_count": 4,
  "last_message_at": "2026-05-04T10:22:00Z",
  "messages": [
    { "direction": "inbound", "text": "Hello, do you have this in size L?", "timestamp": "..." },
    { "direction": "outbound", "text": "Yes! We have it in S, M, L, XL.", "timestamp": "..." }
  ]
}
```

### 6.5 Facebook Webhook — `apps/webhooks/`

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/webhooks/facebook/` | None | Meta webhook verification (hub.challenge) |
| POST | `/api/webhooks/facebook/` | None (HMAC) | Incoming messages from Meta |

**Webhook POST Flow**:
1. Validate `X-Hub-Signature-256` header against `FB_APP_SECRET`
2. Immediately return `HTTP 200` to Meta
3. Dispatch Celery task `process_facebook_message.delay(payload)`
4. Task: look up `FacebookPage` by `page_id` → find `ClientProfile` → find `Group` → forward to `group.make_webhook_url`
5. Forward payload: `{ sender_id, recipient_id (page_id), message_text, timestamp, page_token, client_id }`
6. Log to `WebhookLog`, increment usage counter

**Payload forwarded to Make.com**:
```json
{
  "sender_id": "FB_PSID",
  "page_id": "FB_PAGE_ID",
  "page_token": "PAGE_ACCESS_TOKEN",
  "message_text": "Hello!",
  "timestamp": 1234567890,
  "client_id": "uuid",
  "group_name": "Alpha"
}
```

### 6.6 Subscriptions — `apps/subscriptions/`

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/subscriptions/plans/` | Public | List all plans (used by PricingPage) |
| GET | `/api/subscriptions/me/` | JWT | Current client subscription |
| POST | `/api/subscriptions/upgrade/` | JWT | Request plan upgrade |
| POST | `/api/subscriptions/validate-code/` | Public | Validate an activation code (used by Make.com) |
| POST | `/api/subscriptions/generate-code/` | Admin | Re-generate activation code for a client |

**Validate Code** (POST `/api/subscriptions/validate-code/`):
```json
{ "code": "ECA-G7X2-9KMN-4QPR" }
```
Response: `{ "valid": true, "client_id": "uuid", "plan": "growth" }` or `{ "valid": false, "reason": "expired" }`

### 6.7 Groups — `apps/groups/` (Admin-side + client read)

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/groups/` | Admin | List all groups with client counts |
| POST | `/api/groups/` | Admin | Create a new group (with make_webhook_url) |
| PATCH | `/api/groups/{id}/` | Admin | Update group (webhook URL, meta_app_id) |
| GET | `/api/groups/{id}/clients/` | Admin | List clients in a group |

### 6.8 Analytics — `apps/analytics/`

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/analytics/me/` | JWT | Dashboard stats for the client |
| GET | `/api/analytics/me/daily/` | JWT | Daily usage breakdown (for charts) |

**`/api/analytics/me/` Response** (feeds the 4 stat cards in Dashboard Overview):
```json
{
  "ai_conversations": 127,
  "messages_sent": 8420,
  "messages_limit": 15000,
  "products_listed": 2,
  "avg_reply_time_seconds": 1.4,
  "period_start": "2026-05-01",
  "period_end": "2026-05-31"
}
```

---

## 7. Authentication System Detail

### JWT Configuration (SimpleJWT)
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### Facebook OAuth Flow
Using `social-auth-app-django` (PSA) with a custom pipeline:

```python
AUTHENTICATION_BACKENDS = [
    'social_core.backends.facebook.FacebookOAuth2',
    'django.contrib.auth.backends.ModelBackend',
]

SOCIAL_AUTH_FACEBOOK_KEY    = env('FB_APP_ID')
SOCIAL_AUTH_FACEBOOK_SECRET = env('FB_APP_SECRET')
SOCIAL_AUTH_FACEBOOK_SCOPE  = [
    'pages_show_list',
    'pages_messaging',
    'pages_read_engagement',
    'pages_manage_metadata',
    'public_profile',
    'email',
]
SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {'fields': 'id,name,email,picture'}

# Custom pipeline: after FB auth → fetch pages → let user pick
SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.user.create_user',
    'social_core.pipeline.social_auth.associate_user',
    'apps.accounts.pipeline.save_facebook_token',   # custom: store user token
    'apps.accounts.pipeline.fetch_facebook_pages',  # custom: store available pages
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
)
```

After OAuth: backend returns JWT tokens to frontend (redirected as query params or via postMessage if popup).

### Permission Classes
```python
# shared/permissions.py
class IsClientOwner(BasePermission):
    """Objects belong to request.user's ClientProfile only."""
    def has_object_permission(self, request, view, obj):
        return obj.client == request.user.profile

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff
```

---

## 8. Group Assignment Service

```python
# apps/groups/services.py

GROUP_NAMES = [
    "Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Eta","Theta",
    "Iota","Kappa","Lambda","Mu","Nu","Xi","Omicron","Pi"
    # ... extends automatically
]

class GroupAssignmentService:
    @staticmethod
    @transaction.atomic
    def assign(client: ClientProfile) -> Group:
        # Find first non-full group (select_for_update to prevent race conditions)
        group = Group.objects.select_for_update().filter(
            is_active=True,
            clients__count__lt=F('capacity')
        ).annotate(count=Count('clients')).first()

        if group is None:
            # All groups full — create new one
            group = GroupAssignmentService._create_next_group()

        client.group = group
        client.save(update_fields=['group'])
        ActivityLog.objects.create(
            client=client,
            action_type='group_assigned',
            description=f"Assigned to group {group.name}",
        )
        return group

    @staticmethod
    def _create_next_group() -> Group:
        count = Group.objects.count()
        name = GROUP_NAMES[count] if count < len(GROUP_NAMES) else f"Group-{count+1}"
        group = Group.objects.create(
            name=name,
            make_webhook_url=settings.MAKE_DEFAULT_WEBHOOK,  # admin updates later
            meta_app_id='',  # admin fills in
        )
        # TODO: notify admin via email/Slack that a new group needs configuration
        return group
```

---

## 9. Activation Code Generation

```python
# apps/subscriptions/services.py
import secrets
import string

def generate_activation_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    segments = [''.join(secrets.choice(alphabet) for _ in range(4)) for _ in range(3)]
    return f"ECA-{'-'.join(segments)}"    # e.g. ECA-G7X2-9KMN-4QPR

def create_activation_code(client: ClientProfile) -> ActivationCode:
    code = generate_activation_code()
    while ActivationCode.objects.filter(code=code).exists():
        code = generate_activation_code()   # guarantee uniqueness
    return ActivationCode.objects.create(
        client=client,
        code=code,
        expires_at=None,   # no expiry by default; set if plan expires
    )
```

---

## 10. Celery Tasks

### `apps/products/tasks.py`
```python
@shared_task(bind=True, max_retries=3)
def generate_product_description(self, product_id: str):
    """Call Claude API to generate marketing description for a product."""
    product = Product.objects.get(id=product_id)
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": (
                f"Write a compelling 2-3 sentence product description for an e-commerce store. "
                f"Product: {product.name}. Category: {product.get_category_display()}. "
                f"Make it persuasive, friendly, and concise. No markdown."
            )
        }]
    )
    product.description = message.content[0].text
    product.is_ai_generated = True
    product.save(update_fields=['description', 'is_ai_generated'])
    ActivityLog.objects.create(
        client=product.client,
        action_type='ai_description',
        description=f'AI description generated for "{product.name}"',
        metadata={'product_id': str(product_id)},
    )
```

### `apps/webhooks/tasks.py`
```python
@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_facebook_message(self, payload: dict):
    """Route a Facebook Messenger event to the correct Make.com webhook."""
    try:
        entry = payload['entry'][0]
        messaging = entry['messaging'][0]
        page_id   = entry['id']
        sender_id = messaging['sender']['id']
        message   = messaging.get('message', {})
        text      = message.get('text', '')
        timestamp = messaging['timestamp']

        page = FacebookPage.objects.select_related('client__group').get(page_id=page_id)
        client = page.client
        group  = client.group

        webhook_url = group.make_webhook_url if group else settings.MAKE_DEFAULT_WEBHOOK

        forward_payload = {
            'sender_id':    sender_id,
            'page_id':      page_id,
            'page_token':   page.page_token,
            'message_text': text,
            'timestamp':    timestamp,
            'client_id':    str(client.user.id),
            'group_name':   group.name if group else None,
        }

        response = httpx.post(webhook_url, json=forward_payload, timeout=10)
        response.raise_for_status()

        # Save conversation + message
        convo, _ = Conversation.objects.get_or_create(
            client=client, facebook_page=page, sender_fb_id=sender_id
        )
        Message.objects.create(
            conversation=convo, direction='inbound', text=text,
            timestamp=datetime.fromtimestamp(timestamp / 1000, tz=timezone.utc)
        )
        convo.message_count = F('message_count') + 1
        convo.last_message_at = timezone.now()
        convo.save(update_fields=['message_count', 'last_message_at'])

        WebhookLog.objects.filter(id=...).update(status='forwarded', forwarded_at=timezone.now())

    except Exception as exc:
        WebhookLog.objects.filter(...).update(status='retrying', attempts=F('attempts') + 1)
        raise self.retry(exc=exc)
```

---

## 11. Django Settings — Key Blocks

```python
# settings/base.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'social_django',
    'django_filters',
    'drf_spectacular',
    'django_celery_results',
    'django_celery_beat',
    'storages',
    # Apps
    'apps.accounts',
    'apps.subscriptions',
    'apps.groups',
    'apps.products',
    'apps.conversations',
    'apps.activity',
    'apps.webhooks',
    'apps.analytics',
]

AUTH_USER_MODEL = 'accounts.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # must be first
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    ...
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'shared.pagination.StandardPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'shared.exceptions.custom_exception_handler',
}

CORS_ALLOWED_ORIGINS = [env('FRONTEND_URL', default='http://localhost:5173')]
CORS_ALLOW_CREDENTIALS = True

# File uploads
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Per-plan upload limits enforced in views
PLAN_FILE_LIMITS = {
    'starter': 5 * 1024 * 1024,    # 5 MB
    'growth':  50 * 1024 * 1024,   # 50 MB
    'pro':     500 * 1024 * 1024,  # 500 MB
}
```

---

## 12. Root URL Configuration

```python
# backend/urls.py
urlpatterns = [
    path('admin/',                   admin.site.urls),
    path('api/auth/',                include('apps.accounts.urls')),
    path('api/clients/',             include('apps.accounts.client_urls')),
    path('api/products/',            include('apps.products.urls')),
    path('api/conversations/',       include('apps.conversations.urls')),
    path('api/webhooks/',            include('apps.webhooks.urls')),
    path('api/subscriptions/',       include('apps.subscriptions.urls')),
    path('api/groups/',              include('apps.groups.urls')),
    path('api/analytics/',           include('apps.analytics.urls')),
    path('api/schema/',              SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/',                SpectacularSwaggerUI.as_view(), name='swagger-ui'),
    # Social auth (PSA)
    path('',                         include('social_django.urls', namespace='social')),
]
```

---

## 13. Django Admin Customization

Register all models with useful list displays:

```python
# apps/accounts/admin.py
@admin.register(ClientProfile)
class ClientProfileAdmin(ModelAdmin):
    list_display  = ['user', 'company_name', 'plan', 'group', 'is_onboarded', 'created_at']
    list_filter   = ['plan', 'group', 'is_onboarded', 'business_niche']
    search_fields = ['user__email', 'company_name', 'phone']
    raw_id_fields = ['user', 'plan', 'group']

@admin.register(Group)
class GroupAdmin(ModelAdmin):
    list_display = ['name', 'current_count', 'capacity', 'is_active', 'meta_app_id']
    list_editable= ['make_webhook_url', 'meta_app_id']

@admin.register(WebhookLog)
class WebhookLogAdmin(ModelAdmin):
    list_display = ['page_id', 'sender_id', 'status', 'attempts', 'received_at']
    list_filter  = ['status']
```

---

## 14. Implementation Order (Phased)

### Phase 1 — Foundation (Week 1)
1. Set up PostgreSQL, Django project structure, environment config
2. Build `accounts` app: `User`, `ClientProfile`, `FacebookPage` models + migrations
3. Email/password registration & login endpoints (JWT)
4. Basic profile endpoint (`/api/clients/me/`)
5. CORS setup for frontend dev server

### Phase 2 — Core SaaS Logic (Week 1–2)
6. `subscriptions` app: `Plan`, `Subscription`, `ActivationCode` models
7. `groups` app: `Group` model + `GroupAssignmentService`
8. Complete registration flow: onboarding → group assignment → activation code
9. Activation code validation endpoint (for Make.com calls)
10. Seed `Plan` and initial `Group` fixtures

### Phase 3 — Facebook Integration (Week 2)
11. Facebook OAuth with PSA (login + page listing + page selection)
12. `FacebookPage` storage
13. Webhook verification endpoint (GET)
14. Webhook receive endpoint (POST) with HMAC validation
15. Celery + Redis setup
16. `process_facebook_message` Celery task
17. `WebhookLog` model + admin

### Phase 4 — Products & Conversations (Week 2–3)
18. `products` app: full CRUD with image upload
19. `generate_product_description` Celery task (Claude API)
20. `conversations` app: `Conversation` + `Message` models
21. Conversation list & detail endpoints
22. Activity log creation on all write events

### Phase 5 — Analytics & Dashboard (Week 3)
23. `analytics` app: usage stats endpoint
24. `DailyUsageSnapshot` model + Celery Beat periodic task
25. Connect analytics to subscription period (reset on renewal)

### Phase 6 — Polish (Week 3–4)
26. Global exception handler + structured JSON errors
27. Rate limiting (`django-ratelimit` on webhook, auth endpoints)
28. OpenAPI docs (`drf-spectacular`)
29. Admin customization
30. Write integration tests for: auth flow, group assignment, webhook routing, product AI
31. Production settings: static files via Whitenoise, S3 media, DEBUG=False

---

## 15. Frontend Integration Changes Needed

Once the backend is running, replace mock data in the frontend:

| Frontend File | Mock to Replace | API Call |
|---|---|---|
| `DashboardPage.jsx` | `CLIENT` object | `GET /api/clients/me/` |
| `DashboardPage.jsx` | `MOCK_PRODUCTS` | `GET /api/products/` |
| `DashboardPage.jsx` | `MOCK_CONVOS` | `GET /api/conversations/` |
| `DashboardPage.jsx` | `MOCK_ACTIVITY` | `GET /api/clients/me/activity/` |
| `DashboardPage.jsx` | AI description (fake timer) | `POST /api/products/{id}/generate-description/` |
| `SignUpPage.jsx` | Direct redirect after form | `POST /api/auth/register/` → `POST /api/auth/onboarding/` |
| `SignInPage.jsx` | No real login | `POST /api/auth/login/` |
| `PricingPage.jsx` | `PLANS` data | `GET /api/subscriptions/plans/` |

Add an `api.js` service file in the frontend with `fetch`/`axios` calls and JWT token handling (store token in `localStorage` or `httpOnly` cookie).

---

## 16. Environment Summary

```
PostgreSQL: ecomauto database, ecomauto_user
Redis: localhost:6379
Django: localhost:8000
Frontend: localhost:5173
Celery worker: celery -A backend worker -l info
Celery beat: celery -A backend beat -l info (for periodic tasks)
```

For production: PostgreSQL on Supabase or Railway, Redis on Upstash, Django on Railway/Render, media on AWS S3, frontend on Vercel.
