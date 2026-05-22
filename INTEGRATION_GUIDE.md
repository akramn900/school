# SchooLama – Clerk Auth + Communications Integration Guide

## What's included in this update

| File | Purpose |
|---|---|
| `index.html` | New login page powered by Clerk (replaces username/password form) |
| `js/clerk-auth.js` | Auth guard for every protected page |
| `pages/communications.html` | WhatsApp + Call hub for all roles |

---

## Step 1 – Update Your Publishable Key

Your Clerk publishable key (from the screenshot) is already embedded:
```
pk_test_Y_RzLmR1diQ
```
If this is wrong or rotated, do a global find-replace across all three files:
- Find:    `pk_test_Y_RzLmR1diQ`
- Replace: `pk_test_YOUR_ACTUAL_KEY`

---

## Step 2 – Add Clerk SDK + auth guard to existing pages

For **every** protected page (dashboard.html, pages/*.html), add these two script tags
right before the closing `</head>` tag:

```html
<!-- Clerk SDK -->
<script
  async
  crossorigin="anonymous"
  data-clerk-publishable-key="pk_test_Y_RzLmR1diQ"
  src="https://unpkg.com/@clerk/clerk-js@latest/dist/clerk.browser.js"
></script>
<!-- Auth guard -->
<script src="../js/clerk-auth.js"></script>
```

(For `dashboard.html` at the root, change `../js/clerk-auth.js` to `./js/clerk-auth.js`)

After adding this, `window.schoolUser` is available with:
```js
{
  id, name, email, imageUrl,
  role: "admin" | "teacher" | "student" | "parent",
  clerkId
}
```

---

## Step 3 – Replace the old sign-out button

Find any existing sign-out or logout button and replace the handler:

```html
<!-- OLD (remove this) -->
<button onclick="localStorage.clear(); window.location.href='../index.html'">Logout</button>

<!-- NEW (add this) -->
<button onclick="clerkSignOut()">Sign Out</button>
```

---

## Step 4 – Add Communications link to all sidebars

Add this to the sidebar navigation in every page:

```html
<a href="../pages/communications.html">
  <span class="icon">💬</span> Communications
</a>
```

---

## Step 5 – Add phone numbers to your Supabase tables

The WhatsApp and Call features require a `phone` column in your DB tables.
Run this SQL in your Supabase SQL editor:

```sql
-- Add phone column to each table (skip if already exists)
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE parents  ADD COLUMN IF NOT EXISTS phone TEXT;
```

Phone numbers should be in **international format without spaces or dashes**:
- ✅ `+491234567890`  (Germany)
- ✅ `+201234567890`  (Egypt)
- ✅ `+447911123456`  (UK)

---

## How the WhatsApp + Call features work

### Per-contact (Communications page)
- **WhatsApp button** → opens `https://wa.me/{phone}` in a new tab
- **Call button** → opens `tel:{phone}` (uses the device's phone/Skype)
- If no phone number is stored, buttons show "No phone" (disabled)

### Broadcast (Admin/Teacher only)
- Select recipient groups (Students / Teachers / Parents)
- Type a message
- Click "Send WhatsApp Broadcast"
- Opens WhatsApp for the first recipient with your message pre-filled
- Note: true bulk messaging requires **WhatsApp Business API** (Twilio, 360dialog, etc.)
  For that integration, see the optional Twilio section below.

---

## Optional: Twilio WhatsApp Business API (true bulk messaging)

If you want to send bulk messages programmatically (not just open WhatsApp links),
you'll need a backend. Add a Supabase Edge Function:

```typescript
// supabase/functions/send-whatsapp/index.ts
import { serve } from "https://deno.land/std/http/server.ts"

serve(async (req) => {
  const { to, message } = await req.json()
  
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_SID')}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${Deno.env.get('TWILIO_SID')}:${Deno.env.get('TWILIO_TOKEN')}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:${Deno.env.get('TWILIO_WHATSAPP_NUMBER')}`,
      To: `whatsapp:${to}`,
      Body: message,
    }),
  })

  return new Response(JSON.stringify(await res.json()), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Then in `communications.html`, replace the `sendBroadcast()` function body to call
this edge function for each contact.

---

## Role-based access summary

| Feature | Admin | Teacher | Student | Parent |
|---|:---:|:---:|:---:|:---:|
| View all contacts | ✅ | ✅ | — | — |
| Contact teachers | ✅ | ✅ | ✅ | ✅ |
| Contact students | ✅ | ✅ | — | ✅ |
| Contact parents | ✅ | ✅ | — | — |
| Broadcast messages | ✅ | ✅ | — | — |
| WhatsApp per-contact | ✅ | ✅ | ✅ | ✅ |
| Call per-contact | ✅ | ✅ | ✅ | ✅ |
