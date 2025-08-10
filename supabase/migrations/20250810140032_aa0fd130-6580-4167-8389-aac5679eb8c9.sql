-- Database Impact Analysis Query
-- Get current table usage statistics for cleanup planning

-- Step 1: Analyze table usage patterns
CREATE TEMP VIEW current_db_status AS
SELECT 
  schemaname,
  relname as table_name,
  n_live_tup as live_rows,
  n_tup_ins as total_inserts,
  n_tup_upd as total_updates, 
  n_tup_del as total_deletes,
  last_vacuum,
  last_analyze,
  CASE 
    WHEN n_live_tup > 10 THEN 'high'
    WHEN n_live_tup BETWEEN 1 AND 10 THEN 'medium'
    ELSE 'low'
  END as activity_level
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC, relname;

-- Step 2: Check for view dependencies
CREATE TEMP VIEW view_dependencies AS
SELECT 
  vtu.view_name,
  vtu.table_name,
  vtu.table_schema
FROM information_schema.view_table_usage vtu
WHERE vtu.table_schema = 'public';

-- Step 3: Check for foreign key dependencies  
CREATE TEMP VIEW fk_dependencies AS
SELECT 
  tc.table_name as dependent_table,
  ccu.table_name as referenced_table,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND ccu.table_schema = 'public';

-- Display analysis results
SELECT 
  'CURRENT DATABASE STATUS' as analysis_type,
  table_name,
  live_rows,
  total_inserts,
  total_updates,
  activity_level,
  last_analyze::date as last_analyzed
FROM current_db_status
UNION ALL
SELECT 
  'VIEW DEPENDENCIES' as analysis_type,
  table_name,
  NULL as live_rows,
  NULL as total_inserts, 
  NULL as total_updates,
  view_name as activity_level,
  NULL as last_analyzed
FROM view_dependencies
UNION ALL  
SELECT
  'FK DEPENDENCIES' as analysis_type,
  referenced_table as table_name,
  NULL as live_rows,
  NULL as total_inserts,
  NULL as total_updates, 
  dependent_table as activity_level,
  NULL as last_analyzed
FROM fk_dependencies
ORDER BY analysis_type, table_name;