-- =====================================================================  
-- TEMPORARY COMPATIBILITY LAYER
-- Allow queries to 'branches' table name until all code is updated
-- =====================================================================

-- Create views for backward compatibility
CREATE OR REPLACE VIEW branches AS SELECT * FROM salons;
CREATE OR REPLACE VIEW staff_branches AS SELECT * FROM staff_salons;

-- This allows existing code to continue working while we update components
-- Once all components are updated, these views can be dropped