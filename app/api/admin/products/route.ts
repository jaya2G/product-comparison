import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { productSchema } from '@/lib/validation';
import { generateSlug } from '@/lib/utils';
import { syncProductsToSearch } from '@/lib/search';

// Middleware to check admin key
function checkAdminKey(request: NextRequest): boolean {
    const adminKey = request.headers.get('x-admin-key');
    return adminKey === process.env.ADMIN_KEY;
}

export async function POST(request: NextRequest) {
    try {
        // Check admin authorization
        if (!checkAdminKey(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate input
        const validation = productSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid product data', details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Create product with transaction
        const result = await transaction(async (client) => {
            // Get category ID
            const categoryResult = await client.query(
                'SELECT id FROM categories WHERE slug = $1',
                [data.category]
            );

            if (categoryResult.rows.length === 0) {
                throw new Error('Category not found');
            }

            const categoryId = categoryResult.rows[0].id;

            // Get or create brand
            let brandId;
            const brandResult = await client.query(
                'SELECT id FROM brands WHERE slug = $1',
                [generateSlug(data.brand)]
            );

            if (brandResult.rows.length === 0) {
                const newBrand = await client.query(
                    'INSERT INTO brands (name, slug) VALUES ($1, $2) RETURNING id',
                    [data.brand, generateSlug(data.brand)]
                );
                brandId = newBrand.rows[0].id;
            } else {
                brandId = brandResult.rows[0].id;
            }

            // Create product
            const slug = generateSlug(data.name);
            const productResult = await client.query(
                `INSERT INTO products (category_id, brand_id, name, slug, description, release_year, price, rating, main_image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [
                    categoryId,
                    brandId,
                    data.name,
                    slug,
                    data.description || null,
                    data.release_year || null,
                    data.price || null,
                    data.rating || 0,
                    data.main_image_url || null,
                ]
            );

            const product = productResult.rows[0];

            // Insert specs if provided
            if (data.specs) {
                for (const [key, value] of Object.entries(data.specs)) {
                    // Get spec definition
                    const specDefResult = await client.query(
                        'SELECT id, value_type FROM spec_definitions WHERE category_id = $1 AND key = $2',
                        [categoryId, key]
                    );

                    if (specDefResult.rows.length === 0) continue;

                    const specDef = specDefResult.rows[0];
                    let valueNumber = null, valueText = null, valueBool = null;

                    if (specDef.value_type === 'number') valueNumber = value;
                    else if (specDef.value_type === 'bool') valueBool = value;
                    else valueText = value;

                    await client.query(
                        `INSERT INTO product_specs (product_id, spec_definition_id, value_number, value_text, value_bool)
             VALUES ($1, $2, $3, $4, $5)`,
                        [product.id, specDef.id, valueNumber, valueText, valueBool]
                    );
                }
            }

            return product;
        });

        // Sync to Meilisearch
        try {
            const productWithInfo = await query(
                `SELECT p.*, c.name as category_name, c.slug as category_slug, b.name as brand_name, b.slug as brand_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         JOIN brands b ON p.brand_id = b.id
         WHERE p.id = $1`,
                [result.id]
            );
            await syncProductsToSearch([productWithInfo.rows[0]]);
        } catch (searchError) {
            console.error('Failed to sync to search:', searchError);
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Admin create product error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create product' },
            { status: 500 }
        );
    }
}
