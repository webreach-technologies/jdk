import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faqItem = z.object({
  question: z.string(),
  answer: z.string(),
});

const fleet = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/fleet' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    category: z.enum(['Motor Coach', 'Mini Bus', 'Mini Coach', 'Specialty Vehicle']),
    capacity: z.string(),
    summary: z.string(),
    heroImage: image(),
    interiorImage: image(),
    features: z.array(z.object({
      label: z.string(),
      icon: image(),
    })),
    faqs: z.array(faqItem).optional(),
    order: z.number(),
    seo: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    summary: z.string(),
    intro: z.string(),
    heroImage: image(),
    secondaryImage: image(),
    benefits: z.array(z.object({
      label: z.string(),
      description: z.string(),
    })),
    idealFor: z.array(z.string()),
    faqs: z.array(faqItem).optional(),
    order: z.number(),
    seo: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }),
});

const serviceAreas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/service-areas' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    state: z.string(),
    summary: z.string(),
    heroImage: image(),
    highlights: z.array(z.object({
      label: z.string(),
      description: z.string(),
      image: image().optional(),
    })),
    idealFor: z.array(z.string()),
    nearbyAreas: z.array(z.object({
      name: z.string(),
      slug: z.string(),
    })),
    faqs: z.array(faqItem).optional(),
    order: z.number(),
    seo: z.object({
      title: z.string(),
      description: z.string(),
    }),
  }),
});

export const collections = { fleet, services, serviceAreas };
