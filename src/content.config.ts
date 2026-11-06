import { existsSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    h1: z.string(),
    summary: z.string(),
    order: z.number(),
    sample: z.boolean(),
    highlights: z.array(z.string()),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })),
  }),
});

const projects = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/projects',
    generateId: ({ entry }) => dirname(entry),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      city: z.string(),
      service: reference('services'),
      projectType: z.enum(['home', 'commercial']),
      tileType: z.string(),
      summary: z.string(),
      metaDescription: z.string(),
      order: z.number(),
      sample: z.boolean(),
      photos: z.array(z.object({ src: image(), alt: z.string() })).min(1),
    }),
});

// Launching with no reviews removes this folder, because git keeps no empty folders, and glob() warns about that on every build.
const reviewsDir = new URL('./content/reviews/', import.meta.url);
const hasReviews = existsSync(reviewsDir) && readdirSync(reviewsDir).some((file) => file.endsWith('.json'));

const reviews = defineCollection({
  loader: hasReviews ? glob({ pattern: '*.json', base: reviewsDir }) : () => [],
  schema: z.object({
    author: z.string(),
    city: z.string(),
    text: z.string(),
    sample: z.boolean(),
  }),
});

export const collections = { services, projects, reviews };
