import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, autocompleteSearch } from '@/lib/search';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const query = searchParams.get('q') || '';
        const category = searchParams.get('category') || undefined;
        const brands = searchParams.get('brands')?.split(',').filter(Boolean) || undefined;
        const price_min = searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined;
        const price_max = searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined;
        const year_min = searchParams.get('year_min') ? parseInt(searchParams.get('year_min')!) : undefined;
        const year_max = searchParams.get('year_max') ? parseInt(searchParams.get('year_max')!) : undefined;
        const sort = searchParams.get('sort') || 'popularity_score:desc';
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
        const per_page = searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : 20;
        const autocomplete = searchParams.get('autocomplete') === 'true';

        // Handle autocomplete
        if (autocomplete) {
            const results = await autocompleteSearch(query, 5);
            return NextResponse.json({ results });
        }

        // Full search
        const results = await searchProducts({
            query,
            category,
            brands,
            price_min,
            price_max,
            year_min,
            year_max,
            sort,
            page,
            per_page,
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
