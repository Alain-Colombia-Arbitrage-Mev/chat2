# Integration with memory.ancestro.ai

This document explains how the frontend talks to the backend, intended for anyone who needs to extend either side.

## Architecture

```
┌─────────────────────┐  https + cookies      ┌──────────────────────────────┐
│  Your visitor       │ ───────────────────►  │  memory.ancestro.ai          │
│  Browser            │                       │                              │
│                     │ ◄───────────────────  │  Next.js 16 API              │
│  (this frontend)    │       JSON, SSE       │  Qdrant + FalkorDB           │
└─────────────────────┘                       └──────────────────────────────┘
```

The frontend is a Vite SPA. The backend is Next.js running behind nginx on a single VPS. Identity is established by an HttpOnly signed cookie that the backend sets and the frontend never reads directly.

## Lifecycle of a chat turn

1. **Page loads** → the SPA calls `GET /api/auth/session`. If the visitor has no cookie yet, the backend mints a signed `qdmem_session` with `sub: "anon_<uuid>"`, `status: "anon"`.

2. **User opens the widget and fills the lead form** (name + email + phone). The form data is held in component state — *not* sent to the backend yet.

3. **User sends the first message.** The frontend embeds the lead info at the top of the first user turn:
   ```
   [user info: name=…, email=…, phone=…]
   What's the cost of a 5kW system?
   ```
   so the backend's `register_user` tool detects the contact details and fires automatically.

4. **Backend** receives `POST /api/chat`, stores the user turn in Qdrant, runs RAG against the FAQ + docs collections, decides whether to invoke any tools (`register_user`, `quote_energy`), and returns the assistant reply.

5. **If `register_user` ran**, the response has `X-Registered: true` and the `Set-Cookie` header replaces the anon cookie with an authenticated one (`sub: <user_uuid>`, `status: "auth"`). All previous anon turns are reassigned to the new user_id on the backend so no history is lost.

6. **Subsequent turns** flow through the same `POST /api/chat`. The backend recalls relevant prior turns + profile facts + FAQs + docs and feeds them as context to the LLM.

## Streaming

`POST /api/chat` with `{ stream: true }` returns a `text/plain; charset=utf-8` chunked response. The frontend reads it with the Web Streams API:

```ts
const { stream, sessionId, registered, toolEvents } = await sendChatStream(message, history);
const reader = stream.getReader();
const decoder = new TextDecoder();
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  appendToken(decoder.decode(value, { stream: true }));
}
```

Tool events are surfaced via the `X-Tool-Events` response header (JSON-encoded array).

## CORS + cookies cross-subdomain

For the frontend at `app.ancestro.ai` to talk to `memory.ancestro.ai`, two things must align:

1. **Backend `ALLOWED_ORIGINS`** must include the frontend's exact origin (no `*` allowed when `credentials: include`).
2. **Backend cookie config**:
   ```bash
   SESSION_COOKIE_DOMAIN=.ancestro.ai
   SESSION_SAMESITE=None
   ```
   `SameSite=None` requires `Secure`, which is auto-set in production.

3. **Frontend fetches** must include `credentials: "include"`. All helpers in `lib/api.ts` already do this.

## Admin permissions

Admin status is derived from the backend env `ADMIN_EMAILS` (comma-separated, lowercase). When a user registers with an email in that list, their `:User` node in FalkorDB gets `is_admin: true`. The admin endpoints check that flag:

- `POST /api/docs/ingest`
- `DELETE /api/docs/sources/:source`
- `POST /api/faqs` / `PUT` / `DELETE`
- `POST /api/admin/purge`

The frontend's `<AuthGate />` reads `is_admin` from `/api/auth/session` and renders the admin routes only when true.

## Mapping legacy endpoints

The original Chatbot Control Center had its own backend. Here's how those endpoints map to memory.ancestro.ai:

| Old (Express + MongoDB + Weaviate)          | New (memory.ancestro.ai)              |
|---------------------------------------------|---------------------------------------|
| `POST /auth/init`                           | `GET /api/auth/session`               |
| `GET /api/config`                           | _stubbed_ (single-tenant for now)     |
| `POST /api/chat`                            | `POST /api/chat`                      |
| `GET/POST /api/ancestro` (FAQ CRUD)         | `GET/POST /api/faqs`                  |
| `PUT/DELETE /api/ancestro/:id`              | `PUT/DELETE /api/faqs/:id`            |
| `POST /api/ancestro/batch-create`           | `POST /api/faqs` with `{ items: […] }`|
| `GET /api/documents`                        | `GET /api/docs/sources`               |
| `POST /api/documents/upload`                | `POST /api/docs/ingest`               |
| `DELETE /api/documents/:id`                 | `DELETE /api/docs/sources/:id`        |
| `POST /api/widget/chat/:agentId`            | `POST /api/chat`                      |
| `GET /api/widget/config/:agentId`           | hardcoded default in `lib/api.ts`     |
| `POST /api/scrape`                          | _not implemented_                     |
| `GET /api/knowledge-gaps`                   | _not implemented_                     |
| `GET /api/errors`                           | _not implemented_                     |
| `GET /api/analytics`                        | _not implemented_                     |
| `GET/PUT /api/email-editor`                 | _not implemented_                     |

The stubbed endpoints return empty data so the existing UI doesn't crash. PRs welcome for the ones marked _not implemented_.
