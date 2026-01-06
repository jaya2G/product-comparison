import { query } from './db';
import { Product, ChatMessage } from '@/types';

interface QueryConstraints {
    category?: string;
    price_max?: number;
    price_min?: number;
    brands?: string[];
    specs?: Record<string, any>;
    limit?: number;
}

export async function parseUserQuery(message: string): Promise<QueryConstraints> {
    const constraints: QueryConstraints = {
        limit: 3,
    };

    const lowerMessage = message.toLowerCase();

    // Extract category
    if (lowerMessage.includes('phone')) {
        constraints.category = 'phones';
    } else if (lowerMessage.includes('camera')) {
        constraints.category = 'cameras';
    }

    // Extract price constraints
    const priceMatch = lowerMessage.match(/under\s+\$?(\d+)/i) ||
        lowerMessage.match(/below\s+\$?(\d+)/i) ||
        lowerMessage.match(/less than\s+\$?(\d+)/i);
    if (priceMatch) {
        constraints.price_max = parseInt(priceMatch[1]);
    }

    const minPriceMatch = lowerMessage.match(/above\s+\$?(\d+)/i) ||
        lowerMessage.match(/more than\s+\$?(\d+)/i) ||
        lowerMessage.match(/over\s+\$?(\d+)/i);
    if (minPriceMatch) {
        constraints.price_min = parseInt(minPriceMatch[1]);
    }

    // Extract brand
    const brands = ['apple', 'samsung', 'google', 'sony', 'canon', 'nikon', 'oneplus', 'xiaomi'];
    const foundBrands = brands.filter((brand) => lowerMessage.includes(brand));
    if (foundBrands.length > 0) {
        constraints.brands = foundBrands;
    }

    return constraints;
}

export async function findProductsByConstraints(
    constraints: QueryConstraints
): Promise<Product[]> {
    try {
        const whereClauses: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (constraints.category) {
            whereClauses.push(`c.slug = $${paramIndex}`);
            params.push(constraints.category);
            paramIndex++;
        }

        if (constraints.price_min !== undefined) {
            whereClauses.push(`p.price >= $${paramIndex}`);
            params.push(constraints.price_min);
            paramIndex++;
        }

        if (constraints.price_max !== undefined) {
            whereClauses.push(`p.price <= $${paramIndex}`);
            params.push(constraints.price_max);
            paramIndex++;
        }

        if (constraints.brands && constraints.brands.length > 0) {
            whereClauses.push(`b.slug = ANY($${paramIndex})`);
            params.push(constraints.brands);
            paramIndex++;
        }

        const whereClause = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(' AND ')}`
            : '';

        const limit = constraints.limit || 3;

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
      ORDER BY p.popularity_score DESC, p.rating DESC
      LIMIT $${paramIndex}
    `;

        params.push(limit);

        const result = await query(sql, params);
        return result.rows;
    } catch (error) {
        console.error('Error finding products by constraints:', error);
        return [];
    }
}

export function formatChatResponse(
    userMessage: string,
    products: Product[]
): string {
    if (products.length === 0) {
        return "I couldn't find any products matching your criteria. Could you try adjusting your requirements? For example, you could increase your budget or broaden your search.";
    }

    const productList = products
        .map((p: any, i) => {
            const price = p.price ? `$${p.price.toFixed(0)}` : 'N/A';
            return `${i + 1}. **${p.name}** (${p.brand_name}) - ${price}\n   [View Details](/product/${p.slug}) | [Compare](/compare?ids=${p.slug})`;
        })
        .join('\n\n');

    let response = `Based on your requirements, here are my top recommendations:\n\n${productList}\n\n`;

    // Add follow-up question
    const followUps = [
        'Would you like to know more about any specific feature?',
        'Are you interested in comparing these options?',
        'Do you have any other preferences, like brand or specific features?',
    ];

    response += followUps[Math.floor(Math.random() * followUps.length)];

    return response;
}

export function isSafeQuery(message: string): boolean {
    const dangerousPatterns = [
        /hack/i,
        /exploit/i,
        /injection/i,
        /script/i,
        /<script/i,
        /javascript:/i,
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(message));
}

export async function handleChatMessage(userMessage: string): Promise<{
    response: string;
    products: Product[];
}> {
    // Safety check
    if (!isSafeQuery(userMessage)) {
        return {
            response: 'I can only help with product-related questions. Please ask about phones or cameras.',
            products: [],
        };
    }

    // Parse query
    const constraints = await parseUserQuery(userMessage);

    // Find matching products
    const products = await findProductsByConstraints(constraints);

    // Format response
    const response = formatChatResponse(userMessage, products);

    return {
        response,
        products,
    };
}
