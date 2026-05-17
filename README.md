# ancestro-chat-frontend

Frontend for **[memory.ancestro.ai](https://memory.ancestro.ai)** — the chat backend that handles vectors (Qdrant), entity graph (FalkorDB), per-user memory, and admin tooling.

This repo is a Vite + React + TypeScript app with:

- **Embeddable chat widget** (`/widget`) — lead form + chat that talks to memory.ancestro.ai
- **Admin console** — knowledge-base CRUD, test chat, embed config, settings
- **Cookie-based auth** — anonymous visitors get a signed session cookie; admins are identified by email whitelist on the backend

## Quick start

```bash
cp .env.example .env
# edit .env: set VITE_API_URL to your backend
npm install
npm run dev    # http://localhost:5000
```

Open the widget at <http://localhost:5000/widget>. Open the admin at <http://localhost:5000/>.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | yes | — | Public URL of memory.ancestro.ai backend |
| `VITE_DEFAULT_AGENT_ID` | no | `default` | Reserved for future multi-agent routing |

Variables prefixed `VITE_` are inlined into the build. Do not put server-only secrets here.

## Backend endpoints expected

The frontend assumes the backend at `VITE_API_URL` exposes these routes (all with `credentials: "include"` and a signed cookie):

```
POST   /api/auth/session            inspect / mint anon cookie
POST   /api/chat                    chat (with tool calling for register_user / quote_energy)
POST   /api/me/forget               GDPR wipe

GET    /api/faqs                    list curated FAQs
POST   /api/faqs                    create FAQ (admin)  — also accepts { items: [...] } for batch
GET    /api/faqs/:id                get one
PUT    /api/faqs/:id                update (admin)
DELETE /api/faqs/:id                delete (admin)

POST   /api/docs/ingest             upload a document for vectorization (admin)
GET    /api/docs/sources            list ingested documents (admin)
DELETE /api/docs/sources/:source    delete a document (admin)

POST   /api/quote                   energy quote (10-40% clamped)
GET    /api/quote/audit             list quotes for the current user
```

## Auth model

1. **Anonymous**: on first visit the backend issues an HttpOnly signed cookie with `user_id = anon_<uuid>`.
2. **Registered**: when the chat detects an email, the `register_user` tool fires and the cookie is upgraded to `user_id = <permanent uuid>`, `status = auth`.
3. **Admin**: if that email is listed in `ADMIN_EMAILS` on the backend, the resulting user record has `is_admin: true` and unlocks admin endpoints.

The frontend never touches API keys or tokens directly — everything flows through cookies.

## Stubbed features

Some pages from the original Chatbot Control Center are kept for layout continuity but the underlying API calls are stubs (they return empty data or throw):

- **Website scraping** — needs Firecrawl integration on the backend
- **Knowledge gaps tracking** — needs unanswered question analytics
- **Error logs / circuit breakers** — needs MongoDB logging on the backend
- **Analytics** — needs session metrics
- **Email composer** — needs a transactional email pipeline

These pages render but with empty data. PRs welcome for backend implementations.

## Project structure

```
client/src/
  pages/
    EmbeddableWidgetPage.tsx     # /widget  — public chat widget
    TestChatPage.tsx             # /test-chat — admin test chat
    KnowledgeBasePage.tsx        # /knowledge-base — FAQ/docs CRUD
    ChatbotSettingsPage.tsx      # / — config (stub)
    AnalyticsPage.tsx            # /analytics (stub)
    EmbedConfigPage.tsx          # /embed — widget embed code generator
    EmailComposerPage.tsx        # /email-composer (stub)
    LoginPage.tsx                # cookie-based admin onboarding
  components/ui/                 # shadcn/ui
  lib/
    api.ts                       # → memory.ancestro.ai client
    queryClient.ts               # React Query config
    schemas.ts                   # Zod schemas
    utils.ts                     # cn() helper
```

## Building for production

```bash
VITE_API_URL=https://memory.ancestro.ai npm run build
```

The static bundle ends up in `dist/`. Serve it from any static host (Nginx, Vercel, Netlify, Cloudflare Pages…) or behind the same nginx that fronts memory.ancestro.ai.

## Embedding the widget on another site

```html
<iframe
  src="https://your-frontend.example.com/widget?agent=default"
  style="position:fixed; bottom:0; right:0; border:0; width:430px; height:640px; z-index:2147483647;"
></iframe>
```

The widget's cookie will be set on the **frontend's domain**, not the host site's, so cross-site embedding works automatically.

## Security

- `.env*` files are git-ignored. Don't commit them.
- A `gitleaks` GitHub Action runs on every push to block accidental secret commits.
- Custom rules for Together AI, OpenAI, and Anthropic key patterns are in `.gitleaks.toml`.
- The backend enforces a strict `ALLOWED_ORIGINS` CORS list — make sure your deployed frontend domain is in that list on memory.ancestro.ai.

## License

MIT — see [`LICENSE`](LICENSE).
