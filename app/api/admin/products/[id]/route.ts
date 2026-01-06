import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { productUpdateSchema } from '@/lib/validation';
import { syncProductsToSearch, deleteProductFromSearch } from '@/lib/search';

function checkAdminKey(request: NextRequest): boolean {
    const adminKey = request.headers.get('x-admin-key');
    return adminKey === process.env.ADMIN_KEY;
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!checkAdminKey(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        const body = await request.json();
        const validation = productUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid product data', details: validation.error.issues },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Check if product exists
        const existingProduct = await query(
            'SELECT * FROM products WHERE id = $1',
            [productId]
        );

        if (existingProduct.rows.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Update product
        const result = await transaction(async (client) => {
            const updateFields: string[] = [];
            const updateValues: any[] = [];
            let paramIndex = 1;

            if (data.name !== undefined) {
                updateFields.push(`name = $${paramIndex}`);
                updateValues.push(data.name);
                paramIndex++;
            }

            if (data.description !== undefined) {
                updateFields.push(`description = $${paramIndex}`);
                updateValues.push(data.description);
                paramIndex++;
            }

            if (data.price !== undefined) {
                updateFields.push(`price = $${paramIndex}`);
                updateValues.push(data.price);
                paramIndex++;
            }

            if (data.rating !== undefined) {
                updateFields.push(`rating = $${paramIndex}`);
                updateValues.push(data.rating);
                paramIndex++;
            }

            if (data.release_year !== undefined) {
                updateFields.push(`release_year = $${paramIndex}`);
                updateValues.push(data.release_year);
                paramIndex++;
            }

            if (data.main_image_url !== undefined) {
                updateFields.push(`main_image_url = $${paramIndex}`);
                updateValues.push(data.main_image_url);
                paramIndex++;
            }

            updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
            updateValues.push(productId);

            const updateSql = `
        UPDATE products
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

            const productResult = await client.query(updateSql, updateValues);
            const updatedProduct = productResult.rows[0];

            // Update specs if provided
            if (data.specs) {
                // Delete existing specs
                await client.query('DELETE FROM product_specs WHERE product_id = $1', [
                    productId,
                ]);

                // Insert new specs
                for (const [key, value] of Object.entries(data.specs)) {
                    const specDefResult = await client.query(
                        'SELECT id, value_type FROM spec_definitions WHERE category_id = $1 AND key = $2',
                        [updatedProduct.category_id, key]
                    );

                    if (specDefResult.rows.length === 0) continue;

                    const specDef = specDefResult.rows[0];
                    let valueNumber = null,
                        valueText = null,
                        valueBool = null;

                    if (specDef.value_type === 'number') valueNumber = value;
                    else if (specDef.value_type === 'bool') valueBool = value;
                    else valueText = value;

                    await client.query(
                        `INSERT INTO product_specs (product_id, spec_definition_id, value_number, value_text, value_bool)
             VALUES ($1, $2, $3, $4, $5)`,
                        [productId, specDef.id, valueNumber, valueText, valueBool]
                    );
                }
            }

            return updatedProduct;
        });

        // Sync to Meilisearch
        try {
            const productWithInfo = await query(
                `SELECT p.*, c.name as category_name, c.slug as category_slug, b.name as brand_name, b.slug as brand_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         JOIN brands b ON p.brand_id = b.id
         WHERE p.id = $1`,
                [productId]
            );
            await syncProductsToSearch([productWithInfo.rows[0]]);
        } catch (searchError) {
            console.error('Failed to sync to search:', searchError);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Admin update product error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update product' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!checkAdminKey(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        // Check if product exists
        const existingProduct = await query(
            'SELECT * FROM products WHERE id = $1',
            [productId]
        );

        if (existingProduct.rows.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Delete product (cascade will handle specs and media)
        await query('DELETE FROM products WHERE id = $1', [productId]);

        // Remove from search
        try {
            await deleteProductFromSearch(productId);
        } catch (searchError) {
            console.error('Failed to remove from search:', searchError);
        }

        return NextResponse.json({ success: true, message: 'Product deleted' });
    } catch (error: any) {
        console.error('Admin delete product error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete product' },
            { status: 500 }
        );
    }
}
