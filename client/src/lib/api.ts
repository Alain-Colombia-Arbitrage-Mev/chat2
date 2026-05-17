// =====================================================================
// API client for memory.ancestro.ai
//
// All endpoints live on a single backend exposed via VITE_API_URL.
// Authentication is cookie-based (HttpOnly, signed). Every fetch uses
// credentials: "include" so the session cookie flows automatically.
//
// Some legacy admin features (scraping, knowledge gaps, error logs,
// email editor, analytics) don't exist in memory.ancestro.ai yet — they
// are stubbed below with empty data so the existing UI doesn't crash.
// =====================================================================

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function url(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}

async function fetchJSON<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const res = await fetch(url(path), {
    ...options,
    credentials: "include",
    headers,
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const msg =
      (body as { error?: string } | null)?.error ?? `${res.status} ${res.statusText}`;
    const err = new Error(msg) as Error & {
      response?: { status: number; data: unknown };
    };
    err.response = { status: res.status, data: body };
    throw err;
  }
  return (await res.json()) as T;
}

// =====================================================================
// SESSION — cookie-based anon/auth
// =====================================================================

export interface SessionInfo {
  user_id: string;
  status: "anon" | "auth";
  issued_at: number;
  is_new: boolean;
  user: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    is_admin: boolean;
    created_at: number;
  } | null;
}

export async function getSession(): Promise<SessionInfo> {
  return fetchJSON<SessionInfo>("/api/auth/session");
}

export async function forgetMe(): Promise<{
  ok: boolean;
  erased_user_id: string;
  new_user_id: string;
}> {
  return fetchJSON("/api/me/forget", { method: "POST" });
}

// Legacy auth helpers kept for compatibility with existing imports — no-ops now.
export function setAuthToken(_token: string, _expiry: number) {}
export function clearAuth() {}
export function getUserFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("user");
}

// =====================================================================
// CHAT
// =====================================================================

export interface ChatSource {
  type: "faq" | "doc" | "turn" | "profile";
  id: string | number;
  score: number;
  title?: string;
  content?: string;
  category?: string | null;
  question?: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  user_id: string;
  session_status: "anon" | "auth";
  registered?: boolean;
  tool_events: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
  sources: {
    docs: Array<{ id: string | number; score: number; file?: string }>;
    turns: Array<{ id: string | number; score: number; role?: string }>;
    profile: Array<{ id: string | number; score: number }>;
    faqs: Array<{
      id: string | number;
      score: number;
      question?: string;
      category?: string | null;
    }>;
  };
}

export async function sendChatMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  options: { sessionId?: string; useTools?: boolean } = {},
): Promise<ChatResponse> {
  return fetchJSON<ChatResponse>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: conversationHistory,
      session_id: options.sessionId,
      use_tools: options.useTools ?? true,
    }),
  });
}

/** Streaming version — returns the raw ReadableStream so callers can render token-by-token. */
export async function sendChatStream(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  options: { sessionId?: string; useTools?: boolean } = {},
): Promise<{
  stream: ReadableStream<Uint8Array>;
  sessionId: string | null;
  userId: string | null;
  status: string | null;
  registered: boolean;
  toolEvents: ChatResponse["tool_events"];
}> {
  const res = await fetch(url("/api/chat"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: conversationHistory,
      session_id: options.sessionId,
      use_tools: options.useTools ?? true,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`chat ${res.status}: ${await res.text().catch(() => "")}`);
  }
  let toolEvents: ChatResponse["tool_events"] = [];
  try {
    const raw = res.headers.get("X-Tool-Events");
    if (raw) toolEvents = JSON.parse(raw);
  } catch {}
  return {
    stream: res.body,
    sessionId: res.headers.get("X-Session-Id"),
    userId: res.headers.get("X-User-Id"),
    status: res.headers.get("X-Session-Status"),
    registered: res.headers.get("X-Registered") === "true",
    toolEvents,
  };
}

// =====================================================================
// CLIENT CONFIG — stub (memory.ancestro.ai is single-tenant for now)
// =====================================================================

