# n8n Setup — Data-Aware AI with Product Context + Pro Image Generation

## Architecture

```
Customer Message
      ↓
Meta Webhook POST
      ↓
Django /api/webhooks/facebook/
  - Verifies HMAC-SHA256 signature
  - Returns 200 to Meta instantly
  - Dispatches Celery async task
      ↓
Celery: process_facebook_message
  - Looks up FacebookPage → gets page_token
  - Checks message limit (blocks if exceeded)
  - Deduplicates by message mid
  - Creates Conversation (first time) in DB  ← MUST happen before n8n call
  - POSTs enriched payload to n8n (includes conversation_id + plan)
  - Records inbound Message in DB
      ↓
n8n Workflow:
  1. Receive from Django (POST only)
  2. HTTP GET → /api/n8n/client-context/ (Django internal API)
     Returns: company name, niche, plan, active products + file URLs
  3. Code: Build System Prompt from client data
  4. Code: Detect Intent (image request? Pro plan only)
     ├── Text Branch (all plans)
     │     AI Agent (Gemini + Chat Memory)
     │     → Extract reply text
     │     → HTTP: Send text reply to Messenger
     └── Image Branch (Pro plan only, when customer wants to see product in real life)
           HTTP: Gemini Imagen — generate product-in-context image
           → HTTP: Upload image to Facebook
           → HTTP: Send image attachment to Messenger
  5. Postgres: Save outbound message (text or image caption)
  6. Postgres: Prune old messages (keep last 20)
  7. Respond: 200 OK → Django receives success
```

**What Django handles — n8n must NOT duplicate:**
- HMAC signature verification
- hub.challenge verification (Meta webhook setup)
- Message limit enforcement
- `page_token` lookup
- Inbound `Conversation` + `Message` recording
- `MonthlyUsage` increment
- Sentiment classification (async, 90s after message)
- `ActivityLog` entry

---

## Incoming Payload to n8n

Django's Celery task POSTs this exact JSON to n8n:

```json
{
  "sender_id":       "1234567890",
  "page_id":         "9876543210",
  "page_token":      "EAAxxxxxxxxxxxxxxx",
  "message_text":    "Can I see how the jacket looks on a model?",
  "timestamp":       1746600000000,
  "client_id":       "uuid-of-django-user",
  "group_name":      "Alpha",
  "conversation_id": "uuid-of-conversation",
  "plan":            "pro"
}
```

> `page_token` and `conversation_id` are already included — n8n never queries them from DB.

---

## Required Backend Changes

### 1. Fix tasks.py — Create Conversation Before Forwarding

Currently `tasks.py` forwards to n8n before creating the conversation, so `conversation_id`
is missing from the payload. Reorder the task so conversation is created first:

**File:** [backend/apps/webhooks/tasks.py](backend/apps/webhooks/tasks.py)

Replace the block starting at the `forward_payload` dict with this reordered version:

```python
group = client.group
webhook_url = (
    group.n8n_webhook_url
    if group and group.n8n_webhook_url
    else settings.N8N_DEFAULT_WEBHOOK
)

# Deduplicate by mid before doing any DB writes
if mid and Message.objects.filter(mid=mid).exists():
    logger.debug('Duplicate mid %s — skipping.', mid)
    return

# 1. Create conversation FIRST so we have its ID for n8n
convo, created = Conversation.objects.get_or_create(
    client=client,
    facebook_page=page,
    sender_fb_id=sender_id,
)

# 2. Forward to n8n WITH conversation_id and plan
forward_payload = {
    'sender_id':       sender_id,
    'page_id':         page_id,
    'page_token':      page.page_token,
    'message_text':    text,
    'timestamp':       timestamp_ms,
    'client_id':       str(client.user.id),
    'group_name':      group.name if group else None,
    'conversation_id': str(convo.id),
    'plan':            client.plan.name if client.plan else 'starter',
}

with httpx.Client(timeout=10) as http:
    response = http.post(webhook_url, json=forward_payload)
    response.raise_for_status()

# 3. Increment monthly usage
MonthlyUsage.objects.filter(
    client=client, year=tz.now().year, month=tz.now().month,
).update(messages_used=F('messages_used') + 1)

# 4. Record inbound message
msg_time = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
Message.objects.create(
    conversation=convo,
    direction='inbound',
    text=text,
    mid=mid,
    timestamp=msg_time,
)
convo.message_count = F('message_count') + 1
convo.last_message_at = msg_time
convo.save(update_fields=['message_count', 'last_message_at'])

if created:
    ActivityLog.objects.create(
        client=client,
        action_type='conversation_started',
        description=f'New conversation from sender {sender_id}.',
        metadata={'sender_id': sender_id, 'page_id': page_id},
    )

from apps.conversations.tasks import classify_and_summarize_conversation
classify_and_summarize_conversation.apply_async(args=[str(convo.id)], countdown=90)
```

