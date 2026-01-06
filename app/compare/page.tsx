import { query } from '@/lib/db';
import { compareProducts } from '@/lib/specs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatSpecValue } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ComparePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const search = await searchParams;
    const ids = ((search.ids as string) || '').split(',').filter(Boolean);

    if (ids.length < 2) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center max-w-md mx-auto">
                    <h1 className="text-3xl font-bold mb-4">No Products to Compare</h1>
                    <p className="text-muted-foreground mb-6">
                        Please select at least 2 products to compare.
                    </p>
                    <Link href="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Fetch products
    const productsResult = await query(
        `SELECT 
      p.*,
      c.name as category_name,
      b.name as brand_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN brands b ON p.brand_id = b.id
    WHERE p.slug = ANY($1)`,
        [ids]
    );

    const products = productsResult.rows;

    if (products.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Products Not Found</h1>
                    <Link href="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const categoryId = products[0].category_id;

    // Fetch specs for all products
    const productIds = products.map((p: any) => p.id);
    const specsResult = await query(
        `SELECT 
      ps.*,
      sd.key,
      sd.label,
      sd.group_name,
      sd.unit,
      sd.value_type
    FROM product_specs ps
    JOIN spec_definitions sd ON ps.spec_definition_id = sd.id
    WHERE ps.product_id = ANY($1)
    ORDER BY sd.group_name, sd.label`,
        [productIds]
    );

    // Attach specs to products
    const productsWithSpecs = products.map((product: any) => ({
        ...product,
        specs: specsResult.rows
            .filter((spec: any) => spec.product_id === product.id)
            .map((spec: any) => ({
                ...spec,
                definition: {
                    key: spec.key,
                    label: spec.label,
                    group_name: spec.group_name,
                    unit: spec.unit,
                    value_type: spec.value_type,
                    id: spec.spec_definition_id,
                },
            })),
    }));

    // Get spec definitions
    const defsResult = await query(
        `SELECT * FROM spec_definitions
    WHERE category_id = $1
    ORDER BY group_name, label`,
        [categoryId]
    );

    const comparison = compareProducts(productsWithSpecs, defsResult.rows);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Product Comparison</h1>

            {/* Products Header */}
            <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}>
                <div></div>
                {products.map((product: any) => (
                    <Card key={product.id}>
                        <CardHeader className="pb-2">
                            {product.main_image_url && (
                                <img
                                    src={product.main_image_url}
                                    alt={product.name}
                                    className="w-full aspect-square object-cover rounded mb-2"
                                />
                            )}
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <Badge variant="secondary" className="w-fit">{product.brand_name}</Badge>
                        </CardHeader>
                        <CardContent>
                            {product.price && (
                                <p className="text-2xl font-bold mb-2">{formatPrice(product.price)}</p>
                            )}
                            <Link href={`/product/${product.slug}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                    View Details
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Comparison Table */}
            <div className="space-y-6">
                {comparison.specs.map((group) => (
                    <Card key={group.group_name}>
                        <CardHeader>
                            <CardTitle>{group.group_name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {group.specs.map((spec) => (
                                    <div
                                        key={spec.key}
                                        className="grid gap-4 py-3 border-b last:border-0"
                                        style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}
                                    >
                                        <div className="font-medium text-sm">{spec.label}</div>
                                        {spec.values.map((value, idx) => (
                                            <div
                                                key={idx}
                                                className={`text-sm ${spec.winner_index === idx ? 'font-bold text-green-600' : ''
                                                    }`}
                                            >
                                                {formatSpecValue(value, spec.unit)}
                                                {spec.winner_index === idx && ' ✓'}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
