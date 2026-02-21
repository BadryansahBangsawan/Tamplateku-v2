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

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function resolveErrorMessage(payload: Record<string, unknown>, status: number): string {
  const messageValue = payload.message;
  if (typeof messageValue === "string" && messageValue.trim().length > 0) {
    return messageValue;
  }

  if (Array.isArray(messageValue) && messageValue.length > 0) {
    const joined = messageValue
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .filter(Boolean)
      .join("; ");
    if (joined.trim().length > 0) return joined;
  }

  const errorValue = payload.error;
  if (typeof errorValue === "string" && errorValue.trim().length > 0) {
    return errorValue;
  }

  if (Array.isArray(errorValue) && errorValue.length > 0) {
    const joined = errorValue
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .filter(Boolean)
      .join("; ");
    if (joined.trim().length > 0) return joined;
  }

  return `DOKU request failed (${status}).`;
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
  paymentMethodTypes?: string[];
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    postcode?: string;
    state?: string;
    city?: string;
    country?: string;
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

export class DokuRequestError extends Error {
  status: number;
  requestId: string;
  payload: Record<string, unknown>;

  constructor(params: {
    message: string;
    status: number;
    requestId: string;
    payload: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = "DokuRequestError";
    this.status = params.status;
    this.requestId = params.requestId;
    this.payload = params.payload;
  }
}

function safeSlugPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
}

function splitCustomerName(fullName: string): { firstName: string; lastName: string } {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) return { firstName: "Customer", lastName: "User" };
  const parts = normalized.split(" ");
  const firstName = parts.shift() || "Customer";
  const lastName = parts.join(" ") || "User";
  return {
    firstName: firstName.slice(0, 255),
    lastName: lastName.slice(0, 16),
  };
}

export function getDokuConfig() {
  return {
    clientId: getEnv("DOKU_CLIENT_ID"),
    secretKey: getEnv("DOKU_SECRET_KEY"),
    apiKey: process.env.DOKU_API_KEY?.trim() || "",
    baseUrl: normalizeBaseUrl(process.env.DOKU_BASE_URL?.trim() || "https://api-sandbox.doku.com"),
    publicBaseUrl: normalizeBaseUrl(process.env.DOKU_PUBLIC_BASE_URL?.trim() || ""),
    paymentMethodTypes: parseCsvEnv(process.env.DOKU_PAYMENT_METHOD_TYPES),
    lineItemCategory: process.env.DOKU_LINE_ITEM_CATEGORY?.trim() || "other",
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
  const origin = new URL(input.successUrl).origin;
  const { firstName, lastName } = splitCustomerName(input.customer.name);
  const normalizedPhone = input.customer.phone?.trim() || "6281234567890";
  const normalizedAddress = input.customer.address?.trim() || "Indonesia";
  const normalizedPostcode = input.customer.postcode?.trim() || "10110";
  const normalizedState = input.customer.state?.trim() || "DKI Jakarta";
  const normalizedCity = input.customer.city?.trim() || "Jakarta";
  const normalizedCountry = input.customer.country?.trim() || "ID";
  const safeTemplateSlug = safeSlugPart(input.templateSlug) || "template";
  const safeTemplateName = input.templateName.trim() || "Template";
  const configuredMethods =
    input.paymentMethodTypes?.map((method) => method.trim()).filter((method) => method.length > 0) ??
    [];
  const lineItemCategory = config.lineItemCategory.trim() || "other";
  const lineItem = {
    id: `${safeTemplateSlug}-001`,
    name: safeTemplateName.slice(0, 255),
    quantity: 1,
    price: input.amount,
    sku: `${safeTemplateSlug}-sku`,
    category: lineItemCategory,
  };
  const payment: Record<string, unknown> = {
    payment_due_date: 60,
  };
  if (configuredMethods.length > 0) {
    payment.payment_method_types = configuredMethods;
  }
  if (configuredMethods.includes("PEER_TO_PEER_AKULAKU")) {
    payment.merchant_unique_reference = input.invoiceNumber;
  }

  const body = {
    order: {
      invoice_number: input.invoiceNumber,
      amount: input.amount,
      currency: "IDR",
      callback_url: input.successUrl,
      callback_url_result: input.successUrl,
      callback_url_cancel: input.failureUrl,
      language: "ID",
      auto_redirect: true,
      line_items: [lineItem],
    },
    payment,
    customer: {
      id: input.customer.id,
      name: firstName,
      last_name: lastName,
      email: input.customer.email,
      phone: normalizedPhone,
      address: normalizedAddress,
      postcode: normalizedPostcode,
      state: normalizedState,
      city: normalizedCity,
      country: normalizedCountry,
    },
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      address: normalizedAddress,
      city: normalizedCity,
      postal_code: normalizedPostcode,
      phone: normalizedPhone,
      country_code: "IDN",
    },
    billing_address: {
      first_name: firstName,
      last_name: lastName,
      address: normalizedAddress,
      city: normalizedCity,
      postal_code: normalizedPostcode,
      phone: normalizedPhone,
      country_code: "IDN",
    },
    additional_info: {
      product_type: "DIGITAL",
      template_slug: input.templateSlug,
      override_notification_url: input.notifyUrl,
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

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Client-Id": config.clientId,
    "Request-Id": requestId,
    "Request-Timestamp": requestTimestamp,
    Signature: signed.signature,
    Digest: signed.digest,
  };

  if (config.apiKey) {
    headers["Api-Key"] = config.apiKey;
  }

  const response = await fetch(`${config.baseUrl}${requestTarget}`, {
    method: "POST",
    headers,
    body: bodyText,
    cache: "no-store",
  });

  const responseText = await response.text();
  let payload: Record<string, unknown> = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      payload = { raw_response: responseText };
    }
  }

  if (!response.ok) {
    const message = resolveErrorMessage(payload, response.status);
    throw new DokuRequestError({
      message,
      status: response.status,
      requestId,
      payload,
    });
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
