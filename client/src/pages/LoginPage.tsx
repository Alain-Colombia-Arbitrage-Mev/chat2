import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { login, type SessionInfo } from "@/lib/api";

interface LoginPageProps {
  onLogin: () => Promise<void> | void;
  session: SessionInfo | null;
}

/**
 * Password-based admin login.
 *
 * memory.ancestro.ai exposes `POST /api/auth/login` which verifies the
 * (email, password) pair against bcrypt hashes in `ADMIN_USERS`. On success,
 * the backend sets a signed session cookie with `status: "auth"` and
 * `is_admin: true` (if the email is also in `ADMIN_EMAILS`).
 */
export default function LoginPage({ onLogin, session }: LoginPageProps) {
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      await login(email.trim().toLowerCase(), password);
      await onLogin();
    } catch (e) {
      const msg = (e as Error).message ?? "Login failed";
      setError(msg.toLowerCase().includes("credential") ? "Invalid email or password." : msg);
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
          Sign in with your admin credentials.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground/80">Email</label>
            <input
              type="email"
              className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              autoFocus
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground/80">Password</label>
            <input
              type="password"
              className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              autoComplete="current-password"
              required
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
            {busy ? "Signing in…" : "Sign in"}
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
