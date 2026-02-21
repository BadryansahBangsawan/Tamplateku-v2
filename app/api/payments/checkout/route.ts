import { getRequestAuthUser } from "@/lib/authRequest";
import {
  createDokuCheckout,
  getDokuConfig,
  getDokuWebhookHeaders,
  DokuRequestError,
  verifyDokuWebhookSignature,
} from "@/lib/doku";
import {
  applyDokuNotification,
  createPaymentOrder,
  hasTemplateAccess,
  markPaymentOrderFailed,
  savePaymentWebhookEvent,
  updatePaymentOrderCheckout,
} from "@/lib/paymentDb";
import { getTemplateBySlugServer } from "@/lib/templateServer";
import { NextResponse } from "next/server";

export const runtime = "edge";

type PaymentGatewayMode = "DOKU" | "SIMULATED";

function getPaymentGatewayMode(): PaymentGatewayMode {
  const value = process.env.PAYMENT_GATEWAY_MODE?.trim().toUpperCase();
  if (value === "SIMULATED") return "SIMULATED";
  return "DOKU";
}

function resolveTemplateSlugFromUrl(request: Request): string {
  return new URL(request.url).searchParams.get("slug")?.trim() ?? "";
}

function getTemplateDownloadUrl(template: {
  download_url?: string | null;
  project_link?: string | null;
  case_study_link?: string | null;
}): string | null {
  if (template.download_url && template.download_url.trim().length > 0)
    return template.download_url;
  if (template.project_link && template.project_link.trim().length > 0)
    return template.project_link;
  if (template.case_study_link && template.case_study_link !== "#") return template.case_study_link;
  return null;
}

function generateInvoiceNumber(): string {
  const stamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 90_000 + 10_000).toString();
  return `TMP${stamp}${random}`;
}

function resolvePublicOrigin(request: Request): string {
  const configured = process.env.DOKU_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
}

function sanitizeGatewayMessage(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Gateway pembayaran tidak merespons dengan benar.";
  const looksLikeHtml =
    /^<!doctype/i.test(trimmed) ||
    /^<html/i.test(trimmed) ||
    /^<!--\[if/i.test(trimmed) ||
    /<head|<body|<title/i.test(trimmed);

  if (looksLikeHtml) {
    return "Gateway pembayaran sedang bermasalah. Coba lagi beberapa menit.";
  }

  return trimmed.slice(0, 220);
}

function formatCheckoutFailureMessage(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized.includes("INTERNAL SERVER ERROR")) {
    return "Gateway DOKU masih menolak transaksi (INTERNAL SERVER ERROR). Periksa aktivasi channel pembayaran di dashboard DOKU.";
  }
  if (normalized.includes("PAYMENT CHANNEL IS INACTIVE")) {
    return "Channel pembayaran DOKU untuk metode ini belum aktif. Aktifkan minimal satu channel checkout (misal VA/QRIS) lalu coba lagi.";
  }
  if (normalized.includes("PLEASE USE ANOTHER PAYMENT METHOD")) {
    return "Metode pembayaran yang dipilih tidak tersedia. Gunakan metode lain yang sudah aktif di dashboard DOKU.";
  }
  return value;
}

function canRetryWithAnotherMethod(message: string): boolean {
  const normalized = message.toUpperCase();
  return (
    normalized.includes("INTERNAL SERVER ERROR") ||
    normalized.includes("PAYMENT CHANNEL IS INACTIVE") ||
    normalized.includes("PLEASE USE ANOTHER PAYMENT METHOD")
  );
}

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

async function handleWebhook(request: Request): Promise<NextResponse> {
  if (getPaymentGatewayMode() !== "DOKU") {
    return NextResponse.json(
      { ok: false, message: "Webhook tidak aktif saat mode pembayaran SIMULATED." },
      { status: 400 }
    );
  }

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

  return NextResponse.json({ ok: true, applied: result.applied, status: result.status }, { status: 200 });
}

export async function GET(request: Request) {
  const action = new URL(request.url).searchParams.get("action")?.trim() ?? "status";
  const templateSlug = resolveTemplateSlugFromUrl(request);
  const user = await getRequestAuthUser();

  if (action === "status") {
    if (!templateSlug) {
      return NextResponse.json(
        { ok: false, message: "Parameter slug wajib diisi." },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          ok: true,
          loginRequired: true,
          purchased: false,
        },
        { status: 200 }
      );
    }

    const template = await getTemplateBySlugServer(templateSlug);
    if (!template) {
      return NextResponse.json(
        { ok: false, message: "Template tidak ditemukan." },
        { status: 404 }
      );
    }

    const purchased = await hasTemplateAccess(user.email, template.slug);
    return NextResponse.json({ ok: true, loginRequired: false, purchased }, { status: 200 });
  }

  if (action === "download") {
    if (!user) {
      const url = new URL("/login", request.url);
      url.searchParams.set("auth", "required");
      return NextResponse.redirect(url);
    }

    if (!templateSlug) {
      return NextResponse.json(
        { ok: false, message: "Parameter slug wajib diisi." },
        { status: 400 }
      );
    }

    const template = await getTemplateBySlugServer(templateSlug);
    if (!template) {
      return NextResponse.json(
        { ok: false, message: "Template tidak ditemukan." },
        { status: 404 }
      );
    }

    const purchased = await hasTemplateAccess(user.email, template.slug);
    if (!purchased) {
      return NextResponse.json(
        { ok: false, message: "Template belum dibeli untuk akun ini." },
        { status: 403 }
      );
    }

    const downloadUrl = getTemplateDownloadUrl(template);
    if (!downloadUrl) {
      return NextResponse.json(
        { ok: false, message: "Link download belum diset. Silakan hubungi admin." },
        { status: 400 }
      );
    }

    return NextResponse.redirect(downloadUrl);
  }

  return NextResponse.json({ ok: false, message: "Action tidak valid." }, { status: 400 });
}

