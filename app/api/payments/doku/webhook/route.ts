import { getDokuWebhookHeaders, verifyDokuWebhookSignature } from "@/lib/doku";
import { applyDokuNotification, savePaymentWebhookEvent } from "@/lib/paymentDb";
import { NextResponse } from "next/server";

export const runtime = "edge";

type DokuNotificationBody = {
  order?: {
    invoice_number?: string;
  };
  transaction?: {
    status?: string;
    date?: string;
  };
};

function normalizeStatus(value: string | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

async function createEventKey(rawBody: string, requestId: string | null): Promise<string> {
  if (requestId && requestId.trim().length > 0) {
    return `doku:${requestId.trim()}`;
  }

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
  return `doku:body:${hex}`;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const requestTarget = requestUrl.pathname + (requestUrl.search || "");

  const rawBody = await request.text();

  const signatureValid = await verifyDokuWebhookSignature({
    headers: request.headers,
    rawBody,
    requestTarget,
  }).catch(() => false);

  if (!signatureValid) {
    return NextResponse.json({ ok: false, message: "Invalid signature." }, { status: 401 });
  }

  let payload: DokuNotificationBody;
  try {
    payload = (rawBody ? JSON.parse(rawBody) : {}) as DokuNotificationBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid payload." }, { status: 400 });
  }

  const invoiceNumber = payload.order?.invoice_number?.trim() ?? "";
  const transactionStatus = normalizeStatus(payload.transaction?.status);
  const transactionDate = payload.transaction?.date ?? null;

  if (!invoiceNumber || !transactionStatus) {
    return NextResponse.json(
      { ok: false, message: "invoice_number dan transaction.status wajib ada." },
      { status: 400 }
    );
  }

  const webhookHeaders = getDokuWebhookHeaders(request.headers);
  const eventKey = await createEventKey(rawBody, webhookHeaders.requestId);
  const stored = await savePaymentWebhookEvent({
    provider: "DOKU",
    eventKey,
    requestId: webhookHeaders.requestId,
    invoiceNumber,
    payload: payload as Record<string, unknown>,
  });

  if (!stored) {
    return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
  }

  const result = await applyDokuNotification({
    invoiceNumber,
    transactionStatus,
    transactionDate,
    payload: payload as Record<string, unknown>,
  });

  return NextResponse.json(
    { ok: true, applied: result.applied, status: result.status },
    { status: 200 }
  );
}
