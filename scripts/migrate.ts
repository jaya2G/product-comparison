#!/usr/bin/env tsx
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('Running database migrations...');

        const migrationFile = join(process.cwd(), 'migrations', '001_initial_schema.sql');
        const sql = readFileSync(migrationFile, 'utf-8');

        await pool.query(sql);

        console.log('✓ Migrations completed successfully!');
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
