-- =====================================================================
--  Migration: tambah kategori 'kuliah' ke proj_type
--  Pakai ini KALAU database lu udah jalan & udah ada data (ga mau di-drop).
--  Kalau masih fresh / boleh reset, cukup re-run schema.sql (sudah include ini).
--  Run: psql -U postgres -d mutaz_os -f database/migration_add_kuliah.sql
-- =====================================================================
ALTER TYPE proj_type ADD VALUE IF NOT EXISTS 'kuliah';
