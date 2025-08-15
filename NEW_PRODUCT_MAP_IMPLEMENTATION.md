# New Product MAP Price Implementation

## Overview
This implementation adds support for distinguishing between new and non-new products, with MAP (Minimum Advertised Price) validation for new products in the sales order system.

## Changes Made

### 1. Database Schema Updates
- **File**: `supabase/migrations/20250814232916_add_is_new_to_products.sql`
- **Change**: Added `is_new` BOOLEAN column to products table
- **Additional**: Populated sample data for testing

### 2. Enhanced SQL Data Script
- **File**: `add_is_new_dummy_data.sql`
- **Purpose**: Comprehensive script to add test data with realistic product scenarios
- **Contains**: 20 test products (10 new with MAP restrictions, 10 standard products)

### 3. API Updates
- **File**: `src/modules/sales-inventory/api/products.ts`
- **Changes**:
  - Updated product query to include `cost`, `map_price`, and `is_new` fields
  - Modified response mapping to include these new fields
  - Ensured proper data flow for MAP price validation

### 4. TypeScript Types
- **File**: `src/modules/sales-inventory/types/index.ts`
- **Status**: Already included `isNew` and `mapPrice` fields in `ProductLookupItem` interface

### 5. Sales Order Form Enhancements
- **File**: `src/modules/sales-inventory/components/SalesOrderForm.tsx`
- **Key Changes**:

#### A. Product Addition Validation
- Added MAP price check when adding new products to order
- Prevents adding new products if their default price is below MAP

#### B. Unit Price Change Validation
- Real-time validation when users edit unit prices in the order
- Prevents setting prices below MAP for new products
- Shows descriptive error messages

#### C. Order Submission Validation
- Final validation before order submission
- Blocks submission if any line items violate MAP pricing
- Added validation to both automatic and manual submission methods

#### D. Enhanced Product Display
- Updated product selection dialog to show:
  - "NEW" badge for new products
  - MAP price information for new products
  - Enhanced product option rendering with pricing details

## How It Works

### For New Products (is_new = TRUE)
1. **Adding to Order**: System checks if product price ≥ MAP price
2. **Price Editing**: User cannot set unit price below MAP price
3. **Order Submission**: Final validation prevents submission if any new product has price < MAP
4. **Visual Indicators**: Products marked as "NEW" with MAP price displayed

### For Standard Products (is_new = FALSE)
1. **No Restrictions**: Users can set any price
2. **Normal Workflow**: Standard pricing and discount rules apply

## User Experience

### Product Selection
```
IPHONE15 - iPhone 15 Pro 256GB [NEW] $1,199.99 • MAP: $1,099.99 • In stock: 5
BASIC_MOUSE - Basic Wireless Mouse $19.99 • In stock: 10
```

### Validation Messages
- **MAP Violation**: "Price cannot be below MAP price of $1,099.99 for new product 'iPhone 15 Pro 256GB'"
- **Submission Block**: "Cannot submit order: 'iPhone 15 Pro 256GB' unit price $999.00 is below MAP price $1,099.99"

## Test Data Structure

### New Products (MAP Restricted)
- iPhone 15 Pro: $1,199.99 (MAP: $1,099.99)
- MacBook Air M2: $1,399.99 (MAP: $1,299.99)
- Samsung 55" QLED: $899.99 (MAP: $799.99)
- And 7 more...

### Standard Products (No MAP)
- Basic Wireless Mouse: $19.99 (No MAP restriction)
- USB-C Hub: $39.99 (No MAP restriction)
- HDMI Cable: $12.99 (No MAP restriction)
- And 7 more...

## Next Steps for Deployment

1. **Run Migration**: Execute the existing migration file in Supabase
2. **Add Test Data**: Run the `add_is_new_dummy_data.sql` script in Supabase SQL editor
3. **Test Workflow**:
   - Navigate to `/store/sales-orders/new`
   - Try adding new products and setting prices below MAP
   - Verify validation messages appear
   - Confirm order submission is blocked for MAP violations

## Technical Notes

- All validations work in real-time during form interaction
- Error messages are user-friendly and specific
- The system gracefully handles products without MAP prices
- Backward compatibility maintained for existing products
- Performance optimized with minimal additional database queries

## Files Modified
1. `src/modules/sales-inventory/api/products.ts` - API data fetching
2. `src/modules/sales-inventory/components/SalesOrderForm.tsx` - Form validation and UI
3. `supabase/migrations/20250814232916_add_is_new_to_products.sql` - Database schema
4. `add_is_new_dummy_data.sql` - Test data script (new file)

The implementation is complete and ready for testing!
