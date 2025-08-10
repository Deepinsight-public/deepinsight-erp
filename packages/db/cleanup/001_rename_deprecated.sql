-- Migration 001: Rename Deprecated Tables
-- This migration freezes deprecated tables by renaming them with _deprecated suffix
-- Data is preserved for rollback purposes

-- Enable if running in production
-- SET statement_timeout = '30min';

DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 1: Renaming deprecated tables to _deprecated suffix';
END $$;

-- Sales Orders (to be replaced by views)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders' AND table_schema = 'public') THEN
        ALTER TABLE public.sales_orders RENAME TO sales_orders_deprecated;
        COMMENT ON TABLE public.sales_orders_deprecated IS 'DEPRECATED: Replaced by vw_sales_orders_list view. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed sales_orders to sales_orders_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_order_items' AND table_schema = 'public') THEN
        ALTER TABLE public.sales_order_items RENAME TO sales_order_items_deprecated;
        COMMENT ON TABLE public.sales_order_items_deprecated IS 'DEPRECATED: Replaced by vw_sales_orders_list view. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed sales_order_items to sales_order_items_deprecated';
    END IF;
END $$;

-- Returns (consolidated into ReturnOrder/ReturnLine)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'returns' AND table_schema = 'public') THEN
        ALTER TABLE public.returns RENAME TO returns_deprecated;
        COMMENT ON TABLE public.returns_deprecated IS 'DEPRECATED: Replaced by ReturnOrder/ReturnLine models. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed returns to returns_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'after_sales_returns' AND table_schema = 'public') THEN
        ALTER TABLE public.after_sales_returns RENAME TO after_sales_returns_deprecated;
        COMMENT ON TABLE public.after_sales_returns_deprecated IS 'DEPRECATED: Replaced by ReturnOrder/ReturnLine models. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed after_sales_returns to after_sales_returns_deprecated';
    END IF;
END $$;

-- Scrap (to be replaced by views mapping to Prisma naming)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scrap_headers' AND table_schema = 'public') THEN
        ALTER TABLE public.scrap_headers RENAME TO scrap_headers_deprecated;
        COMMENT ON TABLE public.scrap_headers_deprecated IS 'DEPRECATED: Replaced by vw_scrap_orders view. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed scrap_headers to scrap_headers_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scrap_lines' AND table_schema = 'public') THEN
        ALTER TABLE public.scrap_lines RENAME TO scrap_lines_deprecated;
        COMMENT ON TABLE public.scrap_lines_deprecated IS 'DEPRECATED: Replaced by vw_scrap_orders view. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed scrap_lines to scrap_lines_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scrap_audit' AND table_schema = 'public') THEN
        ALTER TABLE public.scrap_audit RENAME TO scrap_audit_deprecated;
        COMMENT ON TABLE public.scrap_audit_deprecated IS 'DEPRECATED: Audit functionality moved to general audit_log. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed scrap_audit to scrap_audit_deprecated';
    END IF;
END $$;

-- Inventory (to be replaced by Item-based view)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory' AND table_schema = 'public') THEN
        ALTER TABLE public.inventory RENAME TO inventory_deprecated;
        COMMENT ON TABLE public.inventory_deprecated IS 'DEPRECATED: Replaced by vw_inventory based on Item table. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed inventory to inventory_deprecated';
    END IF;
END $$;

-- User Management (consolidated into auth.users metadata)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles RENAME TO profiles_deprecated;
        COMMENT ON TABLE public.profiles_deprecated IS 'DEPRECATED: User data moved to auth.users metadata. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed profiles to profiles_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_roles RENAME TO user_roles_deprecated;
        COMMENT ON TABLE public.user_roles_deprecated IS 'DEPRECATED: Role data moved to auth.users metadata. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed user_roles to user_roles_deprecated';
    END IF;
END $$;

