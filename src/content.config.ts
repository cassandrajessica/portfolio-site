/* ==========================================================================
   content.config.ts: defines the site's content collections
   A collection is a folder of similar files (here, one Markdown file per
   project) with a schema: the fields every file must have. Astro checks
   each file against it and shows a clear error if something's missing.
   ========================================================================== */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  // Every .md file in src/content/projects is a project.
  // Files starting with "_" are ignored (handy for drafts or templates).
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/projects" }),

  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.string(), // e.g. "Web Development"
      year: z.number(),
      summary: z.string(), // one or two sentences, used on the case study page and for SEO
      overview: z.string(), // the Overview paragraph, shown first on the case study page
      order: z.number().default(99), // lower numbers show first on the homepage

      // Card media (all optional). Use a cover image, a looping video, or both.
      // - cover: path to an image in src/assets/projects/ (Astro optimizes it)
      // - video: path to an .mp4 in public/videos/, e.g. "/videos/heyciti.mp4"
      //   If both are set, the cover shows while the video loads.
      cover: image().optional(),
      video: z.string().optional(),

      // Media shown right under the Overview on the case study page.
      // Each item is an image OR a video, with an optional caption:
      //   - image: path to an image in src/assets/projects/
      //   - video: path to an .mp4 in public/videos/
      //   - controls: true for a demo with play/pause and sound;
      //     leave it out for a silent, looping clip
      //   - alt: describes an image for screen readers and search engines
      // One item shows full width; two or more show in a grid.
      gallery: z
        .array(
          z.object({
            image: image().optional(),
            video: z.string().optional(),
            controls: z.boolean().default(false),
            alt: z.string().default(""),
            caption: z.string().optional(),
          })
        )
        .default([]),

      liveUrl: z.string().url().optional(), // link to the live site, if there is one
      draft: z.boolean().default(false), // true hides the project everywhere
    }),
});

export const collections = { projects };