export async function getClientConfig() {
  return {
    chatbotName: "Ancestro AI",
    systemPrompt: "",
    widgetConfig: {
      primaryColor: "#2d92dc",
      accentColor: "#1a1a2e",
      buttonText: "Ask AI",
      chatHeaderTitle: "Ancestro Chat",
      position: "right" as const,
      customCss: "",
      inputPlaceholder: "Type a message…",
    },
  };
}

export async function updateClientConfig(_data: unknown) {
  console.warn("[stub] updateClientConfig: per-agent config not implemented");
  return { ok: true };
}

// =====================================================================
// FAQs (formerly "QA pairs")
// =====================================================================

export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  subcategory: string | null;
  source_type: string | null;
  tags: string[];
  created_at: number;
  updated_at: number;
}

/** Legacy alias kept for backward-compatible imports. */
export type QaPair = FaqRecord & { topic: string };

function faqToQaPair(f: FaqRecord): QaPair {
  return { ...f, topic: f.category ?? "" };
}

export async function getQaPairs(): Promise<QaPair[]> {
  const all: FaqRecord[] = [];
  let offset: string | number | undefined = undefined;
  for (let page = 0; page < 50; page++) {
    const qs =
      offset !== undefined
        ? `?offset=${encodeURIComponent(String(offset))}&limit=200`
        : "?limit=200";
    const res = await fetchJSON<{
      items: FaqRecord[];
      next_page_offset: string | number | null;
    }>(`/api/faqs${qs}`);
    all.push(...res.items);
    if (!res.next_page_offset) break;
    offset = res.next_page_offset;
  }
  return all.map(faqToQaPair);
}

export async function createQaPair(data: {
  topic: string;
  question: string;
  answer: string;
}): Promise<QaPair> {
  const r = await fetchJSON<{ ok: true; faq: FaqRecord }>("/api/faqs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: data.topic,
      question: data.question,
      answer: data.answer,
    }),
  });
  return faqToQaPair(r.faq);
}

export async function updateQaPair(
  id: string,
  data: { topic?: string; question?: string; answer?: string },
): Promise<QaPair> {
  const r = await fetchJSON<{ ok: true; faq: FaqRecord }>(
    `/api/faqs/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: data.topic,
        question: data.question,
        answer: data.answer,
      }),
    },
  );
  return faqToQaPair(r.faq);
}

export async function deleteQaPair(id: string) {
  return fetchJSON(`/api/faqs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function batchCreateQaPairs(
  items: Array<{ topic: string; question: string; answer: string }>,
): Promise<{ created: number }> {
  return fetchJSON("/api/faqs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((it) => ({
        question: it.question,
        answer: it.answer,
        category: it.topic,
      })),
    }),
  });
}

export async function batchUpdateQaPairs(
  updates: Array<{ id: string; topic?: string; question?: string; answer?: string }>,
) {
  for (const u of updates) {
    await updateQaPair(u.id, u);
  }
  return { ok: true, updated: updates.length };
}

// =====================================================================
// DOCUMENTS — file uploads to the global knowledge base
// =====================================================================

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  sourceIdentifier: string;
  status: "ready" | "processing" | "failed";
  errorMessage: string | null;
  uploadedAt: string;
}

interface DocsSourcesResponse {
  count: number;
  total_chunks: number;
  sources: Array<{ source: string; chunks: number; kind: string }>;
}

export async function getDocuments(): Promise<UploadedDocument[]> {
  const res = await fetchJSON<DocsSourcesResponse>("/api/docs/sources");
  return res.sources.map((s) => ({
    id: s.source,
    fileName: s.source,
    fileType: s.kind,
    fileSize: 0,
    chunkCount: s.chunks,
    sourceIdentifier: s.source,
    status: "ready" as const,
    errorMessage: null,
    uploadedAt: "",
  }));
}

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("replace", "true");
  const res = await fetch(url("/api/docs/ingest"), {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `upload ${res.status}`);
  }
  const data = (await res.json()) as {
    ok: boolean;
    source: string;
    kind: string;
    chunks_inserted: number;
  };
  return {
    id: data.source,
    fileName: data.source,
    fileType: data.kind,
    fileSize: file.size,
    chunkCount: data.chunks_inserted,
    sourceIdentifier: data.source,
    status: "ready",
    errorMessage: null,
    uploadedAt: new Date().toISOString(),
  };
}

