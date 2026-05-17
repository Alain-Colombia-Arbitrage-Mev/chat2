import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { sendChatMessage, type SessionInfo } from "@/lib/api";

interface LoginPageProps {
  onLogin: () => Promise<void> | void;
  session: SessionInfo | null;
}

/**
 * memory.ancestro.ai has no /auth/login endpoint. Identity is established by
 * the chat's register_user tool, which fires when the user reveals their
 * email. If that email is listed in ADMIN_EMAILS on the backend, the
 * resulting session has is_admin = true.
 *
 * This page packages that flow as a familiar form. We send the form contents
 * as a chat turn; backend tools handle the rest.
 */
export default function LoginPage({ onLogin, session }: LoginPageProps) {
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [company, setCompany] = useState(session?.user?.company ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setError("Name and email are required.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const message = `Soy ${name.trim()}, mi email es ${email.trim().toLowerCase()}${
        company.trim() ? `, empresa ${company.trim()}` : ""
      }. Ábreme la consola de administración.`;
      await sendChatMessage(message, []);
      await onLogin();
    } catch (e) {
      setError((e as Error).message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card border rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1 text-primary">
          <ShieldCheck className="w-5 h-5" />
          <h1 className="text-lg font-semibold">Admin console</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Identify yourself to access the admin console. Your email must be in{" "}
          <code className="text-xs bg-muted px-1 rounded">ADMIN_EMAILS</code> on
          the backend.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground/80">Name</label>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Email</label>
            <input
              type="email"
              className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">
              Company <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={busy}
            />
          </div>
          {error && (
            <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded p-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {busy ? "Authenticating…" : "Enter"}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Current session:{" "}
          <code className="bg-muted px-1 rounded">{session?.status ?? "?"}</code>
          {session?.user?.email && (
            <>
              {" "}as <code className="bg-muted px-1 rounded">{session.user.email}</code>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
