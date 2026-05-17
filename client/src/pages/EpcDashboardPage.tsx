import { useCallback, useEffect, useState } from "react";
import {
  epcApplyToProject,
  epcListProjects,
  type EpcCompany,
  type EpcProject,
} from "@/lib/api";

// Public-facing dashboard for EPC partners — outside the admin auth gate.
// Session identity comes from the same cookie used during chat onboarding;
// if the user hasn't identified as an EPC there, the backend returns 401 and
// we show a prompt back to the chat.

type State =
  | { kind: "loading" }
  | { kind: "needs_chat"; message: string }
  | { kind: "needs_partnership"; message: string; company: EpcCompany }
  | { kind: "ready"; company: EpcCompany; available: EpcProject[]; applied: EpcProject[] }
  | { kind: "error"; message: string };

export default function EpcDashboardPage() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [applying, setApplying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const r = await fetch("/api/epc/projects", { credentials: "include" });
      if (r.status === 401) {
        setState({
          kind: "needs_chat",
          message: "Identifícate primero como EPC en el chat. Abre el widget en la esquina inferior.",
        });
        return;
      }
      if (r.status === 402) {
        const data = await r.json();
        setState({
          kind: "needs_partnership",
          message: data?.message ?? "Membresía pendiente.",
          company: data?.company,
        });
        return;
      }
      if (!r.ok) {
        setState({ kind: "error", message: `HTTP ${r.status}` });
        return;
      }
      const data = await r.json();
      setState({ kind: "ready", company: data.company, available: data.available, applied: data.applied });
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const apply = async (projectId: string) => {
    setApplying(projectId);
    try {
      await epcApplyToProject(projectId);
      await load();
    } catch (e) {
      alert(`No pude aplicar: ${(e as Error).message}`);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Ancestro Partners · EPC</h1>
        <a href="/widget" style={linkStyle}>Volver al chat</a>
      </header>

      {state.kind === "loading" && <Card><p style={mutedStyle}>Cargando…</p></Card>}

      {state.kind === "needs_chat" && <Card><p>{state.message}</p></Card>}

      {state.kind === "needs_partnership" && (
        <Card>
          <h2 style={h2Style}>Membresía pendiente</h2>
          <p>{state.message}</p>
          <p style={mutedStyle}>Empresa: <strong>{state.company?.name}</strong> · estado: <code>{state.company?.status}</code></p>
          <a href="/widget" style={ctaLinkStyle}>Activar membresía en el chat →</a>
        </Card>
      )}

      {state.kind === "error" && <Card><p style={errorStyle}>Error: {state.message}</p></Card>}

      {state.kind === "ready" && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <h2 style={h2Style}>{state.company.name}</h2>
                <p style={mutedStyle}>{state.company.country} · estado: <code>{state.company.status}</code></p>
              </div>
              <span style={badgeStyle}>Partner activo</span>
            </div>
          </Card>

          <Section title={`Proyectos disponibles (${state.available.length})`}>
            {state.available.length === 0 ? (
              <p style={mutedStyle}>No hay proyectos abiertos en {state.company.country} ahora mismo. Te avisamos por email cuando aparezcan.</p>
            ) : (
              state.available.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  cta={
                    <button
                      onClick={() => apply(p.id)}
                      disabled={applying === p.id}
                      style={primaryBtnStyle}
                    >
                      {applying === p.id ? "Aplicando…" : "Aplicar a este proyecto"}
                    </button>
                  }
                />
              ))
            )}
          </Section>

          <Section title={`Mis aplicaciones (${state.applied.length})`}>
            {state.applied.length === 0 ? (
              <p style={mutedStyle}>Aún no has aplicado a ningún proyecto.</p>
            ) : (
              state.applied.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  cta={<span style={appliedTagStyle}>Aplicado · {p.status}</span>}
                />
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b", marginBottom: 8 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: 16,
    }}>{children}</div>
  );
}

function ProjectCard({ project, cta }: { project: EpcProject; cta: React.ReactNode }) {
  return (
    <div style={projectCardStyle}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{project.title}</div>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>
          {project.country}{project.region ? ` · ${project.region}` : ""}{project.capacityKwp ? ` · ${project.capacityKwp} kWp` : ""}{project.customerType ? ` · ${project.customerType}` : ""}
        </div>
        {project.description && <div style={{ fontSize: 13, color: "#334155" }}>{project.description}</div>}
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
          {project.budgetUsd != null && `Presupuesto: $${project.budgetUsd.toLocaleString()} USD · `}
          {project.deadline && `Cierre: ${project.deadline} · `}
          {project.applicantsCount} aplicantes
        </div>
      </div>
      <div style={{ flexShrink: 0, alignSelf: "center" }}>{cta}</div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const pageStyle: React.CSSProperties = {
  maxWidth: 960, margin: "32px auto", padding: "0 24px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: "#0f172a", background: "#f8fafc", minHeight: "100vh",
};
const headerStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  marginBottom: 24, padding: "16px 0",
};
const h2Style: React.CSSProperties = { margin: 0, fontSize: 18 };
const mutedStyle: React.CSSProperties = { color: "#64748b", margin: "6px 0" };
const errorStyle: React.CSSProperties = { color: "#dc2626" };
const linkStyle: React.CSSProperties = { color: "#0ea5e9", textDecoration: "none", fontSize: 14 };
const ctaLinkStyle: React.CSSProperties = {
  display: "inline-block", marginTop: 8, padding: "10px 16px",
  background: "#0ea5e9", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600,
};
const badgeStyle: React.CSSProperties = {
  background: "#dcfce7", color: "#166534", padding: "4px 10px",
  borderRadius: 999, fontSize: 12, fontWeight: 600,
};
const projectCardStyle: React.CSSProperties = {
  display: "flex", gap: 16, padding: 16,
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 16px", background: "#0ea5e9", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer",
};
const appliedTagStyle: React.CSSProperties = {
  fontSize: 12, color: "#64748b", fontWeight: 600,
};
