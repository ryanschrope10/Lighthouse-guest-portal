-- ============================================================================
-- neon_010_stay_extension_catalog.sql
-- Publish the "Extend Stay" request for every property.
--
-- The extension flow (component + /api/bookings/[id]/extend) both require a
-- `stay_extension` row in addon_catalog, so with an empty catalog the feature
-- was invisible and the endpoint refused. It's priced at 0 and flagged
-- requires_approval: the guest asks, the front desk confirms dates and quotes
-- the cost. Set price_cents in Admin -> Add-ons Catalog to show a per-night
-- rate and an estimate in the portal.
-- ============================================================================

insert into addon_catalog
  (property_id, slug, name, description, category,
   price_cents, requires_approval, active, sort_order)
select
  p.id,
  'stay_extension',
  'Extend Stay',
  'Ask the front desk to push your check-out date back. We''ll confirm availability and pricing before anything is charged.',
  'stay',
  0,
  true,
  true,
  0
from properties p
on conflict (property_id, slug) do nothing;