Remove the old duplicate-check block that was placed after the HTTP call.

---

### 2. New Internal API Endpoint — Client Context for n8n

n8n needs a single call to get everything required to build the AI system prompt.

**Add to** [backend/apps/accounts/views.py](backend/apps/accounts/views.py) (or a new `n8n_views.py`):

```python
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class N8nClientContextView(APIView):
    """
    Internal endpoint for n8n. Returns client product catalog + business profile.
    Auth: X-N8N-Secret header must match N8N_SECRET env var.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        secret = request.headers.get('X-N8N-Secret', '')
        if secret != os.environ.get('N8N_SECRET', ''):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

        client_id = request.query_params.get('client_id')
        if not client_id:
            return Response({'error': 'client_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from apps.accounts.models import ClientProfile
            profile = ClientProfile.objects.select_related('plan').get(user__id=client_id)
        except ClientProfile.DoesNotExist:
            return Response({'error': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

        from apps.products.models import Product
        products = Product.objects.filter(
            client=profile, status='active'
        ).prefetch_related('files')

        product_list = []
        for p in products:
            files = [
                {'name': f.original_name, 'url': request.build_absolute_uri(f.file.url)}
                for f in p.files.all()
            ]
            product_list.append({
                'name':        p.name,
                'price':       str(p.price),
                'category':    p.get_category_display(),
                'description': p.description,
                'image_url':   request.build_absolute_uri(p.image.url) if p.image else None,
                'files':       files,
            })

        return Response({
            'company_name':    profile.company_name or '',
            'business_niche':  profile.business_niche or '',
            'plan':            profile.plan.name if profile.plan else 'starter',
            'products':        product_list,
        })
```

**Register the URL** in [backend/apps/accounts/urls.py](backend/apps/accounts/urls.py):

```python
path('n8n/client-context/', N8nClientContextView.as_view(), name='n8n-client-context'),
```

Or in the root [backend/backend/urls.py](backend/backend/urls.py):

```python
path('api/n8n/', include('apps.accounts.urls')),
```

**Add to** [backend/.env](backend/.env):

```
N8N_SECRET=replace_with_a_long_random_string_min_32_chars
```

Store the same value in n8n as an HTTP Header credential (see Workflow section below).

---

## Database Credentials (Using Default postgres User)

Use the existing `postgres` superuser directly — no need to create a separate `n8n_user` for now. Switch to a least-privilege user later when the setup is stable.

### Create Credential in n8n

Go to **n8n → Settings → Credentials → New → Postgres**, fill in:

| Field    | Value                                                                |
|----------|----------------------------------------------------------------------|
| Host     | `shinkansen.proxy.rlwy.net`                                          |
| Port     | `46856`                                                              |
| Database | `railway`                                                            |
| User     | `postgres`                                                           |
| Password | `djpDxgfhtUuLagkxSJCOSlgsYBwodaPP`                                  |
| SSL      | ✅ Required                                                          |

> If n8n is deployed in the same Railway project, use `postgres.railway.internal:5432` instead (faster, no egress cost).

### Create Django-API Credential in n8n

Go to **n8n → Settings → Credentials → New → HTTP Header Auth**:

| Field       | Value                                  |
|-------------|----------------------------------------|
| Name        | `Django N8N Secret`                    |
| Header Name | `X-N8N-Secret`                         |
| Header Value| *(the N8N_SECRET value from .env)*     |

---

## n8n Workflow — Full Node Breakdown

### Node 1 — Receive from Django

| Setting | Value |
|---------|-------|
| Type    | Webhook |
| Method  | POST only |
| Path    | `ecom-auto-msngr` (or your chosen path) |
| Auth    | None (Django already verified everything) |
| Name    | `Receive from Django` |

This is the entry point. Outputs all fields from the incoming JSON.

---

### Node 2 — Fetch Client Context

| Setting | Value |
|---------|-------|
| Type    | HTTP Request |
| Method  | GET |
| URL     | `https://your-django-domain.railway.app/api/n8n/client-context/` |
| Auth    | Header Auth → `Django N8N Secret` credential |
| Query Params | `client_id` = `{{ $json.client_id }}` |
| Name    | `Fetch Client Context` |