export async function POST(request: Request) {
  const action = new URL(request.url).searchParams.get("action")?.trim() ?? "checkout";
  if (action === "webhook") {
    return handleWebhook(request);
  }

  try {
    const user = await getRequestAuthUser();
    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          code: "UNAUTHORIZED",
          message: "Silakan login dulu untuk melanjutkan pembayaran.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { templateSlug?: string };
    const templateSlug = body.templateSlug?.trim() ?? "";
    if (!templateSlug) {
      return NextResponse.json(
        { ok: false, code: "INVALID_TEMPLATE", message: "Template tidak valid." },
        { status: 400 }
      );
    }

    const template = await getTemplateBySlugServer(templateSlug);
    if (!template) {
      return NextResponse.json(
        { ok: false, code: "TEMPLATE_NOT_FOUND", message: "Template tidak ditemukan." },
        { status: 404 }
      );
    }

    const alreadyPurchased = await hasTemplateAccess(user.email, template.slug);
    if (alreadyPurchased) {
      return NextResponse.json({
        ok: true,
        alreadyPurchased: true,
        downloadUrl: `/api/payments/checkout?action=download&slug=${encodeURIComponent(template.slug)}`,
      });
    }

    const invoiceNumber = generateInvoiceNumber();
    const templateName = template.project_title?.trim() || template.name;
    const amount = Number.isFinite(template.price) ? Math.round(template.price) : 0;
    if (amount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_PRICE",
          message: "Harga template tidak valid. Silakan hubungi admin.",
        },
        { status: 400 }
      );
    }

    const requestUrl = new URL(request.url);
    const paymentMode = getPaymentGatewayMode();
    const origin = resolvePublicOrigin(request);
    if (!process.env.DOKU_PUBLIC_BASE_URL?.trim() && ["localhost", "127.0.0.1"].includes(requestUrl.hostname)) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_PUBLIC_URL",
          message:
            "Set DOKU_PUBLIC_BASE_URL ke domain HTTPS publik (contoh: https://tamplateku.store) untuk checkout dari local.",
        },
        { status: 400 }
      );
    }

    const successUrl = `${origin}/browse-template/${template.slug}?payment=success&invoice=${encodeURIComponent(invoiceNumber)}`;
    const failureUrl = `${origin}/browse-template/${template.slug}?payment=failed&invoice=${encodeURIComponent(invoiceNumber)}`;
    const notifyUrl = `${origin}/api/payments/checkout?action=webhook`;
    const downloadUrl = getTemplateDownloadUrl(template);

    await createPaymentOrder({
      provider: "DOKU",
      invoiceNumber,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userProvider: user.provider,
      templateSlug: template.slug,
      templateName,
      templateDownloadUrl: downloadUrl,
      amount,
      currency: "IDR",
      status: "PENDING",
    });

    if (paymentMode === "SIMULATED") {
      const simulatedAt = new Date().toISOString();
      await applyDokuNotification({
        invoiceNumber,
        transactionStatus: "SUCCESS",
        transactionDate: simulatedAt,
        payload: {
          mode: "SIMULATED",
          order: { invoice_number: invoiceNumber },
          transaction: { status: "SUCCESS", date: simulatedAt },
        },
      });

      return NextResponse.json({
        ok: true,
        provider: "SIMULATED",
        invoiceNumber,
        paymentUrl: successUrl,
        simulated: true,
      });
    }

    try {
      const dokuConfig = getDokuConfig();
      const configuredMethods = dokuConfig.paymentMethodTypes;
      const methodCandidates =
        configuredMethods.length > 0
          ? configuredMethods.map((method) => [method])
          : [undefined];
      let checkout: Awaited<ReturnType<typeof createDokuCheckout>> | null = null;
      let checkoutError: unknown = null;

      for (const paymentMethodTypes of methodCandidates) {
        try {
          checkout = await createDokuCheckout({
            invoiceNumber,
            amount,
            templateName,
            templateSlug: template.slug,
            paymentMethodTypes,
            customer: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
            successUrl,
            failureUrl,
            notifyUrl,
          });
          break;
        } catch (error) {
          checkoutError = error;
          const rawMessage = error instanceof Error ? error.message : "";
          if (
            methodCandidates.length === 1 ||
            !rawMessage ||
            !canRetryWithAnotherMethod(rawMessage)
          ) {
            break;
          }
        }
      }

      if (!checkout) {
        throw checkoutError instanceof Error ? checkoutError : new Error("Checkout gagal.");
      }

      await updatePaymentOrderCheckout({
        invoiceNumber,
        checkoutUrl: checkout.checkoutUrl,
        checkoutExpiresAt: checkout.expiresAt,
        dokuRequestId: checkout.requestId,
        rawPayload: checkout.raw,
      });

      return NextResponse.json({
        ok: true,
        provider: "DOKU",
        invoiceNumber,
        paymentUrl: checkout.checkoutUrl,
      });
    } catch (error) {
      if (error instanceof DokuRequestError) {
        console.error("DOKU checkout failed", {
          status: error.status,
          requestId: error.requestId,
          message: error.message,
        });
      }

      const message = error instanceof Error ? error.message : "Checkout gagal.";
      await markPaymentOrderFailed(invoiceNumber, { error: message });
      const safeMessage = sanitizeGatewayMessage(message);
      const userMessage = formatCheckoutFailureMessage(safeMessage);

      return NextResponse.json(
        {
          ok: false,
          code: "CHECKOUT_FAILED",
          message: `Gagal membuat checkout DOKU. ${userMessage}`,
        },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
