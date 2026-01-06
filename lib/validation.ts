import { z } from 'zod';

// Product validation
export const productSchema = z.object({
    name: z.string().min(1).max(255),
    category: z.string().min(1),
    brand: z.string().min(1),
    description: z.string().optional(),
    release_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    price: z.number().positive().optional(),
    rating: z.number().min(0).max(5).optional(),
    main_image_url: z.string().url().optional(),
    specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const productUpdateSchema = productSchema.partial();

// Spec value validation
export const specValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
]);

// CSV import row validation
export const csvProductSchema = z.object({
    name: z.string(),
    category: z.string(),
    brand: z.string(),
    description: z.string().optional(),
    release_year: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    price: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
    rating: z.string().optional().transform((val) => val ? parseFloat(val) : undefined),
    main_image_url: z.string().optional(),
    // Specs will be in format: spec_key=value, multiple columns
});

// Chat message validation
export const chatMessageSchema = z.object({
    message: z.string().min(1).max(500),
});

// Search validation
export const searchSchema = z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    brands: z.array(z.string()).optional(),
    price_min: z.number().optional(),
    price_max: z.number().optional(),
    year_min: z.number().optional(),
    year_max: z.number().optional(),
    sort: z.enum(['popularity', 'newest', 'price_asc', 'price_desc', 'rating']).optional(),
    page: z.number().int().positive().optional().default(1),
    per_page: z.number().int().positive().max(100).optional().default(20),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
