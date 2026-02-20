import { getRequestAuthUser } from "@/lib/authRequest";
import { createDokuCheckout } from "@/lib/doku";
import {
  createPaymentOrder,
  hasTemplateAccess,
  markPaymentOrderFailed,
  updatePaymentOrderCheckout,
} from "@/lib/paymentDb";
import { getTemplateBySlugServer } from "@/lib/templateServer";
import { NextResponse } from "next/server";

export const runtime = "edge";

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

  try {
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
        downloadUrl: `/api/payments/doku/checkout?action=download&slug=${encodeURIComponent(template.slug)}`,
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

    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/browse-template/${template.slug}?payment=success&invoice=${encodeURIComponent(invoiceNumber)}`;
    const failureUrl = `${origin}/browse-template/${template.slug}?payment=failed&invoice=${encodeURIComponent(invoiceNumber)}`;
    const notifyUrl = `${origin}/api/payments/doku/webhook`;
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

    try {
      const checkout = await createDokuCheckout({
        invoiceNumber,
        amount,
        templateName,
        templateSlug: template.slug,
        customer: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        successUrl,
        failureUrl,
        notifyUrl,
      });

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
      const message = error instanceof Error ? error.message : "Checkout gagal.";
      await markPaymentOrderFailed(invoiceNumber, { error: message });

      return NextResponse.json(
        {
          ok: false,
          code: "CHECKOUT_FAILED",
          message: `Gagal membuat checkout DOKU. ${message}`,
        },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
