import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get('category');
        const brand = searchParams.get('brand');
        const sort = searchParams.get('sort') || 'popularity';
        const page = parseInt(searchParams.get('page') || '1');
        const per_page = parseInt(searchParams.get('per_page') || '20');

        const whereClauses: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (category) {
            whereClauses.push(`c.slug = $${paramIndex}`);
            params.push(category);
            paramIndex++;
        }

        if (brand) {
            whereClauses.push(`b.slug = $${paramIndex}`);
            params.push(brand);
            paramIndex++;
        }

        const whereClause = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(' AND ')}`
            : '';

        // Determine sorting
        let orderBy = 'p.popularity_score DESC';
        if (sort === 'newest') orderBy = 'p.release_year DESC, p.created_at DESC';
        else if (sort === 'price_asc') orderBy = 'p.price ASC';
        else if (sort === 'price_desc') orderBy = 'p.price DESC';
        else if (sort === 'rating') orderBy = 'p.rating DESC';

        const offset = (page - 1) * per_page;

        const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        params.push(per_page, offset);

        const result = await query(sql, params);

        // Get total count
        const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      ${whereClause}
    `;

        const countResult = await query(countSql, params.slice(0, paramIndex - 1));
        const total = parseInt(countResult.rows[0]?.total || '0');

        return NextResponse.json({
            products: result.rows,
            total,
            page,
            per_page,
        });
    } catch (error) {
        console.error('Products API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
