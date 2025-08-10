-- Migration 003: Drop Deprecated Tables (MANUAL APPROVAL REQUIRED)
-- This migration permanently removes deprecated tables
-- REQUIRES: Environment variable ERP_DB_CLEANUP_APPROVED=true

-- Safety check for approval
DO $$
BEGIN
    IF current_setting('erp.db_cleanup_approved', true) != 'true' THEN
        RAISE EXCEPTION 'MANUAL APPROVAL REQUIRED: Set erp.db_cleanup_approved = true to proceed with table drops';
    END IF;
    
    RAISE NOTICE 'Starting Phase 3: Dropping deprecated tables (DESTRUCTIVE OPERATION)';
    RAISE NOTICE 'Approval confirmed. Proceeding with table drops...';
END $$;

-- Template for safe table dropping with dependency checks
CREATE OR REPLACE FUNCTION public.safe_drop_table(table_name TEXT) 
RETURNS void 
LANGUAGE plpgsql 
AS $$
DECLARE 
    dep_count INTEGER;
    view_deps TEXT[];
    fk_deps TEXT[];
BEGIN
    -- Check for view dependencies
    SELECT COUNT(*), ARRAY_AGG(table_name::TEXT)
    INTO dep_count, view_deps
    FROM information_schema.view_table_usage
    WHERE table_schema = 'public' AND table_name = safe_drop_table.table_name;
    
    IF dep_count > 0 THEN
        RAISE EXCEPTION 'Cannot drop table %. Dependent views exist: %', table_name, view_deps;
    END IF;
    
    -- Check for foreign key dependencies  
    SELECT COUNT(*), ARRAY_AGG(constraint_name::TEXT)
    INTO dep_count, fk_deps
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = safe_drop_table.table_name
    AND tc.table_schema = 'public';
    
    IF dep_count > 0 THEN
        RAISE EXCEPTION 'Cannot drop table %. Foreign key dependencies exist: %', table_name, fk_deps;
    END IF;
    
    -- Check if table exists before dropping
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = safe_drop_table.table_name 
        AND table_schema = 'public'
    ) THEN
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(table_name);
        RAISE NOTICE 'Successfully dropped table: %', table_name;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping', table_name;
    END IF;
END $$;

-- ===== DROP DEPRECATED TABLES =====

-- Sales Orders
DO $$
BEGIN
    RAISE NOTICE 'Dropping sales orders tables...';
END $$;

SELECT public.safe_drop_table('sales_orders_deprecated');
SELECT public.safe_drop_table('sales_order_items_deprecated');

-- Returns  
DO $$
BEGIN
    RAISE NOTICE 'Dropping legacy returns tables...';
END $$;

SELECT public.safe_drop_table('returns_deprecated');
SELECT public.safe_drop_table('after_sales_returns_deprecated');

-- Scrap
DO $$
BEGIN
    RAISE NOTICE 'Dropping scrap tables...';
END $$;

SELECT public.safe_drop_table('scrap_audit_deprecated');
SELECT public.safe_drop_table('scrap_lines_deprecated');
SELECT public.safe_drop_table('scrap_headers_deprecated');

-- Inventory
DO $$
BEGIN
    RAISE NOTICE 'Dropping legacy inventory table...';
END $$;

SELECT public.safe_drop_table('inventory_deprecated');

-- User Management
DO $$
BEGIN
    RAISE NOTICE 'Dropping user management tables...';
END $$;

SELECT public.safe_drop_table('user_roles_deprecated');
SELECT public.safe_drop_table('profiles_deprecated');

-- Warranty Management
DO $$
BEGIN
    RAISE NOTICE 'Dropping warranty tables...';
END $$;

SELECT public.safe_drop_table('warranty_tech_deprecated');
SELECT public.safe_drop_table('warranty_resolution_deprecated');
SELECT public.safe_drop_table('warranty_audit_deprecated');
SELECT public.safe_drop_table('warranty_lines_deprecated');
SELECT public.safe_drop_table('warranty_headers_deprecated');

-- Warehouse (HQ scope)
DO $$
BEGIN
    RAISE NOTICE 'Dropping warehouse management tables...';
END $$;

SELECT public.safe_drop_table('warehouse_store_sequence_deprecated');
SELECT public.safe_drop_table('warehouse_allocations_deprecated');
SELECT public.safe_drop_table('warehouse_inventory_deprecated');

-- Unused Tables
DO $$
BEGIN
    RAISE NOTICE 'Dropping unused tables...';
END $$;

SELECT public.safe_drop_table('tasks_deprecated');
SELECT public.safe_drop_table('notifications_deprecated');

-- ===== CLEANUP =====

-- Drop the utility function
DROP FUNCTION IF EXISTS public.safe_drop_table(TEXT);

-- Verify all deprecated tables are gone
DO $$
DECLARE
    remaining_count INTEGER;
    remaining_tables TEXT[];
BEGIN
    SELECT COUNT(*), ARRAY_AGG(table_name)
    INTO remaining_count, remaining_tables
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_name LIKE '%_deprecated';
    
    IF remaining_count > 0 THEN
        RAISE WARNING 'Some deprecated tables still exist: %', remaining_tables;
    ELSE
        RAISE NOTICE 'All deprecated tables successfully removed';
    END IF;
END $$;

-- Generate cleanup report
DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO view_count  
    FROM information_schema.views
    WHERE table_schema = 'public';
    
    RAISE NOTICE '=== DATABASE CLEANUP COMPLETE ===';
    RAISE NOTICE 'Remaining tables: %', table_count;
    RAISE NOTICE 'Total views: %', view_count;
    RAISE NOTICE 'Schema streamlined successfully';
    RAISE NOTICE 'IMPORTANT: Test all /store/* endpoints before deploying to production';
END $$;

-- Final safety reminder
DO $$
BEGIN
    RAISE NOTICE '=== POST-CLEANUP CHECKLIST ===';
    RAISE NOTICE '1. Run full test suite (Unit + E2E)';
    RAISE NOTICE '2. Verify all /api/store/* endpoints return 2xx';
    RAISE NOTICE '3. Test sales summary with source filtering';
    RAISE NOTICE '4. Verify returns workflow with EPC scanning';
    RAISE NOTICE '5. Check inventory accuracy';
    RAISE NOTICE '6. Validate authentication flow';
    RAISE NOTICE '7. Monitor application logs for any table reference errors';
    RAISE NOTICE 'BACKUP RECOMMENDATION: Keep database backup for 30 days minimum';
END $$;