# Remaining Tasks to Complete the Project

---

**Grouping Logic**
- Implement backend group assignment that places each client into the correct group based on their chosen plan.
- Enforce group-level permissions per plan tier — for example, Starter plan clients can only upload `.txt` files for product details and are limited to a single niche, while Growth plan clients can upload `.txt`, `.pdf`, `.doc`, and additional formats.
- Reflect those permission rules inside the n8n workflow so automation behavior is gated by the client's plan.

---

**Subscription Logic**
- Implement account activation and deactivation based on payment status (e.g., automatically suspend unpaid accounts).
- Allow clients to disable their subscription/activation code to pause AI auto-replies without fully cancelling their account.

---

**EcomAuto DB Connection**
- Connect the n8n workflow to the deployed production database to store conversations, messages, client credentials, and n8n conversation history.
- Validate the connection and verify full read/write functionality end-to-end.

---

**Conversations & Messages**
- Once the database connection is live, surface all messages and conversations in the client's frontend dashboard.

---

**Summary Logic**
- Implement an AI-generated conversation summary inside the dashboard.
- Categorize conversations automatically into positive, negative, and neutral sentiment buckets.

---

**File Upload**
- Build the product details file upload feature and persist uploaded files to the database.
- Enforce upload limits and allowed file types based on the client's plan (Starter, Growth, Pro).

---

**Account & Subscription Actions**
- Handle account and subscription code activation/deactivation triggered by specific client actions.
- Generate an AI-powered Recent Actions feed that summarizes what the client has done recently.

---

**Free Trial Logic**
- Track each client's usage throughout the trial month and compare it against their plan's limits.
- Automatically prompt or transition the client to a paid account once the trial ends or limits are reached.

---

**Client Verification**
- Verify that each connected Facebook Page is linked to the account it was registered with.
- Block any attempt by a different client to register the same Facebook Page, preventing abuse and infinite free-tier looping.

---

**Dashboard CRM — Order Collection & Customer Data**
- Design and implement an AI system prompt that, during a Messenger conversation, intelligently collects all information required to confirm an order: customer full name, phone number, delivery address, product details, and any other relevant fields.
- If a customer does not volunteer their details upfront, the AI should proactively ask for each missing piece in a natural, conversational way until all required data is gathered.
- Once a complete order payload is collected, push it to the client's dashboard CRM so they can review, manage, and fulfil confirmed orders from one place.
- Ensure the CRM view stays in sync with live data — new orders appear in real time, and any updates (e.g., order status changes) are reflected immediately.
- **[DECISION REQUIRED]** Implement push notifications for Growth (and above) subscribers to alert them the moment a new confirmed order arrives — decide between WhatsApp Business API or Facebook Messenger as the notification channel before building.

---

**Terms of Service, Privacy Policy & Cookie Policy**
- Draft and publish the platform's Terms of Service, Privacy Policy, and Cookie Policy pages.

---

**Payment Method**
- Decide on and integrate the payment method(s) to use: Baridi Mob, personal cash collection, Stripe, PayPal, or Redotpay.

---

---

## Summary

This document tracks all outstanding work needed before EcomAuto is production-ready. The remaining tasks fall into five broad themes:

1. **Access control & plan enforcement** — Group assignment logic, per-plan file upload permissions, and n8n workflow gating must all be aligned so each client's tier is consistently enforced across the backend, database, and automation layer.

2. **Subscription & account lifecycle** — The platform needs to handle the full account lifecycle: free trial tracking, automatic suspension of unpaid accounts, and giving clients the ability to pause or resume their AI replies independently of their billing status.

3. **Data pipeline & CRM integration** — The n8n workflow must be connected to the production database so that all conversations, messages, and client activity are stored and displayed live in the frontend dashboard. The dashboard's integrated CRM must go further: an AI system prompt will guide Messenger conversations to proactively collect each customer's full order details (name, phone, address, product choice), push confirmed orders to the client's CRM in real time, and — for Growth subscribers and above — trigger an instant push notification the moment a new order lands. The notification channel (WhatsApp Business API vs. Facebook Messenger) must be decided before implementation begins.

4. **AI-powered features** — Two AI-driven features remain: automatic sentiment categorization of conversations (positive / negative / neutral) and an AI-generated summary and recent-actions feed inside the dashboard.

5. **Legal, verification & payments** — Before launch, the platform needs Facebook Page ownership verification (to prevent account sharing abuse), published legal pages (Terms of Service, Privacy Policy, Cookie Policy), and a finalized payment integration — whether Baridi Mob, Stripe, PayPal, or Redotpay.
