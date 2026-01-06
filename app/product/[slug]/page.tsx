import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, formatSpecValue } from '@/lib/utils';
import { groupSpecsByCategory } from '@/lib/specs';

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // Get product
    const productResult = await query(
        `SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug,
      b.name as brand_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN brands b ON p.brand_id = b.id
    WHERE p.slug = $1`,
        [slug]
    );

    if (productResult.rows.length === 0) {
        notFound();
    }

    const product = productResult.rows[0];

    // Get specs
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
    WHERE ps.product_id = $1
    ORDER BY sd.group_name, sd.label`,
        [product.id]
    );

    const specs = specsResult.rows.map((spec: any) => ({
        ...spec,
        definition: {
            key: spec.key,
            label: spec.label,
            group_name: spec.group_name,
            unit: spec.unit,
            value_type: spec.value_type,
        }
    }));

    const groupedSpecs = groupSpecsByCategory(specs);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <div className="mb-6 text-sm text-muted-foreground">
                <Link href="/" className="hover:underline">Home</Link>
                {' / '}
                <Link href={`/products/${product.category_slug}`} className="hover:underline capitalize">
                    {product.category_slug}
                </Link>
                {' / '}
                <span>{product.name}</span>
            </div>

            {/* Hero Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div>
                    {product.main_image_url ? (
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                            <img
                                src={product.main_image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{product.brand_name}</Badge>
                        {product.release_year && (
                            <Badge variant="outline">{product.release_year}</Badge>
                        )}
                    </div>

                    <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

                    {product.rating > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < Math.round(product.rating) ? "text-yellow-500" : "text-gray-300"}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span className="text-lg font-medium">{product.rating.toFixed(1)}</span>
                        </div>
                    )}

                    {product.price && (
                        <p className="text-4xl font-bold mb-6">{formatPrice(product.price)}</p>
                    )}

                    {product.description && (
                        <p className="text-muted-foreground mb-6">{product.description}</p>
                    )}

                    <div className="flex gap-4">
                        <Link href={`/compare?ids=${slug}`}>
                            <Button size="lg">Add to Comparison</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Specifications */}
            <div>
                <h2 className="text-3xl font-bold mb-6">Specifications</h2>

                <div className="space-y-6">
                    {groupedSpecs.map((group) => (
                        <Card key={group.group_name}>
                            <CardHeader>
                                <CardTitle>{group.group_name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    {group.specs.map((spec: any) => {
                                        const value = spec.definition.value_type === 'number'
                                            ? spec.value_number
                                            : spec.definition.value_type === 'bool'
                                                ? spec.value_bool
                                                : spec.value_text;

                                        return (
                                            <div key={spec.id} className="grid grid-cols-2 py-2 border-b last:border-0">
                                                <span className="text-muted-foreground">{spec.definition.label}</span>
                                                <span className="font-medium">
                                                    {formatSpecValue(value, spec.definition.unit)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
