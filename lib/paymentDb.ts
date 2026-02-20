import { runD1Query } from "@/lib/cloudflareD1";

let ensurePaymentTablesPromise: Promise<void> | null = null;

export type PaymentOrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "CANCELED"
  | "REFUNDED";

type PaymentOrderRow = {
  id: string;
  provider: string;
  invoice_number: string;
  doku_request_id: string | null;
  user_id: string | null;
  user_email: string;
  user_name: string;
  user_provider: string | null;
  template_slug: string;
  template_name: string;
  template_download_url: string | null;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  checkout_url: string | null;
  checkout_expires_at: string | null;
  doku_payload_json: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type TemplateAccessRow = {
  id: string;
  user_email: string;
  template_slug: string;
  template_name: string;
  download_url: string | null;
  provider: string;
  source_order_invoice: string;
  granted_at: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function nullableString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensurePaymentTablesInner(): Promise<void> {
  await runD1Query(`
    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      doku_request_id TEXT,
      user_id TEXT,
      user_email TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_provider TEXT,
      template_slug TEXT NOT NULL,
      template_name TEXT NOT NULL,
      template_download_url TEXT,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'IDR',
      status TEXT NOT NULL,
      checkout_url TEXT,
      checkout_expires_at TEXT,
      doku_payload_json TEXT,
      paid_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_payment_orders_user_template
    ON payment_orders(user_email, template_slug, created_at DESC);
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_payment_orders_status_created
    ON payment_orders(status, created_at DESC);
  `);

  await runD1Query(`
    CREATE TABLE IF NOT EXISTS purchased_templates (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      template_slug TEXT NOT NULL,
      template_name TEXT NOT NULL,
      download_url TEXT,
      provider TEXT NOT NULL DEFAULT 'DOKU',
      source_order_invoice TEXT NOT NULL,
      granted_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_email, template_slug)
    );
  `);

  await runD1Query(`
    CREATE INDEX IF NOT EXISTS idx_purchased_templates_user
    ON purchased_templates(user_email, granted_at DESC);
  `);

  await runD1Query(`
    CREATE TABLE IF NOT EXISTS payment_webhook_events (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      event_key TEXT NOT NULL UNIQUE,
      request_id TEXT,
      invoice_number TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export async function ensurePaymentTables(): Promise<void> {
  if (!ensurePaymentTablesPromise) {
    ensurePaymentTablesPromise = ensurePaymentTablesInner().catch((error) => {
      ensurePaymentTablesPromise = null;
      throw error;
    });
  }

  await ensurePaymentTablesPromise;
}

export async function createPaymentOrder(params: {
  provider: "DOKU";
  invoiceNumber: string;
  userId?: string;
  userEmail: string;
  userName: string;
  userProvider?: string;
  templateSlug: string;
  templateName: string;
  templateDownloadUrl?: string | null;
  amount: number;
  currency?: string;
  status?: PaymentOrderStatus;
}): Promise<void> {
  await ensurePaymentTables();
  const now = nowIso();

  await runD1Query(
    `INSERT INTO payment_orders (
      id, provider, invoice_number, doku_request_id, user_id, user_email, user_name, user_provider,
      template_slug, template_name, template_download_url, amount, currency, status,
      checkout_url, checkout_expires_at, doku_payload_json, paid_at, created_at, updated_at
    ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?)`,
    [
      crypto.randomUUID(),
      params.provider,
      params.invoiceNumber,
      nullableString(params.userId),
      normalizeEmail(params.userEmail),
      params.userName.trim(),
      nullableString(params.userProvider),
      params.templateSlug,
      params.templateName,
      nullableString(params.templateDownloadUrl),
      Math.round(params.amount),
      params.currency ?? "IDR",
      params.status ?? "PENDING",
      now,
      now,
    ]
  );
}

export async function updatePaymentOrderCheckout(params: {
  invoiceNumber: string;
  checkoutUrl: string;
  checkoutExpiresAt?: string | null;
  dokuRequestId?: string;
  rawPayload?: Record<string, unknown>;
}): Promise<void> {
  await ensurePaymentTables();
  const now = nowIso();

  await runD1Query(
    `UPDATE payment_orders
     SET checkout_url = ?,
         checkout_expires_at = ?,
         doku_request_id = ?,
         doku_payload_json = COALESCE(?, doku_payload_json),
         updated_at = ?
     WHERE invoice_number = ?`,
    [
      params.checkoutUrl,
      nullableString(params.checkoutExpiresAt),
      nullableString(params.dokuRequestId),
      params.rawPayload ? JSON.stringify(params.rawPayload) : null,
      now,
      params.invoiceNumber,
    ]
  );
}

export async function markPaymentOrderFailed(
  invoiceNumber: string,
  rawPayload?: Record<string, unknown>
): Promise<void> {
  await ensurePaymentTables();
  const now = nowIso();

  await runD1Query(
    `UPDATE payment_orders
     SET status = 'FAILED',
         doku_payload_json = COALESCE(?, doku_payload_json),
         updated_at = ?
     WHERE invoice_number = ? AND status = 'PENDING'`,
    [rawPayload ? JSON.stringify(rawPayload) : null, now, invoiceNumber]
  );
}

export async function findPaymentOrderByInvoice(
  invoiceNumber: string
): Promise<PaymentOrderRow | null> {
  await ensurePaymentTables();

  const rows = await runD1Query<PaymentOrderRow>(
    `SELECT id, provider, invoice_number, doku_request_id, user_id, user_email, user_name, user_provider,
            template_slug, template_name, template_download_url, amount, currency, status,
            checkout_url, checkout_expires_at, doku_payload_json, paid_at, created_at, updated_at
     FROM payment_orders
     WHERE invoice_number = ?
     LIMIT 1`,
    [invoiceNumber]
  );

  return rows[0] ?? null;
}

export async function savePaymentWebhookEvent(params: {
  provider: "DOKU";
  eventKey: string;
  requestId?: string | null;
  invoiceNumber?: string | null;
  payload: Record<string, unknown>;
}): Promise<boolean> {
  await ensurePaymentTables();

  const existing = await runD1Query<{ event_key: string }>(
    "SELECT event_key FROM payment_webhook_events WHERE event_key = ? LIMIT 1",
    [params.eventKey]
  );

  if (existing.length > 0) {
    return false;
  }

  await runD1Query(
    `INSERT INTO payment_webhook_events (
      id, provider, event_key, request_id, invoice_number, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      params.provider,
      params.eventKey,
      nullableString(params.requestId),
      nullableString(params.invoiceNumber),
      JSON.stringify(params.payload),
      nowIso(),
    ]
  );

  return true;
}

function mapDokuStatus(status: string): PaymentOrderStatus {
  const value = status.trim().toUpperCase();
  if (value === "SUCCESS") return "PAID";
  if (value === "FAILED") return "FAILED";
  if (value === "EXPIRED") return "EXPIRED";
  if (value === "REFUNDED") return "REFUNDED";
  if (value === "CANCELLED" || value === "CANCELED") return "CANCELED";
  return "PENDING";
}

export async function applyDokuNotification(params: {
  invoiceNumber: string;
  transactionStatus: string;
  transactionDate?: string | null;
  payload: Record<string, unknown>;
}): Promise<{ applied: boolean; status: PaymentOrderStatus | null }> {
  await ensurePaymentTables();

  const order = await findPaymentOrderByInvoice(params.invoiceNumber);
  if (!order) {
    return { applied: false, status: null };
  }

  const nextStatus = mapDokuStatus(params.transactionStatus);
  const now = nowIso();
  const paidAt =
    nextStatus === "PAID"
      ? (nullableString(params.transactionDate) ?? order.paid_at ?? now)
      : order.paid_at;

  await runD1Query(
    `UPDATE payment_orders
     SET status = ?,
         doku_payload_json = ?,
         paid_at = ?,
         updated_at = ?
     WHERE invoice_number = ?`,
    [nextStatus, JSON.stringify(params.payload), paidAt, now, params.invoiceNumber]
  );

  if (nextStatus === "PAID") {
    await grantTemplateAccess({
      userEmail: order.user_email,
      templateSlug: order.template_slug,
      templateName: order.template_name,
      downloadUrl: order.template_download_url,
      sourceOrderInvoice: order.invoice_number,
      provider: "DOKU",
      grantedAt: paidAt ?? now,
    });
  }

  if (nextStatus === "REFUNDED" || nextStatus === "CANCELED") {
    await revokeTemplateAccess(order.user_email, order.template_slug);
  }

  return {
    applied: true,
    status: nextStatus,
  };
}

export async function hasTemplateAccess(userEmail: string, templateSlug: string): Promise<boolean> {
  await ensurePaymentTables();
  const rows = await runD1Query<{ id: string }>(
    `SELECT id
     FROM purchased_templates
     WHERE user_email = ? AND template_slug = ? AND revoked_at IS NULL
     LIMIT 1`,
    [normalizeEmail(userEmail), templateSlug]
  );

  return rows.length > 0;
}

export async function getTemplateAccessRecord(
  userEmail: string,
  templateSlug: string
): Promise<TemplateAccessRow | null> {
  await ensurePaymentTables();

  const rows = await runD1Query<TemplateAccessRow>(
    `SELECT id, user_email, template_slug, template_name, download_url, provider,
            source_order_invoice, granted_at, revoked_at, created_at, updated_at
     FROM purchased_templates
     WHERE user_email = ? AND template_slug = ?
     LIMIT 1`,
    [normalizeEmail(userEmail), templateSlug]
  );

  return rows[0] ?? null;
}

export async function grantTemplateAccess(params: {
  userEmail: string;
  templateSlug: string;
  templateName: string;
  downloadUrl?: string | null;
  provider: "DOKU";
  sourceOrderInvoice: string;
  grantedAt?: string;
}): Promise<void> {
  await ensurePaymentTables();
  const now = nowIso();

  await runD1Query(
    `INSERT INTO purchased_templates (
      id, user_email, template_slug, template_name, download_url, provider,
      source_order_invoice, granted_at, revoked_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    ON CONFLICT(user_email, template_slug)
    DO UPDATE SET
      template_name = excluded.template_name,
      download_url = excluded.download_url,
      provider = excluded.provider,
      source_order_invoice = excluded.source_order_invoice,
      granted_at = excluded.granted_at,
      revoked_at = NULL,
      updated_at = excluded.updated_at`,
    [
      crypto.randomUUID(),
      normalizeEmail(params.userEmail),
      params.templateSlug,
      params.templateName,
      nullableString(params.downloadUrl),
      params.provider,
      params.sourceOrderInvoice,
      nullableString(params.grantedAt) ?? now,
      now,
      now,
    ]
  );
}

export async function revokeTemplateAccess(userEmail: string, templateSlug: string): Promise<void> {
  await ensurePaymentTables();

  await runD1Query(
    `UPDATE purchased_templates
     SET revoked_at = ?, updated_at = ?
     WHERE user_email = ? AND template_slug = ? AND revoked_at IS NULL`,
    [nowIso(), nowIso(), normalizeEmail(userEmail), templateSlug]
  );
}
