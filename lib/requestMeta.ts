export function getRequestIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) return cfIp.trim().slice(0, 64);

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0].trim().slice(0, 64);
  }

  return "unknown";
}

export function getRequestUserAgent(request: Request): string {
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return userAgent.slice(0, 512);
}