export async function deleteDocument(docId: string): Promise<{ success: boolean }> {
  await fetchJSON(`/api/docs/sources/${encodeURIComponent(docId)}`, {
    method: "DELETE",
  });
  return { success: true };
}

export interface BatchUploadResult {
  success: boolean;
  processed: number;
  successCount: number;
  failCount: number;
  skipped: number;
  results: Array<{
    fileName: string;
    success: boolean;
    error?: string;
    docId?: string;
    chunksCreated?: number;
  }>;
}

export async function uploadDocuments(files: File[]): Promise<BatchUploadResult> {
  const results: BatchUploadResult["results"] = [];
  let successCount = 0;
  let failCount = 0;
  for (const f of files) {
    try {
      const r = await uploadDocument(f);
      results.push({
        fileName: f.name,
        success: true,
        docId: r.id,
        chunksCreated: r.chunkCount,
      });
      successCount++;
    } catch (e) {
      results.push({
        fileName: f.name,
        success: false,
        error: (e as Error).message,
      });
      failCount++;
    }
  }
  return {
    success: failCount === 0,
    processed: files.length,
    successCount,
    failCount,
    skipped: 0,
    results,
  };
}

// =====================================================================
// STUBS — features not yet implemented in memory.ancestro.ai
// =====================================================================

export interface ScrapedUrl {
  source_url: string;
  page_title: string;
  chunk_count: number;
  scraped_at: string;
}
export interface ScrapeResult {
  success: boolean;
  url: string;
  pageTitle: string;
  chunksCreated: number;
  error?: string;
}
export interface CrawlResult {
  success: boolean;
  pagesScraped: number;
  totalChunks: number;
  results: ScrapeResult[];
  error?: string;
}
export interface RescrapeResult {
  success: boolean;
  deletedOldChunks?: number;
  newChunks?: number;
  pageTitle?: string;
  error?: string;
}
export interface RescrapeAllResult {
  success: boolean;
  totalUrls: number;
  successfulRescrapes: number;
  failedRescrapes: number;
  results: Array<{ url: string; success: boolean; newChunks?: number; error?: string }>;
}

const NOT_IMPLEMENTED = "Feature not yet implemented in memory.ancestro.ai backend";

export async function getScrapedUrls(): Promise<ScrapedUrl[]> {
  return [];
}
export async function scrapeUrl(_u: string): Promise<ScrapeResult> {
  throw new Error(NOT_IMPLEMENTED);
}
export async function crawlWebsite(
  _u: string,
  _options?: { maxPages?: number; includePaths?: string[]; excludePaths?: string[] },
): Promise<CrawlResult> {
  throw new Error(NOT_IMPLEMENTED);
}
export async function deleteScrapedUrl(_u: string) {
  return { success: true, deletedChunks: 0 };
}
export async function deleteAllScrapedContent() {
  return { success: true, deletedChunks: 0 };
}
export async function rescrapeUrl(_u: string): Promise<RescrapeResult> {
  throw new Error(NOT_IMPLEMENTED);
}
export async function rescrapeAllUrls(): Promise<RescrapeAllResult> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function getUnansweredQuestions() {
  return [];
}
export async function createUnansweredQuestion(_d: unknown) {
  throw new Error(NOT_IMPLEMENTED);
}
export async function updateUnansweredQuestion(_id: string, _d: unknown) {
  throw new Error(NOT_IMPLEMENTED);
}
export async function deleteUnansweredQuestion(_id: string) {
  throw new Error(NOT_IMPLEMENTED);
}
export async function convertUnansweredToFaq(_id: string, _d: unknown) {
  throw new Error(NOT_IMPLEMENTED);
}

