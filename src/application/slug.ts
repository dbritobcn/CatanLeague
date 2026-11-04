import { DomainError } from "@/domain";

export const MIN_SLUG_LENGTH = 3;
export const MAX_SLUG_LENGTH = 60;

/**
 * Slugs that would shadow first-level app routes (Next.js resolves static
 * routes before the dynamic [code] segment, so such leagues would be
 * unreachable). Guarded by tests.
 */
export const RESERVED_SLUGS: readonly string[] = [
  "admin",
  "api",
  "auth",
  "crear",
  "images",
  "invitar",
  "login",
  "logout",
];

/** Deterministic title → slug pipeline: lowercase, strip diacritics, keep [a-z0-9]. */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Validates a league title, returning its slug or a user-facing error. */
export function titleToSlug(title: string): { slug: string } | { error: string } {
  const slug = slugify(title);
  if (slug.length < MIN_SLUG_LENGTH) {
    return {
      error: `El nombre debe dejar al menos ${MIN_SLUG_LENGTH} caracteres (letras y números).`,
    };
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    return { error: `El nombre es demasiado largo (máximo ${MAX_SLUG_LENGTH} caracteres).` };
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return { error: "Ese nombre no está disponible. Elige otro." };
  }
  return { slug };
}

/** Throws the DomainError for an invalid title, or returns its slug. */
export function requireValidSlug(title: string): string {
  const result = titleToSlug(title);
  if ("error" in result) throw new DomainError(result.error);
  return result.slug;
}