Output fields used downstream:
- `company_name`, `business_niche`, `plan`, `products[]`

---

### Node 3 — Build System Prompt

| Setting | Value |
|---------|-------|
| Type    | Code (JavaScript) |
| Name    | `Build System Prompt` |

```javascript
const ctx = $('Fetch Client Context').first().json;
const msg = $('Receive from Django').first().json;

// Build product catalog string
const catalog = ctx.products.map(p => {
  let entry = `• ${p.name} — ${p.price} DZD (${p.category})`;
  if (p.description) entry += `\n  ${p.description}`;
  return entry;
}).join('\n');

const systemPrompt = `You are a helpful customer service assistant for "${ctx.company_name}", 
an e-commerce store specializing in ${ctx.business_niche}.

Your job is to help customers with product questions, pricing, availability, and 
recommendations. Always be friendly, concise, and helpful.

PRODUCT CATALOG (active products only):
${catalog || 'No products listed yet.'}

RULES:
- Only answer questions related to this store and its products.
- If asked about a product not in the catalog, say it is not currently available.
- Do not make up prices or specifications not listed above.
- If the customer asks to SEE a product in a real-life setting, respond with the 
  exact phrase: [IMAGE_REQUEST: <product name>]
  (The system will handle generating the image.)
- Keep replies under 200 words unless detail is specifically requested.`;

return [{
  json: {
    ...msg,
    system_prompt: systemPrompt,
    client_plan: ctx.plan,
    products: ctx.products,
  }
}];
```

---

### Node 4 — Detect Intent

| Setting | Value |
|---------|-------|
| Type    | Code (JavaScript) |
| Name    | `Detect Intent` |

```javascript
const data = $input.first().json;
const text = data.message_text.toLowerCase();
const plan = data.client_plan;

// Image generation keywords
const imageKeywords = [
  'show me', 'what does it look like', 'real life', 'in use',
  'wearing', 'lifestyle', 'on a model', 'in a room', 'how it looks',
  'can i see', 'photo', 'picture', 'image of'
];

const wantsImage = plan === 'pro' &&
  imageKeywords.some(kw => text.includes(kw));

return [{
  json: {
    ...data,
    wants_image: wantsImage,
  }
}];
```

Connect this node to an **If** node that branches on `{{ $json.wants_image }}`:
- `true` → Image Generation Branch (Pro only)
- `false` → Text Reply Branch

---

### Node 5A — AI Agent (Text Reply Branch)

| Setting | Value |
|---------|-------|
| Type    | AI Agent |
| System Message | `{{ $json.system_prompt }}` |
| Name    | `AI Agent: Reply Customer` |

Sub-nodes:
- **Google Gemini Chat Model** — `gemini-2.0-flash` (or `gemini-1.5-flash`)
- **Postgres Chat Memory** — credential: Railway Postgres; Session Key: `{{ $json.sender_id }}_{{ $json.page_id }}`

---

### Node 5B — Generate Image (Pro Plan — Image Branch)

#### 5B-i — Detect Which Product

| Setting | Value |
|---------|-------|
| Type    | Code (JavaScript) |
| Name    | `Identify Product for Image` |

```javascript
const data = $input.first().json;
const text = data.message_text.toLowerCase();

// Find which product the customer is asking about
const matchedProduct = data.products.find(p =>
  text.includes(p.name.toLowerCase())
);

const productName = matchedProduct ? matchedProduct.name : 'the product';
const productDesc = matchedProduct ? matchedProduct.description : '';

const imagePrompt = `A realistic lifestyle photo of "${productName}" in a real-world setting. 
${productDesc ? 'Product description: ' + productDesc : ''}
The product should be shown in a natural, aspirational environment — good lighting, 
high quality, as if taken by a professional photographer for an e-commerce catalog.
Do not include any text or watermarks in the image.`;

return [{
  json: {
    ...data,
    image_prompt: imagePrompt,
    matched_product: productName,
  }
}];
```

#### 5B-ii — Call Gemini Imagen

| Setting | Value |
|---------|-------|
| Type    | HTTP Request |
| Method  | POST |
| URL     | `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict` |
| Auth    | Query Param — `key` = `{{ $env.GEMINI_API_KEY }}` |
| Body    | JSON (see below) |
| Name    | `Generate Image (Gemini Imagen)` |

