function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} env var.`);
  }
  return value;
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }
  return btoa(binary);
}

async function sha256Base64(payload: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return base64FromBytes(new Uint8Array(digest));
}

async function hmacSha256Base64(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64FromBytes(new Uint8Array(signature));
}

function nowIsoUtc(): string {
  return new Date().toISOString().replace(".000", "");
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

export type DokuCheckoutInput = {
  invoiceNumber: string;
  amount: number;
  templateName: string;
  templateSlug: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  successUrl: string;
  failureUrl: string;
  notifyUrl: string;
  requestId?: string;
};

export type DokuCheckoutResult = {
  checkoutUrl: string;
  requestId: string;
  expiresAt: string | null;
  raw: Record<string, unknown>;
};

export type DokuWebhookHeaders = {
  clientId: string | null;
  requestId: string | null;
  requestTimestamp: string | null;
  signature: string | null;
};

export function getDokuConfig() {
  return {
    clientId: getEnv("DOKU_CLIENT_ID"),
    secretKey: getEnv("DOKU_SECRET_KEY"),
    baseUrl: normalizeBaseUrl(process.env.DOKU_BASE_URL?.trim() || "https://api-sandbox.doku.com"),
  };
}

export function getDokuWebhookHeaders(headers: Headers): DokuWebhookHeaders {
  return {
    clientId: headers.get("Client-Id"),
    requestId: headers.get("Request-Id"),
    requestTimestamp: headers.get("Request-Timestamp"),
    signature: headers.get("Signature"),
  };
}

async function buildSignature(params: {
  clientId: string;
  secretKey: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  bodyText: string;
}): Promise<{ digest: string; signature: string }> {
  const digest = await sha256Base64(params.bodyText);
  const componentToSign = [
    `Client-Id:${params.clientId}`,
    `Request-Id:${params.requestId}`,
    `Request-Timestamp:${params.requestTimestamp}`,
    `Request-Target:${params.requestTarget}`,
    `Digest:${digest}`,
  ].join("\n");

  const raw = await hmacSha256Base64(params.secretKey, componentToSign);
  return {
    digest,
    signature: `HMACSHA256=${raw}`,
  };
}

export async function createDokuCheckout(input: DokuCheckoutInput): Promise<DokuCheckoutResult> {
  const config = getDokuConfig();
  const requestId = input.requestId ?? crypto.randomUUID();
  const requestTimestamp = nowIsoUtc();
  const requestTarget = "/checkout/v1/payment";

  const body = {
    order: {
      invoice_number: input.invoiceNumber,
      amount: input.amount,
      callback_url: input.successUrl,
      callback_url_cancel: input.failureUrl,
      auto_redirect: true,
    },
    payment: {
      payment_due_date: 60,
    },
    customer: {
      id: input.customer.id,
      name: input.customer.name,
      email: input.customer.email,
    },
    line_items: [
      {
        name: input.templateName,
        price: input.amount,
        quantity: 1,
      },
    ],
    additional_info: {
      product_type: "DIGITAL",
      template_slug: input.templateSlug,
      notify_url: input.notifyUrl,
    },
  };

  const bodyText = JSON.stringify(body);
  const signed = await buildSignature({
    clientId: config.clientId,
    secretKey: config.secretKey,
    requestId,
    requestTimestamp,
    requestTarget,
    bodyText,
  });

  const response = await fetch(`${config.baseUrl}${requestTarget}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Client-Id": config.clientId,
      "Request-Id": requestId,
      "Request-Timestamp": requestTimestamp,
      Signature: signed.signature,
      Digest: signed.digest,
    },
    body: bodyText,
    cache: "no-store",
  });

  const responseText = await response.text();
  const payload = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : {};

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `DOKU request failed (${response.status}).`;
    throw new Error(message);
  }

  const responseRoot =
    typeof payload.response === "object" && payload.response !== null
      ? (payload.response as Record<string, unknown>)
      : payload;

  const paymentData =
    typeof responseRoot.payment === "object" && responseRoot.payment !== null
      ? (responseRoot.payment as Record<string, unknown>)
      : null;

  const checkoutUrl =
    (typeof paymentData?.url === "string" && paymentData.url) ||
    (typeof responseRoot.payment_url === "string" ? responseRoot.payment_url : "");

  if (!checkoutUrl) {
    throw new Error("DOKU response tidak mengandung payment URL.");
  }

  const expiresAt =
    typeof paymentData?.expired_date === "string"
      ? paymentData.expired_date
      : typeof responseRoot.expired_date === "string"
        ? responseRoot.expired_date
        : null;

  return {
    checkoutUrl,
    requestId,
    expiresAt,
    raw: payload,
  };
}

export async function verifyDokuWebhookSignature(params: {
  headers: Headers;
  rawBody: string;
  requestTarget: string;
}): Promise<boolean> {
  const config = getDokuConfig();
  const signedHeaders = getDokuWebhookHeaders(params.headers);

  if (
    !signedHeaders.clientId ||
    !signedHeaders.requestId ||
    !signedHeaders.requestTimestamp ||
    !signedHeaders.signature
  ) {
    return false;
  }

  if (signedHeaders.clientId !== config.clientId) {
    return false;
  }

  const expected = await buildSignature({
    clientId: signedHeaders.clientId,
    secretKey: config.secretKey,
    requestId: signedHeaders.requestId,
    requestTimestamp: signedHeaders.requestTimestamp,
    requestTarget: params.requestTarget,
    bodyText: params.rawBody,
  });

  return safeEqual(expected.signature, signedHeaders.signature.trim());
}