export type ErrorService = "firecrawl" | "weaviate" | "mongodb" | "api";
export type ErrorSeverity = "info" | "warning" | "error" | "critical";
export type ErrorStatus = "logged" | "retrying" | "retry_exhausted" | "resolved";
export interface ErrorLogEntry {
  _id?: string;
  agentId: string;
  service: ErrorService;
  operation: string;
  severity: ErrorSeverity;
  errorCode: string;
  message: string;
  stack?: string;
  retryCount: number;
  maxRetries: number;
  status: ErrorStatus;
  occurredAt: string;
  resolvedAt?: string;
  meta?: Record<string, unknown>;
}
export interface ErrorStats {
  total: number;
  byService: Record<string, number>;
  bySeverity: Record<string, number>;
  recentCritical: number;
}
export interface CircuitBreakerStatus {
  isOpen: boolean;
  failures: number;
  timeUntilHalfOpen?: number;
}
export async function getErrorLogs(_o?: unknown): Promise<ErrorLogEntry[]> {
  return [];
}
export async function getErrorStats(): Promise<ErrorStats> {
  return { total: 0, byService: {}, bySeverity: {}, recentCritical: 0 };
}
export async function getCircuitBreakerStatus(
  _s: ErrorService,
): Promise<CircuitBreakerStatus> {
  return { isOpen: false, failures: 0 };
}

export type KnowledgeGapPriority = "high" | "medium" | "low";
export type KnowledgeGapCategory =
  | "policy"
  | "product"
  | "shipping"
  | "returns"
  | "pricing"
  | "general";
export interface KnowledgeGap {
  _id: string;
  timestamp: string;
  contact_name: string;
  customer_question: string;
  knowledge_gap_analysis: null;
  location_id: string;
  resolved: boolean;
}
export interface KnowledgeGapsResponse {
  knowledge_gaps: KnowledgeGap[];
  count: number;
}
export interface KnowledgeGapStats {
  total: number;
  resolved: number;
  unresolved: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}
export async function getKnowledgeGaps(_o?: unknown): Promise<KnowledgeGapsResponse> {
  return { knowledge_gaps: [], count: 0 };
}
export async function getKnowledgeGapStats(): Promise<KnowledgeGapStats> {
  return {
    total: 0,
    resolved: 0,
    unresolved: 0,
    byPriority: {},
    byCategory: {},
  };
}
export async function resolveKnowledgeGap(_id: string, _d: unknown) {
  throw new Error(NOT_IMPLEMENTED);
}

export interface AnalyticsData {
  totalSessions: number;
  successfullyAnswered: number;
  notAnswered: number;
  adminSessions: number;
  widgetSessions: number;
  averageConfidence: number;
  dailySessions: Array<{ date: string; count: number; answered: number; notAnswered: number }>;
  unansweredOpen: number;
  unansweredResolved: number;
  totalDocuments: number;
  totalScrapedUrls: number;
  totalFaqs: number;
}
export async function getAnalytics(): Promise<AnalyticsData> {
  return {
    totalSessions: 0,
    successfullyAnswered: 0,
    notAnswered: 0,
    adminSessions: 0,
    widgetSessions: 0,
    averageConfidence: 0,
    dailySessions: [],
    unansweredOpen: 0,
    unansweredResolved: 0,
    totalDocuments: 0,
    totalScrapedUrls: 0,
    totalFaqs: 0,
  };
}

export type EmailPreviewLang = "en" | "es" | "pt" | "ar" | "zh";
export interface EmailDraftResponse {
  html: string | null;
  design: Record<string, unknown> | null;
  updatedAt: string | null;
}
export async function getEmailDraft(): Promise<EmailDraftResponse> {
  return { html: null, design: null, updatedAt: null };
}
export async function saveEmailDraft(
  _h: string,
  _d: Record<string, unknown> | null,
) {
  throw new Error(NOT_IMPLEMENTED);
}
export async function deleteEmailDraft() {
  return { ok: true };
}
export async function getComposerPreview(_lang: EmailPreviewLang): Promise<string> {
  return "<html><body><p>Email composer not yet implemented.</p></body></html>";
}