Request body:
```json
{
  "instances": [
    { "prompt": "{{ $json.image_prompt }}" }
  ],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "1:1"
  }
}
```

> Store `GEMINI_API_KEY` in n8n **Settings → Environment Variables** using the same value as in Django's `.env`.

#### 5B-iii — Extract Image Data

| Setting | Value |
|---------|-------|
| Type    | Code (JavaScript) |
| Name    | `Extract Image Data` |

```javascript
const response = $input.first().json;
const prediction = response.predictions?.[0];
const base64Image = prediction?.bytesBase64Encoded;

if (!base64Image) {
  // Fall back to text reply if image generation failed
  return [{
    json: {
      ...$('Detect Intent').first().json,
      reply_text: `Here is our ${$('Identify Product for Image').first().json.matched_product}! Unfortunately I cannot display an image right now, but you can visit our page to see photos.`,
      image_failed: true,
    }
  }];
}

return [{
  json: {
    ...$('Identify Product for Image').first().json,
    image_base64: base64Image,
    image_mime: 'image/png',
  }
}];
```

#### 5B-iv — Upload Image to Facebook

Facebook Messenger requires images to be hosted. Upload the image using the Facebook Graph API's attachment upload endpoint:

| Setting | Value |
|---------|-------|
| Type    | HTTP Request |
| Method  | POST |
| URL     | `https://graph.facebook.com/v19.0/me/message_attachments` |
| Auth    | Query Param — `access_token` = `{{ $json.page_token }}` |
| Body    | Form Data (binary upload) |
| Name    | `Upload Image to Facebook` |

Form fields:
```
message: {"attachment":{"type":"image","payload":{"is_reusable":true}}}
filedata: [binary from base64 — use n8n's binary data handling]
```

> In n8n, convert the base64 string to binary using a **Move Binary Data** node before this HTTP node, then send `filedata` as binary.

The response contains `attachment_id`. Store it for the send step.

---

### Node 6 — Extract Reply Text (Text Branch)

| Setting | Value |
|---------|-------|
| Type    | Code (JavaScript) |
| Name    | `Extract AI Reply` |

```javascript
const output = $input.first().json.output || $input.first().json.text || '';
return [{ json: { ...$('Detect Intent').first().json, reply_text: output.trim() } }];
```

---

### Node 7 — Send Reply to Messenger

This node handles both text replies and image replies. Use two separate HTTP Request nodes merged afterward, or a Code node that picks the right body.

**For text reply:**

| Setting | Value |
|---------|-------|
| Type    | HTTP Request |
| Method  | POST |
| URL     | `https://graph.facebook.com/v19.0/me/messages` |
| Auth    | Query Param — `access_token` = `{{ $json.page_token }}` |
| Body    | JSON |
| Name    | `Send Text Reply` |

```json
{
  "recipient": { "id": "{{ $json.sender_id }}" },
  "message":   { "text": "{{ $json.reply_text }}" }
}
```

**For image reply (Pro plan):**

| Setting | Value |
|---------|-------|
| Type    | HTTP Request |
| Method  | POST |
| URL     | `https://graph.facebook.com/v19.0/me/messages` |
| Auth    | Query Param — `access_token` = `{{ $json.page_token }}` |
| Body    | JSON |
| Name    | `Send Image Reply` |

```json
{
  "recipient": { "id": "{{ $json.sender_id }}" },
  "message": {
    "attachment": {
      "type": "image",
      "payload": { "attachment_id": "{{ $json.attachment_id }}" }
    }
  }
}
```

---

### Node 8 — Save Outbound Message

| Setting | Value |
|---------|-------|
| Type    | Postgres |
| Operation| Execute Query |
| Credential | Railway Postgres |
| Name    | `Save Outbound Message` |

```sql
INSERT INTO messages (id, conversation_id, direction, text, mid, timestamp, created_at)
VALUES (
  gen_random_uuid(),
  '{{ $json.conversation_id }}'::uuid,
  'outbound',
  '{{ $json.reply_text }}',
  '',
  NOW(),
  NOW()
)
```

For image replies, set `text` to a caption like `[image: {{ $json.matched_product }}]`.

---

### Node 9 — Prune Old Messages

| Setting | Value |
|---------|-------|
| Type    | Postgres |
| Operation| Execute Query |
| Credential | Railway Postgres |
| Name    | `Prune Old Messages` |

