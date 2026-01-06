import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Get product with category and brand
        const productSql = `
      SELECT 
        p.*,
        c.id as category_id_ref,
        c.name as category_name,
        c.slug as category_slug,
        b.id as brand_id_ref,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = $1
    `;

        const productResult = await query(productSql, [slug]);

        if (productResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        const product = productResult.rows[0];

        // Get specs with definitions
        const specsSql = `
      SELECT 
        ps.*,
        sd.key,
        sd.label,
        sd.group_name,
        sd.unit,
        sd.value_type
      FROM product_specs ps
      JOIN spec_definitions sd ON ps.spec_definition_id = sd.id
      WHERE ps.product_id = $1
      ORDER BY sd.group_name, sd.label
    `;

        const specsResult = await query(specsSql, [product.id]);

        // Get media assets
        const mediaSql = `
      SELECT *
      FROM media_assets
      WHERE product_id = $1
      ORDER BY type, sort_order
    `;

        const mediaResult = await query(mediaSql, [product.id]);

        // Combine all data
        const fullProduct = {
            ...product,
            specs: specsResult.rows,
            media: mediaResult.rows,
        };

        return NextResponse.json(fullProduct);
    } catch (error) {
        console.error('Product details API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}
