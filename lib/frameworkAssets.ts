const FRAMEWORK_LOGO_VERSION = "20260219";
const FRAMEWORK_PATH_PREFIX = "/frameworks/";

export function withFrameworkLogoVersion(src: string): string {
  if (!src.startsWith(FRAMEWORK_PATH_PREFIX)) return src;

  const [withoutHash, hash = ""] = src.split("#", 2);
  const [pathname, query = ""] = withoutHash.split("?", 2);
  const params = new URLSearchParams(query);

  if (!params.has("v")) {
    params.set("v", FRAMEWORK_LOGO_VERSION);
  }

  const queryString = params.toString();
  const hashSuffix = hash ? `#${hash}` : "";

  return queryString ? `${pathname}?${queryString}${hashSuffix}` : `${pathname}${hashSuffix}`;
}
