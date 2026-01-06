import { Product, ProductSpec, ComparisonResult, SpecDefinition } from '@/types';

export function compareProducts(
    products: (Product & { specs: ProductSpec[] })[],
    specDefinitions: SpecDefinition[]
): ComparisonResult {
    if (products.length === 0) {
        return { products: [], specs: [] };
    }

    // Group spec definitions by group_name
    const specGroups = specDefinitions.reduce((acc, def) => {
        if (!acc[def.group_name]) {
            acc[def.group_name] = [];
        }
        acc[def.group_name].push(def);
        return acc;
    }, {} as Record<string, SpecDefinition[]>);

    // Build comparison data
    const comparisonSpecs = Object.entries(specGroups).map(([group_name, defs]) => {
        const specs = defs.map((def) => {
            const values = products.map((product) => {
                const spec = product.specs?.find(
                    (s) => s.spec_definition_id === def.id
                );

                if (!spec) return null;

                if (def.value_type === 'number') return spec.value_number ?? null;
                if (def.value_type === 'bool') return spec.value_bool ?? null;
                return spec.value_text ?? null;
            });

            // Determine if values are different
            const uniqueValues = new Set(values.filter((v) => v !== null));
            const is_different = uniqueValues.size > 1;

            // Determine winner (simple heuristic: highest number wins)
            let winner_index: number | undefined;
            if (def.value_type === 'number' && is_different) {
                const numValues = values.map((v) => (typeof v === 'number' ? v : -Infinity));
                const maxValue = Math.max(...numValues);
                if (maxValue > -Infinity) {
                    winner_index = numValues.indexOf(maxValue);
                }
            }

            return {
                key: def.key,
                label: def.label,
                unit: def.unit,
                values,
                winner_index,
                is_different,
            };
        });

        return {
            group_name,
            specs,
        };
    });

    return {
        products,
        specs: comparisonSpecs,
    };
}

export function getSpecValue(
    product: Product & { specs: ProductSpec[] },
    specKey: string
): string | number | boolean | null {
    const spec = product.specs?.find((s) => s.definition?.key === specKey);

    if (!spec || !spec.definition) return null;

    if (spec.definition.value_type === 'number') return spec.value_number ?? null;
    if (spec.definition.value_type === 'bool') return spec.value_bool ?? null;
    return spec.value_text ?? null;
}

export function groupSpecsByCategory(specs: (ProductSpec & { definition?: SpecDefinition })[]) {
    const grouped = specs.reduce((acc, spec) => {
        if (!spec.definition) return acc;

        const group = spec.definition.group_name;
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(spec);
        return acc;
    }, {} as Record<string, (ProductSpec & { definition?: SpecDefinition })[]>);

    return Object.entries(grouped).map(([group_name, specs]) => ({
        group_name,
        specs,
    }));
}
