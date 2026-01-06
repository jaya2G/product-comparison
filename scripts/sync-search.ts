#!/usr/bin/env tsx
import { Pool } from 'pg';
import { initializeSearchIndex, syncProductsToSearch } from '../lib/search';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function syncSearch() {
    try {
        console.log('🔄 Syncing products to Meilisearch...');

        // Initialize the search index
        await initializeSearchIndex();

        // Fetch all products from database
        const result = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN brands b ON p.brand_id = b.id
      ORDER BY p.id
    `);

        console.log(`Found ${result.rows.length} products to sync`);

        // Sync to Meilisearch
        await syncProductsToSearch(result.rows);

        console.log('✅ Search index synced successfully!');
    } catch (error) {
        console.error('❌ Error syncing search:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

syncSearch();
