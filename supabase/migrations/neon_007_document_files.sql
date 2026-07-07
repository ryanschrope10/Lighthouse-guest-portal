-- ============================================================================
-- neon_007_document_files.sql
-- Store the actual uploaded document bytes in Postgres (base64 text), since
-- this host has no object storage. Suitable for the small documents guests
-- upload (insurance / registration / license). A ~5 MB cap is enforced in the
-- application layer (src/app/api/documents/route.ts).
-- ============================================================================

alter table guest_documents add column if not exists content_type text;
alter table guest_documents add column if not exists file_data text; -- base64-encoded bytes
