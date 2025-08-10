# Store Management System

A comprehensive enterprise retail management system built with React, TypeScript, and Supabase.

## 🚀 Quick Start

```bash
npm install
npm run dev
npm run test:e2e  # Run end-to-end tests
```

## 🧪 Testing

### E2E Test Suites

Three comprehensive e2e test suites ensure API compatibility:

1. **Sales Orders** (`tests/e2e/sales.test.ts`)
   - Create order with line items
   - Verify Extended Warranty, price/MAP ratios, fees
   - Test payment methods (1-3 payments), customer source
   - Validate complete field mapping

2. **Returns** (`tests/e2e/returns.test.ts`)
   - Create customer return → PENDING status
   - Scan EPC for restock → IN_STOCK status
   - Assert Item.status correctly updated
   - Test both customer & store-to-warehouse returns

3. **Transfers** (`tests/e2e/transfers.test.ts`)
   - Create STORE_TO_HQ & HQ_TO_STORE transfers
   - Ship → Receive workflow
   - Verify Item.currentStoreId updates correctly
   - Test all transfer kinds (STORE_TO_STORE, etc.)

```bash
# Run all e2e tests
npm run test:e2e

# Run specific test suite
npx vitest tests/e2e/sales.test.ts
npx vitest tests/e2e/returns.test.ts
npx vitest tests/e2e/transfers.test.ts
```

## 🔄 Migration Safeguards

### API Path Preservation

**All existing API paths remain unchanged** to ensure zero-disruption migrations:

- ✅ `/api/store/*` - All current store-level endpoints preserved
- ✅ Field names and types unchanged in responses
- ✅ Legacy frontend apps can continue without modifications

### Future API Architecture

For HQ-level consolidated reports and analytics:
- 🔮 `/api/hq/*` - Future HQ-only endpoints (role-restricted)
- 🔮 Advanced reporting and cross-store analytics
- 🔮 System administration functions

### OpenAPI Specification

The API specification is automatically generated and saved on each build:

```bash
# Generate OpenAPI spec
npm run generate-openapi

# Outputs:
# - public/openapi.json      # Full OpenAPI 3.0 specification
# - public/api-summary.json  # Summary for frontend/QA teams
```

**For Frontend/QA Teams:**
- OpenAPI spec available at `/openapi.json` in production
- Use for API documentation, client generation, and contract testing
- Summary endpoint lists all available endpoints and methods

### Backward Compatibility Promise

1. **No Breaking Changes**: Existing endpoints maintain identical signatures
2. **Additive Only**: New fields are optional, old clients unaffected  
3. **Graceful Evolution**: New features via optional parameters or new endpoints
4. **Migration Period**: 6-month overlap for any future deprecations


**Current API paths are preserved** to ensure zero frontend changes during backend migration:

- ✅ Keep: `/api/store/*` (current endpoints preserved via Vite proxy)
- 🆕 New Architecture: Supabase Edge Functions + Hono + Service Layer
- 🆕 Future: `/api/hq/*` (HQ-only consolidated reports)

### New Backend Architecture

**Layered Architecture with Type Safety:**
```
Frontend (unchanged) → Vite Proxy → Edge Functions (Hono) → Core Services → Supabase
                     /api/store/*      /api-new/*          packages/core/    Database
```

**Key Components:**
- `supabase/functions/api-new/`: Hono-based Edge Function with OpenAPI
- `packages/core/`: Domain services (AuthService, SalesOrdersService, CustomersService)
- `packages/shared/`: DTOs, validation schemas, error codes, types

**Benefits:**
- Full DTO validation with Zod schemas
- RBAC filtering (cost data hidden from store employees)
- Standardized error handling with codes
- OpenAPI documentation auto-generation
- Type-safe service layer

### OpenAPI Documentation

Automatically generated on each build:
- Output: `public/openapi.json`
- Live docs: `/api/docs` and `/api/docs/ui`
- Used by frontend/QA for automatic API alignment
- Prevents breaking changes during backend transitions

## 📊 Old → New Interface Mapping

For team reference during backend migration:

### Core Sales & Orders
```
OLD → NEW (Future Backend)
sales_orders / sales_order_items → RetailOrder / RetailLine
```
**UI Fields Enhanced:**
- MAP pricing & price/MAP ratios
- Fee breakdown (delivery, accessory, other)
- Payment segmentation (method1-3, amount1-3)
- Customer names (first/last) + cashier details