-- Warranty Management (to be replaced by view from sales data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warranty_headers' AND table_schema = 'public') THEN
        ALTER TABLE public.warranty_headers RENAME TO warranty_headers_deprecated;
        COMMENT ON TABLE public.warranty_headers_deprecated IS 'DEPRECATED: Replaced by vw_warranties view based on sales order warranty fields. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed warranty_headers to warranty_headers_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warranty_lines' AND table_schema = 'public') THEN
        ALTER TABLE public.warranty_lines RENAME TO warranty_lines_deprecated;
        COMMENT ON TABLE public.warranty_lines_deprecated IS 'DEPRECATED: Replaced by vw_warranties view based on sales order warranty fields. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed warranty_lines to warranty_lines_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warranty_audit' AND table_schema = 'public') THEN
        ALTER TABLE public.warranty_audit RENAME TO warranty_audit_deprecated;
        COMMENT ON TABLE public.warranty_audit_deprecated IS 'DEPRECATED: Audit functionality moved to general audit_log. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed warranty_audit to warranty_audit_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warranty_resolution' AND table_schema = 'public') THEN
        ALTER TABLE public.warranty_resolution RENAME TO warranty_resolution_deprecated;
        COMMENT ON TABLE public.warranty_resolution_deprecated IS 'DEPRECATED: Functionality integrated into warranty views. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed warranty_resolution to warranty_resolution_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warranty_tech' AND table_schema = 'public') THEN
        ALTER TABLE public.warranty_tech RENAME TO warranty_tech_deprecated;
        COMMENT ON TABLE public.warranty_tech_deprecated IS 'DEPRECATED: Functionality integrated into warranty views. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed warranty_tech to warranty_tech_deprecated';
    END IF;
END $$;

-- Unused/Low Activity Tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
        ALTER TABLE public.tasks RENAME TO tasks_deprecated;
        COMMENT ON TABLE public.tasks_deprecated IS 'DEPRECATED: Unused table (0 rows). Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed tasks to tasks_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouse_inventory' AND table_schema = 'public') THEN
        ALTER TABLE public.warehouse_inventory RENAME TO warehouse_inventory_deprecated;
        COMMENT ON TABLE public.warehouse_inventory_deprecated IS 'DEPRECATED: HQ-scope functionality to be separated. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed warehouse_inventory to warehouse_inventory_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouse_allocations' AND table_schema = 'public') THEN
        ALTER TABLE public.warehouse_allocations RENAME TO warehouse_allocations_deprecated;
        COMMENT ON TABLE public.warehouse_allocations_deprecated IS 'DEPRECATED: HQ-scope functionality to be separated. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed warehouse_allocations to warehouse_allocations_deprecated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouse_store_sequence' AND table_schema = 'public') THEN
        ALTER TABLE public.warehouse_store_sequence RENAME TO warehouse_store_sequence_deprecated;
        COMMENT ON TABLE public.warehouse_store_sequence_deprecated IS 'DEPRECATED: HQ-scope functionality to be separated. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed warehouse_store_sequence to warehouse_store_sequence_deprecated';
    END IF;
END $$;

-- Notification system (if unused)
DO $$
BEGIN
    -- Check if notifications table has any recent activity
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications' AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE created_at > NOW() - INTERVAL '30 days'
    ) THEN
        ALTER TABLE public.notifications RENAME TO notifications_deprecated;
        COMMENT ON TABLE public.notifications_deprecated IS 'DEPRECATED: No recent activity. Scheduled for removal after observation period.';
        RAISE NOTICE 'Renamed notifications to notifications_deprecated (no recent activity)';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Phase 1 Complete: All deprecated tables renamed with _deprecated suffix';
    RAISE NOTICE 'Next Step: Run 002_views.sql to create replacement views';
    RAISE NOTICE 'Data preserved for rollback. Tables can be renamed back if needed.';
END $$;

-- Create rollback script
DO $$
BEGIN
    -- This would be used to generate rollback commands
    RAISE NOTICE 'ROLLBACK SCRIPT GENERATED:';
    RAISE NOTICE 'To rollback this migration, run the reverse operations:';
    RAISE NOTICE 'ALTER TABLE sales_orders_deprecated RENAME TO sales_orders;';
    RAISE NOTICE 'ALTER TABLE sales_order_items_deprecated RENAME TO sales_order_items;';
    RAISE NOTICE '-- (continue for all renamed tables)';
END $$;