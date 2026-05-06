# n8n ↔ EcomAuto Database Setup

## Overview
n8n connects **directly** to the EcomAuto PostgreSQL database using the built-in PostgreSQL node.
The `n8n_user` role has read/write access to specific tables only.

---

## Step 1 — Create the n8n_user Role in PostgreSQL

Run this SQL on the production database (Supabase SQL editor or `psql`):

```sql
-- Create a dedicated role for n8n
CREATE USER n8n_user WITH PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';

-- Grant access to required tables only
GRANT CONNECT ON DATABASE ecomauto TO n8n_user;
GRANT USAGE ON SCHEMA public TO n8n_user;

-- Tables n8n reads
GRANT SELECT ON activation_codes TO n8n_user;
GRANT SELECT ON client_profiles TO n8n_user;
GRANT SELECT ON facebook_pages TO n8n_user;
GRANT SELECT ON plans TO n8n_user;
GRANT SELECT ON groups TO n8n_user;
GRANT SELECT ON subscriptions TO n8n_user;

-- Tables n8n writes
GRANT SELECT, INSERT, UPDATE ON conversations TO n8n_user;
GRANT SELECT, INSERT ON messages TO n8n_user;
GRANT SELECT, INSERT, UPDATE ON monthly_usage TO n8n_user;

-- Sequences (needed for INSERT on tables with serial PKs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO n8n_user;
```

> Never grant n8n_user access to the `users` table or any auth-related tables.

---

## Step 2 — Configure the PostgreSQL Node in n8n

In each n8n workflow that needs DB access, add a **Credentials** entry for PostgreSQL:

| Field | Value |
|-------|-------|
| Host | Your Supabase/Railway host |
| Port | 5432 |
| Database | ecomauto (or your DB name) |
| User | n8n_user |
| Password | (the password you set above) |
| SSL | Required (for Supabase) |

---

## Step 3 — Key SQL Queries for n8n Workflows

### Validate Activation Code
```sql
SELECT ac.code, ac.is_valid, ac.expires_at,
       cp.id as client_id,
       p.name as plan_name, p.messages_limit,
       mu.messages_used
FROM activation_codes ac
JOIN client_profiles cp ON cp.id = ac.client_id
LEFT JOIN plans p ON p.id = cp.plan_id
LEFT JOIN monthly_usage mu
  ON mu.client_id = cp.id
  AND mu.year = EXTRACT(YEAR FROM NOW())
  AND mu.month = EXTRACT(MONTH FROM NOW())
WHERE ac.code = '{{ $json.activation_code }}'
  AND ac.is_valid = true
  AND (ac.expires_at IS NULL OR ac.expires_at > NOW());
```

### Get Page Token for a Page ID
```sql
SELECT page_token, client_id
FROM facebook_pages
WHERE page_id = '{{ $json.page_id }}'
  AND is_connected = true;
```

### Upsert Conversation
```sql
INSERT INTO conversations
  (id, client_id, facebook_page_id, sender_fb_id, message_count, last_message_at, sentiment, created_at)
VALUES
  (gen_random_uuid(), '{{ $json.client_id }}', '{{ $json.facebook_page_id }}',
   '{{ $json.sender_id }}', 1, NOW(), 'neutral', NOW())
ON CONFLICT (client_id, facebook_page_id, sender_fb_id)
DO UPDATE SET
  message_count = conversations.message_count + 1,
  last_message_at = NOW()
RETURNING id;
```

### Insert Outbound Message
```sql
INSERT INTO messages (id, conversation_id, direction, text, mid, timestamp, created_at)
VALUES (
  gen_random_uuid(),
  '{{ $json.conversation_id }}',
  'outbound',
  '{{ $json.reply_text }}',
  '{{ $json.mid }}',
  NOW(),
  NOW()
);
```

### Increment Monthly Usage
```sql
INSERT INTO monthly_usage (id, client_id, year, month, messages_used)
VALUES (
  gen_random_uuid(),
  '{{ $json.client_id }}',
  EXTRACT(YEAR FROM NOW()),
  EXTRACT(MONTH FROM NOW()),
  1
)
ON CONFLICT (client_id, year, month)
DO UPDATE SET messages_used = monthly_usage.messages_used + 1;
```

### Create Order from Collected Data
```sql
INSERT INTO crm_orders (
  id, client_id, conversation_id,
  customer_name, customer_phone, delivery_address,
  product_name, quantity, unit_price, total_price,
  status, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '{{ $json.client_id }}',
  '{{ $json.conversation_id }}',
  '{{ $json.customer_name }}',
  '{{ $json.customer_phone }}',
  '{{ $json.delivery_address }}',
  '{{ $json.product_name }}',
  {{ $json.quantity }},
  {{ $json.unit_price }},
  {{ $json.quantity }} * {{ $json.unit_price }},
  'pending',
  NOW(),
  NOW()
);
```

---

## Step 4 — Internal API Endpoint (Alternative to Direct DB)

For operations that require business logic (e.g., triggering Gemini classification after an outbound message), n8n can call:

```
POST /api/internal/messages/outbound/
Headers:
  X-Internal-Key: <INTERNAL_API_SECRET from .env>
  Content-Type: application/json

Body:
{
  "conversation_id": "uuid",
  "text": "reply text",
  "mid": "m_xxxx",
  "timestamp": "2026-05-06T12:00:00Z"
}
```

This endpoint records the outbound message AND triggers Gemini sentiment classification.

---

## Security Notes

- Keep the n8n DB password and `INTERNAL_API_SECRET` out of version control.
- Rotate the n8n_user password every 90 days.
- In Supabase, enable Row-Level Security (RLS) and add policies for n8n_user if needed.
