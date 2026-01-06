import { MeiliSearch, Index } from 'meilisearch';
import { Product } from '@/types';

const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_MASTER_KEY,
});

const INDEX_NAME = 'products';

export async function initializeSearchIndex(): Promise<Index> {
    try {
        const index = client.index(INDEX_NAME);

        // Configure searchable attributes
        await index.updateSearchableAttributes([
            'name',
            'brand',
            'category',
            'description',
        ]);

        // Configure filterable attributes
        await index.updateFilterableAttributes([
            'category',
            'brand',
            'price',
            'release_year',
            'rating',
            'specs',
        ]);

        // Configure sortable attributes
        await index.updateSortableAttributes([
            'price',
            'release_year',
            'rating',
            'popularity_score',
        ]);

        console.log('Meilisearch index initialized successfully');
        return index;
    } catch (error) {
        console.error('Error initializing Meilisearch:', error);
        throw error;
    }
}

export async function syncProductsToSearch(products: any[]): Promise<void> {
    try {
        const index = client.index(INDEX_NAME);

        // Transform products for search
        const searchDocs = products.map((product) => ({
            id: product.id.toString(),
            name: product.name,
            slug: product.slug,
            brand: product.brand_name || product.brand,
            category: product.category_name || product.category,
            description: product.description || '',
            price: product.price || 0,
            release_year: product.release_year || 0,
            rating: product.rating || 0,
            popularity_score: product.popularity_score || 0,
            main_image_url: product.main_image_url || '',
            specs: product.specs || {},
        }));

        await index.addDocuments(searchDocs, { primaryKey: 'id' });
        console.log(`Synced ${searchDocs.length} products to search index`);
    } catch (error) {
        console.error('Error syncing products to search:', error);
        throw error;
    }
}

export async function searchProducts(params: {
    query?: string;
    category?: string;
    brands?: string[];
    price_min?: number;
    price_max?: number;
    year_min?: number;
    year_max?: number;
    sort?: string;
    page?: number;
    per_page?: number;
}): Promise<{
    products: any[];
    total: number;
    page: number;
    per_page: number;
}> {
    try {
        const index = client.index(INDEX_NAME);

        const {
            query = '',
            category,
            brands,
            price_min,
            price_max,
            year_min,
            year_max,
            sort = 'popularity_score:desc',
            page = 1,
            per_page = 20,
        } = params;

        // Build filters
        const filters: string[] = [];

        if (category) {
            filters.push(`category = "${category}"`);
        }

        if (brands && brands.length > 0) {
            const brandFilter = brands.map((b) => `brand = "${b}"`).join(' OR ');
            filters.push(`(${brandFilter})`);
        }

        if (price_min !== undefined) {
            filters.push(`price >= ${price_min}`);
        }

        if (price_max !== undefined) {
            filters.push(`price <= ${price_max}`);
        }

        if (year_min !== undefined) {
            filters.push(`release_year >= ${year_min}`);
        }

        if (year_max !== undefined) {
            filters.push(`release_year <= ${year_max}`);
        }

        const filterString = filters.length > 0 ? filters.join(' AND ') : undefined;

        // Execute search
        const results = await index.search(query, {
            filter: filterString,
            sort: [sort],
            limit: per_page,
            offset: (page - 1) * per_page,
        });

        return {
            products: results.hits,
            total: results.estimatedTotalHits || 0,
            page,
            per_page,
        };
    } catch (error) {
        console.error('Meilisearch query error:', error);
        // Return empty results on error
        return {
            products: [],
            total: 0,
            page: 1,
            per_page: 20,
        };
    }
}

export async function autocompleteSearch(query: string, limit = 5): Promise<any[]> {
    try {
        const index = client.index(INDEX_NAME);
        const results = await index.search(query, {
            limit,
            attributesToRetrieve: ['id', 'name', 'slug', 'brand', 'category', 'main_image_url'],
        });
        return results.hits;
    } catch (error) {
        console.error('Autocomplete search error:', error);
        return [];
    }
}

export async function deleteProductFromSearch(productId: number): Promise<void> {
    try {
        const index = client.index(INDEX_NAME);
        await index.deleteDocument(productId.toString());
    } catch (error) {
        console.error('Error deleting product from search:', error);
    }
}

export default client;
