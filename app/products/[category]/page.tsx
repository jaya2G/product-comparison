import Link from 'next/link';
import { query } from '@/lib/db';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

export default async function ProductsPage({
    params,
    searchParams,
}: {
    params: Promise<{ category: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { category } = await params;
    const search = await searchParams;
    const sort = (search.sort as string) || 'popularity';
    const page = parseInt((search.page as string) || '1');
    const per_page = 20;

    // Determine sorting
    let orderBy = 'p.popularity_score DESC';
    if (sort === 'newest') orderBy = 'p.release_year DESC, p.created_at DESC';
    else if (sort === 'price_asc') orderBy = 'p.price ASC';
    else if (sort === 'price_desc') orderBy = 'p.price DESC';
    else if (sort === 'rating') orderBy = 'p.rating DESC';

    const offset = (page - 1) * per_page;

    // Fetch products
    const result = await query(
        `SELECT 
      p.*,
      c.name as category_name,
      b.name as brand_name,
      b.slug as brand_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN brands b ON p.brand_id = b.id
    WHERE c.slug = $1
    ORDER BY ${orderBy}
    LIMIT $2 OFFSET $3`,
        [category, per_page, offset]
    );

    const products = result.rows;

    // Get total count
    const countResult = await query(
        `SELECT COUNT(*) as total
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = $1`,
        [category]
    );

    const total = parseInt(countResult.rows[0]?.total || '0');

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 capitalize">{category}</h1>
                <p className="text-muted-foreground">{total} products found</p>
            </div>

            {/* Sorting */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <Link href={`/products/${category}?sort=popularity`}>
                        <Button variant={sort === 'popularity' ? 'default' : 'outline'} size="sm">
                            Popular
                        </Button>
                    </Link>
                    <Link href={`/products/${category}?sort=newest`}>
                        <Button variant={sort === 'newest' ? 'default' : 'outline'} size="sm">
                            Newest
                        </Button>
                    </Link>
                    <Link href={`/products/${category}?sort=price_asc`}>
                        <Button variant={sort === 'price_asc' ? 'default' : 'outline'} size="sm">
                            Price: Low to High
                        </Button>
                    </Link>
                    <Link href={`/products/${category}?sort=rating`}>
                        <Button variant={sort === 'rating' ? 'default' : 'outline'} size="sm">
                            Top Rated
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product: any) => (
                    <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow">
                        <CardHeader>
                            {product.main_image_url && (
                                <div className="aspect-square relative mb-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                                    <img
                                        src={product.main_image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{product.brand_name}</Badge>
                                {product.release_year && (
                                    <span className="text-sm text-muted-foreground">{product.release_year}</span>
                                )}
                            </div>
                            {product.rating > 0 && (
                                <div className="flex items-center gap-1 mb-2">
                                    <span className="text-yellow-500">★</span>
                                    <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                                </div>
                            )}
                            {product.price && (
                                <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
                            )}
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Link href={`/product/${product.slug}`} className="w-full">
                                <Button className="w-full">View Details</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Pagination */}
            {total > per_page && (
                <div className="flex justify-center gap-2 mt-8">
                    {page > 1 && (
                        <Link href={`/products/${category}?page=${page - 1}&sort=${sort}`}>
                            <Button variant="outline">Previous</Button>
                        </Link>
                    )}
                    <span className="flex items-center px-4">
                        Page {page} of {Math.ceil(total / per_page)}
                    </span>
                    {page < Math.ceil(total / per_page) && (
                        <Link href={`/products/${category}?page=${page + 1}&sort=${sort}`}>
                            <Button variant="outline">Next</Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
