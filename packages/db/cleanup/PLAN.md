# Database Cleanup Plan

## Overview
This document outlines the strategy for streamlining the ERP database schema by removing redundant tables and replacing them with views or consolidated models. The approach follows a two-phase strategy: first freeze and rename deprecated tables, then create replacement views.

## Table Analysis

### Current Database Status (by activity)
```
High Activity Tables (>10 rows):
- order_claim_logs: 111 rows, active
- products: 17 rows, core data
- sales_orders: 16 rows, 3 updates
- sales_order_items: 16 rows
- scrap_lines: 11 rows
- warehouse_inventory: 10 rows, 10 updates

Medium Activity (1-10 rows):
- scrap_headers: 7 rows, 2 updates
- stores: 6 rows, 1 update  
- inventory: 6 rows, 5 updates
- warehouse_store_sequence: 6 rows
- customers: 4 rows, 2 updates
- after_sales_returns: 4 rows
- profiles: 3 rows, 6 updates
- warehouse_allocations: 3 rows
- order_pool: 2 rows, 111 updates
- user_roles: 2 rows, 2 deletes
- scrap_audit: 2 rows

Low/Inactive Tables (0-1 rows):
- warranty_*: 1 row each
- purchase_requests: 1 row
- purchase_turns: 1 row
- repairs: 1 row
- system_settings: 1 row
- tasks, ReturnLine, etc.: 0 rows
```

## Consolidation Strategy

### Phase 1: Keep Core Tables
**Retain (No Changes Required):**
- `stores` - Core master data
- `products` - Product catalog
- `customers` - Customer master
- `system_settings` - Configuration

**Retain Prisma Models (New Schema):**
- `Item`, `ItemEvent` - RFID/EPC tracking
- `ReturnOrder`, `ReturnLine` - Unified returns 
- `TransferOrder`, `TransferLine` - Inter-store transfers
- `ScanLog` - Scanning audit trail
- `PurchaseRequest`, `PurchaseRequestLine` - Purchase workflow

### Phase 2: Replace with Views

#### A) Sales Orders → Views
**Deprecate:** `sales_orders`, `sales_order_items`
**Replace with:** `vw_sales_orders_list`, `vw_sales_summary`
- Supports legacy API structure
- Includes source filtering for pivot analysis
- Maintains all fields: warranty, pricing, payment methods

#### B) Returns Consolidation  
**Deprecate:** `returns`, `after_sales_returns`
**Replace with:** Enhanced `return_order`/`return_line` (already exists)
- Customer returns + store-to-warehouse returns
- Unified workflow with EPC scanning
- `productBarcode` and `restockStatus` fields

#### C) Scrap Orders
**Deprecate:** `scrap_headers`, `scrap_lines`
**Replace with:** `scrap_order`, `scrap_line` views
- Maps to Prisma schema naming
- Maintains `photoUrls[]` array support

#### D) Inventory Tracking
**Deprecate:** `inventory`, `warehouse_inventory`
**Replace with:** `vw_inventory` 
- Based on `Item` table + aggregation
- Store-level stock counts
- Reserved quantity tracking

#### E) User Management  
**Deprecate:** `profiles`, `user_roles`
**Replace with:** Enhanced `auth.users` metadata
- First/Last name fields
- Role and store assignment in user metadata
- Simplified authentication flow

#### F) Warranty Management
**Deprecate:** `warranty_headers`, `warranty_lines`, `warranty_audit`, `warranty_resolution`, `warranty_tech`
**Replace with:** `vw_warranties` view
- Derived from sales order line warranty fields
- Standard 1-year warranty vs extended warranty
- Calculated expiry dates

### Phase 3: Remove Unused
**Safe to Drop:**
- `tasks` (0 rows, no dependencies)
- `warehouse_*` tables (if HQ scope is separate)
- `grab_orders` (if feature unused)
- `notifications` (if real-time not implemented)

## Migration Sequence

### Migration 001: Freeze Deprecated Tables
```sql
-- Rename tables to _deprecated suffix
-- Add deprecation comments
-- Preserve data for rollback
```

### Migration 002: Create Replacement Views
```sql
-- vw_sales_orders_list: Legacy sales_orders API shape
-- vw_sales_summary: Aggregated sales with source filtering  
-- vw_inventory: Item-based inventory aggregation
-- vw_warranties: Warranty tracking from sales data
-- vw_scrap_orders: Scrap management views
```

### Migration 003: Drop Deprecated (Manual)
```sql
-- Requires ERP_DB_CLEANUP_APPROVED=true
-- Dependency checks before each DROP
-- No CASCADE operations
```

## Risk Assessment

### Low Risk ✅
- View creation (non-destructive)
- Table renaming (reversible)
- Scrap/warranty consolidation (low usage)

### Medium Risk ⚠️
- Sales orders → views (high usage, needs testing)
- Inventory consolidation (stock accuracy critical)
- User management changes (auth flow)

### High Risk 🚨
- Return order consolidation (business critical)
- Profile/user_roles removal (authentication)

## Rollback Strategy

1. **Phase 1 Rollback:** Rename tables back from `_deprecated`
2. **Phase 2 Rollback:** Drop views, rename tables back
3. **Phase 3 Rollback:** Restore from backups (if needed)

## Testing Requirements

- All `/api/store/*` endpoints return 2xx after Phase 1+2
- Sales summary/pivot filtering by source works
- Returns workflow with EPC scanning functions
- Inventory accuracy maintained
- Authentication flow unaffected

## Success Criteria

- [ ] 50%+ reduction in table count
- [ ] All legacy APIs still functional
- [ ] View performance acceptable (<100ms)
- [ ] Test coverage >80% for affected modules
- [ ] Zero breaking changes for frontend

## Dependencies

**Code References to Update:**
- Search codebase for table name references
- Update service layer mappings
- Verify RLS policies on views
- Test API response schemas

**Database Dependencies:**
- Views depending on deprecated tables
- Triggers and functions
- RLS policies
- Foreign key constraints

---
*Generated on: 2025-01-10*
*Target Completion: Phase 1+2 immediate, Phase 3 after 14-30 day observation*