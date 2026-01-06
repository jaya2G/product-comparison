#!/usr/bin/env tsx
import { Pool } from 'pg';
import { generateSlug } from '../lib/utils';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('🌱 Seeding database...');

        // 1. Insert Categories
        console.log('Inserting categories...');
        const categoriesResult = await client.query(`
      INSERT INTO categories (name, slug, description) VALUES
      ('Phones', 'phones', 'Smartphones and mobile devices'),
      ('Cameras', 'cameras', 'Digital cameras and photography equipment')
      RETURNING id, slug
    `);

        const categoryMap: Record<string, number> = {};
        categoriesResult.rows.forEach(row => {
            categoryMap[row.slug] = row.id;
        });

        // 2. Insert Brands
        console.log('Inserting brands...');
        const brandsData = [
            { name: 'Apple', slug: 'apple' },
            { name: 'Samsung', slug: 'samsung' },
            { name: 'Google', slug: 'google' },
            { name: 'OnePlus', slug: 'oneplus' },
            { name: 'Xiaomi', slug: 'xiaomi' },
            { name: 'Sony', slug: 'sony' },
            { name: 'Canon', slug: 'canon' },
            { name: 'Nikon', slug: 'nikon' },
            { name: 'Fujifilm', slug: 'fujifilm' },
            { name: 'Panasonic', slug: 'panasonic' },
        ];

        const brandMap: Record<string, number> = {};
        for (const brand of brandsData) {
            const result = await client.query(
                'INSERT INTO brands (name, slug) VALUES ($1, $2) RETURNING id',
                [brand.name, brand.slug]
            );
            brandMap[brand.slug] = result.rows[0].id;
        }

        // 3. Insert Phone Spec Definitions
        console.log('Inserting phone spec definitions...');
        const phoneSpecDefs = [
            // Display
            { key: 'screen_size', label: 'Screen Size', group: 'Display', unit: 'inches', type: 'number' },
            { key: 'resolution', label: 'Resolution', group: 'Display', unit: '', type: 'text' },
            { key: 'refresh_rate', label: 'Refresh Rate', group: 'Display', unit: 'Hz', type: 'number' },
            { key: 'screen_type', label: 'Screen Type', group: 'Display', unit: '', type: 'text' },

            // Performance
            { key: 'processor', label: 'Processor', group: 'Performance', unit: '', type: 'text' },
            { key: 'ram', label: 'RAM', group: 'Performance', unit: 'GB', type: 'number' },
            { key: 'storage', label: 'Storage', group: 'Performance', unit: 'GB', type: 'number' },

            // Camera
            { key: 'main_camera', label: 'Main Camera', group: 'Camera', unit: 'MP', type: 'number' },
            { key: 'front_camera', label: 'Front Camera', group: 'Camera', unit: 'MP', type: 'number' },
            { key: 'video_recording', label: 'Video Recording', group: 'Camera', unit: '', type: 'text' },

            // Battery
            { key: 'battery', label: 'Battery Capacity', group: 'Battery', unit: 'mAh', type: 'number' },
            { key: 'fast_charging', label: 'Fast Charging', group: 'Battery', unit: 'W', type: 'number' },
            { key: 'wireless_charging', label: 'Wireless Charging', group: 'Battery', unit: '', type: 'bool' },

            // Build
            { key: 'weight', label: 'Weight', group: 'Build', unit: 'g', type: 'number' },
            { key: 'water_resistant', label: 'Water Resistant', group: 'Build', unit: '', type: 'bool' },

            // Connectivity
            { key: '5g', label: '5G Support', group: 'Connectivity', unit: '', type: 'bool' },
        ];

        const phoneSpecMap: Record<string, number> = {};
        for (const spec of phoneSpecDefs) {
            const result = await client.query(
                `INSERT INTO spec_definitions (category_id, key, label, group_name, unit, value_type) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [categoryMap['phones'], spec.key, spec.label, spec.group, spec.unit, spec.type]
            );
            phoneSpecMap[spec.key] = result.rows[0].id;
        }

        // 4. Insert Camera Spec Definitions
        console.log('Inserting camera spec definitions...');
        const cameraSpecDefs = [
            // Sensor
            { key: 'sensor_size', label: 'Sensor Size', group: 'Sensor', unit: '', type: 'text' },
            { key: 'megapixels', label: 'Megapixels', group: 'Sensor', unit: 'MP', type: 'number' },
            { key: 'iso_range', label: 'ISO Range', group: 'Sensor', unit: '', type: 'text' },

            // Performance
            { key: 'autofocus_points', label: 'Autofocus Points', group: 'Performance', unit: '', type: 'number' },
            { key: 'max_shutter_speed', label: 'Max Shutter Speed', group: 'Performance', unit: '', type: 'text' },
            { key: 'burst_rate', label: 'Burst Rate', group: 'Performance', unit: 'fps', type: 'number' },

            // Video
            { key: '4k_video', label: '4K Video', group: 'Video', unit: '', type: 'bool' },
            { key: '8k_video', label: '8K Video', group: 'Video', unit: '', type: 'bool' },
            { key: 'video_fps', label: 'Max Video FPS', group: 'Video', unit: 'fps', type: 'number' },

            // Screen
            { key: 'screen_size_cam', label: 'Screen Size', group: 'Display', unit: 'inches', type: 'number' },
            { key: 'viewfinder', label: 'Viewfinder Type', group: 'Display', unit: '', type: 'text' },

            // Build
            { key: 'weight_cam', label: 'Weight', group: 'Build', unit: 'g', type: 'number' },
            { key: 'weather_sealed', label: 'Weather Sealed', group: 'Build', unit: '', type: 'bool' },

            // Battery
            { key: 'battery_life', label: 'Battery Life', group: 'Battery', unit: 'shots', type: 'number' },
        ];

        const cameraSpecMap: Record<string, number> = {};
        for (const spec of cameraSpecDefs) {
            const result = await client.query(
                `INSERT INTO spec_definitions (category_id, key, label, group_name, unit, value_type) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [categoryMap['cameras'], spec.key, spec.label, spec.group, spec.unit, spec.type]
            );
            cameraSpecMap[spec.key] = result.rows[0].id;
        }

        // 5. Insert Phones
        console.log('Inserting phones...');
        const phones = [
            {
                name: 'iPhone 15 Pro Max',
                brand: 'apple',
                price: 1199,
                year: 2023,
                rating: 4.7,
                description: 'Flagship iPhone with titanium design and A17 Pro chip',
                image: 'https://images.unsplash.com/photo-1695048064524-d94569f3e893?w=400',
                specs: {
                    screen_size: 6.7, resolution: '2796 x 1290', refresh_rate: 120, screen_type: 'OLED',
                    processor: 'A17 Pro', ram: 8, storage: 256,
                    main_camera: 48, front_camera: 12, video_recording: '4K 60fps ProRes',
                    battery: 4441, fast_charging: 27, wireless_charging: true,
                    weight: 221, water_resistant: true, '5g': true
                }
            },
            {
                name: 'Samsung Galaxy S24 Ultra',
                brand: 'samsung',
                price: 1299,
                year: 2024,
                rating: 4.8,
                description: 'Premium Samsung flagship with S Pen and AI features',
                image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
                specs: {
                    screen_size: 6.8, resolution: '3120 x 1440', refresh_rate: 120, screen_type: 'AMOLED',
                    processor: 'Snapdragon 8 Gen 3', ram: 12, storage: 256,
                    main_camera: 200, front_camera: 12, video_recording: '8K 30fps',
                    battery: 5000, fast_charging: 45, wireless_charging: true,
                    weight: 232, water_resistant: true, '5g': true
                }
            },
            {
                name: 'Google Pixel 8 Pro',
                brand: 'google',
                price: 999,
                year: 2023,
                rating: 4.6,
                description: 'Google flagship with Tensor G3 and advanced AI photography',
                image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
                specs: {
                    screen_size: 6.7, resolution: '2992 x 1344', refresh_rate: 120, screen_type: 'OLED',
                    processor: 'Tensor G3', ram: 12, storage: 128,
                    main_camera: 50, front_camera: 10.5, video_recording: '4K 60fps',
                    battery: 5050, fast_charging: 30, wireless_charging: true,
                    weight: 213, water_resistant: true, '5g': true
                }
            },
            {
                name: 'OnePlus 12',
                brand: 'oneplus',
                price: 799,
                year: 2024,
                rating: 4.5,
                description: 'Flagship killer with Hasselblad cameras',
                image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
                specs: {
                    screen_size: 6.82, resolution: '3168 x 1440', refresh_rate: 120, screen_type: 'AMOLED',
                    processor: 'Snapdragon 8 Gen 3', ram: 12, storage: 256,
                    main_camera: 50, front_camera: 32, video_recording: '8K 24fps',
                    battery: 5400, fast_charging: 100, wireless_charging: true,
                    weight: 220, water_resistant: true, '5g': true
                }
            },
            {
                name: 'Xiaomi 14 Pro',
                brand: 'xiaomi',
                price: 899,
                year: 2024,
                rating: 4.4,
                description: 'Premium Xiaomi with Leica optics',
                image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400',
                specs: {
                    screen_size: 6.73, resolution: '3200 x 1440', refresh_rate: 120, screen_type: 'AMOLED',
                    processor: 'Snapdragon 8 Gen 3', ram: 12, storage: 256,
                    main_camera: 50, front_camera: 32, video_recording: '8K 24fps',
                    battery: 4880, fast_charging: 120, wireless_charging: true,
                    weight: 219, water_resistant: true, '5g': true
                }
            },
            {
                name: 'iPhone 14',
                brand: 'apple',
                price: 799,
                year: 2022,
                rating: 4.5,
                description: 'Reliable iPhone with great camera and performance',
                image: 'https://images.unsplash.com/photo-1663531004056-a2f1e0c5be74?w=400',
                specs: {
                    screen_size: 6.1, resolution: '2532 x 1170', refresh_rate: 60, screen_type: 'OLED',
                    processor: 'A15 Bionic', ram: 6, storage: 128,
                    main_camera: 12, front_camera: 12, video_recording: '4K 60fps',
                    battery: 3279, fast_charging: 20, wireless_charging: true,
                    weight: 172, water_resistant: true, '5g': true
                }
            },
            {
                name: 'Samsung Galaxy S23',
                brand: 'samsung',
                price: 799,
                year: 2023,
                rating: 4.6,
                description: 'Compact flagship with excellent performance',
                image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
                specs: {
                    screen_size: 6.1, resolution: '2340 x 1080', refresh_rate: 120, screen_type: 'AMOLED',
                    processor: 'Snapdragon 8 Gen 2', ram: 8, storage: 128,
                    main_camera: 50, front_camera: 12, video_recording: '8K 30fps',
                    battery: 3900, fast_charging: 25, wireless_charging: true,
                    weight: 168, water_resistant: true, '5g': true
                }
            },
            {
                name: 'Google Pixel 7a',
                brand: 'google',
                price: 499,
                year: 2023,
                rating: 4.4,
                description: 'Budget-friendly Pixel with great camera',
                image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
                specs: {
                    screen_size: 6.1, resolution: '2400 x 1080', refresh_rate: 90, screen_type: 'OLED',
                    processor: 'Tensor G2', ram: 8, storage: 128,
                    main_camera: 64, front_camera: 13, video_recording: '4K 60fps',
                    battery: 4385, fast_charging: 18, wireless_charging: true,
                    weight: 193, water_resistant: true, '5g': true
                }
            },
            {
                name: 'OnePlus 11',
                brand: 'oneplus',
                price: 699,
                year: 2023,
                rating: 4.5,
                description: 'Fast flagship with excellent value',
                image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
                specs: {
                    screen_size: 6.7, resolution: '3216 x 1440', refresh_rate: 120, screen_type: 'AMOLED',
                    processor: 'Snapdragon 8 Gen 2', ram: 8, storage: 128,
                    main_camera: 50, front_camera: 16, video_recording: '8K 24fps',
                    battery: 5000, fast_charging: 100, wireless_charging: false,
                    weight: 205, water_resistant: false, '5g': true
                }
            },
            {
                name: 'Xiaomi 13',
                brand: 'xiaomi',
                price: 649,
                year: 2023,
                rating: 4.3,
                description: 'Powerful phone with Leica cameras',
                image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400',
                specs: {
                    screen_size: 6.36, resolution: '2400 x 1080', refresh_rate: 120, screen_type: 'AMOLED',
                    processor: 'Snapdragon 8 Gen 2', ram: 8, storage: 128,
                    main_camera: 50, front_camera: 32, video_recording: '8K 24fps',
                    battery: 4500, fast_charging: 67, wireless_charging: true,
                    weight: 189, water_resistant: true, '5g': true
                }
            },
        ];

        for (const phone of phones) {
            const slug = generateSlug(phone.name);
            const productResult = await client.query(
                `INSERT INTO products (category_id, brand_id, name, slug, description, release_year, price, rating, main_image_url, popularity_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                [categoryMap['phones'], brandMap[phone.brand], phone.name, slug, phone.description,
                phone.year, phone.price, phone.rating, phone.image, Math.floor(Math.random() * 1000)]
            );

            const productId = productResult.rows[0].id;

            // Insert specs
            for (const [key, value] of Object.entries(phone.specs)) {
                const specDefId = phoneSpecMap[key];
                if (!specDefId) continue;

                const specDef = phoneSpecDefs.find(s => s.key === key);
                if (!specDef) continue;

                let valueNumber = null, valueText = null, valueBool = null;

                if (specDef.type === 'number') valueNumber = value;
                else if (specDef.type === 'bool') valueBool = value;
                else valueText = value;

                await client.query(
                    `INSERT INTO product_specs (product_id, spec_definition_id, value_number, value_text, value_bool)
           VALUES ($1, $2, $3, $4, $5)`,
                    [productId, specDefId, valueNumber, valueText, valueBool]
                );
            }
        }

        // 6. Insert Cameras
        console.log('Inserting cameras...');
        const cameras = [
            {
                name: 'Canon EOS R5',
                brand: 'canon',
                price: 3899,
                year: 2020,
                rating: 4.8,
                description: 'Professional mirrorless camera with 8K video',
                image: 'https://images.unsplash.com/photo-1606978266749-79c7a45fcfdb?w=400',
                specs: {
                    sensor_size: 'Full Frame', megapixels: 45, iso_range: '100-51200',
                    autofocus_points: 5940, max_shutter_speed: '1/8000s', burst_rate: 20,
                    '4k_video': true, '8k_video': true, video_fps: 120,
                    screen_size_cam: 3.2, viewfinder: 'EVF 5.76M dots',
                    weight_cam: 738, weather_sealed: true, battery_life: 320
                }
            },
            {
                name: 'Sony A7 IV',
                brand: 'sony',
                price: 2499,
                year: 2021,
                rating: 4.7,
                description: 'Versatile full-frame hybrid camera',
                image: 'https://images.unsplash.com/photo-1606171414532-a3bffe2b90cc?w=400',
                specs: {
                    sensor_size: 'Full Frame', megapixels: 33, iso_range: '100-51200',
                    autofocus_points: 759, max_shutter_speed: '1/8000s', burst_rate: 10,
                    '4k_video': true, '8k_video': false, video_fps: 60,
                    screen_size_cam: 3.0, viewfinder: 'EVF 3.69M dots',
                    weight_cam: 658, weather_sealed: true, battery_life: 580
                }
            },
            {
                name: 'Nikon Z9',
                brand: 'nikon',
                price: 5499,
                year: 2021,
                rating: 4.9,
                description: 'Flagship mirrorless camera with 8K video',
                image: 'https://images.unsplash.com/photo-1606171414532-a3bffe2b90cc?w=400',
                specs: {
                    sensor_size: 'Full Frame', megapixels: 45.7, iso_range: '64-25600',
                    autofocus_points: 493, max_shutter_speed: '1/32000s', burst_rate: 20,
                    '4k_video': true, '8k_video': true, video_fps: 120,
                    screen_size_cam: 3.2, viewfinder: 'EVF 3.69M dots',
                    weight_cam: 1340, weather_sealed: true, battery_life: 740
                }
            },
            {
                name: 'Fujifilm X-T5',
                brand: 'fujifilm',
                price: 1699,
                year: 2022,
                rating: 4.6,
                description: 'Retro-styled APS-C camera with excellent image quality',
                image: 'https://images.unsplash.com/photo-1606171414532-a3bffe2b90cc?w=400',
                specs: {
                    sensor_size: 'APS-C', megapixels: 40, iso_range: '125-12800',
                    autofocus_points: 425, max_shutter_speed: '1/8000s', burst_rate: 15,
                    '4k_video': true, '8k_video': false, video_fps: 60,
                    screen_size_cam: 3.0, viewfinder: 'EVF 3.69M dots',
                    weight_cam: 557, weather_sealed: true, battery_life: 580
                }
            },
            {
                name: 'Sony A6400',
                brand: 'sony',
                price: 898,
                year: 2019,
                rating: 4.6,
                description: 'Compact APS-C camera with fast autofocus',
                image: 'https://images.unsplash.com/photo-1606171414532-a3bffe2b90cc?w=400',
                specs: {
                    sensor_size: 'APS-C', megapixels: 24, iso_range: '100-32000',
                    autofocus_points: 425, max_shutter_speed: '1/4000s', burst_rate: 11,
                    '4k_video': true, '8k_video': false, video_fps: 30,
                    screen_size_cam: 3.0, viewfinder: 'EVF 2.36M dots',
                    weight_cam: 403, weather_sealed: false, battery_life: 410
                }
            },
            {
                name: 'Canon EOS R6 Mark II',
                brand: 'canon',
                price: 2499,
                year: 2022,
                rating: 4.7,
                description: 'Fast full-frame camera for action and wildlife',
                image: 'https://images.unsplash.com/photo-1606978266749-79c7a45fcfdb?w=400',
                specs: {
                    sensor_size: 'Full Frame', megapixels: 24, iso_range: '100-102400',
                    autofocus_points: 1053, max_shutter_speed: '1/8000s', burst_rate: 40,
                    '4k_video': true, '8k_video': false, video_fps: 60,
                    screen_size_cam: 3.0, viewfinder: 'EVF 3.69M dots',
                    weight_cam: 670, weather_sealed: true, battery_life: 760
                }
            },
            {
                name: 'Nikon Z6 II',
                brand: 'nikon',
                price: 1999,
                year: 2020,
                rating: 4.5,
                description: 'Versatile full-frame camera with dual processors',
                image: 'https://images.unsplash.com/photo-1606171414532-a3bffe2b90cc?w=400',
                specs: {
                    sensor_size: 'Full Frame', megapixels: 24.5, iso_range: '100-51200',
                    autofocus_points: 273, max_shutter_speed: '1/8000s', burst_rate: 14,
                    '4k_video': true, '8k_video': false, video_fps: 60,
                    screen_size_cam: 3.2, viewfinder: 'EVF 3.69M dots',
                    weight_cam: 705, weather_sealed: true, battery_life: 410
                }
            },
            {
                name: 'Fujifilm X-S20',
                brand: 'fujifilm',
                price: 1299,
                year: 2023,
                rating: 4.5,
                description: 'Compact APS-C camera with great video features',
                image: 'https://images.unsplash.com/photo-1606171414532-a3bffe2b90cc?w=400',
                specs: {
                    sensor_size: 'APS-C', megapixels: 26, iso_range: '160-12800',
                    autofocus_points: 425, max_shutter_speed: '1/8000s', burst_rate: 20,
                    '4k_video': true, '8k_video': false, video_fps: 60,
                    screen_size_cam: 3.0, viewfinder: 'EVF 2.36M dots',
                    weight_cam: 491, weather_sealed: false, battery_life: 800
                }
            },
            {
                name: 'Panasonic Lumix GH6',
                brand: 'panasonic',
                price: 2199,
                year: 2022,
                rating: 4.6,
                description: 'Professional video-centric Micro Four Thirds camera',
                image: 'https://images.unsplash.com/photo-1606171414532-a3bffe2b90cc?w=400',
                specs: {
                    sensor_size: 'Micro Four Thirds', megapixels: 25, iso_range: '100-25600',
                    autofocus_points: 315, max_shutter_speed: '1/8000s', burst_rate: 14,
                    '4k_video': true, '8k_video': false, video_fps: 120,
                    screen_size_cam: 3.0, viewfinder: 'EVF 3.68M dots',
                    weight_cam: 823, weather_sealed: true, battery_life: 360
                }
            },
            {
                name: 'Canon EOS R10',
                brand: 'canon',
                price: 979,
                year: 2022,
                rating: 4.4,
                description: 'Affordable APS-C camera with fast performance',
                image: 'https://images.unsplash.com/photo-1606978266749-79c7a45fcfdb?w=400',
                specs: {
                    sensor_size: 'APS-C', megapixels: 24, iso_range: '100-32000',
                    autofocus_points: 651, max_shutter_speed: '1/4000s', burst_rate: 15,
                    '4k_video': true, '8k_video': false, video_fps: 60,
                    screen_size_cam: 3.0, viewfinder: 'EVF 2.36M dots',
                    weight_cam: 429, weather_sealed: false, battery_life: 450
                }
            },
        ];

        for (const camera of cameras) {
            const slug = generateSlug(camera.name);
            const productResult = await client.query(
                `INSERT INTO products (category_id, brand_id, name, slug, description, release_year, price, rating, main_image_url, popularity_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                [categoryMap['cameras'], brandMap[camera.brand], camera.name, slug, camera.description,
                camera.year, camera.price, camera.rating, camera.image, Math.floor(Math.random() * 1000)]
            );

            const productId = productResult.rows[0].id;

            // Insert specs
            for (const [key, value] of Object.entries(camera.specs)) {
                const specDefId = cameraSpecMap[key];
                if (!specDefId) continue;

                const specDef = cameraSpecDefs.find(s => s.key === key);
                if (!specDef) continue;

                let valueNumber = null, valueText = null, valueBool = null;

                if (specDef.type === 'number') valueNumber = value;
                else if (specDef.type === 'bool') valueBool = value;
                else valueText = value;

                await client.query(
                    `INSERT INTO product_specs (product_id, spec_definition_id, value_number, value_text, value_bool)
           VALUES ($1, $2, $3, $4, $5)`,
                    [productId, specDefId, valueNumber, valueText, valueBool]
                );
            }
        }

        await client.query('COMMIT');
        console.log('✅ Database seeded successfully!');
        console.log(`   - Categories: 2`);
        console.log(`   - Brands: ${brandsData.length}`);
        console.log(`   - Phones: ${phones.length}`);
        console.log(`   - Cameras: ${cameras.length}`);
        console.log(`   - Total products: ${phones.length + cameras.length}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase().catch(console.error);