### Inventory Management
```
OLD → NEW
inventory → vw_inventory (derived from Item table)
```
**Real-time tracking:**
- EPC-based item tracking
- Store location (currentStoreId)
- Status transitions (in_stock, sold, transferred, etc.)

### Returns & After-Sales
```
OLD → NEW
returns / after_sales_returns → ReturnOrder / ReturnLine
```
**Unified Model:**
- `isCustomerReturn` flag (customer vs store-to-warehouse)
- `restockStatus` workflow (PENDING → IN_STOCK)
- Automatic Item status updates via triggers

### Repairs
```
OLD → NEW
repairs → RepairOrder / RepairPart
```
**Enhanced Features:**
- Document uploads (repair quotes, work orders)
- Disclaimer injection from SystemSetting
- Status tracking with estimated completion

### Scrap Management
```
OLD → NEW
scrap_headers / scrap_lines → ScrapOrder / ScrapLine
```
**Photo Documentation:**
- `photoUrls[]` array for multiple photos
- 7-day signed URLs for secure access
- Bucket-based storage with RLS policies

### Purchase Requests
```
OLD → NEW
purchase_requests → PurchaseRequest* (simplified tables)
```
**Transition Period:**
- Old routes preserved during migration
- New simplified schema for better performance

### User Management
```
OLD → NEW
profiles / user_roles / stores → User (first/last/role/storeId) / Store
```
**Unified Hierarchy:**
- HQ, Warehouse, Store all unified in Store table
- Role-based access (store_employee, store_manager, hq_admin)
- Single user profile with embedded role/store

### Warranty Management
```
OLD → NEW
warranty_headers / lines → Derived from RetailLine (no separate tables)
```
**Simplified Approach:**
- Warranty data embedded in sales order lines
- Views/aggregations for warranty reporting
- Eliminates data duplication

## 🔧 Development

### File Structure
```
tests/
├── setup.ts              # Test environment configuration
├── helpers/
│   └── auth.ts           # Authentication helpers
└── e2e/
    ├── sales.test.ts     # Sales order e2e tests
    ├── returns.test.ts   # Returns workflow e2e tests
    └── transfers.test.ts # Transfer operations e2e tests

scripts/
└── generate-openapi.ts   # OpenAPI spec generation

src/
├── lib/
│   └── storage.ts        # File upload utilities
└── components/
    └── shared/
        └── FileUpload.tsx # Reusable upload component
```

### Running Tests

```bash
# All tests (Vitest + E2E + Playwright)
npm run test:all

# Vitest unit tests (services, handlers)
npm run test:vitest

# E2E tests (database workflows)
npm run test:e2e

# Playwright E2E tests (API endpoints)
npm run test:playwright

# Watch mode
npm run test:watch

# Generate OpenAPI spec
npm run generate-openapi
```

### Test Coverage
- **Unit Tests**: Service layer validation, business logic, RBAC filtering
- **Integration Tests**: Database workflows (sales, returns, transfers)
- **E2E Tests**: API endpoint compatibility, OpenAPI compliance
- **Target Coverage**: ≥80% across all layers

## 📝 API Documentation

- **Current API**: Available at `/api/docs`
- **OpenAPI Spec**: `public/openapi.json` (auto-generated)
- **Future HQ APIs**: Will be documented under `/api/hq/*`

## 🛡️ Security Features

- Row Level Security (RLS) on all tables
- Store-based data isolation
- Secure file uploads with signed URLs
- JWT-based authentication
- Role-based access control

## 🚀 Deployment

```bash
npm run build  # Includes OpenAPI generation
```

The build process automatically:
1. Compiles TypeScript
2. Builds React application
3. Generates OpenAPI specification
4. Prepares for deployment

## 📋 Acceptance Criteria

- ✅ E2E tests all green (sales, returns, transfers)
- ✅ Frontend runs common flows without path changes
- ✅ OpenAPI spec generated on each build (`public/openapi.json`)
- ✅ New layered architecture (Edge Functions + Hono + Core Services)
- ✅ DTO validation with Zod schemas
- ✅ RBAC filtering (cost data protection)
- ✅ Migration mapping documented
- ✅ File uploads working with signed URLs
- ✅ Test coverage ≥80%

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/bae360ca-9102-4db0-a77f-9e6994b06a92) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage)
- Vitest (Testing)

## Deployment

Simply open [Lovable](https://lovable.dev/projects/bae360ca-9102-4db0-a77f-9e6994b06a92) and click on Share → Publish.