# Product Comparison Platform MVP

A production-ready multi-category product comparison website built with Next.js 14, TypeScript, PostgreSQL, and Meilisearch. Compare phones and cameras side-by-side with detailed specifications, smart search, and AI-powered recommendations.

## Features

### Customer Features (No Login Required)
- **Home Page**: Search bar with autocomplete, category tiles, popular comparisons
- **Product Listings**: Filterable and sortable product grids with pagination
- **Product Details**: Comprehensive specs, images, 360/3D viewers
- **Comparison Tool**: Side-by-side comparison of up to 4 products
- **AI Assistant**: Chat interface for personalized product recommendations
- **Responsive Design**: Mobile-first with dark mode support

### Admin Features (API Key Protected)
- Create, update, delete products via API
- CSV bulk import
- Automatic search index synchronization

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL
- **Search**: Meilisearch
- **3D Viewer**: @google/model-viewer
- **Validation**: Zod

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Setup Instructions

### 1. Clone Repository

```bash
cd /Users/zcejey/Coding/Comparison/product-comparison
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Meilisearch on port 7700

Verify services are running:
```bash
docker-compose ps
```

### 4. Environment Configuration

The `.env.local` file is already created with these values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/product_comparison
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey123456789
ADMIN_KEY=your-secret-admin-key-change-in-production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: Change `ADMIN_KEY` before deploying to production!

### 5. Run Database Migrations

```bash
npm run migrate
```

This creates all database tables (categories, brands, products, specs, etc.)

### 6. Seed Database

```bash
npm run seed
```

This populates the database with:
- 2 categories (Phones, Cameras)
- 10 brands
- 10 phones with full specs
- 10 cameras with full specs

### 7. Sync Meilisearch Index

```bash
npm run sync-search
```

This indexes all products for fast search.

### 8. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Quick Setup (All-in-One)

After Docker services are running:

```bash
npm run setup
```

This runs migration + seed + sync-search in sequence.

## Project Structure

```
product-comparison/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── search/         # Search endpoint
│   │   ├── products/       # Product CRUD
│   │   ├── compare/        # Comparison endpoint
│   │   ├── chat/           # Chatbot endpoint
│   │   └── admin/          # Admin endpoints (protected)
│   ├── products/[category] # Product list pages
│   ├── product/[slug]      # Product detail pages
│   ├── compare/            # Comparison page
│   ├── assistant/          # Chatbot page
│   └── layout.tsx          # Root layout with navigation
├── components/              # React components
│   └── ui/                 # shadcn/ui components
├── lib/                     # Utilities
│   ├── db.ts               # Database queries
│   ├── search.ts           # Meilisearch integration
│   ├── specs.ts            # Comparison logic
│   ├── chat.ts             # Chatbot logic
│   └── validation.ts       # Zod schemas
├── migrations/              # SQL migrations
├── scripts/                 # Setup scripts
│   ├── migrate.ts          # Run migrations
│   ├── seed.ts             # Seed database
│   └── sync-search.ts      # Sync search index
├── types/                   # TypeScript types
└── docker-compose.yml       # Docker services
```

## Admin API Usage

All admin endpoints require the `x-admin-key` header.

### Create Product

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "x-admin-key: your-secret-admin-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 16 Pro",
    "category": "phones",
    "brand": "Apple",
    "description": "Latest flagship iPhone",
    "release_year": 2024,
    "price": 1199,
    "rating": 4.8,
    "main_image_url": "https://example.com/iphone16.jpg",
    "specs": {
      "screen_size": 6.7,
      "processor": "A18 Pro",
      "ram": 8,
      "storage": 256
    }
  }'
```

### CSV Import Template

Create a file `products.csv`:

```csv
name,category,brand,price,release_year,rating,description
Galaxy S25,phones,Samsung,1299,2024,4.7,Flagship Samsung phone
Canon R1,cameras,Canon,6499,2024,4.9,Professional mirrorless camera
```

Import via API:

```bash
curl -X POST http://localhost:3000/api/admin/import/csv \
  -H "x-admin-key: your-secret-admin-key-change-in-production" \
  -F "file=@products.csv"
```

## API Endpoints

### Public Endpoints

- `GET /api/search?q=...&category=...` - Search products
- `GET /api/products?category=...&sort=...` - List products
- `GET /api/products/[slug]` - Get product details
- `GET /api/compare?ids=slug1,slug2` - Compare products
- `POST /api/chat` - Chat with AI assistant

### Admin Endpoints (Require x-admin-key header)

- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/import/csv` - Bulk import

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
npm run sync-search  # Sync products to Meilisearch
npm run setup        # Run all setup steps (migrate + seed + sync)
```

## Database Schema

- **categories**: Product categories (phones, cameras)
- **brands**: Product brands
- **products**: Main product data
- **spec_definitions**: Flexible spec schema per category
- **product_specs**: Spec values (number, text, bool)
- **media_assets**: Images, 360 views, 3D models

## Features Roadmap

### Implemented ✅
- Multi-category support (Phones, Cameras)
- Flexible spec system
- Fast search with Meilisearch
- Side-by-side comparison
- AI chatbot for recommendations
- Admin API for data management
- Responsive design
- Dark mode

### Future Enhancements 🚀
- User accounts (optional)
- Product reviews and ratings
- Price tracking and alerts
- More categories (laptops, headphones, etc.)
- Advanced filters (price history, deals)
- Social sharing
- PWA support

## Troubleshooting

### Docker Services Won't Start

```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :7700  # Meilisearch

# Stop and restart services
docker-compose down
docker-compose up -d
```

### Database Connection Error

```bash
# Check DATABASE_URL in .env.local
# Verify PostgreSQL is running
docker-compose ps

# Test connection
psql postgresql://postgres:postgres@localhost:5432/product_comparison
```

### Meilisearch Not Working

```bash
# Check Meilisearch is running
curl http://localhost:7700/health

# Re-sync index
npm run sync-search
```

### Search Returns Empty Results

This means Meilisearch is  down or not synced. The system will fallback to PostgreSQL for search, but it's slower.

```bash
# Restart Meilisearch
docker-compose restart meilisearch

# Re-sync
npm run sync-search
```

## Production Deployment

1. **Update Environment Variables**
   - Change `ADMIN_KEY` to a strong random string
   - Update `DATABASE_URL` to production database
   - Update `MEILISEARCH_URL` if using managed service
   - Set `NEXT_PUBLIC_APP_URL` to production URL

2. **Build Application**
   ```bash
   npm run build
   npm run start
   ```

3. **Deploy Database**
   - Run migrations on production database
   - Import data

4. **Deploy Search**
   - Set up Meilisearch (self-hosted or Meilisearch Cloud)
   - Sync products

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
