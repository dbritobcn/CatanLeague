import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, slugify, titleToSlug } from "@/application/slug";

describe("slugify", () => {
  it("derives a slug from a title with spaces and caps", () => {
    expect(slugify("Liga Cholos 2026")).toBe("liga-cholos-2026");
  });

  it("strips diacritics", () => {
    expect(slugify("Liga Chólos Únándoñ")).toBe("liga-cholos-unandon");
  });

  it("ñ is transliterated to n", () => {
    expect(slugify("La Caña").replace(/^la-/, "")).toContain("cana");
  });

  it("collapses repeated separators and trims them", () => {
    expect(slugify("  --¿Liga?? de---Catán!!  ")).toBe("liga-de-catan");
  });

  it("maps every non [a-z0-9] character to a separator", () => {
    expect(slugify("a_b.c/d(e)")).toBe("a-b-c-d-e");
  });

  it("leaves nothing when the title has no valid characters", () => {
    expect(slugify("¡¿???")).toBe("");
  });
});

describe("titleToSlug", () => {
  it("accepts a valid title", () => {
    expect(titleToSlug("Liga Chólos")).toEqual({ slug: "liga-cholos" });
  });

  it("rejects a title that cleans up to less than 3 characters", () => {
    expect(titleToSlug("¡a!")).toHaveProperty("error");
  });

  it("rejects a title longer than 60 characters after cleanup", () => {
    expect(titleToSlug("a".repeat(61))).toHaveProperty("error");
  });

  it("rejects every reserved slug", () => {
    for (const reserved of RESERVED_SLUGS) {
      const result = titleToSlug(reserved);
      expect(result, `slug "${reserved}" should be reserved`).toHaveProperty("error");
    }
  });

  it("keeps the reserved list aligned with first-level app routes", () => {
    // Routes that must never be shadowed by a league code.
    expect(RESERVED_SLUGS).toContain("crear");
    expect(RESERVED_SLUGS).toContain("login");
    expect(RESERVED_SLUGS).toContain("auth");
    expect(RESERVED_SLUGS).toContain("admin");
  });
});