```sql
DELETE FROM messages
WHERE id IN (
  SELECT id FROM messages
  WHERE conversation_id = '{{ $json.conversation_id }}'::uuid
  ORDER BY timestamp ASC
  LIMIT GREATEST(
    0,
    (SELECT COUNT(*) FROM messages WHERE conversation_id = '{{ $json.conversation_id }}'::uuid) - 20
  )
)
```

---

### Node 10 — Respond 200 OK

| Setting | Value |
|---------|-------|
| Type    | Respond to Webhook |
| Status  | 200 |
| Body    | `{"ok": true}` |
| Name    | `Respond 200 OK` |

---

## Postgres Chat Memory Config

The `Postgres Chat Memory` node (LangChain) auto-creates the `n8n_chat_histories` table on first run.

```
Session Key: {{ $json.sender_id }}_{{ $json.page_id }}
Credential:  Railway Postgres (postgres user)
```

This table stores only the rolling conversation context for the AI agent.
It is independent from Django's `messages` table.

---

## Complete Workflow Diagram

```
Receive from Django (POST)
        ↓
Fetch Client Context  ──── GET /api/n8n/client-context/?client_id=…
        ↓                  (returns: company, niche, plan, products[])
Build System Prompt
  (includes full product catalog in the AI's context)
        ↓
Detect Intent
  (is this a Pro plan image request?)
        │
   ┌────┴────────────────────────────────────┐
   │ wants_image = false (all plans)         │ wants_image = true (Pro only)
   ↓                                         ↓
AI Agent: Reply Customer              Identify Product for Image
  ├── Gemini Chat Model                       ↓
  └── Postgres Chat Memory          Generate Image (Gemini Imagen)
        ↓                                     ↓
Extract AI Reply                     Extract Image Data
        ↓                                     ↓
Send Text Reply                     Upload Image to Facebook
        │                                     ↓
        └──────────────┬──────────── Send Image Reply
                       ↓
              Save Outbound Message
                       ↓
              Prune Old Messages
                       ↓
              Respond 200 OK  →  Django receives success
```

---

## Nodes to Remove (Dead Code from Old Workflow)

| Node | Reason |
|------|--------|
| `If: GET Request` | Django handles hub.challenge |
| `If: Verify Token` | Django handles hub.challenge |
| `Respond: 200 Challenge` | Django handles hub.challenge |
| `Respond: 401 Unauthorized` | Django handles hub.challenge |
| `If: POST Request` | Entry is POST-only now |
| `Postgres: Fetch Client` | `page_token` already in payload |
| `Postgres: Check Conversation` | Django creates conversation before forwarding |
| `Postgres: Update Conversation` | Django handles `last_message_at` |
| `Postgres: Create Conversation` | Django creates conversation before forwarding |
| `Merge: Get Conversation ID` | `conversation_id` comes in payload |
| `Postgres: Get History` | Replaced by Postgres Chat Memory (LangChain) |
| `Code: Determine Message Type` | Django only forwards text events |
| `If: Audio Message` | Django filters non-text at source |
| `If: Image Message` | Django filters non-text at source |
| `If: Text Message` | Django filters non-text at source |
| `HTTP: Download Audio` | Django filters non-text at source |
| `Gemini: Transcribe Audio` | Django filters non-text at source |
| `HTTP: Download Image` | Django filters non-text at source |
| `Gemini: Analyze Image` | Django filters non-text at source |
| `Merge: All Message Types` | No longer needed |

---

## Plan Feature Matrix

| Feature | Starter | Growth | Pro |
|---------|---------|--------|-----|
| AI text replies from product catalog | ✅ | ✅ | ✅ |
| Product file context (.txt) | ✅ | ✅ | ✅ |
| Product file context (.pdf, .doc, .docx) | ❌ | ✅ | ✅ |
| Product file context (.csv, .xls, .json) | ❌ | ❌ | ✅ |
| AI image generation (product in real life) | ❌ | ❌ | ✅ |

The `plan` field in the n8n payload (and in the client-context response) drives this branching inside the workflow.

---

## Security Notes

- `N8N_SECRET` must be at least 32 random characters. Generate with: `openssl rand -hex 32`
- Store `N8N_SECRET` in Django `.env` and in n8n Environment Variables — never hard-code it.
- The `n8n/client-context/` endpoint returns product data only — no auth tokens, no user credentials.
- The n8n webhook URL acts as a secondary secret — keep the UUID path unguessable.
- `GEMINI_API_KEY` goes in n8n Environment Variables, not in any workflow node directly.
- Switch from `postgres` superuser to a least-privilege `n8n_user` before going to production.
