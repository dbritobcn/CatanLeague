"use client";

import { useState } from "react";
import { slugify, titleToSlug } from "@/application/slug";

/**
 * Live preview of the league URL while typing the title. Shares the exact
 * slug pipeline with the server (src/application/slug.ts), which remains
 * the authoritative validator.
 */
export function SlugPreview() {
  const [title, setTitle] = useState("");
  const result = title.trim() ? titleToSlug(title) : null;

  return (
    <>
      <label className="field-label" htmlFor="league-title">Nombre de la liga</label>
      <input
        id="league-title"
        name="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Liga Cholos"
        maxLength={60}
        required
        autoComplete="off"
      />
      <div aria-live="polite">
        {result &&
          ("error" in result ? (
            <p className="feedback error">{result.error}</p>
          ) : (
            <p className="slug-preview">
              Dirección de la liga: <span className="share-code">/{slugify(title)}</span>
            </p>
          ))}
      </div>
    </>
  );
}
