import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[!_]*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    cardTitle: z.string(),
    excerpt: z.string(),
    image: z.string(),
    order: z.number().default(99),
    capabilities: z.array(z.object({
      title: z.string(),
      desc: z.string(),
    })).default([]),
    values: z.array(z.object({
      emoji: z.string(),
      title: z.string(),
      desc: z.string(),
    })).default([]),
    media: z.array(z.object({
      type: z.enum(['image', 'video']),
      src: z.string(),
      alt: z.string().optional(),
    })).default([]),
  }),
});

export const collections = { blog, services };
