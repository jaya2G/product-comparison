import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { compareProducts } from '@/lib/specs';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];

        if (ids.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 product slugs required' },
                { status: 400 }
            );
        }

        if (ids.length > 4) {
            return NextResponse.json(
                { error: 'Maximum 4 products can be compared' },
                { status: 400 }
            );
        }

        // Fetch products
        const productsSql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      WHERE p.slug = ANY($1)
    `;

        const productsResult = await query(productsSql, [ids]);

        if (productsResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'No products found' },
                { status: 404 }
            );
        }

        const products = productsResult.rows;
        const categoryId = products[0].category_id;

        // Ensure all products are from same category
        const allSameCategory = products.every((p: any) => p.category_id === categoryId);
        if (!allSameCategory) {
            return NextResponse.json(
                { error: 'All products must be from the same category' },
                { status: 400 }
            );
        }

        // Fetch specs for all products
        const productIds = products.map((p: any) => p.id);
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
      WHERE ps.product_id = ANY($1)
      ORDER BY sd.group_name, sd.label
    `;

        const specsResult = await query(specsSql, [productIds]);

        // Attach specs to products
        const productsWithSpecs = products.map((product: any) => ({
            ...product,
            specs: specsResult.rows.filter((spec: any) => spec.product_id === product.id),
        }));

        // Get spec definitions for this category
        const defsSql = `
      SELECT * FROM spec_definitions
      WHERE category_id = $1
      ORDER BY group_name, label
    `;

        const defsResult = await query(defsSql, [categoryId]);

        // Generate comparison
        const comparison = compareProducts(productsWithSpecs, defsResult.rows);

        return NextResponse.json(comparison);
    } catch (error) {
        console.error('Compare API error:', error);
        return NextResponse.json(
            { error: 'Comparison failed' },
            { status: 500 }
        );
    }
}
