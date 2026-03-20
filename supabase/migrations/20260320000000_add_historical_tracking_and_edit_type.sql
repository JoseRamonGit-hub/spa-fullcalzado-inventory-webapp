-- ============================================================================
-- Migration 1/2: add_historical_tracking_and_edit_type
--
-- Adds 'edit' to movement_types enum and new tracking columns.
-- The enum value must be committed before it can be referenced in CHECK
-- constraints or function bodies, so the rest is in the next migration.
--
-- BACKWARD COMPATIBILITY:
--   - All new columns are nullable → existing rows remain valid with NULLs
--   - Enum ADD VALUE is non-reversible but permanent by design
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Add 'edit' to movement_types enum
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TYPE public.movement_types ADD VALUE 'edit';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Add historical tracking columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.inventory_movements
  ADD COLUMN stock_before integer,
  ADD COLUMN price_usd numeric(12,2),
  ADD COLUMN price_usd_before numeric(12,2),
  ADD COLUMN description_before text;
