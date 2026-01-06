import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { query, transaction } from '@/lib/db';
import { generateSlug } from '@/lib/utils';
import { syncProductsToSearch } from '@/lib/search';

function checkAdminKey(request: NextRequest): boolean {
    const adminKey = request.headers.get('x-admin-key');
    return adminKey === process.env.ADMIN_KEY;
}

export async function POST(request: NextRequest) {
    try {
        if (!checkAdminKey(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const csvText = await file.text();

        // Parse CSV
        const records = parse(csvText, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        if (records.length === 0) {
            return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
        }

        const results: any = {
            total: records.length,
            success: 0,
            failed: 0,
            errors: [],
        };

        // Process each record
        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            try {
                await transaction(async (client) => {
                    // Get category
                    const categoryResult = await client.query(
                        'SELECT id FROM categories WHERE slug = $1',
                        [record.category]
                    );

                    if (categoryResult.rows.length === 0) {
                        throw new Error(`Category '${record.category}' not found`);
                    }

                    const categoryId = categoryResult.rows[0].id;

                    // Get or create brand
                    let brandId;
                    const brandSlug = generateSlug(record.brand);
                    const brandResult = await client.query(
                        'SELECT id FROM brands WHERE slug = $1',
                        [brandSlug]
                    );

                    if (brandResult.rows.length === 0) {
                        const newBrand = await client.query(
                            'INSERT INTO brands (name, slug) VALUES ($1, $2) RETURNING id',
                            [record.brand, brandSlug]
                        );
                        brandId = newBrand.rows[0].id;
                    } else {
                        brandId = brandResult.rows[0].id;
                    }

                    // Create product
                    const slug = generateSlug(record.name);
                    const price = record.price ? parseFloat(record.price) : null;
                    const releaseYear = record.release_year
                        ? parseInt(record.release_year)
                        : null;
                    const rating = record.rating ? parseFloat(record.rating) : 0;

                    await client.query(
                        `INSERT INTO products (category_id, brand_id, name, slug, description, release_year, price, rating, main_image_url, popularity_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            categoryId,
                            brandId,
                            record.name,
                            slug,
                            record.description || null,
                            releaseYear,
                            price,
                            rating,
                            record.main_image_url || null,
                            0,
                        ]
                    );
                });

                results.success++;
            } catch (error: any) {
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    name: record.name,
                    error: error.message,
                });
            }
        }

        // Sync to Meilisearch
        if (results.success > 0) {
            try {
                const allProducts = await query(`
          SELECT p.*, c.name as category_name, c.slug as category_slug, 
                 b.name as brand_name, b.slug as brand_slug
          FROM products p
          JOIN categories c ON p.category_id = c.id
          JOIN brands b ON p.brand_id = b.id
        `);
                await syncProductsToSearch(allProducts.rows);
            } catch (searchError) {
                console.error('Failed to sync to search:', searchError);
            }
        }

        return NextResponse.json(results, { status: 201 });
    } catch (error: any) {
        console.error('CSV import error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to import CSV' },
            { status: 500 }
        );
    }
}
